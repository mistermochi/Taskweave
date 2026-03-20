import { EnergyLevel } from '../model/types';

export const ENERGY_COLORS: Record<EnergyLevel, { bg: string; text: string; border: string; hex: string }> = {
  Low: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
    hex: '#10b981'
  },
  Medium: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
    hex: '#f59e0b'
  },
  High: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/30',
    hex: '#f97316'
  }
};
