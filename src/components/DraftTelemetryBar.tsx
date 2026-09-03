'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { OscilloscopeEnergyBar } from '@/components/OscilloscopeEnergyBar';
import { ArtistMonopolyTracker } from '@/components/ArtistMonopolyTracker';
import { Activity, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export const DraftTelemetryBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { energyMetrics, monopolyReport, slots, currentRoundIndex } = useDraftStore();

  const activeSlot = slots[currentRoundIndex];
  const { hasViolation, totalPenaltyDeduction } = monopolyReport;

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Sleek compact HUD bar */}
      <div className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-[#0e0e12]/85 border border-white/[0.08] backdrop-blur-2xl text-xs shadow-lg">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Energy pacing badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-300 whitespace-nowrap">
            <Activity className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Pacing:</span>
            <span className="text-white font-extrabold">{energyMetrics.status}</span>
          </div>

          {/* Slot Target */}
          {activeSlot && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-400 font-medium whitespace-nowrap">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Target: <strong className="text-white">{activeSlot.targetEnergy.ideal}%</strong></span>
            </div>
          )}

          {/* Monopoly status badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap">
            {hasViolation ? (
              <span className="flex items-center gap-1 text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Monopoly Penalty: -{totalPenaltyDeduction} pts</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Roster: Clean Diversity</span>
              </span>
            )}
          </div>
        </div>

        {/* Expand / Collapse toggle */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-300 hover:text-white text-[11px] font-bold transition active:scale-95 cursor-pointer flex-shrink-0"
          title={isOpen ? 'Collapse telemetry panels' : 'Expand full energy waveform and monopoly radar'}
        >
          <span>{isOpen ? 'Hide Telemetry' : 'Telemetry Waveform'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible deep dive panels */}
      {isOpen && (
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          <OscilloscopeEnergyBar />
          <ArtistMonopolyTracker />
        </div>
      )}
    </div>
  );
};
