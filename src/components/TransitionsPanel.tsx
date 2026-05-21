"use client";

import { useState, useCallback } from "react";
import { EditRecipe } from "@/lib/types";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>, payload: { type: string; id: string; label: string; duration?: number }) => void;
}

interface TransitionType {
  id: string;
  name: string;
  duration: number;
  icon: string;
  color: string;
  description: string;
}

const TRANSITIONS: TransitionType[] = [
  {
    id: "cross-dissolve",
    name: "Cross Dissolve",
    duration: 1.0,
    icon: "opacity",
    color: "#6200ee",
    description: "Smoothly blends the outgoing frame into the incoming frame. Perfect for narrative sequences.",
  },
  {
    id: "fade-to-black",
    name: "Fade to Black",
    duration: 1.5,
    icon: "brightness_low",
    color: "#000000",
    description: "Fades the outgoing clip completely to black before fading in the next. Ideal for scene transitions.",
  },
  {
    id: "zoom-blur",
    name: "Zoom Blur",
    duration: 0.8,
    icon: "zoom_in",
    color: "#03dac6",
    description: "A fast, energetic zoom with heavy radial blur. Perfect for vlogs, travel clips, and high-energy cuts.",
  },
  {
    id: "whip-pan",
    name: "Whip Pan",
    duration: 0.5,
    icon: "swap_horiz",
    color: "#ff0266",
    description: "A fast camera pan right or left that creates a dynamic motion blur transition between contexts.",
  },
  {
    id: "glitch-warp",
    name: "Glitch Warp",
    duration: 0.6,
    icon: "grid_view",
    color: "#3d5afe",
    description: "Digital chromatic aberration and slice effects. Great for tech reviews, gaming, or modern edits.",
  },
];

export default function TransitionsPanel({ recipe, onChange, onDragStart }: Props) {
  // Store transition settings in recipe as transitionId and transitionDuration
  const selectedId = recipe.transitionId || "cross-dissolve";
  const transitionDuration = recipe.transitionDuration || 1.0;
  const transitionPlacement = recipe.transitionPlacement || "both";

  const selected = TRANSITIONS.find((t) => t.id === selectedId) || TRANSITIONS[0];

  const handleSelectTransition = useCallback((transId: string) => {
    onChange({ 
      transitionId: transId,
      transitionDuration: transitionDuration,
      transitionPlacement,
    });
  }, [onChange, transitionDuration, transitionPlacement]);

  const handleDurationChange = useCallback((duration: number) => {
    onChange({ 
      transitionId: selectedId,
      transitionDuration: duration,
      transitionPlacement,
    });
  }, [onChange, selectedId, transitionPlacement]);

  const handleDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>, transId: string, duration: number) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify({ id: transId, duration }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>animation</span>
          Transitions
        </h3>
        <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
          Multi-clip
        </span>
      </div>

      {/* Info Warning Banner */}
      <div className="p-3 bg-surface-container-high/40 border border-outline-variant/15 rounded-xl space-y-1.5">
        <p className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1.5 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
          Drag onto the timeline
        </p>
        <p className="text-[9.5px] text-on-surface-variant/75 leading-normal">
          Drag a preset onto the intro or outro lane in the timeline to place the transition where it will be visible.
        </p>
      </div>

      {/* Selection list */}
      <div className="space-y-2">
        <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Transition Presets</p>
        <div className="space-y-1">
          {TRANSITIONS.map((trans) => {
            const isSel = trans.id === selectedId;
            return (
              <button
                key={trans.id}
                type="button"
                onClick={() => handleSelectTransition(trans.id)}
                draggable
                onDragStart={(event) => {
                  handleDragStart(event, trans.id, trans.duration);
                  onDragStart?.(event, { type: "transition", id: trans.id, label: trans.name, duration: trans.duration });
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer bg-transparent text-left ${
                  isSel
                    ? "border-secondary bg-secondary/5 text-on-surface"
                    : "border-outline-variant/10 text-on-surface-variant hover:border-outline-variant/30 hover:bg-surface-variant/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white"
                    style={{
                      backgroundColor: isSel ? trans.color : `${trans.color}25`,
                      color: isSel ? "#ffffff" : trans.color,
                      border: `1.5px solid ${trans.color}35`,
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">{trans.icon}</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{trans.name}</span>
                </div>
                {isSel && (
                  <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration adjustment */}
      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Transition Duration</p>
          <span className="text-[10px] text-on-surface font-mono">{transitionDuration.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={3.0}
          step={0.1}
          value={transitionDuration}
          onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
          className="w-full h-1 accent-secondary cursor-pointer"
        />
      </div>

      {/* Detailed view */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-3 space-y-1.5">
        <p className="text-[9px] font-semibold text-secondary uppercase tracking-widest">{selected.name}</p>
        <p className="text-[10px] text-on-surface-variant/80 leading-normal">{selected.description}</p>
        <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold pt-1">
          Placement: {transitionPlacement}
        </p>
      </div>
    </div>
  );
}
