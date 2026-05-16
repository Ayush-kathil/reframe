"use client";

import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/ffmpeg";
import { Download, RotateCcw, Share2, Eye, CheckCircle2 } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import successAnim from "@/lib/lottie/success.json";
import { cn } from "@/lib/utils";

const SHARE_TWEET_TEXT =
  "Created a professional sequence with Reframe Studio. 🚀 #Production #Studio";

interface Props {
  result: ExportResult;
  onReset: () => void;
}

export default function DownloadResult({ result, onReset }: Props) {
  const filename = `reframe_sequence_${result.width}x${result.height}.${result.format}`;
  const shareHref = `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TWEET_TEXT)}`;

  return (
    <div className="max-w-lg w-full bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] p-12 space-y-10 animate-scale shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mb-4">
          <CheckCircle2 size={40} strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Sequence Finalized</h2>
          <p className="text-xs text-[var(--muted)] font-medium">The master file has been encoded successfully.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl">
        <div className="space-y-1">
          <p className="label-mono">Resolution</p>
          <p className="text-sm font-bold tracking-tight">{result.width} × {result.height}</p>
        </div>
        <div className="space-y-1">
          <p className="label-mono">Payload</p>
          <p className="text-sm font-bold tracking-tight">{formatBytes(result.size)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={result.blobUrl}
          download={filename}
          className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-xs uppercase tracking-[0.2em]"
        >
          <Download size={16} />
          Download Master
        </a>
        
        <div className="grid grid-cols-3 gap-3">
          <a
            href={result.blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest"
          >
            <Eye size={14} />
            Review
          </a>
          <button
            onClick={onReset}
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest"
          >
            <Share2 size={14} />
            Share
          </a>
        </div>
      </div>
    </div>
  );
}
