/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
"use client";

import { useEffect, useRef, useState } from "react";
import { Film, UploadCloud, FileVideo, AlertCircle, Info } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  file: File | null;
  isProcessing?: boolean;
}

function fmt(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ onFileSelect, file, isProcessing = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleFile = (f: File) => {
    setError("");
    if (!f.type.startsWith("video/")) {
      setError("Asset must be a video stream.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`Asset exceeds maximum payload (2GB). Found: ${fmt(f.size)}`);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setDuration(video.duration);
    };
    video.src = URL.createObjectURL(f);
    onFileSelect(f);
  };

  return (
    <div className="space-y-6 animate-entrance">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "relative group transition-google border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center",
          isProcessing ? "opacity-30 cursor-not-allowed border-[var(--border)]" : (
            dragging 
              ? "border-[var(--accent-cta)] bg-[var(--accent-cta)]/5 scale-[1.02] shadow-2xl shadow-blue-500/10" 
              : "border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--muted)]/50 cursor-pointer"
          )
        )}
      >
        <div className="w-24 h-24 mb-6 opacity-60 group-hover:opacity-100 transition-google group-hover:scale-110">
          <LottiePlayer animationData={uploadAnim} loop autoplay />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-bold tracking-tight">Ingest Video Asset</h4>
          <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest">Drag media or click to browse</p>
        </div>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">
          <UploadCloud size={12} />
          MAX 2GB • PRO RESOLUTION
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {file && (
        <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] flex items-center gap-4 animate-scale">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shadow-inner">
             <FileVideo size={20} />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-xs font-bold truncate tracking-tight">{file.name}</p>
             <p className="text-[10px] text-[var(--muted)] font-mono font-bold uppercase tracking-wider">
                {fmt(file.size)} {duration ? `• ${duration.toFixed(1)}s` : "• Syncing..."}
             </p>
          </div>
          <button 
            disabled={isProcessing}
            onClick={() => inputRef.current?.click()}
            className="p-3 text-[var(--muted)] hover:text-[var(--text)] transition-google disabled:opacity-30"
          >
            <Info size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
