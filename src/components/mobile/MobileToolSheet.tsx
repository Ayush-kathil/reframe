"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import EditorToolPanels, { type EditorToolKey } from "../EditorToolPanels";

type MobileToolSheetProps = {
  open: boolean;
  activeTool: EditorToolKey | null;
  onClose: () => void;
};

const toolTitles: Record<EditorToolKey, string> = {
  reframe: "Reframe",
  adjustments: "Adjust",
  text: "Text",
  transitions: "Transitions",
};

export default function MobileToolSheet({ open, activeTool, onClose }: MobileToolSheetProps) {
  return (
    <AnimatePresence>
      {open && activeTool && (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[min(72vh,640px)] rounded-t-[28px] border border-white/10 bg-zinc-900/95 shadow-[0_-24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <p className="text-sm font-medium text-zinc-100">{toolTitles[activeTool]}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="editor-scroll max-h-[calc(min(72vh,640px)-56px)] overflow-y-auto overscroll-contain px-4 py-4">
              <EditorToolPanels activeTool={activeTool} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
