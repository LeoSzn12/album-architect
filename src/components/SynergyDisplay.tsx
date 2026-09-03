'use client';

import React from 'react';
import { Flame, Disc, Sparkles, Clock, Headphones, Award } from 'lucide-react';
import type { SynergyBadge } from '@/types/draft';

interface SynergyDisplayProps {
  synergies: SynergyBadge[];
}

export const SynergyDisplay: React.FC<SynergyDisplayProps> = ({ synergies }) => {
  if (synergies.length === 0) return null;

  const getIcon = (category: SynergyBadge['category']) => {
    switch (category) {
      case 'producer':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'bpm':
        return <Disc className="w-3.5 h-3.5 text-sky-400" />;
      case 'feature':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'era':
        return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
      case 'curator':
        return <Headphones className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Award className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2 py-1">
      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-rose-500" /> Active Synergies:
      </div>
      {synergies.map((syn) => (
        <div
          key={syn.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-zinc-200 shadow-sm backdrop-blur-xl animate-fade-in"
          title={syn.description}
        >
          {getIcon(syn.category)}
          <span>{syn.name}</span>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-500/30">
            +{syn.bonusPoints}
          </span>
        </div>
      ))}
    </div>
  );
};
