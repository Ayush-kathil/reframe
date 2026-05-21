"use client";

import { useState, useCallback } from "react";
import { EditRecipe } from "@/lib/types";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const FONT_OPTIONS = [
  { id: "sans", label: "Sans Serif", value: "Arial" },
  { id: "serif", label: "Serif", value: "Times New Roman" },
  { id: "mono", label: "Monospace", value: "Courier" },
  { id: "bold", label: "Impact", value: "Impact" },
];

const POSITION_OPTIONS = [
  { id: "top-left", label: "Top Left", icon: "north_west" },
  { id: "top-center", label: "Top Center", icon: "north" },
  { id: "top-right", label: "Top Right", icon: "north_east" },
  { id: "center", label: "Center", icon: "center_focus_strong" },
  { id: "bottom-left", label: "Bottom Left", icon: "south_west" },
  { id: "bottom-center", label: "Bottom Center", icon: "south" },
  { id: "bottom-right", label: "Bottom Right", icon: "south_east" },
];

export default function BrandKitPanel({ recipe, onChange }: Props) {
  const [watermarkText, setWatermarkText] = useState(recipe.watermarkText || "");
  const [watermarkPosition, setWatermarkPosition] = useState(recipe.watermarkPosition || "bottom-right");
  const [watermarkSize, setWatermarkSize] = useState(recipe.watermarkSize || 24);
  const [watermarkOpacity, setWatermarkOpacity] = useState(recipe.watermarkOpacity || 70);
  const [watermarkColor, setWatermarkColor] = useState(recipe.watermarkColor || "#ffffff");
  const [watermarkFont, setWatermarkFont] = useState(recipe.watermarkFont || "Arial");
  const [watermarkEnabled, setWatermarkEnabled] = useState(recipe.watermarkEnabled || false);

  const applyWatermark = useCallback(() => {
    const patch: Partial<EditRecipe> = {
      watermarkText,
      watermarkPosition,
      watermarkSize,
      watermarkOpacity,
      watermarkColor,
      watermarkFont,
      watermarkEnabled: true,
    };
    onChange(patch);
    setWatermarkEnabled(true);
  }, [watermarkText, watermarkPosition, watermarkSize, watermarkOpacity, watermarkColor, watermarkFont, onChange]);

  const removeWatermark = useCallback(() => {
    onChange({ watermarkEnabled: false, watermarkText: "" });
    setWatermarkEnabled(false);
    setWatermarkText("");
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>branding_watermark</span>
          Brand Kit
        </h3>
        {watermarkEnabled && (
          <button
            type="button"
            onClick={removeWatermark}
            className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider font-semibold cursor-pointer bg-transparent border-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[12px]">delete</span>
            Remove
          </button>
        )}
      </div>

      {/* Watermark Section */}
      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 space-y-3">
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px]">text_fields</span>
          Text Watermark
        </p>

        {/* Text Input */}
        <div className="relative">
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Enter watermark text..."
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none transition-colors"
          />
          {watermarkText && (
            <button
              type="button"
              onClick={() => setWatermarkText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant cursor-pointer bg-transparent border-0"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Font Selection */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Font</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => setWatermarkFont(font.value)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                  watermarkFont === font.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/20 bg-transparent text-on-surface-variant hover:border-outline-variant/40"
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position Grid */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Position</p>
          <div className="grid grid-cols-4 gap-1">
            {POSITION_OPTIONS.map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setWatermarkPosition(pos.id)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all cursor-pointer border ${
                  watermarkPosition === pos.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent bg-transparent text-on-surface-variant/50 hover:bg-surface-variant/30 hover:text-on-surface-variant"
                }`}
                title={pos.label}
              >
                <span className="material-symbols-outlined text-[14px]">{pos.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Size</p>
            <span className="text-[10px] text-on-surface-variant font-mono">{watermarkSize}px</span>
          </div>
          <input
            type="range"
            min={12}
            max={72}
            value={watermarkSize}
            onChange={(e) => setWatermarkSize(Number(e.target.value))}
            className="w-full h-1 accent-primary cursor-pointer"
          />
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Opacity</p>
            <span className="text-[10px] text-on-surface-variant font-mono">{watermarkOpacity}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={watermarkOpacity}
            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
            className="w-full h-1 accent-primary cursor-pointer"
          />
        </div>

        {/* Color Picker */}
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider font-semibold">Color</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-on-surface-variant">{watermarkColor}</span>
            <input
              type="color"
              value={watermarkColor}
              onChange={(e) => setWatermarkColor(e.target.value)}
              className="w-6 h-6 rounded border border-outline-variant/30 cursor-pointer"
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={applyWatermark}
          disabled={!watermarkText.trim()}
          className={`w-full py-2.5 rounded-xl font-label-md text-sm font-semibold uppercase tracking-wider transition-all border-0 cursor-pointer ${
            watermarkText.trim()
              ? "bg-primary text-on-primary hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-[0.98]"
              : "bg-surface-variant/30 text-on-surface-variant/40 cursor-not-allowed"
          }`}
        >
          {watermarkEnabled ? "Update Watermark" : "Apply Watermark"}
        </button>
      </div>

      {/* Preview */}
      {watermarkEnabled && watermarkText && (
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px]">visibility</span>
            Preview
          </p>
          <div className="aspect-video bg-surface-container-lowest rounded-lg border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">videocam</span>
            </div>
            <div
              className="absolute p-2"
              style={{
                ...(watermarkPosition.includes("top") ? { top: "8px" } : watermarkPosition === "center" ? { top: "50%", transform: "translateY(-50%)" } : { bottom: "8px" }),
                ...(watermarkPosition.includes("left") ? { left: "8px" } : watermarkPosition.includes("right") ? { right: "8px" } : { left: "50%", transform: `translateX(-50%) ${watermarkPosition === "center" ? "translateY(-50%)" : ""}` }),
                fontFamily: watermarkFont,
                fontSize: `${Math.max(8, watermarkSize / 4)}px`,
                color: watermarkColor,
                opacity: watermarkOpacity / 100,
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                fontWeight: "bold",
              }}
            >
              {watermarkText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
