"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop, Focus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onNext?: () => void;
}

const REFRAME_PRESETS = [
  { id: "center", name: "Center", icon: "⊙", panX: 0, panY: 0, description: "Keep center focus" },
  { id: "top", name: "Top", icon: "↑", panX: 0, panY: -30, description: "Focus on top" },
  { id: "bottom", name: "Bottom", icon: "↓", panX: 0, panY: 30, description: "Focus on bottom" },
  { id: "left", name: "Left", icon: "←", panX: -40, panY: 0, description: "Focus on left side" },
  { id: "right", name: "Right", icon: "→", panX: 40, panY: 0, description: "Focus on right side" },
  { id: "top-left", name: "Top-Left", icon: "↖", panX: -40, panY: -30, description: "Top-left focus" },
  { id: "top-right", name: "Top-Right", icon: "↗", panX: 40, panY: -30, description: "Top-right focus" },
  { id: "bottom-left", name: "Bottom-Left", icon: "↙", panX: -40, panY: 30, description: "Bottom-left focus" },
];

export default function FramingControl({ recipe, onChange, onNext }: Props) {
  return (
    <div className="space-y-6">
      {/* Framing Mode Selection */}
      <div className="grid grid-cols-2 gap-3">
        {(["fit", "fill"] as const).map((mode) => {
          const Icon = mode === "fit" ? Maximize2 : Crop;
          const active = recipe.framing === mode;
          return (
            <button
              type="button"
              key={mode}
              title={mode === "fit" ? "Fit: Keeps the full video visible with black bars" : "Reframe: Keeps the full video visible inside the frame"}
              onClick={() => onChange({ framing: mode })}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                active
                  ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/20"
                  : "border-outline-variant/20 text-on-surface-variant hover:border-primary/40 bg-surface-container-low"
              )}
            >
              <Icon size={20} aria-hidden="true"/>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider">
                  {mode === "fit" ? "Letterbox" : "Full Frame"}
                </p>
                <p className="text-[10px] text-on-surface-variant/70 mt-1">
                  {mode === "fit" ? "Add black bars" : "Keep every pixel visible"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {recipe.framing === "fill" && (
        <div className="space-y-4 pt-4 border-t border-outline-variant/20 mt-2 animate-fade-in">
          {/* Full-frame reframing presets */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <Focus className="w-4 h-4" />
              Focus Presets
            </div>
            <div className="grid grid-cols-4 gap-2">
              {REFRAME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ panX: preset.panX, panY: preset.panY })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center text-xs",
                    recipe.panX === preset.panX && recipe.panY === preset.panY
                      ? "border-primary bg-primary/15 shadow-md shadow-primary/20"
                      : "border-outline-variant/20 bg-surface-container-low hover:border-primary/40"
                  )}
                  title={preset.description}
                >
                  <div className="text-xl mb-1">{preset.icon}</div>
                  <div className="font-bold text-[9px] uppercase tracking-wider">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Pan Controls */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Custom Adjustment</p>
            
            {/* Horizontal Pan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="pan-x" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                  Horizontal
                </label>
                <span className="text-xs font-mono font-bold text-primary">
                  {recipe.panX > 0 ? `+${recipe.panX}` : recipe.panX}%
                </span>
              </div>
              <input
                id="pan-x"
                type="range"
                min={-100}
                max={100}
                step={5}
                value={recipe.panX}
                onChange={(e) => onChange({ panX: parseInt(e.target.value) })}
                className="w-full h-2 accent-primary cursor-pointer bg-surface-container-high rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                <span>Left</span>
                <span>Center</span>
                <span>Right</span>
              </div>
            </div>

            {/* Vertical Tilt */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="pan-y" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                  Vertical
                </label>
                <span className="text-xs font-mono font-bold text-primary">
                  {recipe.panY > 0 ? `+${recipe.panY}` : recipe.panY}%
                </span>
              </div>
              <input
                id="pan-y"
                type="range"
                min={-100}
                max={100}
                step={5}
                value={recipe.panY}
                onChange={(e) => onChange({ panY: parseInt(e.target.value) })}
                className="w-full h-2 accent-primary cursor-pointer bg-surface-container-high rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                <span>Top</span>
                <span>Center</span>
                <span>Bottom</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => onChange({ panX: 0, panY: 0 })}
              className="w-full py-2 px-3 rounded-lg border-2 border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40 text-on-surface-variant text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Reset to Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}