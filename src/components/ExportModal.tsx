'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  const [durableShareToken, setDurableShareToken] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    void fetch('/api/share', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sharePayload) })
      .then(async (response) => response.ok ? response.json() as Promise<{ token?: string }> : null)
      .then((body) => { if (body?.token) setDurableShareToken(body.token); })
      .catch(() => { /* URL-encoded share remains available in guest mode. */ });
  }, [isOpen, sharePayload]);

  const shareUrl = typeof window !== 'undefined'
    ? durableShareToken
      ? `${window.location.origin}/share?token=${durableShareToken}`
      : `${window.location.origin}/share?data=${encodeSharePayload(sharePayload)}`
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
        className="bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/[0.08]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Real-World Playlist Export
            </span>
            <h2 className="text-2xl font-black text-white">Export Your TrackDraft</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mock Album Cover Badge Preview */}
        <div className="bg-[#121216]/90 border border-white/[0.08] rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-xl">
          <div className="w-20 h-20 rounded-xl bg-black/60 border border-white/[0.1] p-1 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] flex flex-col items-center justify-center p-2 text-center">
              <Disc className="w-7 h-7 text-rose-500 mb-1" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider line-clamp-1">
                ARCHITECT
              </span>
            </div>
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-black border border-white/[0.08]">
              {evaluationResult?.gradeBadge || 'Classic Status'}
            </span>
            <h3 className="text-lg font-black text-white mt-1">{titleText}</h3>
            <p className="text-xs text-zinc-400">
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
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black font-black rounded-full shadow-lg text-center transition flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-95"
          >
            <Music className="w-4 h-4 text-red-500" />
            <span>Launch YouTube Music Playlist Search</span>
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </a>

          <div className="grid grid-cols-2 gap-3">
            {/* Copy Tracklist */}
            <button
              onClick={handleCopyText}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold rounded-full text-xs transition flex items-center justify-center gap-2 border border-white/[0.08] cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copied ? 'Copied Tracklist!' : 'Copy Tracklist'}</span>
            </button>

            {/* Download M3U */}
            <button
              onClick={handleDownloadM3u}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold rounded-full text-xs transition flex items-center justify-center gap-2 border border-white/[0.08] cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>Download .M3U File</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyShare}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold rounded-full text-xs transition flex items-center justify-center gap-2 border border-white/[0.08] cursor-pointer active:scale-95"
            >
              {shareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{shareCopied ? 'Copied Share Link!' : 'Copy Share Link'}</span>
            </button>
            <a
              href={shareUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playDraftLockSound(audioEnabled)}
              className="py-3 px-4 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-extrabold rounded-full text-xs transition flex items-center justify-center gap-2 border border-white/[0.08] active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-rose-500" />
              <span>Open Share Card</span>
            </a>
          </div>
        </div>

        {/* Preview Tracklist Snippet */}
        <div className="mt-5 pt-4 border-t border-white/[0.08]">
          <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-2">
            Master Tracklist Sequence
          </span>
          <div className="max-h-36 overflow-y-auto bg-black/60 rounded-2xl p-3 border border-white/[0.06] space-y-1.5 font-mono text-[11px] text-zinc-300">
            {draftedTracks.map((t, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate">
                  {idx + 1}. {t.song.title} - {t.song.artist}
                </span>
                <span className="text-zinc-500 ml-2">{t.song.bpm} BPM</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
