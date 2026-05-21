"use client";

import { useEffect } from "react";
import { EditRecipe } from "@/lib/types";
import { SPEED_STEPS } from "@/lib/constants";
import { Volume2, VolumeX, Gauge, ArrowRight, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onNext?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>, payload: { type: string; id: string; label: string; duration?: number }) => void;
  duration?: number;
}

const EQ_PRESETS = [
  { id: "none", name: "Flat EQ", icon: "🎚️", description: "No equalization" },
  { id: "vocal", name: "Vocal Enhance", icon: "🎤", description: "Boost dialogue clarity" },
  { id: "bass", name: "Bass Boost", icon: "🔊", description: "Deep low frequencies" },
  { id: "clarity", name: "Crystal Clear", icon: "✨", description: "Studio-grade highs" },
  { id: "noise-reduction", name: "Noise Killer", icon: "🔇", description: "Remove background noise" },
  { id: "podcast", name: "Podcast Pro", icon: "📻", description: "Optimized for speech" },
];

export default function AudioMixer({ recipe, onChange, onNext, onDragStart, duration = 0 }: Props) {
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

      if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey) {
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
  const clipEnd = recipe.trimEnd ?? duration;
  const sourceClipDuration = duration > 0 ? Math.max(0, clipEnd - recipe.trimStart) : 0;
  const outputDuration = recipe.speed > 0 ? sourceClipDuration / recipe.speed : 0;
  
  const getSpeedDescription = (speed: number) => {
    if (speed <= 0.5) return "Very Slow";
    if (speed < 1) return "Slow";
    if (speed === 1) return "Normal";
    if (speed <= 1.5) return "Fast";
    return "Very Fast";
  };

  const isModified = 
    recipe.speed !== 1 || 
    !recipe.keepAudio || 
    recipe.volume !== 1 || 
    (recipe.audioFadeIn || 0) > 0 || 
    (recipe.audioFadeOut || 0) > 0 || 
    recipe.audioEqualizer !== "none";

  return (
    <div className="space-y-6">
      {/* Reset Header */}
      {isModified && (
        <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in">
          <span className="text-xs font-semibold text-primary">Audio settings modified</span>
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
            className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-all cursor-pointer bg-transparent border-0"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Audio Track Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio Track
          </label>
          <button
            type="button"
            onClick={() => onChange({ keepAudio: !recipe.keepAudio })}
            className={cn(
              "w-11 h-6 rounded-full border-2 transition-all flex items-center",
              recipe.keepAudio 
                ? "bg-green-500/20 border-green-500 justify-end" 
                : "bg-red-500/20 border-red-500 justify-start"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>
        {!recipe.keepAudio && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <VolumeX className="w-3 h-3" />
            Audio track is muted - enable to include audio in export
          </div>
        )}
      </div>

      {/* Volume Control */}
      {recipe.keepAudio && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="volume" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Master Volume
              </label>
              <span className="text-sm font-mono font-bold text-primary">
                {Math.round(recipe.volume * 100)}%
              </span>
            </div>
            <input
              id="volume"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={recipe.volume}
              onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 accent-primary cursor-pointer rounded-lg appearance-none bg-surface-container-high"
              title="Adjust master volume"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant/60">
              <span>Silence</span>
              <span>Normal</span>
              <span>Loud</span>
            </div>
          </div>

          {/* Equalizer Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <AudioLines className="w-4 h-4" />
              Audio Equalizer
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ audioEqualizer: preset.id })}
                  draggable
                  onDragStart={(event) => onDragStart?.(event, {
                    type: "audio-eq",
                    id: preset.id,
                    label: preset.name,
                  })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    recipe.audioEqualizer === preset.id
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                      : "border-outline-variant/20 bg-surface-container-low hover:border-primary/40"
                  )}
                  title={preset.description}
                >
                  <div className="text-lg mb-1">{preset.icon}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
                    {preset.name}
                  </div>
                  <div className="text-[8px] text-on-surface-variant/60 mt-1">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fade Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="fade-in" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Fade In
                </label>
                <span className="text-xs font-mono text-on-surface-variant">
                  {(recipe.audioFadeIn || 0).toFixed(1)}s
                </span>
              </div>
              <input
                id="fade-in"
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={recipe.audioFadeIn || 0}
                onChange={(e) => onChange({ audioFadeIn: parseFloat(e.target.value) })}
                className="w-full h-2 accent-primary cursor-pointer rounded-lg appearance-none bg-surface-container-high"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="fade-out" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Fade Out
                </label>
                <span className="text-xs font-mono text-on-surface-variant">
                  {(recipe.audioFadeOut || 0).toFixed(1)}s
                </span>
              </div>
              <input
                id="fade-out"
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={recipe.audioFadeOut || 0}
                onChange={(e) => onChange({ audioFadeOut: parseFloat(e.target.value) })}
                className="w-full h-2 accent-primary cursor-pointer rounded-lg appearance-none bg-surface-container-high"
              />
            </div>
          </div>

          {/* Playback Speed */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="speed" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Playback Speed
              </label>
              <span className="text-sm font-mono font-bold text-secondary">
                {recipe.speed}x • {getSpeedDescription(recipe.speed)}
              </span>
            </div>
            <input
              id="speed"
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={recipe.speed}
              onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
              className="w-full h-2 accent-secondary cursor-pointer rounded-lg appearance-none bg-surface-container-high"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant/60">
              <span>0.25x</span>
              <span>1x Normal</span>
              <span>2x</span>
            </div>
          </div>

          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">Timing Impact</span>
              <span className="text-[10px] font-mono text-on-surface-variant">{recipe.speed}x</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/70">Source Clip</p>
                <p className="font-mono text-on-surface mt-1">{sourceClipDuration.toFixed(1)}s</p>
              </div>
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/70">Output Clip</p>
                <p className="font-mono text-secondary mt-1">{outputDuration.toFixed(1)}s</p>
              </div>
            </div>
            {(recipe.audioFadeIn || 0) + (recipe.audioFadeOut || 0) > outputDuration && outputDuration > 0 && (
              <p className="text-[10px] text-amber-500">
                Fade in + fade out exceeds output clip duration. Reduce fades for cleaner audio.
              </p>
            )}
          </div>

          {/* Quick Speed Presets */}
          <div className="flex gap-2">
            {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onChange({ speed })}
                className={cn(
                  "flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all",
                  recipe.speed === speed
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-outline-variant/20 bg-surface-container-low hover:border-secondary/40 text-on-surface-variant"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </>
      )}

      {/* Next Section Button */}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
        >
          Continue to Effects
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
