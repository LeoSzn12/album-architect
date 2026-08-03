import type { SharePayload } from '@/lib/sharePayload';

interface ShareCardProps {
  payload: SharePayload;
}

export function ShareCard({ payload }: ShareCardProps) {
  return (
    <article className="w-full max-w-2xl overflow-hidden rounded-3xl border border-purple-400/30 bg-slate-950/90 shadow-2xl shadow-purple-950/40">
      <div className="bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-300">TrackDraft result</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{payload.projectTitle}</h1>
            <p className="mt-1 text-sm text-slate-300">Curated by {payload.creator}</p>
          </div>
          <div className="rounded-2xl border border-pink-300/30 bg-black/30 px-5 py-3 text-center">
            <div className="text-4xl font-black text-white">{payload.score.toFixed(1)}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-pink-300">{payload.grade} · /10</div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {payload.topTracks.map((track, index) => (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" key={`${track.title}-${track.artist}`}>
              <div className="text-xs font-black text-cyan-300">0{index + 1}</div>
              <div className="mt-1 truncate font-bold text-white">{track.title}</div>
              <div className="truncate text-xs text-slate-400">{track.artist}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Challenge code</p>
            <p className="font-mono text-lg font-bold tracking-widest text-cyan-300">{payload.challengeCode}</p>
          </div>
          {payload.opponentScore !== undefined && (
            <p className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-200">Opponent {payload.opponentScore.toFixed(1)} / 10</p>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Transparent scorecard</h2>
          <div className="space-y-3">
            {payload.categories.map((category) => (
              <div key={category.label}>
                <div className="mb-1 flex justify-between gap-3 text-xs font-bold">
                  <span className="truncate text-slate-300">{category.label}</span>
                  <span className="text-purple-200">{category.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={category.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.score}>
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400" style={{ width: `${category.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
