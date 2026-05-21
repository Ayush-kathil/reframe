"use client";

import * as Slider from "@radix-ui/react-slider";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore, type ColorVector } from "@/store/editorStore";
import { useTimelineStore, type KeyframeProperty } from "@/store/timelineStore";

type WheelKey = "lift" | "gamma" | "gain";

type ChannelKey = "r" | "g" | "b";

const wheelMeta: Record<
  WheelKey,
  { label: string; min: number; max: number; step: number; defaultValue: number; accent: string }
> = {
  lift: { label: "Lift", min: -0.35, max: 0.35, step: 0.001, defaultValue: 0, accent: "from-sky-400 to-cyan-300" },
  gamma: { label: "Gamma", min: 0.45, max: 2.2, step: 0.001, defaultValue: 1, accent: "from-violet-400 to-fuchsia-300" },
  gain: { label: "Gain", min: 0.45, max: 2.2, step: 0.001, defaultValue: 1, accent: "from-amber-400 to-orange-300" },
};

const channels: ChannelKey[] = ["r", "g", "b"];

const keyframeControls: Array<{
  property: KeyframeProperty;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { property: "scale", label: "Scale", min: 0.25, max: 3, step: 0.01 },
  { property: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01 },
  { property: "positionX", label: "Position X", min: -0.5, max: 0.5, step: 0.001 },
  { property: "positionY", label: "Position Y", min: -0.5, max: 0.5, step: 0.001 },
];

function PremiumSlider({
  label,
  value,
  min,
  max,
  step,
  accent,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent: string;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-zinc-300">{value.toFixed(3)}</span>
      </div>
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onValueChange(next[0] ?? value)}
      >
        <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-zinc-800">
          <Slider.Range className={cn("absolute h-full rounded-full bg-gradient-to-r", accent)} />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border border-white/20 bg-zinc-100 shadow-lg shadow-black/40 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          aria-label={label}
        />
      </Slider.Root>
    </div>
  );
}

function ColorWheelSection({
  wheel,
  vector,
  onChange,
}: {
  wheel: WheelKey;
  vector: ColorVector;
  onChange: (vector: ColorVector) => void;
}) {
  const meta = wheelMeta[wheel];

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">{meta.label}</span>
        <div className={cn("h-2 w-16 rounded-full bg-gradient-to-r", meta.accent)} />
      </div>
      <div className="space-y-3">
        {channels.map((channel) => (
          <PremiumSlider
            key={channel}
            label={channel.toUpperCase()}
            value={vector[channel]}
            min={meta.min}
            max={meta.max}
            step={meta.step}
            accent={meta.accent}
            onValueChange={(value) => onChange({ ...vector, [channel]: value })}
          />
        ))}
      </div>
    </div>
  );
}

export default function ColorWheelsPanel({ className }: { className?: string }) {
  const {
    brightness,
    contrast,
    saturation,
    lift,
    gamma,
    gain,
    maskPenActive,
    currentTime,
    clipTransform,
    setBrightness,
    setContrast,
    setSaturation,
    setLift,
    setGamma,
    setGain,
    setMaskPenActive,
    clearMask,
    closeMask,
    maskPoints,
    maskClosed,
  } = useEditorStore();

  const { selectedTrackId, selectedClipId, setKeyframeAtPlayhead } = useTimelineStore();

  const maskStatus = useMemo(() => {
    if (!maskPenActive) return "Off";
    if (maskClosed) return "Closed";
    return `${maskPoints.length} points`;
  }, [maskClosed, maskPenActive, maskPoints.length]);

  const canKeyframe = Boolean(selectedTrackId && selectedClipId);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-100">Primary</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Global</span>
        </div>
        <div className="space-y-3">
          <PremiumSlider
            label="Brightness"
            value={brightness}
            min={-0.5}
            max={0.5}
            step={0.001}
            accent="from-zinc-300 to-white"
            onValueChange={setBrightness}
          />
          <PremiumSlider
            label="Contrast"
            value={contrast}
            min={0.5}
            max={1.5}
            step={0.001}
            accent="from-zinc-400 to-zinc-200"
            onValueChange={setContrast}
          />
          <PremiumSlider
            label="Saturation"
            value={saturation}
            min={0}
            max={2}
            step={0.001}
            accent="from-emerald-400 to-teal-300"
            onValueChange={setSaturation}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-100">Transform</span>
          <span className="font-mono text-[10px] text-zinc-500">{currentTime.toFixed(2)}s</span>
        </div>
        <div className="space-y-3">
          {keyframeControls.map((control) => (
            <div key={control.property} className="space-y-2">
              <PremiumSlider
                label={control.label}
                value={clipTransform[control.property]}
                min={control.min}
                max={control.max}
                step={control.step}
                accent="from-amber-300 to-yellow-200"
                onValueChange={(value) => {
                  if (!canKeyframe || !selectedTrackId || !selectedClipId) return;
                  setKeyframeAtPlayhead(selectedTrackId, selectedClipId, control.property, currentTime, value);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <ColorWheelSection wheel="lift" vector={lift} onChange={setLift} />
      <ColorWheelSection wheel="gamma" vector={gamma} onChange={setGamma} />
      <ColorWheelSection wheel="gain" vector={gain} onChange={setGain} />

      <div className="rounded-2xl border border-white/5 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-100">Mask Pen</span>
          <span className="font-mono text-xs text-zinc-400">{maskStatus}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMaskPenActive(!maskPenActive)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition",
              maskPenActive
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                : "border border-white/10 bg-zinc-950 text-zinc-300 hover:bg-white/5"
            )}
          >
            {maskPenActive ? "Pen On" : "Pen Off"}
          </button>
          <button
            type="button"
            onClick={closeMask}
            disabled={maskPoints.length < 3}
            className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Close Path
          </button>
          <button
            type="button"
            onClick={clearMask}
            className="col-span-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            Clear Mask
          </button>
        </div>
      </div>
    </div>
  );
}
