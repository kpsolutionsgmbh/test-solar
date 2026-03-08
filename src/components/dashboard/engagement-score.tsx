'use client';

interface EngagementScoreProps {
  score: number;
  compact?: boolean;
}

function getScoreConfig(s: number) {
  if (s <= 20) return { bg: 'bg-gray-200', fill: 'bg-gray-400', label: 'Kalt' };
  if (s <= 40) return { bg: 'bg-blue-100', fill: 'bg-blue-400', label: 'Lauwarm' };
  if (s <= 60) return { bg: 'bg-orange-100', fill: 'bg-orange-400', label: 'Warm' };
  if (s <= 80) return { bg: 'bg-red-100', fill: 'bg-red-500', label: 'Heiß' };
  return { bg: 'bg-emerald-100', fill: 'bg-emerald-500', label: 'Deal-Ready' };
}

export function EngagementScore({ score, compact }: EngagementScoreProps) {
  const { bg, fill, label } = getScoreConfig(score);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`h-1.5 w-12 rounded-full ${bg} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${fill} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-[#1a1a1a] tabular-nums whitespace-nowrap">
          {score}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 flex-1 rounded-full ${bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${fill} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[#1a1a1a] whitespace-nowrap">
        {label} {score}/100
      </span>
    </div>
  );
}

export function getScoreLabel(score: number): string {
  return getScoreConfig(score).label;
}
