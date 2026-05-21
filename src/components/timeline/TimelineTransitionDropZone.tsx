"use client";

import { useMemo } from "react";
import { findAdjacentClipPairs } from "@/lib/transitions/resolveTransition";
import type { TimelineClip, TransitionKind } from "@/store/timelineStore";
import { timeToPx } from "./timelineMath";

type TimelineTransitionDropZoneProps = {
  clips: TimelineClip[];
  pixelsPerSecond: number;
  top: number;
  height: number;
  onInsert: (leftClipId: string, rightClipId: string, kind: TransitionKind) => void;
};

const MIME_KIND = "application/x-reframe-transition";

function mapPresetToKind(presetId: string): TransitionKind {
  if (presetId === "fade-to-black") return "linear-fade";
  if (presetId === "zoom-blur") return "directional-slide";
  return "cross-dissolve";
}

export default function TimelineTransitionDropZone({
  clips,
  pixelsPerSecond,
  top,
  height,
  onInsert,
}: TimelineTransitionDropZoneProps) {
  const pairs = useMemo(() => findAdjacentClipPairs(clips), [clips]);

  return (
    <>
      {pairs.map(({ left, right, junctionTime }) => (
        <div
          key={`${left.id}-${right.id}`}
          className="absolute z-30 w-5 -translate-x-1/2 rounded-full border border-dashed border-amber-200/50 bg-amber-300/10 transition hover:border-amber-200 hover:bg-amber-300/25"
          style={{
            left: timeToPx(junctionTime, pixelsPerSecond),
            top: top + 4,
            height: height - 8,
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const directKind = event.dataTransfer.getData(MIME_KIND) as TransitionKind;
            if (directKind) {
              onInsert(left.id, right.id, directKind);
              return;
            }
            const payload = event.dataTransfer.getData("application/json");
            if (!payload) return;
            try {
              const parsed = JSON.parse(payload) as { id?: string };
              if (!parsed.id) return;
              onInsert(left.id, right.id, mapPresetToKind(parsed.id));
            } catch {
              return;
            }
          }}
        />
      ))}
    </>
  );
}

export function setTransitionDragData(event: React.DragEvent, kind: TransitionKind) {
  event.dataTransfer.setData(MIME_KIND, kind);
  event.dataTransfer.effectAllowed = "copy";
}
