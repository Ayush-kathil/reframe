"use client";

import { type ComponentType, useState } from "react";
import { Crop, SlidersHorizontal, Sparkles, Type } from "lucide-react";
import ColorWheelsPanel from "./ColorWheelsPanel";
import TransitionsPanel from "./TransitionsPanel";
import { setTransitionDragData } from "./timeline/TimelineTransitionDropZone";
import { DEFAULT_RECIPE } from "@/lib/constants";
import type { EditRecipe } from "@/lib/types";
import { buildMockTrackingPath, buildTrackingPathFromVideo } from "@/lib/tracking/focusTracker";
import { useEditorStore } from "@/store/editorStore";
import { useTimelineStore, type TransitionKind } from "@/store/timelineStore";

export type EditorToolKey = "reframe" | "adjustments" | "text" | "transitions";

type EditorToolPanelsProps = {
  activeTool: EditorToolKey;
  onImport?: () => void;
};

export const editorTools: Array<{
  key: EditorToolKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "reframe", label: "Reframe", icon: Crop },
  { key: "adjustments", label: "Adjust", icon: SlidersHorizontal },
  { key: "text", label: "Text", icon: Type },
  { key: "transitions", label: "Transitions", icon: Sparkles },
];

const panelTransitions: Array<{ kind: TransitionKind; label: string }> = [
  { kind: "linear-fade", label: "Linear Fade" },
  { kind: "cross-dissolve", label: "Cross Dissolve" },
  { kind: "directional-slide", label: "Directional Slide" },
];

export default function EditorToolPanels({ activeTool, onImport }: EditorToolPanelsProps) {
  const {
    duration,
    autoReframeEnabled,
    setAutoReframeEnabled,
    setTrackingPath,
    setReframeDimensions,
  } = useEditorStore();
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);

  const enableAutoReframe = async () => {
    setAutoReframeEnabled(true);
    setReframeDimensions({ width: 1080, height: 1920 });
    const video = document.querySelector("video");
    if (video instanceof HTMLVideoElement && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const path = await buildTrackingPathFromVideo(video, duration || video.duration || 8);
      setTrackingPath(path);
      return;
    }
    setTrackingPath(buildMockTrackingPath(duration || 8));
  };

  if (activeTool === "adjustments") {
    return <ColorWheelsPanel />;
  }

  if (activeTool === "text") {
    return (
      <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <Type className="h-4 w-4 text-violet-300" />
          Text overlays
        </div>
        <p className="text-sm text-zinc-400">Add titles, captions, and lower thirds to your timeline.</p>
        <button
          type="button"
          onClick={() => {
            const time = useEditorStore.getState().currentTime;
            useTimelineStore.getState().addTextObject({
              text: "New Text",
              fontFamily: "Inter",
              fontSize: 64,
              fill: "#ffffff",
              stroke: "#000000",
              strokeWidth: 2,
              shadow: "0px 4px 16px rgba(0,0,0,0.8)",
              left: 300,
              top: 300,
              scaleX: 1,
              scaleY: 1,
              startTime: time,
              duration: 3,
            });
          }}
          className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
        >
          Add Text
        </button>
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          Select text on canvas to edit properties.
        </div>
      </div>
    );
  }

  if (activeTool === "transitions") {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          {panelTransitions.map((entry) => (
            <button
              key={entry.kind}
              type="button"
              draggable
              onDragStart={(event) => setTransitionDragData(event, entry.kind)}
              className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/10"
            >
              {entry.label}
            </button>
          ))}
        </div>
        <TransitionsPanel
          recipe={recipe}
          onChange={(patch) => setRecipe((current) => ({ ...current, ...patch }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-200">
        <Crop className="h-4 w-4 text-violet-300" />
        Reframe
      </div>
      <button
        type="button"
        onClick={() => void enableAutoReframe()}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition ${
          autoReframeEnabled
            ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/50"
            : "bg-violet-500 text-white hover:bg-violet-400"
        }`}
      >
        Auto 9:16 Mobile Reframe
      </button>
      <p className="text-sm text-zinc-400">
        Intelligent focal tracking pans a portrait crop across landscape footage over time.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setAutoReframeEnabled(false);
            setReframeDimensions({ width: 1080, height: 1920 });
          }}
          className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          9:16 Static
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoReframeEnabled(false);
            setReframeDimensions({ width: 1920, height: 1080 });
          }}
          className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          16:9 Wide
        </button>
      </div>
      {onImport && (
        <button
          type="button"
          onClick={onImport}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
        >
          Replace video
        </button>
      )}
    </div>
  );
}
