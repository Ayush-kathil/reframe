"use client";

import { EditRecipe } from "@/lib/types";
import { Type, AlignLeft, AlignCenter, AlignRight, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function TextControl({ recipe, onChange }: Props) {
  const positions = [
    { id: "top", label: "Top" },
    { id: "center", label: "Center" },
    { id: "bottom", label: "Bottom" },
  ];

  const colors = [
    "#ffffff", "#000000", "#0066FF", "#FF3366", "#33CC99", "#FFCC00"
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] flex items-center gap-2">
          <Type size={14} className="text-[var(--accent)]" /> Text Content
        </h3>
        <textarea
          value={recipe.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Enter overlay text..."
          className="w-full h-24 p-5 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[11px] font-medium placeholder:opacity-30 focus:border-[var(--accent)] outline-none resize-none transition-studio shadow-inner"
        />
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] flex items-center gap-2">
          <AlignLeft size={14} className="text-[var(--accent)]" /> Positioning
        </h3>
        <div className="flex gap-2 p-1.5 bg-[var(--surface-hover)] rounded-2xl border border-[var(--border)]">
          {positions.map((pos) => (
            <button
              key={pos.id}
              onClick={() => onChange({ textPosition: pos.id as any })}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-studio",
                recipe.textPosition === pos.id
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              )}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] flex items-center gap-2">
          <Palette size={14} className="text-[var(--accent)]" /> Style & Scale
        </h3>
        <div className="p-8 bg-[var(--surface-hover)] rounded-[2.5rem] border border-[var(--border)] space-y-10 shadow-sm">
          <div className="space-y-5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
              <span>Font Size</span>
              <span className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-md font-mono">{recipe.textFontSize ?? 48}px</span>
            </div>
            <input
              type="range" min={12} max={120} step={2}
              value={recipe.textFontSize ?? 48}
              onChange={(e) => onChange({ textFontSize: Number(e.target.value) })}
              className="w-full accent-[var(--accent)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">Color Palette</span>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => onChange({ textColor: c })}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-studio ring-offset-2 ring-offset-[var(--bg)]",
                      recipe.textColor === c ? "border-[var(--accent)] scale-110 ring-2 ring-[var(--accent)]/20" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-sm">
                <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: recipe.textColor ?? "#ffffff" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
