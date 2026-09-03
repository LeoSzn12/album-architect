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
        return <Disc className="w-3.5 h-3.5 text-cyan-400" />;
      case 'feature':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case 'era':
        return <Clock className="w-3.5 h-3.5 text-purple-400" />;
      case 'curator':
        return <Headphones className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Award className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2 py-2">
      <div className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-purple-400" /> Active Synergies:
      </div>
      {synergies.map((syn) => (
        <div
          key={syn.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-xs font-semibold text-purple-200 shadow-md backdrop-blur-md animate-fade-in"
          title={syn.description}
        >
          {getIcon(syn.category)}
          <span>{syn.name}</span>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-500/30">
            +{syn.bonusPoints}
          </span>
        </div>
      ))}
    </div>
  );
};
