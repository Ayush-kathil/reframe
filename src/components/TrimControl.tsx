/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useState, useEffect } from "react";
import { Scissors, Timer, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trimStart: number;
  trimEnd: number | null;
  onChange: (patch: Partial<{ trimStart: number; trimEnd: number | null }>) => void;
  duration: number;
}

export default function TrimControl({ trimStart, trimEnd, onChange, duration }: Props) {
  const [startVal, setStartVal] = useState(trimStart.toString());
  const [endVal, setEndVal] = useState(trimEnd?.toString() ?? "");
  
  useEffect(() => {
    setStartVal(trimStart.toString());
    setEndVal(trimEnd?.toString() ?? "");
  }, [trimStart, trimEnd]);

  const handleStartChange = (v: string) => {
    setStartVal(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0 && n < (trimEnd ?? duration)) {
      onChange({ trimStart: n });
    }
  };

  const handleEndChange = (v: string) => {
    setEndVal(v);
    if (v === "") {
      onChange({ trimEnd: null });
      return;
    }
    const n = parseFloat(v);
    if (!isNaN(n) && n > trimStart && n <= duration) {
      onChange({ trimEnd: n });
    }
  };

  const isErrorStart = parseFloat(startVal) >= (trimEnd ?? duration) || parseFloat(startVal) < 0;
  const isErrorEnd = endVal !== "" && (parseFloat(endVal) <= trimStart || parseFloat(endVal) > duration);

  return (
    <div className="flex flex-col gap-4 animate-entrance">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Scissors size={14} />
          </div>
          <span className="label-mono">Precision Trimming</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-hover)] rounded-full border border-[var(--border)]">
          <Timer size={12} className="text-[var(--muted)]" />
          <span className="text-[10px] font-mono font-bold">{duration.toFixed(2)}s Total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Start Input */}
        <div className={cn(
          "relative group transition-google p-4 rounded-2xl border bg-[var(--surface)]",
          isErrorStart ? "border-red-500/50 shadow-lg shadow-red-500/5" : "border-[var(--border)] hover:border-[var(--muted)]/30"
        )}>
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] mb-2 block">Mark In</label>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={startVal}
              onChange={(e) => handleStartChange(e.target.value)}
              step={0.1}
              className="bg-transparent text-xl font-bold w-full outline-none tracking-tight"
            />
            <span className="text-[10px] font-mono font-bold text-[var(--muted)] mb-1">SEC</span>
          </div>
          {isErrorStart && <AlertCircle size={12} className="absolute top-4 right-4 text-red-500" />}
        </div>

        {/* End Input */}
        <div className={cn(
          "relative group transition-google p-4 rounded-2xl border bg-[var(--surface)]",
          isErrorEnd ? "border-red-500/50 shadow-lg shadow-red-500/5" : "border-[var(--border)] hover:border-[var(--muted)]/30"
        )}>
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] mb-2 block">Mark Out</label>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={endVal}
              placeholder={duration.toFixed(1)}
              onChange={(e) => handleEndChange(e.target.value)}
              step={0.1}
              className="bg-transparent text-xl font-bold w-full outline-none tracking-tight"
            />
            <span className="text-[10px] font-mono font-bold text-[var(--muted)] mb-1">SEC</span>
          </div>
          {isErrorEnd && <AlertCircle size={12} className="absolute top-4 right-4 text-red-500" />}
        </div>
      </div>

      {/* Mini Visual Rail */}
      <div className="relative h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-blue-500 transition-all duration-300"
          style={{ 
            left: `${(trimStart / duration) * 100}%`,
            width: `${(( (trimEnd ?? duration) - trimStart) / duration) * 100}%`
          }}
        />
      </div>
    </div>
  );
}

