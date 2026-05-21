"use client";

import { useState, useEffect } from "react";
import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, Share2, AlertCircle, X, Copy, MessageSquare, Send, Check } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import successAnim from "@/lib/lottie/success.json";
import { cn } from "@/lib/utils";

const SHARE_TWEET_TEXT =
  "I just edited my video with @reframevideo — free browser-based video editor! Check it out: https://github.com/magic-peach/reframe";

interface Props {
  result: ExportResult;
  onReset: () => void;
  soundOnCompletion: boolean;
}

export default function DownloadResult({ result, onReset, soundOnCompletion }: Props) {
  const defaultName = `reframe_${result.width}x${result.height}`;
  const [name, setName] = useState(defaultName);
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const invalidCharRegex = /[<>:"/\\|?*]/;
  const isValid = !invalidCharRegex.test(name) && name.trim().length > 0;
  const filename = `${name.trim() || "untitled"}.${result.format}`;

  const shareHref = `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TWEET_TEXT)}`;

  useEffect(() => {
    if (soundOnCompletion) {
      const audio = new Audio("/sounds/export-complete.mp3");
      audio.play().catch(console.error);
    }
  }, [soundOnCompletion]);

  const handleReset = () => {
    if (window.confirm("This will clear the current video and all settings. Continue?")) {
      onReset();
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      
      // Fetch the actual file blob from URL
      const response = await fetch(result.blobUrl);
      const blob = await response.blob();
      const fileObj = new File([blob], filename, { type: blob.type });

      // Check if browser supports file sharing
      if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: "My Edited Video",
          text: "Check out this video I edited using Reframe!",
        });
      } else if (navigator.share) {
        // Link fallback if native share supports links but not files
        await navigator.share({
          title: "My Edited Video",
          text: `Check out my video: ${filename}`,
          url: window.location.origin,
        });
      } else {
        // Custom interactive desktop modal fallback
        setShowShareModal(true);
      }
    } catch (err) {
      console.warn("Share failed or cancelled:", err);
      // Fallback
      setShowShareModal(true);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://github.com/magic-peach/reframe");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4 relative">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0">
          <LottiePlayer animationData={successAnim} loop={false} autoplay />
        </div>
        <div>
          <p className="font-heading font-bold text-base text-[var(--text)]">Export complete</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Ready to download</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Resolution</p>
          <p className="font-heading font-bold text-[var(--text)]">{result.width} × {result.height}</p>
        </div>
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">File size</p>
          <p className="font-heading font-bold text-[var(--text)]">{formatBytes(result.size)}</p>
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center text-xs px-1">
          <label htmlFor="filename-input" className="text-[var(--muted)] font-heading font-semibold uppercase tracking-wider">
            Filename
          </label>
          <span className={cn("transition-colors", name.length >= 100 ? "text-red-500 font-medium" : "text-[var(--muted)]")}>
            {100 - name.length} chars remaining
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="filename-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={cn(
              "flex-1 px-3 py-2.5 bg-[var(--bg)] border rounded-lg text-sm transition-colors text-[var(--text)] placeholder:text-[var(--muted)]",
              !isValid && name.length > 0 ? "border-red-500 focus:outline-red-500 focus:ring-1 focus:ring-red-500" : "border-[var(--border)] focus:outline-film-500"
            )}
            placeholder="Enter filename"
          />
          <span className="text-sm text-[var(--muted)] shrink-0 font-medium bg-[var(--bg)] px-3 py-2.5 border border-[var(--border)] rounded-lg">
            .{result.format}
          </span>
        </div>
        {!isValid && name.length > 0 && (
          <p className="text-xs text-red-500 px-1 flex items-center gap-1.5 mt-1 animate-fade-in">
            <AlertCircle size={12} />
            Filename contains invalid characters (\ / : * ? &quot; &lt; &gt; |)
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <a
          href={isValid ? result.blobUrl : undefined}
          download={isValid ? filename : undefined}
          className={cn(
            "flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all",
            isValid
              ? "bg-film-600 hover:bg-film-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              : "bg-film-600/50 cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!isValid) e.preventDefault();
          }}
        >
          <Download size={15} aria-hidden="true"  />
          Download {result.format.toUpperCase()}
        </a>

        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Share2 size={15} aria-hidden="true" />
          {sharing ? "Preparing Share..." : "Share Video"}
        </button>

        <a
          href={result.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preview video in new tab"
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          Preview
        </a>
        <button
          type="button"
          title="Reset and upload a new video"
          aria-label="Upload a new video"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          <RotateCcw size={14} aria-hidden="true"  />
          New
        </button>
      </div>

      {/* Premium Desktop Fallback Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors rounded-lg hover:bg-[var(--bg)]"
            >
              <X size={16} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-lg text-[var(--text)]">Share Composition</h3>
              <p className="text-xs text-[var(--muted)]">Connect directly with all social apps without downloads</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my edited video: ${filename} from Reframe! https://github.com/magic-peach/reframe`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--bg)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl transition-all hover:scale-[1.03] space-y-1.5"
              >
                <MessageSquare size={20} className="text-green-500" />
                <span className="text-[10px] font-heading font-medium text-[var(--text)]">WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent("https://github.com/magic-peach/reframe")}&text=${encodeURIComponent(`Check out my video: ${filename} edited with Reframe!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--bg)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl transition-all hover:scale-[1.03] space-y-1.5"
              >
                <Send size={20} className="text-blue-400" />
                <span className="text-[10px] font-heading font-medium text-[var(--text)]">Telegram</span>
              </a>

              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3.5 bg-[var(--bg)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl transition-all hover:scale-[1.03] space-y-1.5"
              >
                <Share2 size={20} className="text-purple-400" />
                <span className="text-[10px] font-heading font-medium text-[var(--text)]">Twitter / X</span>
              </a>
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">Project Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://github.com/magic-peach/reframe"
                  className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-mono text-[var(--muted)]"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg)] transition-colors text-[var(--text)] shrink-0"
                >
                  {copySuccess ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
