"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { Film, Upload } from "lucide-react";
import { isValidVideoFile, pickVideoFile } from "@/lib/videoUpload";
import { useEditorStore } from "@/store/editorStore";

export default function UploadOnboarding() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ingestVideoFile = useEditorStore((state) => state.ingestVideoFile);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setError("No video file detected.");
        return;
      }

      if (!isValidVideoFile(file)) {
        setError("Only MP4 or WebM files are supported.");
        return;
      }

      setError(null);
      ingestVideoFile(file);
    },
    [ingestVideoFile]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      handleFile(pickVideoFile(event.dataTransfer.files));
    },
    [handleFile]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4"
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex h-full w-full max-w-4xl cursor-pointer flex-col items-center justify-center rounded-[40px] border-2 border-dashed px-8 py-16 text-center transition duration-300 ${
          isDragging
            ? "border-violet-400/80 bg-violet-500/10 shadow-[0_0_80px_rgba(139,92,246,0.25)]"
            : "border-white/15 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_42%),linear-gradient(160deg,rgba(24,24,27,0.95),rgba(9,9,11,0.98))] hover:border-white/25 hover:bg-white/[0.02]"
        }`}
      >
        <motion.div
          animate={isDragging ? { scale: 1.06, y: -4 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-violet-500/10"
        >
          <Upload className="h-10 w-10 text-violet-300" />
        </motion.div>

        <p className="text-3xl font-medium tracking-tight text-zinc-50 sm:text-4xl">Drop your video to begin</p>
        <p className="mt-3 max-w-lg text-sm text-zinc-400 sm:text-base">
          Drag and drop an MP4 or WebM file anywhere in this zone, or tap to browse from your device.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-zinc-400">
          <Film className="h-4 w-4 text-violet-300" />
          MP4 · WebM
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-6 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          className="hidden"
          onChange={(event) => {
            handleFile(pickVideoFile(event.target.files));
            event.currentTarget.value = "";
          }}
        />
      </div>
    </motion.div>
  );
}
