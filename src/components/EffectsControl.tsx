"use client";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  SlidersHorizontal, Sparkles, Droplets, Contrast, 
  Sun, Palette, Zap, Waves, EyeOff, Focus, 
  Wind, Aperture, Paintbrush
} from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function EffectsControl({ recipe, onChange }: Props) {
  const adjustments = [
    { label: "Exposure", key: "brightness", min: -1, max: 1, step: 0.05, icon: <Sun size={14} />, group: "Basic" },
    { label: "Contrast", key: "contrast", min: 0, max: 2, step: 0.1, icon: <Contrast size={14} />, group: "Basic" },
    { label: "Vibrance", key: "saturation", min: 0, max: 2, step: 0.1, icon: <Palette size={14} />, group: "Basic" },
    
    { label: "Hue", key: "hueRotate", min: 0, max: 360, step: 1, icon: <Zap size={14} />, group: "Color" },
    { label: "Sepia", key: "sepia", min: 0, max: 1, step: 0.05, icon: <Droplets size={14} />, group: "Color" },
    { label: "Grayscale", key: "grayscale", min: 0, max: 1, step: 0.05, icon: <EyeOff size={14} />, group: "Color" },
    
    { label: "Sharpness", key: "sharpen", min: 0, max: 2, step: 0.1, icon: <Focus size={14} />, group: "Details" },
    { label: "Gaussian Blur", key: "blur", min: 0, max: 20, step: 1, icon: <Waves size={14} />, group: "Details" },
    { label: "Digital Noise", key: "noise", min: 0, max: 50, step: 1, icon: <Wind size={14} />, group: "Details" },
    
    { label: "Vignette", key: "vignette", min: 0, max: 1, step: 0.05, icon: <Aperture size={14} />, group: "Cinematic" },
    { label: "Master Opacity", key: "opacity", min: 0, max: 1, step: 0.05, icon: <SlidersHorizontal size={14} />, group: "Cinematic" },
  ];

  const colorBalance = [
    { label: "R-Channel", key: "colorBalanceR", color: "text-red-500" },
    { label: "G-Channel", key: "colorBalanceG", color: "text-green-500" },
    { label: "B-Channel", key: "colorBalanceB", color: "text-blue-500" },
  ];

  const groups = ["Basic", "Color", "Details", "Cinematic"];

  return (
    <div className="space-y-10 animate-entrance">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">Image Processing</h3>
        <button 
          onClick={() => onChange({ 
            brightness: 0, contrast: 1, saturation: 1, hueRotate: 0, 
            sepia: 0, grayscale: 0, blur: 0, opacity: 1, invert: false,
            sharpen: 0, noise: 0, vignette: 0, colorBalanceR: 1, colorBalanceG: 1, colorBalanceB: 1
          })}
          className="text-[10px] font-bold text-blue-500 hover:opacity-70 transition-google uppercase tracking-widest"
        >
          Reset Stack
        </button>
      </div>

      <div className="space-y-8">
        {/* Toggleable Invert */}
        <div className="p-5 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl flex items-center justify-between group hover:border-[var(--muted)]/20 transition-google">
          <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-google", recipe.invert ? "bg-red-500 text-white shadow-lg" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]")}>
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-tight">Spectrum Inversion</p>
              <p className="text-[9px] text-[var(--muted)]">Flip luminosity and hue channels</p>
            </div>
          </div>
          <button
            onClick={() => onChange({ invert: !recipe.invert })}
            className={cn("w-12 h-6 rounded-full transition-google relative", recipe.invert ? "bg-red-500" : "bg-[var(--border)]")}
          >
            <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-google shadow-sm", recipe.invert ? "left-7" : "left-1")} />
          </button>
        </div>

        {/* RGB Color Balance */}
        <div className="space-y-4">
          <p className="label-mono">Chromatic Balancing</p>
          <div className="grid grid-cols-1 gap-6 p-6 bg-[var(--surface-hover)] border border-[var(--border)] rounded-3xl">
            {colorBalance.map((tint) => (
              <div key={tint.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest", tint.color)}>{tint.label}</span>
                  <span className="text-[10px] font-mono font-bold opacity-60">{((recipe as any)[tint.key] * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0} max={2} step={0.05}
                  value={(recipe as any)[tint.key]}
                  onChange={(e) => onChange({ [tint.key]: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Grouped Adjustments */}
        {groups.map((group) => (
          <div key={group} className="space-y-4">
            <p className="label-mono">{group} Parameters</p>
            <div className="grid grid-cols-1 gap-8 p-6 bg-[var(--surface-hover)] border border-[var(--border)] rounded-3xl">
              {adjustments.filter(a => a.group === group).map((adj) => (
                <div key={adj.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-[var(--muted)]">
                      <span className="text-blue-500">{adj.icon}</span>
                      <span>{adj.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold opacity-60">
                      {((recipe as any)[adj.key]).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range" min={adj.min} max={adj.max} step={adj.step}
                    value={(recipe as any)[adj.key]}
                    onChange={(e) => onChange({ [adj.key]: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
