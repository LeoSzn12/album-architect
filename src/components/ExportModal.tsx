'use client';

import React, { useMemo, useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { X, ExternalLink, Copy, Check, Download, Disc, Sparkles, Music } from 'lucide-react';
import { playHoverSound, playDraftLockSound } from '@/lib/audioEngine';

import { useModalA11y } from '@/hooks/useModalA11y';
import { encodeSharePayload, type SharePayload } from '@/lib/sharePayload';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { draftedTracks, gameMode, evaluationResult, opponentEvaluationResult, playerAlias, draftSeed, audioEnabled } = useDraftStore();
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen,
    onClose,
  });

  const titleText = gameMode === 'draft' ? 'TrackDraft Seven-Round Build' : gameMode === 'ep' ? 'TrackDraft EP Builder' : 'TrackDraft Album Builder';

  const sharePayload = useMemo<SharePayload>(() => {
    const tracks = draftedTracks.slice(0, 3).map((track) => ({
      title: track.song.title,
      artist: track.song.rawArtistString || track.song.artist,
    }));
    while (tracks.length < 3) tracks.push({ title: 'Unfilled slot', artist: 'TrackDraft' });

    const categories = evaluationResult?.categoryScores
      ? Object.entries(evaluationResult.categoryScores).map(([key, category]) => ({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()),
          score: Math.round(category.score),
        }))
      : [{ label: 'Overall', score: Math.round((evaluationResult?.overallScore ?? 0) * 10) }];

    return {
      version: 1,
      projectTitle: titleText,
      creator: playerAlias,
      score: evaluationResult?.overallScore ?? 0,
      grade: evaluationResult?.gradeBadge ?? 'Unscored',
      topTracks: tracks as SharePayload['topTracks'],
      ...(opponentEvaluationResult ? { opponentScore: opponentEvaluationResult.overallScore } : {}),
      challengeCode: draftSeed || 'TRACKDRAFT-DEMO',
      categories,
    };
  }, [draftSeed, draftedTracks, evaluationResult, opponentEvaluationResult, playerAlias, titleText]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share?data=${encodeSharePayload(sharePayload)}`
    : '';

  if (!isOpen) return null;

  // Construct YouTube Music query URL
  const searchQuery = draftedTracks.map((t) => `${t.song.artist} ${t.song.title}`).join(' ');
  const ytMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(
    searchQuery.slice(0, 200)
  )}`;

  // Construct formatted text tracklist
  const formattedText = `${titleText}\nScore: ${evaluationResult?.overallScore || '9.5'} / 10 (${evaluationResult?.gradeBadge || 'Classic'})\n\n` +
    draftedTracks
      .map(
        (t, idx) =>
          `#${idx + 1} [${t.slot.name}] - ${t.song.title} by ${t.song.rawArtistString} (${t.song.bpm} BPM)`
      )
      .join('\n');

  const handleCopyText = () => {
    playDraftLockSound(audioEnabled);
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyShare = () => {
    if (!shareUrl) return;
    playDraftLockSound(audioEnabled);
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleDownloadM3u = () => {
    playDraftLockSound(audioEnabled);
    const m3uContent =
      '#EXTM3U\n' +
      draftedTracks
        .map(
          (t) =>
            `#EXTINF:-1,${t.song.artist} - ${t.song.title}\nhttps://music.youtube.com/search?q=${encodeURIComponent(
              t.song.artist + ' ' + t.song.title
            )}`
        )
        .join('\n');

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleText.toLowerCase().replace(/\s+/g, '_')}_playlist.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="bg-gray-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden"
      >
        {/* Glow backdrop decorative */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Real-World Playlist Export
            </span>
            <h2 className="text-2xl font-extrabold text-white">Export Your TrackDraft</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mock Album Cover Badge Preview */}
        <div className="bg-gradient-to-br from-purple-950 via-gray-950 to-pink-950 border border-purple-800/60 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-xl">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex flex-col items-center justify-center p-2 text-center">
              <Disc className="w-6 h-6 text-pink-400 mb-1" />
              <span className="text-[9px] font-extrabold text-white uppercase tracking-tighter line-clamp-1">
                ARCHITECT
              </span>
            </div>
          </div>
          <div>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800">
              {evaluationResult?.gradeBadge || 'Classic Status'}
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">{titleText}</h3>
            <p className="text-xs text-gray-400">
              {draftedTracks.length} Tracks • Score: {evaluationResult?.overallScore || '9.5'} / 10
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* YouTube Music Button */}
          <a
            href={ytMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playDraftLockSound(audioEnabled)}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-lg shadow-red-950/40 text-center transition flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Music className="w-5 h-5" />
            <span>Launch YouTube Music Playlist Search 🎵</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="grid grid-cols-2 gap-3">
            {/* Copy Tracklist */}
            <button
              onClick={handleCopyText}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-gray-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Tracklist!' : 'Copy Tracklist'}</span>
            </button>

            {/* Download M3U */}
            <button
              onClick={handleDownloadM3u}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-gray-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Download .M3U File</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyShare}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-purple-950/70 hover:bg-purple-900/80 text-purple-100 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-purple-700/70 cursor-pointer"
            >
              {shareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{shareCopied ? 'Copied Share Link!' : 'Copy Share Link'}</span>
            </button>
            <a
              href={shareUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playDraftLockSound(audioEnabled)}
              className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-gray-700"
            >
              <ExternalLink className="w-4 h-4 text-cyan-300" />
              <span>Open Share Card</span>
            </a>
          </div>
        </div>

        {/* Preview Tracklist Snippet */}
        <div className="mt-5 pt-4 border-t border-gray-800">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Master Tracklist Sequence
          </span>
          <div className="max-h-36 overflow-y-auto bg-gray-950 rounded-xl p-3 border border-gray-800/80 space-y-1.5 font-mono text-[11px] text-gray-300">
            {draftedTracks.map((t, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate">
                  {idx + 1}. {t.song.title} - {t.song.artist}
                </span>
                <span className="text-gray-500 ml-2">{t.song.bpm} BPM</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
