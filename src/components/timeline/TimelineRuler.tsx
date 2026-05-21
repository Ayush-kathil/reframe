"use client";

import { buildRulerTicks, formatTimecode, timeToPx } from "./timelineMath";

type TimelineRulerProps = {
  duration: number;
  pixelsPerSecond: number;
  contentWidth: number;
};

export default function TimelineRuler({ duration, pixelsPerSecond, contentWidth }: TimelineRulerProps) {
  const ticks = buildRulerTicks(duration);

  return (
    <div className="relative h-8 border-b border-white/5 bg-zinc-950/60" style={{ width: contentWidth }}>
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute top-0 flex h-full flex-col justify-between"
          style={{ left: timeToPx(tick, pixelsPerSecond) }}
        >
          <div className="h-2 w-px bg-white/20" />
          <span className="-translate-x-1/2 pr-2 font-mono text-[10px] text-zinc-500">{formatTimecode(tick)}</span>
        </div>
      ))}
    </div>
  );
}
