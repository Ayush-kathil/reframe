"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { timeToPx } from "./timelineMath";

type TimelinePlayheadProps = {
  currentTime: number;
  pixelsPerSecond: number;
  height: number;
  scrubbing: boolean;
  onScrubStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onScrubMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onScrubEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export default function TimelinePlayhead({
  currentTime,
  pixelsPerSecond,
  height,
  scrubbing,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
}: TimelinePlayheadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const targetLeft = timeToPx(currentTime, pixelsPerSecond);
    if (scrubbing) {
      gsap.to(containerRef.current, {
        left: targetLeft,
        duration: 0.1,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      gsap.set(containerRef.current, { left: targetLeft });
    }
  }, [currentTime, pixelsPerSecond, scrubbing]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-y-0 z-40"
    >
      <div
        role="slider"
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuenow={currentTime}
        tabIndex={0}
        className={cn(
          "pointer-events-auto absolute -left-2 top-0 flex h-full w-4 cursor-ew-resize flex-col items-center",
          scrubbing ? "z-50" : "z-40"
        )}
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
      >
        <div
          className={cn(
            "h-3 w-3 rotate-45 rounded-sm shadow-lg",
            scrubbing ? "bg-fuchsia-400 shadow-fuchsia-500/60" : "bg-violet-500 shadow-violet-500/50"
          )}
        />
        <div
          className={cn("w-px flex-1", scrubbing ? "bg-fuchsia-400/90" : "bg-violet-500/90")}
          style={{ minHeight: height }}
        />
      </div>
    </div>
  );
}
