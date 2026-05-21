"use client";

import { useState } from "react";
import { Upload, Film, FileVideo, Check, Play, Trash } from "lucide-react";
import FileUpload from "./FileUpload";

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  duration?: number;
  file: File;
}

interface MediaLibraryViewProps {
  mediaFiles: MediaFile[];
  onUpload: (file: File) => void;
  onSelectMedia: (media: MediaFile) => void;
  selectedMediaId?: string;
  onDeleteMedia: (id: string, e: React.MouseEvent) => void;
}

export default function MediaLibraryView({
  mediaFiles,
  onUpload,
  onSelectMedia,
  selectedMediaId,
  onDeleteMedia,
}: MediaLibraryViewProps) {
  const [activeDrag, setActiveDrag] = useState(false);

  // Format file size nicely
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 animate-fade-in p-8 h-full overflow-y-auto">
      {/* View Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold tracking-tight">Media Bin</h2>
        <p className="text-xs text-muted mt-1 uppercase tracking-widest font-mono">
          Upload, manage, and inspect local source assets inside your sandbox cache
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Left Side: Dynamic Drag/Drop Upload Area */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono">
            Import Asset
          </h3>
          <div className="bg-surface border border-border rounded-xl p-5">
            <FileUpload
              onFileSelect={onUpload}
              currentFile={null}
            />
          </div>
        </div>

        {/* Right Side: Media Asset Bin Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono flex items-center justify-between">
            <span>Asset Catalog</span>
            <span className="text-[10px] text-muted font-normal lowercase">
              {mediaFiles.length} file{mediaFiles.length !== 1 ? "s" : ""} cached
            </span>
          </h3>

          {mediaFiles.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-border bg-surface/50 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full border border-border bg-surface flex items-center justify-center mx-auto text-muted">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Media library is empty</p>
                <p className="text-xs text-muted mt-1">Upload files using the importer sidebar to populate your bin.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {mediaFiles.map((media) => {
                const isSelected = media.id === selectedMediaId;
                return (
                  <div
                    key={media.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMedia(media)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectMedia(media);
                      }
                    }}
                    className={`group relative bg-surface border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-shadow/50 flex flex-col justify-between h-40 text-left ${
                      isSelected
                        ? "border-accent ring-1 ring-accent"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="p-2 rounded-lg bg-surface/80 border border-border text-accent group-hover:bg-accent/10 transition-colors">
                          <FileVideo className="w-4 h-4" />
                        </div>
                        <div className="flex gap-1">
                          {isSelected && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-wider font-mono">
                              <Check className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                          <button
                            onClick={(e) => onDeleteMedia(media.id, e)}
                            className="p-1.5 rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-heading font-bold text-xs mt-3 truncate group-hover:text-accent transition-colors" title={media.name}>
                        {media.name}
                      </h4>
                    </div>

                    <div className="flex justify-between items-center border-t border-border pt-3 mt-4 text-[10px] text-muted font-mono">
                      <span>{formatSize(media.size)}</span>
                      {media.duration && (
                        <span>{media.duration.toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
