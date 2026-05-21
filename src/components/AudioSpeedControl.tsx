"use client";

import { useEffect } from "react";
import { EditRecipe } from "@/lib/types";
import { SPEED_STEPS } from "@/lib/constants";
import { Volume2, VolumeX, Gauge, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const EQ_PRESETS = [
  { id: "none", name: "None (Flat EQ)" },
  { id: "vocal", name: "Vocal Dialogue Enhance" },
  { id: "bass", name: "Deep Bass Boost" },
  { id: "clarity", name: "Studio High Clarity" },
  { id: "noise-reduction", name: "Voice Noise Reducer" },
];

export default function AudioSpeedControl({ recipe, onChange }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        e.key.toLowerCase() === "m" &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        onChange({
          keepAudio: !recipe.keepAudio,
        });
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [recipe.keepAudio, onChange]);

  const speedIndex = SPEED_STEPS.indexOf(recipe.speed as (typeof SPEED_STEPS)[number]);
  
  const getSpeedDescription = (speed: number) => {
    if (speed <= 0.5) return "Very Slow";
    if (speed < 1) return "Slow";
    if (speed === 1) return "Normal";
    if (speed <= 1.5) return "Fast";
    return "Very Fast";
  };

  const handleNextSection = () => {
    const event = new CustomEvent("wizard-next", { detail: { currentTool: "audio" } });
    window.dispatchEvent(event);
  };

  const isModified = 
    recipe.speed !== 1 || 
    !recipe.keepAudio || 
    recipe.volume !== 1 || 
    (recipe.audioFadeIn || 0) > 0 || 
    (recipe.audioFadeOut || 0) > 0 || 
    recipe.audioEqualizer !== "none";

  return (
    <div className="space-y-4">
      {/* Reset Header */}
      {isModified && (
        <div className="flex justify-end animate-fade-in">
          <button
            type="button"
            onClick={() => onChange({ 
              speed: 1, 
              keepAudio: true, 
              volume: 1, 
              audioFadeIn: 0, 
              audioFadeOut: 0, 
              audioEqualizer: "none" 
            })}
            className="text-[10px] font-heading font-semibold uppercase tracking-wider text-film-500 hover:text-film-600 hover:underline transition-all duration-150 cursor-pointer bg-transparent border-0"
          >
            Reset Mixer
          </button>
        </div>
      )}

      {/* Toggle Audio Track */}
      <button
        type="button"
        onClick={() => onChange({ keepAudio: !recipe.keepAudio })}
        aria-label={recipe.keepAudio ? "Mute audio" : "Unmute audio"}
        aria-pressed={recipe.keepAudio}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-150 cursor-pointer",
          "hover:scale-[1.01] active:scale-[0.99]",
          recipe.keepAudio
            ? "border-film-500 bg-film-50/10 text-film-500"
            : "border-outline-variant/10 bg-transparent text-[var(--muted)]"
        )}
      >
        <div className="flex items-center gap-2.5">
          {recipe.keepAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="text-xs font-heading font-bold uppercase tracking-wider">
            {recipe.keepAudio ? "Audio Track Enabled" : "Audio Track Muted"}
          </span>
        </div>
        <div className="text-[10px] font-mono text-[var(--muted)]">
          {recipe.keepAudio ? "Active" : "Silent"}
        </div>
      </button>

      {recipe.keepAudio && (
        <div className="space-y-4 animate-fade-in pt-1">
          {/* Master Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] text-on-surface font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">volume_up</span>
                Master Gain
              </span>
              <span className="text-[10px] font-mono text-on-surface">
                {Math.round(recipe.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2.0}
              step={0.05}
              value={recipe.volume}
              onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
              className="w-full h-1 accent-film-500 cursor-pointer bg-surface-container-high rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[8px] font-mono text-[var(--muted)]">
              <span>0% (Muted)</span>
              <span>100% (Default)</span>
              <span>200% (Boosted)</span>
            </div>
          </div>

          {/* Equalizer Presets Dropdown */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="voice-eq" className="text-[11px] text-on-surface font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
              Voice Equalizer (EQ)
            </label>
            <select
              id="voice-eq"
              value={recipe.audioEqualizer}
              onChange={(e) => onChange({ audioEqualizer: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-on-surface focus:outline-primary cursor-pointer font-sans"
            >
              {EQ_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Fades Section */}
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 space-y-3">
            <p className="text-[9px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">Fade Transitions</p>
            
            {/* Fade In */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-semibold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">line_curve_up</span>
                  Fade In Duration
                </span>
                <span className="text-[10px] font-mono text-on-surface">{(recipe.audioFadeIn || 0).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={recipe.audioFadeIn || 0}
                onChange={(e) => onChange({ audioFadeIn: parseFloat(e.target.value) })}
                className="w-full h-1 accent-primary cursor-pointer"
              />
            </div>

            {/* Fade Out */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-semibold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">line_curve_down</span>
                  Fade Out Duration
                </span>
                <span className="text-[10px] font-mono text-on-surface">{(recipe.audioFadeOut || 0).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={recipe.audioFadeOut || 0}
                onChange={(e) => onChange({ audioFadeOut: parseFloat(e.target.value) })}
                className="w-full h-1 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Speed Controls */}
      <div className="pt-2 border-t border-outline-variant/10">
        <div className="flex items-center justify-between mb-2">
          <label
            id="speed-label"
            htmlFor="speed-control"
            className="text-xs font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5"
          >
            <Gauge size={12} /> Playback Speed
          </label>
          <div className="text-right">
            <span className="text-xs font-heading font-bold text-film-500 block">
              {recipe.speed}x
            </span>
            <span id="speed-description" className="text-[9px] text-[var(--muted)] font-medium uppercase tracking-wider">
              {getSpeedDescription(recipe.speed)}
            </span>
          </div>
        </div>
        <input
          id="speed-control"
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex === -1 ? 3 : speedIndex}
          onChange={(e) => onChange({ speed: SPEED_STEPS[Number(e.target.value)] })}
          aria-labelledby="speed-label"
          aria-describedby="speed-description"
          aria-label="Video playback speed"
          aria-valuetext={`${recipe.speed}x speed, ${getSpeedDescription(recipe.speed)}`}
          className="w-full h-1 accent-film-500 cursor-pointer bg-surface-container-high rounded-lg appearance-none"
        />
        <div className="flex justify-between mt-1 overflow-hidden">
          {SPEED_STEPS.map((s) => (
            <span
              key={s}
              className="text-[9px] font-mono text-[var(--muted)] truncate text-center min-w-0"
            >
              {s}x
            </span>
          ))}
        </div>
      </div>

      {/* Next Wizard Step */}
      <button
        type="button"
        onClick={handleNextSection}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer mt-4"
      >
        Next: Subtitles & Captions
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
