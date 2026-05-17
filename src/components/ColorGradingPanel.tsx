"use client";

import { Sliders, Sun, Contrast, Droplets, Sparkles, RefreshCw, Eye, EyeOff } from "lucide-react";
import { EditRecipe } from "@/lib/types";

interface ColorGradingPanelProps {
  recipe: EditRecipe;
  onChange: (updates: Partial<EditRecipe>) => void;
}

export default function ColorGradingPanel({ recipe, onChange }: ColorGradingPanelProps) {
  // Reset utility helpers
  const handleResetCore = () => {
    onChange({
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hueRotate: 0,
      opacity: 1,
    });
  };

  const handleResetRGB = () => {
    onChange({
      colorBalanceR: 1,
      colorBalanceG: 1,
      colorBalanceB: 1,
    });
  };

  const handleResetEffects = () => {
    onChange({
      sepia: 0,
      grayscale: 0,
      invert: false,
      blur: 0,
      sharpen: 0,
      noise: 0,
      vignette: 0,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Col 1: Core Color Adjustments & RGB Channels */}
      <div className="space-y-6">
        {/* Core Adjustments */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Core grading
            </h3>
            <button
              onClick={handleResetCore}
              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono uppercase tracking-wider"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Brightness</span>
                <span className="text-accent">{(recipe.brightness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={recipe.brightness}
                onChange={(e) => onChange({ brightness: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Contrast</span>
                <span className="text-accent">{(recipe.contrast * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={recipe.contrast}
                onChange={(e) => onChange({ contrast: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Saturation</span>
                <span className="text-accent">{(recipe.saturation * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.05"
                value={recipe.saturation}
                onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Hue Rotate */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Hue Rotation</span>
                <span className="text-accent">{recipe.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={recipe.hueRotate}
                onChange={(e) => onChange({ hueRotate: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Opacity</span>
                <span className="text-accent">{(recipe.opacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={recipe.opacity}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        </div>

        {/* RGB Channel Balance */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              RGB Channels
            </h3>
            <button
              onClick={handleResetRGB}
              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono uppercase tracking-wider"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Red Channel */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-red-400">Red Channel</span>
                <span className="text-red-400">{recipe.colorBalanceR.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={recipe.colorBalanceR}
                onChange={(e) => onChange({ colorBalanceR: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Green Channel */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-green-400">Green Channel</span>
                <span className="text-green-400">{recipe.colorBalanceG.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={recipe.colorBalanceG}
                onChange={(e) => onChange({ colorBalanceG: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {/* Blue Channel */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-blue-400">Blue Channel</span>
                <span className="text-blue-400">{recipe.colorBalanceB.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.01"
                value={recipe.colorBalanceB}
                onChange={(e) => onChange({ colorBalanceB: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Col 2: Custom Creative Effects & Flip Transforms */}
      <div className="space-y-6">
        {/* Creative Effects */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Creative effects
            </h3>
            <button
              onClick={handleResetEffects}
              className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono uppercase tracking-wider"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Grayscale */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Grayscale</span>
                <span className="text-accent">{(recipe.grayscale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={recipe.grayscale}
                onChange={(e) => onChange({ grayscale: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Sepia */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Sepia</span>
                <span className="text-accent">{(recipe.sepia * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={recipe.sepia}
                onChange={(e) => onChange({ sepia: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Blur */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Blur Blur</span>
                <span className="text-accent">{recipe.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={recipe.blur}
                onChange={(e) => onChange({ blur: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Sharpen */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Sharpen Amount</span>
                <span className="text-accent">{recipe.sharpen.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={recipe.sharpen}
                onChange={(e) => onChange({ sharpen: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span>Vignette Depth</span>
                <span className="text-accent">{recipe.vignette.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={recipe.vignette}
                onChange={(e) => onChange({ vignette: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-bg border border-border rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Invert */}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <span className="font-mono">Invert Visuals</span>
              <button
                onClick={() => onChange({ invert: !recipe.invert })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all ${
                  recipe.invert
                    ? "bg-accent/15 border-accent text-accent"
                    : "border-border text-muted hover:border-accent hover:text-text"
                }`}
              >
                {recipe.invert ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {recipe.invert ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* Spatial Transform Toggles */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono flex items-center gap-1.5 border-b border-border pb-3">
            <Droplets className="w-3.5 h-3.5" />
            Flips & Transforms
          </h3>

          <div className="flex gap-4">
            <button
              onClick={() => onChange({ flipH: !recipe.flipH })}
              className={`flex-1 py-3 border rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                recipe.flipH
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/10"
                  : "border-border text-muted hover:border-accent hover:text-text bg-surface"
              }`}
            >
              Horizontal Flip
            </button>
            <button
              onClick={() => onChange({ flipV: !recipe.flipV })}
              className={`flex-1 py-3 border rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                recipe.flipV
                  ? "bg-accent border-accent text-white shadow-lg shadow-accent/10"
                  : "border-border text-muted hover:border-accent hover:text-text bg-surface"
              }`}
            >
              Vertical Flip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
