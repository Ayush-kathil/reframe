"use client";

import { useMemo } from "react";
import type { MaskPoint } from "@/store/editorStore";
import { cn } from "@/lib/utils";

type MaskPenOverlayProps = {
  points: MaskPoint[];
  closed: boolean;
  active: boolean;
  width: number;
  height: number;
  className?: string;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
};

export default function MaskPenOverlay({
  points,
  closed,
  active,
  width,
  height,
  className,
  onPointerDown,
}: MaskPenOverlayProps) {
  const polyline = useMemo(
    () => points.map((point) => `${point.x * width},${point.y * height}`).join(" "),
    [height, points, width]
  );

  return (
    <svg
      width={width}
      height={height}
      className={cn("absolute z-30 touch-none", active ? "cursor-crosshair" : "pointer-events-none", className)}
      onPointerDown={onPointerDown}
    >
      {points.length > 1 && (
        <polyline
          points={polyline}
          fill={closed ? "rgba(34,211,238,0.12)" : "none"}
          stroke="rgba(34,211,238,0.9)"
          strokeWidth={2}
          strokeDasharray={closed ? undefined : "6 4"}
        />
      )}
      {closed && points.length > 2 && <polygon points={polyline} fill="rgba(34,211,238,0.08)" stroke="none" />}
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x * width}
          cy={point.y * height}
          r={5}
          fill="#22d3ee"
          stroke="#09090b"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
