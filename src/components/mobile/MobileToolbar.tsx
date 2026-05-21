"use client";

import { motion } from "framer-motion";
import { editorTools, type EditorToolKey } from "../EditorToolPanels";
import { cn } from "@/lib/utils";

type MobileToolbarProps = {
  activeTool: EditorToolKey | null;
  onSelect: (tool: EditorToolKey) => void;
};

export default function MobileToolbar({ activeTool, onSelect }: MobileToolbarProps) {
  return (
    <div className="shrink-0 border-y border-white/5 bg-zinc-950/90 px-3 py-2 md:hidden">
      <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {editorTools.map((tool) => {
          const Icon = tool.icon;
          const selected = activeTool === tool.key;

          return (
            <motion.button
              key={tool.key}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(tool.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition",
                selected
                  ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                  : "border-white/10 bg-white/5 text-zinc-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tool.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
