"use client";

import { EditRecipe } from "@/lib/types";
import { useCallback } from "react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  patch: Partial<EditRecipe>;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "none",
    name: "Original",
    icon: "filter_none",
    color: "#888",
    patch: { brightness: 0, contrast: 1, saturation: 1, hueRotate: 0, sepia: 0, grayscale: 0, vignette: 0, blur: 0, sharpen: 0, noise: 0, invert: false, colorBalanceR: 1, colorBalanceG: 1, colorBalanceB: 1 },
  },
  {
    id: "vintage",
    name: "Vintage",
    icon: "photo_camera",
    color: "#d4a574",
    patch: { brightness: 0.05, contrast: 0.9, saturation: 0.7, sepia: 0.4, vignette: 0.3, colorBalanceR: 1.1, colorBalanceG: 1.0, colorBalanceB: 0.85 },
  },
  {
    id: "noir",
    name: "Film Noir",
    icon: "contrast",
    color: "#555",
    patch: { brightness: -0.05, contrast: 1.4, saturation: 0, grayscale: 1, vignette: 0.5, sharpen: 1.5 },
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    icon: "wb_sunny",
    color: "#ff8c42",
    patch: { brightness: 0.08, contrast: 1.05, saturation: 1.3, hueRotate: -10, colorBalanceR: 1.15, colorBalanceG: 1.0, colorBalanceB: 0.85, vignette: 0.15 },
  },
  {
    id: "cool-blue",
    name: "Cool Tone",
    icon: "ac_unit",
    color: "#64b5f6",
    patch: { brightness: 0, contrast: 1.1, saturation: 0.85, hueRotate: 10, colorBalanceR: 0.9, colorBalanceG: 0.95, colorBalanceB: 1.2 },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    icon: "movie",
    color: "#ab47bc",
    patch: { brightness: -0.03, contrast: 1.25, saturation: 0.8, vignette: 0.4, colorBalanceR: 1.0, colorBalanceG: 0.95, colorBalanceB: 1.1, sharpen: 0.8 },
  },
  {
    id: "retro",
    name: "Retro 70s",
    icon: "vintage_filter",
    color: "#e8a87c",
    patch: { brightness: 0.1, contrast: 0.85, saturation: 1.2, sepia: 0.2, hueRotate: 5, vignette: 0.2, colorBalanceR: 1.1, colorBalanceG: 1.05, colorBalanceB: 0.8 },
  },
  {
    id: "bleach",
    name: "Bleach Bypass",
    icon: "exposure",
    color: "#9e9e9e",
    patch: { brightness: 0.05, contrast: 1.5, saturation: 0.4, sharpen: 1.0, vignette: 0.2 },
  },
  {
    id: "neon",
    name: "Neon Glow",
    icon: "flare",
    color: "#e040fb",
    patch: { brightness: 0.1, contrast: 1.3, saturation: 1.8, hueRotate: 15, colorBalanceR: 1.1, colorBalanceG: 0.9, colorBalanceB: 1.2 },
  },
  {
    id: "matte",
    name: "Matte",
    icon: "gradient",
    color: "#78909c",
    patch: { brightness: 0.08, contrast: 0.85, saturation: 0.75, vignette: 0.1, colorBalanceR: 1.0, colorBalanceG: 1.02, colorBalanceB: 1.0 },
  },
  {
    id: "vivid",
    name: "Vivid",
    icon: "palette",
    color: "#ff5252",
    patch: { brightness: 0.05, contrast: 1.2, saturation: 1.6, sharpen: 0.5, colorBalanceR: 1.05, colorBalanceG: 1.0, colorBalanceB: 1.05 },
  },
  {
    id: "dreamy",
    name: "Dreamy",
    icon: "cloud",
    color: "#b39ddb",
    patch: { brightness: 0.12, contrast: 0.8, saturation: 0.9, blur: 0.3, vignette: 0.2, colorBalanceR: 1.05, colorBalanceG: 1.0, colorBalanceB: 1.1 },
  },
];

export default function EffectsPanel({ recipe, onChange }: Props) {
  const applyPreset = useCallback((preset: FilterPreset) => {
    onChange(preset.patch);
  }, [onChange]);

  // Determine which preset is closest to the current state
  const activePresetId = FILTER_PRESETS.find(p => {
    if (p.id === "none") {
      return recipe.brightness === 0 && recipe.contrast === 1 && recipe.saturation === 1 && recipe.sepia === 0 && recipe.grayscale === 0;
    }
    return false;
  })?.id || null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
          Filter Presets
        </h3>
        <button
          type="button"
          onClick={() => applyPreset(FILTER_PRESETS[0])}
          className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-wider font-semibold cursor-pointer bg-transparent border-0 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[12px]">restart_alt</span>
          Reset
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-3 gap-2">
        {FILTER_PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`group/fx relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer bg-transparent hover:scale-[1.03] active:scale-[0.97] ${
                isActive
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                  : "border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-variant/30"
              }`}
            >
              {/* Icon circle */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all group-hover/fx:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${preset.color}22, ${preset.color}44)`,
                  border: `1.5px solid ${preset.color}55`,
                }}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ color: preset.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {preset.icon}
                </span>
              </div>
              {/* Label */}
              <span className={`text-[10px] font-semibold tracking-wider uppercase text-center leading-tight ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}>
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Adjustments */}
      <div className="border-t border-outline-variant/15 pt-3 mt-3">
        <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px]">info</span>
          Tip: Use Color Grading panel for fine-tuning
        </p>
      </div>
    </div>
  );
}
