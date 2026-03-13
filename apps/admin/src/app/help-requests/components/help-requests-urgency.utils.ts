export type HelpUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HelpRequestUrgencyLike = {
  urgency: HelpUrgency;
  predictedUrgency?: HelpUrgency | null;
  urgencyConfidence?: number | null;
};

export function getEffectiveUrgency(item: HelpRequestUrgencyLike): HelpUrgency {
  return item.predictedUrgency ?? item.urgency;
}

export function getUrgencyPaletteClasses(urgency: HelpUrgency): {
  badge: string;
  card: string;
} {
  switch (urgency) {
    case 'LOW':
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        card: 'border-l-slate-300',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        card: 'border-l-amber-300',
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        card: 'border-l-orange-400',
      };
    case 'CRITICAL':
      return {
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        card: 'border-l-rose-500',
      };
  }
}

export function formatUrgencyConfidence(confidence?: number | null): string | null {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(1, confidence));
  return `${Math.round(clamped * 100)}%`;
}
