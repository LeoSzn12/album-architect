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
          bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'High Energy Overload':
        return {
          bg: 'bg-red-950/80 border-red-800 text-red-300',
          icon: <Flame className="w-3.5 h-3.5 text-red-400" />,
        };
      case 'Vibe Lull':
        return {
          bg: 'bg-amber-950/80 border-amber-800 text-amber-300',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'Wild Energy Spikes':
        return {
          bg: 'bg-purple-950/80 border-purple-800 text-purple-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="w-full bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Visual background ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-16 bg-purple-600/10 blur-2xl pointer-events-none" />

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Oscilloscope Energy & Pacing Waveform
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeSlot && !isComplete && (
            <span className="text-[11px] text-gray-400 font-medium">
              Target Energy: <span className="text-purple-300 font-bold">{activeSlot.targetEnergy.min}% - {activeSlot.targetEnergy.max}%</span>
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
      <div className="h-14 bg-gray-950/90 rounded-xl p-2 flex items-end gap-1.5 border border-gray-800/80 relative overflow-hidden">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_10px] opacity-20 pointer-events-none" />

        {slots.map((slot, idx) => {
          const drafted = draftedTracks[idx];
          const isCurrent = idx === currentRoundIndex;
          const isPast = idx < currentRoundIndex;

          const heightPercent = drafted ? drafted.song.energy : isCurrent ? 50 : 20;

          // Color gradient depending on energy
          let barBg = 'bg-gray-800';
          if (drafted) {
            if (drafted.song.energy >= 85) barBg = 'bg-gradient-to-t from-red-600 via-pink-500 to-purple-400 shadow-md shadow-red-900/40';
            else if (drafted.song.energy >= 65) barBg = 'bg-gradient-to-t from-purple-700 to-pink-500 shadow-md shadow-purple-900/40';
            else if (drafted.song.energy >= 45) barBg = 'bg-gradient-to-t from-blue-700 to-cyan-400';
            else barBg = 'bg-gradient-to-t from-indigo-900 to-teal-500';
          } else if (isCurrent) {
            barBg = 'bg-purple-500/40 animate-pulse border border-purple-400/50';
          }

          return (
            <div
              key={slot.id}
              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              {drafted && (
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-950 border border-purple-500/40 rounded-lg p-2 text-[10px] w-36 z-30 shadow-xl pointer-events-none">
                  <span className="font-bold text-white truncate">{drafted.song.title}</span>
                  <span className="text-gray-400 truncate">{drafted.song.artist}</span>
                  <div className="flex justify-between mt-1 pt-1 border-t border-gray-800 text-[9px]">
                    <span className="text-purple-400">Energy: {drafted.song.energy}%</span>
                    <span className="text-cyan-400">{drafted.song.bpm} BPM</span>
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
                  isCurrent ? 'text-purple-400' : isPast ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                R{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Energy Metrics Stats Row */}
      <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1 border-t border-gray-800/60">
        <div>
          Avg Energy:{' '}
          <span className="font-bold text-white">{energyMetrics.avgEnergy}%</span>
        </div>
        <div>
          Fatigue Risk:{' '}
          <span
            className={`font-bold ${
              energyMetrics.fatigueScore > 50 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {energyMetrics.fatigueScore}%
          </span>
        </div>
        <div>
          Drafted: <span className="font-bold text-purple-300">{draftedTracks.length} / {slots.length}</span>
        </div>
      </div>
    </div>
  );
};
