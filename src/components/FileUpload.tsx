"use client";

import { useRef, useState, useEffect } from "react";
import { Film, FolderOpen, UploadCloud, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  fileError?: string;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function FileUpload({
  onFileSelect,
  currentFile,
  fileError = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        inputRef.current?.click();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleFile = (file: File) => {
    setError("");
    setWarning("");
    setDuration(null);

    // Validate type
    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    // Hard limit
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large (${formatBytes(
          file.size
        )}). Maximum allowed size is 2GB.`
      );
      return;
    }

    // Soft warning
    if (file.size > WARNING_FILE_SIZE) {
      const estimatedMinutes = Math.max(1, Math.round(file.size / (100 * 1024 * 1024)));
      setWarning(
        `Large file detected (${formatBytes(
          file.size
        )}). Processing may take ~${estimatedMinutes} minutes and affect performance on low-memory devices.`
      );
    }

    // Extract metadata safely
    const video = document.createElement("video");
    video.preload = "metadata";

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      setDuration(video.duration);
    };

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const FileInfo = () => (
    <div className="flex items-center gap-4 px-5 py-4 bg-accent/5 border border-accent/10 rounded-xl animate-fade-in shadow-[0_4px_20px_rgba(168,85,247,0.03)] backdrop-blur-sm">
      <div className="p-3 bg-accent/10 rounded-lg text-accent animate-pulse shrink-0">
        <Film size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-heading font-medium text-text truncate">
            {currentFile?.name}
          </p>
          {currentFile && (
            <span className="px-2 py-0.5 bg-zinc-700 text-white font-mono tracking-wider rounded text-[9px] uppercase">
              {currentFile.name.includes(".") ? currentFile.name.split(".").pop() : "VIDEO"}
            </span>
          )}
        </div>

        <p className="text-[11px] text-muted font-mono mt-0.5">
          {formatBytes(currentFile?.size ?? 0)}
          {duration !== null
            ? ` • ${formatDuration(duration)}`
            : " • Loading metadata..."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-heading font-medium text-accent hover:text-accent-hover transition-colors uppercase tracking-wider flex flex-col items-end gap-0.5 shrink-0"
      >
        <span>Change</span>
        <span className="text-[9px] text-muted font-mono font-normal lowercase">(Ctrl+O)</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-heading font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warning && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs font-heading font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      {currentFile ? (
        <FileInfo />
      ) : (
        <div
          role="button"
          aria-label="Upload video file"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              inputRef.current?.click();
            }
          }}
          className={cn(
            "group flex flex-col items-center justify-center gap-6 py-14 px-6 relative overflow-hidden",
            "border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-500 ease-out",
            dragging
              ? "border-accent bg-accent/[0.04] scale-[1.01] shadow-[0_20px_50px_-15px_rgba(168,85,247,0.12)]"
              : "border-border bg-surface hover:border-accent hover:bg-accent/[0.01] hover:scale-[1.005] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)]"
          )}
        >
          {/* Ambient Glow */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none transition-opacity duration-700",
              dragging ? "opacity-100" : "opacity-30 group-hover:opacity-75"
            )}
          />

          {/* Premium Animated SVG Uploader Icon */}
          <div className="relative z-10 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent/5 scale-75 group-hover:scale-100 group-hover:animate-ping opacity-30 transition-all duration-700" />
            <div className="absolute inset-2 rounded-full bg-accent/10 scale-90 group-hover:scale-105 transition-all duration-500" />
            
            {/* Custom Premium SVG Icon */}
            <div className="w-16 h-16 bg-surface border border-border group-hover:border-accent rounded-2xl flex items-center justify-center shadow-lg relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
              <UploadCloud size={28} className={cn("transition-colors duration-300", dragging ? "text-accent" : "text-muted group-hover:text-accent")} />
              
              {/* Floating micro indicators */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-secondary" />
            </div>
          </div>

          <div className="text-center relative z-10 space-y-1 max-w-sm">
            <p className="font-heading font-medium text-base text-text tracking-wide transition-colors">
              {dragging ? "Release to drop video" : "Drag & Drop video here"}
            </p>

            <p className="text-xs text-muted font-sans font-light leading-relaxed">
              or{" "}
              <span className="text-accent font-medium underline group-hover:text-accent-hover transition-colors">
                click to browse local files
              </span>
            </p>

            <p className="text-[10px] text-muted/60 mt-3 font-mono border border-border/40 px-2 py-0.5 rounded bg-bg/50 inline-block">
              Ctrl+O / Cmd+O
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg border border-border rounded-lg text-[10px] text-muted font-mono tracking-wider uppercase relative z-10">
            <FolderOpen size={12} className="text-accent" />
            MP4 / MOV / AVI / WebM
          </div>

          <p className="text-[10px] text-muted/50 text-center relative z-10">
            Supports high-density codec profiles up to 2GB
          </p>

          {fileError && <p className="text-sm text-red-500 text-center">{fileError}</p>}

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}
    </div>
  );
}
