'use client';

import React from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Activity, Flame, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const OscilloscopeEnergyBar: React.FC = () => {
  const { slots, currentRoundIndex, draftedTracks, energyMetrics } = useDraftStore();

  const activeSlot = slots[currentRoundIndex];
  const isComplete = currentRoundIndex >= slots.length;

  // Status color badges
  const getStatusBadge = () => {
    switch (energyMetrics.status) {
      case 'Optimal Pacing':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'High Energy Overload':
        return {
          bg: 'bg-rose-950/60 border-rose-500/30 text-rose-300',
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'Vibe Lull':
        return {
          bg: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'Wild Energy Spikes':
        return {
          bg: 'bg-white/[0.06] border-white/[0.1] text-zinc-200',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-zinc-300" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="w-full bg-[#0e0e12]/85 border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl backdrop-blur-2xl relative overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Oscilloscope Energy & Pacing Waveform
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeSlot && !isComplete && (
            <span className="text-[11px] text-zinc-400 font-medium">
              Target Energy: <span className="text-white font-bold">{activeSlot.targetEnergy.min}% - {activeSlot.targetEnergy.max}%</span>
            </span>
          )}

          <div
            className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shadow-sm ${statusBadge.bg}`}
          >
            {statusBadge.icon}
            <span>{energyMetrics.status}</span>
          </div>
        </div>
      </div>

      {/* Waveform Visualization Grid */}
      <div className="h-14 bg-black/60 rounded-xl p-2 flex items-end gap-1.5 border border-white/[0.06] relative overflow-hidden">
        {slots.map((slot, idx) => {
          const drafted = draftedTracks[idx];
          const isCurrent = idx === currentRoundIndex;
          const isPast = idx < currentRoundIndex;

          const heightPercent = drafted ? drafted.song.energy : isCurrent ? 50 : 20;

          // Color gradient depending on energy
          let barBg = 'bg-zinc-800';
          if (drafted) {
            if (drafted.song.energy >= 85) barBg = 'bg-rose-500 shadow-md shadow-rose-950/40';
            else if (drafted.song.energy >= 65) barBg = 'bg-amber-400';
            else if (drafted.song.energy >= 45) barBg = 'bg-emerald-400';
            else barBg = 'bg-zinc-500';
          } else if (isCurrent) {
            barBg = 'bg-white/40 animate-pulse border border-white/60';
          }

          return (
            <div
              key={slot.id}
              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              {drafted && (
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#121216] border border-white/[0.12] rounded-lg p-2 text-[10px] w-36 z-30 shadow-2xl pointer-events-none">
                  <span className="font-bold text-white truncate">{drafted.song.title}</span>
                  <span className="text-zinc-400 truncate">{drafted.song.artist}</span>
                  <div className="flex justify-between mt-1 pt-1 border-t border-white/[0.06] text-[9px]">
                    <span className="text-rose-400">Energy: {drafted.song.energy}%</span>
                    <span className="text-zinc-300">{drafted.song.bpm} BPM</span>
                  </div>
                </div>
              )}

              {/* Bar element */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t-sm transition-all duration-500 ${barBg}`}
              />

              {/* Round number footer */}
              <span
                className={`text-[9px] mt-1 font-bold ${
                  isCurrent ? 'text-white' : isPast ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                R{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Energy Metrics Stats Row */}
      <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
        <div>
          Avg Energy:{' '}
          <span className="font-bold text-white">{energyMetrics.avgEnergy}%</span>
        </div>
        <div>
          Fatigue Risk:{' '}
          <span
            className={`font-bold ${
              energyMetrics.fatigueScore > 50 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {energyMetrics.fatigueScore}%
          </span>
        </div>
        <div>
          Drafted: <span className="font-bold text-white">{draftedTracks.length} / {slots.length}</span>
        </div>
      </div>
    </div>
  );
};
