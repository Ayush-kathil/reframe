"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Sparkles, Film } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="
        relative flex items-center justify-center
        w-8 h-8 rounded-full
        bg-[var(--surface)] text-[var(--text)]
        border border-[var(--border)]
        hover:border-[var(--accent)] hover:text-[var(--accent)]
        focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2
        transition-all duration-300 shadow-sm
      "
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
