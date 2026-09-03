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
      <div className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Energy pacing badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-[11px] font-bold text-purple-200 whitespace-nowrap">
            <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>Pacing:</span>
            <span className="text-purple-300 font-extrabold">{energyMetrics.status}</span>
          </div>

          {/* Slot Target */}
          {activeSlot && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 font-medium whitespace-nowrap">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Target: <strong className="text-slate-200">{activeSlot.targetEnergy.ideal}%</strong></span>
            </div>
          )}

          {/* Monopoly status badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap">
            {hasViolation ? (
              <span className="flex items-center gap-1 text-red-300 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Monopoly Penalty: -{totalPenaltyDeduction} pts</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Roster: Clean Diversity</span>
              </span>
            )}
          </div>
        </div>

        {/* Expand / Collapse toggle */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white text-[11px] font-bold transition cursor-pointer flex-shrink-0"
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
