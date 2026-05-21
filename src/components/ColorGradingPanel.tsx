"use client";

import { useState } from "react";
import { Sun, Contrast, Droplets, Sparkles, RefreshCw, Eye, EyeOff, ChevronDown } from "lucide-react";
import { EditRecipe } from "@/lib/types";

interface ColorGradingPanelProps {
  recipe: EditRecipe;
  onChange: (updates: Partial<EditRecipe>) => void;
}

/* ─── Reusable Premium Slider ─── */
interface ModernSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  trackClass: string;
  displayValue: string;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
}

function ModernSlider({ label, value, min, max, step, trackClass, displayValue, onChange, icon }: ModernSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="group/slider space-y-2">
      <div className="flex items-center justify-between">
        <span className="slider-label text-xs font-medium text-on-surface-variant flex items-center gap-1.5 select-none">
          {icon}
          {label}
        </span>
        <span
          key={displayValue}
          className={`value-badge text-xs font-mono font-semibold px-2 py-0.5 rounded-md transition-all ${
            isDragging
              ? "bg-primary/20 text-primary scale-110"
              : "bg-surface-container-high/60 text-on-surface-variant"
          }`}
        >
          {displayValue}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        {/* Track container with gradient */}
        <div className="flex-1 relative h-8 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`slider-modern ${trackClass}`}
          />
          {/* Glow indicator at thumb position */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none transition-opacity duration-200"
            style={{
              left: `calc(${percent}% - 6px)`,
              background: 'var(--accent)',
              opacity: isDragging ? 0.5 : 0,
              filter: 'blur(8px)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Collapsible Section Wrapper ─── */
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  onReset?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, onReset, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container/50 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-variant/30 transition-colors cursor-pointer bg-transparent border-0 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
          {icon}
          {title}
        </span>
        <div className="flex items-center gap-2">
          {onReset && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onReset?.(); } }}
              className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div className={`section-collapse ${isOpen ? "open" : ""}`}>
        <div>
          <div className="px-3 pb-3 pt-1 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Panel ─── */
export default function ColorGradingPanel({ recipe, onChange }: ColorGradingPanelProps) {
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
    <div className="space-y-3 animate-fade-in">
      {/* Core Color Adjustments */}
      <CollapsibleSection
        title="Color"
        icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
        onReset={handleResetCore}
      >
        <ModernSlider
          label="Brightness"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
          value={recipe.brightness}
          min={-1}
          max={1}
          step={0.05}
          trackClass="slider-brightness"
          displayValue={`${(recipe.brightness * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ brightness: v })}
        />
        <ModernSlider
          label="Contrast"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />}
          value={recipe.contrast}
          min={0}
          max={2}
          step={0.05}
          trackClass="slider-contrast"
          displayValue={`${(recipe.contrast * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ contrast: v })}
        />
        <ModernSlider
          label="Saturation"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" />}
          value={recipe.saturation}
          min={0}
          max={3}
          step={0.05}
          trackClass="slider-saturation"
          displayValue={`${(recipe.saturation * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ saturation: v })}
        />
        <ModernSlider
          label="Hue Rotation"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-400 via-green-400 to-blue-400 inline-block" />}
          value={recipe.hueRotate}
          min={0}
          max={360}
          step={1}
          trackClass="slider-hue"
          displayValue={`${recipe.hueRotate}°`}
          onChange={(v) => onChange({ hueRotate: v })}
        />
        <ModernSlider
          label="Opacity"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-white/60 border border-white/20 inline-block" />}
          value={recipe.opacity}
          min={0}
          max={1}
          step={0.05}
          trackClass="slider-opacity"
          displayValue={`${(recipe.opacity * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ opacity: v })}
        />
      </CollapsibleSection>

      {/* RGB Channel Balance */}
      <CollapsibleSection
        title="RGB Channels"
        icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />}
        onReset={handleResetRGB}
        defaultOpen={false}
      >
        <ModernSlider
          label="Red"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />}
          value={recipe.colorBalanceR}
          min={0.5}
          max={1.5}
          step={0.01}
          trackClass="slider-red"
          displayValue={recipe.colorBalanceR.toFixed(2)}
          onChange={(v) => onChange({ colorBalanceR: v })}
        />
        <ModernSlider
          label="Green"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
          value={recipe.colorBalanceG}
          min={0.5}
          max={1.5}
          step={0.01}
          trackClass="slider-green"
          displayValue={recipe.colorBalanceG.toFixed(2)}
          onChange={(v) => onChange({ colorBalanceG: v })}
        />
        <ModernSlider
          label="Blue"
          icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
          value={recipe.colorBalanceB}
          min={0.5}
          max={1.5}
          step={0.01}
          trackClass="slider-blue"
          displayValue={recipe.colorBalanceB.toFixed(2)}
          onChange={(v) => onChange({ colorBalanceB: v })}
        />
      </CollapsibleSection>

      {/* Creative Effects */}
      <CollapsibleSection
        title="Effects"
        icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
        onReset={handleResetEffects}
        defaultOpen={false}
      >
        <ModernSlider
          label="Grayscale"
          value={recipe.grayscale}
          min={0}
          max={1}
          step={0.05}
          trackClass="slider-grayscale"
          displayValue={`${(recipe.grayscale * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ grayscale: v })}
        />
        <ModernSlider
          label="Sepia"
          value={recipe.sepia}
          min={0}
          max={1}
          step={0.05}
          trackClass="slider-sepia"
          displayValue={`${(recipe.sepia * 100).toFixed(0)}%`}
          onChange={(v) => onChange({ sepia: v })}
        />
        <ModernSlider
          label="Lens Blur"
          value={recipe.blur}
          min={0}
          max={20}
          step={1}
          trackClass="slider-blur"
          displayValue={`${recipe.blur}px`}
          onChange={(v) => onChange({ blur: v })}
        />
        <ModernSlider
          label="Sharpening"
          value={recipe.sharpen}
          min={0}
          max={2}
          step={0.1}
          trackClass="slider-sharpen"
          displayValue={recipe.sharpen.toFixed(1)}
          onChange={(v) => onChange({ sharpen: v })}
        />
        <ModernSlider
          label="Vignette"
          value={recipe.vignette}
          min={0}
          max={2}
          step={0.1}
          trackClass="slider-vignette"
          displayValue={recipe.vignette.toFixed(1)}
          onChange={(v) => onChange({ vignette: v })}
        />

        {/* Invert Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          <span className="text-xs font-medium text-on-surface-variant">Invert Colors</span>
          <button
            type="button"
            onClick={() => onChange({ invert: !recipe.invert })}
            className={`relative w-10 h-[22px] rounded-full transition-all duration-300 cursor-pointer border-0 ${
              recipe.invert
                ? "bg-primary shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "bg-surface-container-high"
            }`}
          >
            <div
              className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                recipe.invert ? "left-[22px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>
      </CollapsibleSection>

      {/* Flip Transforms */}
      <CollapsibleSection
        title="Transforms"
        icon={<Contrast className="w-3.5 h-3.5 text-teal-400" />}
        defaultOpen={false}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ flipH: !recipe.flipH })}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
              recipe.flipH
                ? "bg-primary/15 border-primary text-primary shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-on-surface bg-transparent"
            }`}
          >
            ↔ Horizontal
          </button>
          <button
            type="button"
            onClick={() => onChange({ flipV: !recipe.flipV })}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
              recipe.flipV
                ? "bg-primary/15 border-primary text-primary shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                : "border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-on-surface bg-transparent"
            }`}
          >
            ↕ Vertical
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
