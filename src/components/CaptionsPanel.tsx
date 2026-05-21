"use client";

import { EditRecipe } from "@/lib/types";
import { useState } from "react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>, payload: { type: string; id: string; label: string; duration?: number }) => void;
  duration?: number;
}

const CAPTION_FONTS = [
  { id: "Sans-Serif", label: "Sans-Serif (Standard)" },
  { id: "Serif", label: "Serif (Classic)" },
];

const STYLE_PRESETS = [
  {
    id: "tiktok",
    name: "TikTok Highlight",
    color: "#ffea00",
    bgColor: "#000000",
    desc: "Bold uppercase style with thick contrast background.",
  },
  {
    id: "neon",
    name: "Neon Glow",
    color: "#a855f7",
    bgColor: "transparent",
    desc: "Soft colored outer shadow for a futuristic glowing vibe.",
  },
  {
    id: "minimal",
    name: "Minimalist",
    color: "#ffffff",
    bgColor: "rgba(0,0,0,0.6)",
    desc: "Subtle semi-transparent dark plate, elegant and readable.",
  },
];

export default function CaptionsPanel({ recipe, onChange, onDragStart, duration = 0 }: Props) {
  const [activePreset, setActivePreset] = useState("tiktok");
  const clipEnd = recipe.trimEnd ?? duration;
  const sourceClipDuration = duration > 0 ? Math.max(0, clipEnd - recipe.trimStart) : 0;
  const outputDuration = recipe.speed > 0 ? sourceClipDuration / recipe.speed : 0;
  const captionStart = Math.max(0, recipe.captionStartTime || 0);
  const captionEnd = recipe.captionEndTime ?? outputDuration;

  const handleCaptionStartChange = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) return;
    const boundedStart = outputDuration > 0 ? Math.min(next, outputDuration) : next;
    const patch: Partial<EditRecipe> = { captionStartTime: boundedStart };
    if (recipe.captionEndTime !== null && recipe.captionEndTime < boundedStart) {
      patch.captionEndTime = boundedStart;
    }
    onChange(patch);
  };

  const handleCaptionEndChange = (value: string) => {
    if (value === "") {
      onChange({ captionEndTime: null });
      return;
    }

    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) return;
    const boundedEnd = outputDuration > 0 ? Math.min(next, outputDuration) : next;
    if (boundedEnd < captionStart) return;
    onChange({ captionEndTime: boundedEnd });
  };

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === "tiktok") {
      onChange({
        captionStyle: "tiktok",
        captionColor: "#ffea00",
        captionFont: "Sans-Serif",
        captionSize: 24,
      });
    } else if (presetId === "neon") {
      onChange({
        captionStyle: "neon",
        captionColor: "#a855f7",
        captionFont: "Sans-Serif",
        captionSize: 26,
      });
    } else {
      onChange({
        captionStyle: "minimal",
        captionColor: "#ffffff",
        captionFont: "Sans-Serif",
        captionSize: 18,
      });
    }
  };

  const handleNextSection = () => {
    // Navigation wizard helper - triggers parent to switch focus
    const event = new CustomEvent("wizard-next", { detail: { currentTool: "captions" } });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>subtitles</span>
          Subtitles & Captions
        </h3>
        <label htmlFor="caption-toggle" className="relative inline-flex items-center cursor-pointer">
          <span className="sr-only">Toggle Subtitles</span>
          <input
            id="caption-toggle"
            type="checkbox"
            checked={recipe.captionEnabled}
            onChange={(e) => onChange({ captionEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white peer-checked:after:border-transparent" />
        </label>
      </div>

      {recipe.captionEnabled ? (
        <div className="space-y-4 animate-fade-in">
          {/* Subtitle Input */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Overlay Text</span>
            <textarea
              value={recipe.captionText}
              onChange={(e) => onChange({ captionText: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-on-surface focus:outline-primary focus:ring-1 focus:ring-primary resize-none"
              placeholder="Type your caption here..."
              maxLength={150}
            />
            <div className="flex justify-between items-center text-[9px] text-on-surface-variant/45 font-mono">
              <span>Dynamic overlay preview active</span>
              <span>{recipe.captionText.length}/150</span>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider font-semibold">Timeline Timing</span>
              <span className="text-[10px] text-on-surface-variant/70 font-mono">clip {outputDuration.toFixed(1)}s</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider font-semibold">Start sec</span>
                <input
                  type="number"
                  min={0}
                  max={outputDuration > 0 ? outputDuration : undefined}
                  step={0.1}
                  value={captionStart}
                  onChange={(e) => handleCaptionStartChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface focus:outline-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider font-semibold">End sec</span>
                <input
                  type="number"
                  min={captionStart}
                  max={outputDuration > 0 ? outputDuration : undefined}
                  step={0.1}
                  value={recipe.captionEndTime ?? ""}
                  onChange={(e) => handleCaptionEndChange(e.target.value)}
                  placeholder={outputDuration > 0 ? outputDuration.toFixed(1) : "end"}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface focus:outline-primary"
                />
              </label>
            </div>
            <p className="text-[9px] text-on-surface-variant/60">
              Caption visible from {captionStart.toFixed(1)}s to {(captionEnd || 0).toFixed(1)}s on output timeline.
            </p>
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Caption Theme Preset</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_PRESETS.map((style) => {
                const isActive = activePreset === style.id || recipe.captionStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => applyPreset(style.id)}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between h-18 transition-all cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/5 text-on-surface"
                        : "border-outline-variant/10 bg-transparent text-on-surface-variant hover:border-outline-variant/30 hover:bg-surface-variant/10"
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wide">{style.name}</span>
                    <span 
                      className="text-[13px] font-black uppercase text-center mt-1 select-none self-center px-1 rounded"
                      style={{
                        color: style.color,
                        backgroundColor: style.bgColor === "transparent" ? "transparent" : "#111111",
                        textShadow: style.id === "neon" ? `0 0 4px ${style.color}` : "none",
                        fontFamily: "Impact, sans-serif"
                      }}
                    >
                      AA
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fine Tuning Panel */}
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 space-y-3">
            {/* Font Family */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant">Font Style</span>
              <select
                value={recipe.captionFont}
                onChange={(e) => onChange({ captionFont: e.target.value })}
                className="px-2 py-1 text-[11px] bg-surface-container-lowest border border-outline-variant/20 rounded-md text-on-surface focus:outline-primary cursor-pointer font-sans"
              >
                {CAPTION_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] font-semibold text-on-surface-variant">Text Size</span>
                <span className="text-[10px] font-mono text-on-surface">{recipe.captionSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={48}
                step={1}
                value={recipe.captionSize}
                onChange={(e) => onChange({ captionSize: parseInt(e.target.value) })}
                className="w-full h-1 accent-primary cursor-pointer"
              />
            </div>

            {/* Text Color */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-on-surface-variant">Highlight Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={recipe.captionColor}
                  onChange={(e) => onChange({ captionColor: e.target.value })}
                  className="w-6 h-6 border-0 p-0 rounded-md cursor-pointer overflow-hidden bg-transparent"
                />
                <span className="text-[10px] font-mono text-[var(--muted)]">{recipe.captionColor.toUpperCase()}</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                draggable
                onDragStart={(event) => onDragStart?.(event, {
                  type: "text",
                  id: "caption-track",
                  label: recipe.captionText || "Caption Text",
                  duration: Math.max(0, captionEnd - captionStart),
                })}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-grab active:cursor-grabbing"
                title="Drag this caption block into the text lane"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[15px] text-primary">drag_indicator</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Drag to timeline</span>
                </div>
                <span className="text-[9px] text-on-surface-variant/70 truncate max-w-[62%] text-right">
                  {recipe.captionText || "Caption Text"}
                </span>
              </button>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Position Layout</span>
              <div className="grid grid-cols-2 gap-2">
                {(["top-center", "bottom-center"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => onChange({ captionPosition: pos })}
                    className={`py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                      recipe.captionPosition === pos
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/15 text-[var(--muted)] bg-transparent hover:border-outline-variant/30"
                    }`}
                  >
                    {pos === "top-center" ? "Top Third" : "Bottom Third"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-on-surface-variant/50 space-y-2 border border-dashed border-outline-variant/10 rounded-xl bg-surface-container-low/20">
          <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">subtitles_off</span>
          <p className="text-[11px]">Subtitles are currently disabled.</p>
          <p className="text-[9.5px] text-on-surface-variant/60 px-4">Toggle subtitles on using the switch above to burning-in customized captions onto your layout.</p>
        </div>
      )}

      {/* Next step button */}
      <button
        type="button"
        onClick={handleNextSection}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer mt-4"
      >
        Next: Color Grading
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </button>
    </div>
  );
}
