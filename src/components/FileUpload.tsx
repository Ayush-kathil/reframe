"use client";

import { useRef, useState } from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function FileUpload({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

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
      setWarning(
        `Large file detected (${formatBytes(
          file.size
        )}). This may cause slow performance on low-end devices.`
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const FileInfo = () => (
    <div className="flex items-center gap-4 px-5 py-4 bg-accent/5 border border-accent/10 rounded-xl animate-fade-in shadow-[0_4px_20px_rgba(168,85,247,0.03)] backdrop-blur-sm">
      <div className="p-3 bg-accent/10 rounded-lg text-accent animate-pulse">
        <Film size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {currentFile?.name}
        </p>

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
        className="text-xs font-medium text-accent hover:text-accent-hover transition-colors uppercase tracking-wider font-mono flex flex-col items-end gap-0.5"
      >
        <span>Change</span>
        <span className="text-[9px] text-muted font-normal lowercase">(Ctrl+O)</span>
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

  const DropZone = () => (
    <div
      role="button"
      aria-label="Upload video file"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          inputRef.current?.click();
        }
      }}
      className={cn(
        "group flex flex-col items-center justify-center gap-5 py-14 px-6 relative overflow-hidden animate-fade-in",
        "border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-500 ease-out",
        dragging
          ? "border-accent bg-accent/5 scale-[1.02] shadow-[0_15px_40px_-10px_rgba(168,85,247,0.15)]"
          : "border-border bg-surface hover:border-accent/40 hover:bg-accent/[0.01] hover:scale-[1.01] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)]"
      )}
    >
      {/* Background Ambient Glow on Dragging */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none transition-opacity duration-500",
        dragging ? "opacity-100" : "opacity-0"
      )} />

      {/* Lottie Animation Hub */}
      <div className="relative z-10 w-24 h-24 flex items-center justify-center">
        {/* Decorative dynamic pulsing circles */}
        <div className="absolute inset-0 rounded-full bg-accent/5 scale-75 group-hover:scale-100 group-hover:animate-ping opacity-30 transition-all duration-700" />
        <div className="absolute inset-2 rounded-full bg-accent/10 scale-90 group-hover:scale-105 transition-all duration-500" />
        <div className="w-20 h-20 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10">
          <LottiePlayer animationData={uploadAnim} loop autoplay />
        </div>
      </div>

      <div className="text-center relative z-10">
        <p className="font-heading font-medium text-sm text-text uppercase tracking-wider group-hover:text-accent transition-colors">
          {dragging ? "Release to upload" : "Drag & Drop your video"}
        </p>

        <p className="text-xs text-muted mt-1.5 font-sans">
          or <span className="text-accent font-medium underline group-hover:text-accent-hover transition-colors">click to browse local files</span>
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

      {/* Show file size preview if file exists */}
      {currentFile && (
        <p className="text-xs text-accent mt-2 font-mono">
          Selected: {formatBytes(currentFile.size)}
        </p>
      )}

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
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {warning && <p className="text-sm text-yellow-500">{warning}</p>}

      {currentFile ? <FileInfo /> : <DropZone />}
    </div>
  );
}