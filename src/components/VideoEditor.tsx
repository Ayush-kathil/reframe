"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import { cn } from "@/lib/utils";
import { EditRecipe } from "@/lib/types";
import { DEFAULT_RECIPE } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import LandingPage from "./LandingPage";
import DashboardView from "./DashboardView";
import ExportOverlay from "./ExportOverlay";
import ColorGradingPanel from "./ColorGradingPanel";
import PremiumExportPanel from "./PremiumExportPanel";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import RotateControl from "./RotateControl";
import AudioMixer from "./AudioMixer";
import TrimControl from "./TrimControl";
import EffectsPanel from "./EffectsPanel";
import TransitionsPanel from "./TransitionsPanel";
import BrandKitPanel from "./BrandKitPanel";
import FileUpload from "./FileUpload";
import CaptionsPanel from "./CaptionsPanel";

import {
  Film,
  Layers,
  Sliders,
  Play,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Crop,
  Scissors,
  Edit2,
  Check,
  Menu,
  User,
  ChevronDown,
  Plus,
} from "lucide-react";

// Project state representation
interface Project {
  id: string;
  title: string;
  createdAt: string;
  duration: number;
  recipe: EditRecipe;
  fileDetails?: {
    name: string;
    size: number;
  };
}

// Media file catalog item
interface CachedMedia {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  duration?: number;
  file: File;
}

export default function VideoEditor() {
  // Navigation & Shell states
  const [currentTab, setCurrentTab] = useState<"landing" | "dashboard" | "editor" | "export">("editor");
  const [activeTool, setActiveTool] = useState<"properties" | "framing" | "effects" | "transitions" | "brand" | "captions" | "audio">("properties");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(560);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [dragTimelineItem, setDragTimelineItem] = useState<{ type: string; id: string; label: string; duration?: number } | null>(null);

  // Tool navigation handler
  const handleToolNext = useCallback((currentTool: string) => {
    const toolOrder = ["properties", "framing", "audio", "effects", "transitions", "brand", "captions"];
    const currentIndex = toolOrder.indexOf(currentTool);
    if (currentIndex !== -1 && currentIndex < toolOrder.length - 1) {
      setActiveTool(toolOrder[currentIndex + 1] as any);
    }
  }, []);

  const handleToolPrev = useCallback((currentTool: string) => {
    const toolOrder = ["properties", "framing", "audio", "effects", "transitions", "brand", "captions"];
    const currentIndex = toolOrder.indexOf(currentTool);
    if (currentIndex > 0) {
      setActiveTool(toolOrder[currentIndex - 1] as any);
    }
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Profile Workspace management
  const [activeProfile, setActiveProfile] = useState<string>("Default Sandbox");
  const [availableProfiles, setAvailableProfiles] = useState<string[]>(["Default Sandbox"]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [showCreateProfileInput, setShowCreateProfileInput] = useState(false);

  // Parent shared project states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("Composition 1");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
    }
  }, [isEditingTitle]);

  // Hook-based core editor engine (destructuring fileError to match new upstream signature)
  const {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    updateRecipe,
    handleFileSelect,
    fileError,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
    videoRef,
    seekTo,
  } = useVideoEditor();

  // Timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbingTimeline, setIsScrubbingTimeline] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const editorStackRef = useRef<HTMLDivElement>(null);
  const timelineTrackInsetLeft = 72;
  const timelineTrackInsetRight = 12;
  const clipEnd = recipe.trimEnd ?? duration;
  const sourceClipDuration = duration > 0 ? Math.max(0, clipEnd - recipe.trimStart) : 0;
  const outputDuration = recipe.speed > 0 ? sourceClipDuration / recipe.speed : 0;
  const outputCurrentTime = outputDuration > 0
    ? Math.max(0, Math.min(outputDuration, (currentTime - recipe.trimStart) / recipe.speed))
    : 0;
  const sourcePosition = Math.max(recipe.trimStart, Math.min(clipEnd, currentTime));
  const timelineTickStep = outputDuration <= 60 ? 1 : outputDuration <= 180 ? 5 : outputDuration <= 600 ? 10 : 30;
  const timelineTicks = useMemo(() => {
    if (outputDuration <= 0) return [] as number[];
    const tickCount = Math.floor(outputDuration / timelineTickStep);
    return Array.from({ length: tickCount + 1 }, (_, index) => index * timelineTickStep);
  }, [outputDuration, timelineTickStep]);
  const playheadProgress = outputDuration > 0 ? Math.max(0, Math.min(1, outputCurrentTime / outputDuration)) : 0;

  const clampPreviewHeight = useCallback((value: number) => {
    const min = 360;
    const max = 760;
    return Math.max(min, Math.min(max, value));
  }, []);

  const handlePreviewResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizingPreview(true);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  }, []);

  const handlePreviewResizeMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingPreview || !editorStackRef.current) return;
    const rect = editorStackRef.current.getBoundingClientRect();
    const nextHeight = event.clientY - rect.top;
    setPreviewHeight(clampPreviewHeight(nextHeight));
  }, [clampPreviewHeight, isResizingPreview]);

  const handlePreviewResizeEnd = useCallback(() => {
    setIsResizingPreview(false);
  }, []);

  // Track video currentTime and play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number | null = null;

    const syncCurrentTime = () => {
      setCurrentTime(video.currentTime);
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(syncCurrentTime);
      }
    };

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay = () => {
      setIsPlaying(true);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncCurrentTime);
    };
    const onPause = () => {
      setIsPlaying(false);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [videoRef, file]);

  // Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [videoRef]);

  const isTimelineControlTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("button, input, select, textarea, a, [data-no-scrub='true']"));
  }, []);

  const getTimelineFraction = useCallback((clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const contentLeft = timelineTrackInsetLeft;
    const usableWidth = Math.max(1, rect.width - timelineTrackInsetLeft - timelineTrackInsetRight);
    const x = clientX - rect.left - contentLeft;
    return Math.max(0, Math.min(1, x / usableWidth));
  }, [timelineTrackInsetLeft, timelineTrackInsetRight]);

  const seekTimelineToClientX = useCallback((clientX: number) => {
    if (!outputDuration) return;
    const timelineTime = getTimelineFraction(clientX) * outputDuration;
    const sourceTime = recipe.trimStart + timelineTime * recipe.speed;
    seekTo(sourceTime);
  }, [getTimelineFraction, outputDuration, recipe.trimStart, recipe.speed, seekTo]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isTimelineControlTarget(e.target)) return;
    seekTimelineToClientX(e.clientX);
  }, [isTimelineControlTarget, seekTimelineToClientX]);

  const handleTimelinePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isTimelineControlTarget(e.target)) return;
    setIsScrubbingTimeline(true);
    seekTimelineToClientX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isTimelineControlTarget, seekTimelineToClientX]);

  const handleTimelinePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingTimeline) return;
    seekTimelineToClientX(e.clientX);
  }, [isScrubbingTimeline, seekTimelineToClientX]);

  const handleTimelinePointerUp = useCallback(() => {
    setIsScrubbingTimeline(false);
  }, []);

  // Format time as HH:MM:SS:FF
  const formatTimecode = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 30); // 30fps frames
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  }, []);

  // Pre-computed waveform data (stable across renders)
  const waveformData = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => {
      const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
      return 20 + Math.sin(i * 0.4) * 30 + noise * 25;
    }),
    []
  );

  // Load profiles on mount
  useEffect(() => {
    const savedActive = localStorage.getItem("reframe_active_profile") || "Default Sandbox";
    const savedProfiles = localStorage.getItem("reframe_profiles");
    let profilesList = ["Default Sandbox"];
    if (savedProfiles) {
      try {
        profilesList = JSON.parse(savedProfiles);
      } catch (e) {}
    }
    setActiveProfile(savedActive);
    setAvailableProfiles(profilesList);
  }, []);

  // Sync projects and media library whenever activeProfile changes
  useEffect(() => {
    const storageKey = `reframe_projects_${activeProfile}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored projects for profile", e);
      }
    } else {
      // Seed default project for profile
      const defaultProj: Project = {
        id: "proj-default",
        title: `${activeProfile} Sequence`,
        createdAt: new Date().toISOString(),
        duration: 12.4,
        recipe: DEFAULT_RECIPE,
      };
      setProjects([defaultProj]);
      localStorage.setItem(storageKey, JSON.stringify([defaultProj]));
    }
  }, [activeProfile]);

  const handleProfileSwitch = (profile: string) => {
    setActiveProfile(profile);
    localStorage.setItem("reframe_active_profile", profile);
    setActiveProjectId(null);
    reset(); // Clear current active video and state
    setShowProfileDropdown(false);
  };

  const handleCreateProfile = () => {
    const trimmed = newProfileName.trim();
    if (trimmed && !availableProfiles.includes(trimmed)) {
      const updatedList = [...availableProfiles, trimmed];
      setAvailableProfiles(updatedList);
      localStorage.setItem("reframe_profiles", JSON.stringify(updatedList));
      handleProfileSwitch(trimmed);
      setNewProfileName("");
      setShowCreateProfileInput(false);
    }
  };

  // Update recipe if active project changes
  useEffect(() => {
    if (activeProjectId) {
      const activeProj = projects.find((p) => p.id === activeProjectId);
      if (activeProj) {
        setProjectTitle(activeProj.title);
        // Load settings from project recipe
        updateRecipe(activeProj.recipe);
      }
    }
  }, [activeProjectId, projects, updateRecipe]);

  // Sync title editing state
  const startEditingTitle = () => {
    setTempTitle(projectTitle);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (tempTitle.trim()) {
      setProjectTitle(tempTitle);
      // Persist to projects array
      const updatedProjects = projects.map((p) => {
        if (p.id === activeProjectId) {
          return { ...p, title: tempTitle };
        }
        return p;
      });
      setProjects(updatedProjects);
      localStorage.setItem(`reframe_projects_${activeProfile}`, JSON.stringify(updatedProjects));
    }
    setIsEditingTitle(false);
  };

  // Create new project composition
  const handleCreateProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: newId,
      title: `Composition ${projects.length + 1}`,
      createdAt: new Date().toISOString(),
      duration: 0,
      recipe: DEFAULT_RECIPE,
    };
    const updated = [newProj, ...projects];
    setProjects(updated);
    localStorage.setItem(`reframe_projects_${activeProfile}`, JSON.stringify(updated));
    setActiveProjectId(newId);
    reset(); // Clear current active video
    setCurrentTab("editor");
  };

  // Open existing project
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentTab("editor");
  };

  // Delete project composition
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem(`reframe_projects_${activeProfile}`, JSON.stringify(updated));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      reset();
    }
  };

  // Handle direct file upload (no media library intermediary)
  const handleFileUpload = async (uploadedFile: File) => {
    await handleFileSelect(uploadedFile);
    
    // Sync into project details
    if (activeProjectId) {
      const updated = projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            fileDetails: { name: uploadedFile.name, size: uploadedFile.size },
          };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem(`reframe_projects_${activeProfile}`, JSON.stringify(updated));
    }

    // Stay in editor workspace
    setCurrentTab("editor");
  };

  // Sync edits in editor back to local projects
  const handleRecipeChange = useCallback((updates: Partial<EditRecipe>) => {
    updateRecipe(updates);
    if (activeProjectId) {
      const updated = projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            recipe: { ...p.recipe, ...updates },
          };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem(`reframe_projects_${activeProfile}`, JSON.stringify(updated));
    }
  }, [activeProfile, activeProjectId, projects, updateRecipe]);

  const isProcessing = status === "loading-engine" || status === "exporting";
  const transitionPlacement = recipe.transitionPlacement || "both";
  const transitionDuration = recipe.transitionDuration || 1;
  const transitionWidth = outputDuration > 0 ? `${Math.max(4, Math.min(30, (transitionDuration / outputDuration) * 100))}%` : "8%";

  const parseTransitionDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const payload = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
    if (!payload) return null;

    try {
      return JSON.parse(payload) as { id?: string; duration?: number };
    } catch {
      return null;
    }
  }, []);

  const applyTransitionPlacement = useCallback((placement: "intro" | "outro" | "both", payload?: { id?: string; duration?: number } | null) => {
    const transitionId = payload?.id || (recipe as any).transitionId || "cross-dissolve";
    const transitionDuration = payload?.duration ?? (recipe as any).transitionDuration ?? 1;
    handleRecipeChange({
      transitionId,
      transitionDuration,
      transitionPlacement: placement,
    } as Partial<EditRecipe>);
  }, [handleRecipeChange, recipe]);

  const handleTimelineItemDragStart = useCallback((event: React.DragEvent<HTMLElement>, payload: { type: string; id: string; label: string; duration?: number }) => {
    setDragTimelineItem(payload);
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  }, []);

  const handleTimelineItemDragEnd = useCallback(() => {
    setDragTimelineItem(null);
  }, []);

  const handleTrackDrop = useCallback((event: React.DragEvent<HTMLDivElement>, track: "audio" | "transition" | "text", placement?: "intro" | "outro") => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as { type?: string; id?: string; duration?: number; label?: string };
      if (track === "transition" && placement) {
        applyTransitionPlacement(placement, { id: payload.id, duration: payload.duration });
        return;
      }

      if (track === "audio" && payload.type === "audio-eq" && payload.id) {
        handleRecipeChange({ audioEqualizer: payload.id });
        return;
      }

      if (track === "text" && payload.type === "text") {
        handleRecipeChange({
          captionEnabled: true,
          captionText: payload.label || recipe.captionText,
          captionStartTime: 0,
          captionEndTime: outputDuration > 0 ? outputDuration : recipe.captionEndTime,
        });
      }
    } catch {
      return;
    }
  }, [applyTransitionPlacement, handleRecipeChange, outputDuration, recipe.captionEndTime, recipe.captionText]);

  // Render navigation rail sidebar content
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "library", label: "Media Bin", icon: <Film className="w-4 h-4" /> },
    { id: "editor", label: "Editor", icon: <Layers className="w-4 h-4 text-accent" /> },
    { id: "color", label: "Color Grading", icon: <Sliders className="w-4 h-4 text-secondary" /> },
    { id: "export", label: "Export", icon: <Play className="w-4 h-4 text-tertiary" /> },
  ] as const;

  // Complete bypass for marketing landing view
  if (currentTab === "landing") {
    return <LandingPage onStart={() => setCurrentTab("dashboard")} />;
  }

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary/30 h-screen w-screen overflow-hidden flex flex-col relative">
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} />

      {/* Top Navigation Anchor */}
      <nav className="flex justify-between items-center w-full px-gutter h-16 fixed top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-xl">
          <button 
            className="font-display-lg text-title-lg font-bold text-primary cursor-pointer hover:text-primary-fixed transition-colors bg-transparent border-0 p-0 tracking-[0.18em] uppercase"
            onClick={() => setCurrentTab("dashboard")}
          >
            Reframe
          </button>
          <div className="hidden md:flex gap-lg">
            <button 
              onClick={() => setCurrentTab("dashboard")}
              className={cn("text-on-surface-variant font-medium hover:bg-white/10 hover:text-primary transition-colors cursor-pointer px-sm py-xs rounded bg-transparent border-0", currentTab === 'dashboard' && "text-primary bg-white/5")}
            >
              Projects
            </button>
            <button 
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/*";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFileUpload(f);
                };
                input.click();
              }}
              className="text-on-surface-variant font-medium hover:bg-white/10 hover:text-primary transition-colors cursor-pointer px-sm py-xs rounded bg-transparent border-0"
            >
              Upload
            </button>
            <span className="text-on-surface-variant font-medium hover:bg-white/10 hover:text-primary transition-colors cursor-pointer px-sm py-xs rounded">Team</span>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm mr-md">
            <button className="p-2 text-on-surface-variant scale-95 active:scale-90 transition-transform"><span className="material-symbols-outlined">undo</span></button>
            <button className="p-2 text-on-surface-variant scale-95 active:scale-90 transition-transform"><span className="material-symbols-outlined">redo</span></button>
          </div>
          {file && (
            <button 
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/*";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFileUpload(f);
                };
                input.click();
              }}
              className="px-md py-sm rounded-full bg-surface-container-high text-on-surface font-body-md hover:bg-white/10 transition-colors flex items-center gap-xs cursor-pointer border-0"
              title="Replace current video file"
            >
              <span className="material-symbols-outlined text-body-md">swap_horiz</span>
              Swap Media
            </button>
          )}
          <button 
            onClick={handleExport}
            className="px-md py-sm rounded-full bg-primary-container text-on-primary-container font-body-md font-bold scale-95 active:scale-90 transition-transform flex items-center gap-xs cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-body-md">ios_share</span>
            Export
          </button>
          <span className="material-symbols-outlined text-on-surface-variant ml-sm cursor-pointer hover:text-on-surface transition-colors">account_circle</span>
        </div>
      </nav>

      {/* Side Bar */}
      <aside className="fixed left-0 top-16 bottom-8 flex flex-col items-center py-md z-40 bg-surface-container-low/90 backdrop-blur-lg border-r border-outline-variant/10 w-20 group hover:w-64 transition-all duration-300">
        <div className="flex flex-col items-center gap-sm w-full px-xs">
          
          <div className="flex flex-col gap-xs w-full mt-4">
            <button 
              onClick={() => { setCurrentTab("editor"); setActiveTool("captions"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left", currentTab === 'editor' && activeTool === 'captions' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'captions') ? "'FILL' 1" : "'FILL' 0" }}>subtitles</span>
              <span className="hidden group-hover:block font-label-md truncate">Captions</span>
            </button>
            
            <button 
              onClick={() => { setCurrentTab("editor"); setActiveTool("properties"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left", currentTab === 'editor' && activeTool === 'properties' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'properties') ? "'FILL' 1" : "'FILL' 0" }}>movie_edit</span>
              <span className="hidden group-hover:block font-label-md truncate">Editor</span>
            </button>

            <button 
              onClick={() => { setCurrentTab("editor"); setActiveTool("audio"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left", currentTab === 'editor' && activeTool === 'audio' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'audio') ? "'FILL' 1" : "'FILL' 0" }}>speaker_notes</span>
              <span className="hidden group-hover:block font-label-md truncate">Audio Mixer</span>
            </button>

            <button 
              onClick={() => { setCurrentTab("editor"); setActiveTool("framing"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left", currentTab === 'editor' && activeTool === 'framing' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'framing') ? "'FILL' 1" : "'FILL' 0" }}>crop_rotate</span>
              <span className="hidden group-hover:block font-label-md truncate">Framing</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setCurrentTab("editor"); setActiveTool("effects"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left relative", currentTab === 'editor' && activeTool === 'effects' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'effects') ? "'FILL' 1" : "'FILL' 0" }}>auto_fix_high</span>
              <span className="hidden group-hover:block font-label-md truncate">Effects</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setCurrentTab("editor"); setActiveTool("transitions"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left relative", currentTab === 'editor' && activeTool === 'transitions' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'transitions') ? "'FILL' 1" : "'FILL' 0" }}>animation</span>
              <span className="hidden group-hover:block font-label-md truncate">Transitions</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setCurrentTab("editor"); setActiveTool("brand"); }}
              className={cn("flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer bg-transparent border-0 text-left relative", currentTab === 'editor' && activeTool === 'brand' && "bg-secondary-container text-on-secondary-container")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: (currentTab === 'editor' && activeTool === 'brand') ? "'FILL' 1" : "'FILL' 0" }}>branding_watermark</span>
              <span className="hidden group-hover:block font-label-md truncate">Brand Kit</span>
            </button>
          </div>
        </div>
        
        <div className="mt-auto flex flex-col gap-xs w-full px-xs">
          <div className="flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span className="hidden group-hover:block font-label-md truncate">Settings</span>
          </div>
          <div className="flex items-center gap-md w-full p-md text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-all cursor-pointer">
            <span className="material-symbols-outlined">help</span>
            <span className="hidden group-hover:block font-label-md truncate">Help</span>
          </div>
        </div>
      </aside>

      {/* Main Content Router */}
      {currentTab === "dashboard" && (
        <main className="fixed left-20 right-0 top-16 bottom-8 overflow-y-auto bg-background pt-8 pb-12 px-margin-desktop">
          <DashboardView
            projects={projects}
            onCreateProject={handleCreateProject}
            onSelectProject={(id) => { handleSelectProject(id); setCurrentTab("editor"); }}
            onDeleteProject={handleDeleteProject}
          />
        </main>
      )}



      {currentTab === "editor" && (
        <main className="fixed left-20 right-0 top-16 bottom-8 p-gutter overflow-hidden flex flex-col lg:flex-row gap-md bg-background">
          {/* Editor Workspace - Responsive */}
          <div ref={editorStackRef} className="flex-1 flex flex-col gap-3 min-w-0 h-full">
            {/* Video Preview Section */}
            <section className="rounded-[1.5rem] border border-white/8 bg-gradient-to-b from-surface-container to-surface-container-low/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)] overflow-hidden relative"
              style={{ height: `${previewHeight}px` }}>
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">Live Preview</span>
              </div>
              {file ? (
                <VideoPreview file={file} recipe={recipe} videoRef={videoRef} />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 relative z-10">
                  <div className="w-full max-w-md p-6 bg-surface-container-low rounded-2xl border border-outline-variant/15 shadow-2xl">
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    currentFile={file}
                    fileError={fileError || undefined}
                  />
                  </div>
                </div>
              )}
            </section>

            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize preview and timeline"
              onPointerDown={handlePreviewResizeStart}
              onPointerMove={handlePreviewResizeMove}
              onPointerUp={handlePreviewResizeEnd}
              onPointerLeave={handlePreviewResizeEnd}
              onLostPointerCapture={handlePreviewResizeEnd}
              className={cn(
                "h-3 rounded-full border border-outline-variant/10 bg-surface-container-low/70 relative cursor-row-resize transition-all",
                isResizingPreview && "bg-primary/20 border-primary/30"
              )}
              title="Drag to resize preview"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="h-1 w-16 rounded-full bg-outline-variant/25" />
                <span className="h-1 w-1 rounded-full bg-outline-variant/35" />
                <span className="h-1 w-16 rounded-full bg-outline-variant/25" />
              </div>
            </div>

            {/* ── Premium NLE Timeline ── */}
            <div className="flex-1 min-h-0 bg-surface-container-lowest rounded-2xl border border-white/8 flex flex-col relative overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                {/* Transport Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/15 bg-surface-container-low/55 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                        {/* Skip to start */}
                        <button
                          type="button"
                          onClick={() => seekTo(recipe.trimStart)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-variant/50 flex items-center justify-center transition-all cursor-pointer bg-transparent border-0"
                          title="Go to Start"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">first_page</span>
                        </button>
                        {/* Previous frame */}
                        <button
                          type="button"
                          onClick={() => seekTo(Math.max(recipe.trimStart, currentTime - (1 / 30) * recipe.speed))}
                          className="w-7 h-7 rounded-lg hover:bg-surface-variant/50 flex items-center justify-center transition-all cursor-pointer bg-transparent border-0"
                          title="Previous Frame"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">skip_previous</span>
                        </button>
                        {/* Play/Pause */}
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/80 flex items-center justify-center transition-all active:scale-90 cursor-pointer border-0 shadow-md shadow-primary/20 mx-1"
                          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                        >
                          <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isPlaying ? "pause" : "play_arrow"}
                          </span>
                        </button>
                        {/* Next frame */}
                        <button
                          type="button"
                          onClick={() => seekTo(Math.min(clipEnd, currentTime + (1 / 30) * recipe.speed))}
                          className="w-7 h-7 rounded-lg hover:bg-surface-variant/50 flex items-center justify-center transition-all cursor-pointer bg-transparent border-0"
                          title="Next Frame"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">skip_next</span>
                        </button>
                        {/* Skip to end */}
                        <button
                          type="button"
                          onClick={() => seekTo(clipEnd)}
                          className="w-7 h-7 rounded-lg hover:bg-surface-variant/50 flex items-center justify-center transition-all cursor-pointer bg-transparent border-0"
                          title="Go to End"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">last_page</span>
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 bg-outline-variant/20 mx-2" />

                        {/* Timecode Display */}
                        <div className="flex flex-col gap-0.5 bg-surface-container rounded-lg px-3 py-1.5 border border-outline-variant/10 min-w-[240px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Out</span>
                            <span className="text-on-surface font-mono text-sm tabular-nums tracking-wider font-semibold">
                              {formatTimecode(outputCurrentTime)}
                            </span>
                            {outputDuration > 0 && (
                              <>
                                <span className="text-outline-variant text-xs">/</span>
                                <span className="text-on-surface-variant font-mono text-[11px] tabular-nums">
                                  {formatTimecode(outputDuration)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Src</span>
                            <span className="text-on-surface-variant font-mono text-[11px] tabular-nums">
                              {formatTimecode(Math.max(0, sourcePosition - recipe.trimStart))}
                            </span>
                            <span className="text-outline-variant text-[10px]">/</span>
                            <span className="text-on-surface-variant/80 font-mono text-[10px] tabular-nums">
                              {formatTimecode(sourceClipDuration)}
                            </span>
                          </div>
                        </div>
                    </div>

                    {/* Right side info */}
                    <div className="flex items-center gap-3">
                      {file && (
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider bg-surface-container rounded-md px-2 py-1 border border-outline-variant/10">
                          {recipe.preset.replace(/-/g, ' ')}
                        </span>
                      )}
                      {isPlaying && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider font-semibold">Live</span>
                        </div>
                      )}
                    </div>
                </div>

                {/* Modern NLE Dual-Track Timeline Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 bg-surface-container-low/35">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-primary">view_timeline</span>
                    <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-on-surface-variant">Workspace Timeline</span>
                  </div>
                  {/* Timeline Zoom Controls */}
                  <div className="flex items-center gap-1.5 bg-surface-container-high/40 rounded-lg p-0.5 border border-outline-variant/10">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-on-surface-variant px-1.5">Zoom</span>
                    {([1, 2, 5, 10] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setTimelineZoom(z)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border-0",
                          timelineZoom === z 
                            ? "bg-primary text-on-primary shadow-sm" 
                            : "bg-transparent text-on-surface-variant hover:bg-white/5"
                        )}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Track Area Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-surface-container-lowest animate-fade-in relative min-h-[200px]">
                  {/* Playhead scrubber container */}
                  <div 
                    ref={timelineRef}
                    className={cn(
                      "h-full relative select-none py-3",
                      isScrubbingTimeline ? "cursor-ew-resize" : "cursor-crosshair"
                    )}
                    style={{ width: `${100 * timelineZoom}%`, minWidth: "100%" }}
                    onClick={handleTimelineClick}
                    onPointerDown={handleTimelinePointerDown}
                    onPointerMove={handleTimelinePointerMove}
                    onPointerUp={handleTimelinePointerUp}
                    onLostPointerCapture={handleTimelinePointerUp}
                    role="slider"
                    aria-label="Timeline scrubber"
                    aria-valuemin={0}
                    aria-valuemax={outputDuration || 0}
                    aria-valuenow={outputCurrentTime}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') seekTo(Math.min(clipEnd, currentTime + recipe.speed));
                      if (e.key === 'ArrowLeft') seekTo(Math.max(recipe.trimStart, currentTime - recipe.speed));
                      if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
                    }}
                  >
                    {/* Time Ruler */}
                    <div className="h-5 bg-surface-container-low/40 border-b border-outline-variant/10 relative px-1 flex items-end mb-2 w-full">
                      <div className="absolute inset-y-0 left-18 right-3">
                        {outputDuration > 0 && timelineTicks.map((tick) => {
                          const pos = (tick / outputDuration) * 100;
                          const isMajor = tick % (timelineTickStep * 5) === 0;
                          return (
                            <div key={tick} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${pos}%` }}>
                              <div className={`w-px ${isMajor ? 'h-3 bg-outline-variant/40' : 'h-1.5 bg-outline-variant/20'}`} />
                              {isMajor && (
                                <span className="absolute -top-0.5 text-[8px] text-on-surface-variant/50 font-mono tabular-nums -translate-x-1/2">
                                  {tick}s
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Track V1 - VIDEO */}
                    <div className="h-14 relative flex items-center mb-2.5 w-full">
                      {/* V1 Label Header */}
                      <div className="absolute left-3 top-0 bottom-0 w-12 bg-surface-container-high/95 border border-outline-variant/20 rounded-lg flex flex-col items-center justify-center z-20 shadow-sm">
                        <span className="text-[10px] font-black font-mono text-primary leading-none">V1</span>
                        <span className="text-[7px] font-heading font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">Video</span>
                      </div>
                      
                      {/* Video Clip Block */}
                      <div className="absolute left-18 right-3 top-0 bottom-0 rounded-lg overflow-hidden border border-primary/20 bg-primary/5 shadow-inner">
                        {/* Trim Range Overlay */}
                        {file && duration > 0 && (
                          <div 
                            className="absolute bg-primary/10 border-l border-r border-primary/50 inset-y-0"
                            style={{
                              left: `${(recipe.trimStart / duration) * 100}%`,
                              right: `${100 - ((recipe.trimEnd !== null ? recipe.trimEnd : duration) / duration) * 100}%`
                            }}
                          >
                            {/* Visual Handle Indicators */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-3 h-6 rounded-md bg-primary border border-white flex items-center justify-center shadow-md cursor-ew-resize z-10">
                              <span className="material-symbols-outlined text-[8px] text-white">drag_indicator</span>
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-3 h-6 rounded-md bg-primary border border-white flex items-center justify-center shadow-md cursor-ew-resize z-10">
                              <span className="material-symbols-outlined text-[8px] text-white">drag_indicator</span>
                            </div>
                          </div>
                        )}

                        {/* Video label metadata */}
                        <div className="absolute top-2 left-4 flex items-center gap-2 z-10">
                          <span className="material-symbols-outlined text-[13px] text-primary">movie</span>
                          <span className="text-[10px] text-on-surface font-semibold truncate max-w-[250px]">
                            {file ? file.name : "No Media Imported"}
                          </span>
                        </div>

                        {/* Scale markers inside V1 */}
                        {duration > 0 && (
                          <div className="absolute bottom-2 right-4 text-[8px] font-mono text-on-surface-variant/60 bg-black/40 rounded-md px-1.5 py-0.5 border border-white/5">
                            {recipe.trimStart.toFixed(1)}s - {(recipe.trimEnd !== null ? recipe.trimEnd : duration).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Track T1 - TRANSITIONS */}
                    <div className="h-14 relative flex items-center mb-2.5 w-full">
                      <div className="absolute left-3 top-0 bottom-0 w-12 bg-surface-container-high/95 border border-outline-variant/20 rounded-lg flex flex-col items-center justify-center z-20 shadow-sm">
                        <span className="text-[10px] font-black font-mono text-secondary leading-none">T1</span>
                        <span className="text-[7px] font-heading font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">Transitions</span>
                      </div>

                      <div
                        className="absolute left-18 right-3 top-0 bottom-0 rounded-lg overflow-hidden border border-secondary/20 bg-secondary/5 shadow-inner"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleTrackDrop(e, "transition", e.clientX < (timelineRef.current?.getBoundingClientRect().left || 0) + (timelineRef.current?.getBoundingClientRect().width || 0) / 2 ? "intro" : "outro")}
                      >
                        <div
                          className="absolute inset-y-0 left-0 w-1/2"
                          onDrop={(e) => {
                            e.preventDefault();
                            applyTransitionPlacement("intro", parseTransitionDrop(e));
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="absolute inset-y-1 left-1 right-[4px] rounded-l-lg border border-dashed border-secondary/25 bg-gradient-to-r from-secondary/20 to-transparent" />
                        </div>
                        <div
                          className="absolute inset-y-0 right-0 w-1/2"
                          onDrop={(e) => {
                            e.preventDefault();
                            applyTransitionPlacement("outro", parseTransitionDrop(e));
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="absolute inset-y-1 left-[4px] right-1 rounded-r-lg border border-dashed border-secondary/25 bg-gradient-to-l from-secondary/20 to-transparent" />
                        </div>

                        <div className="absolute top-2 left-4 flex items-center gap-2 z-10 pointer-events-none">
                          <span className="material-symbols-outlined text-[13px] text-secondary">animation</span>
                          <span className="text-[10px] text-on-surface font-semibold uppercase tracking-wider">
                            Drag a transition here to place it on the timeline
                          </span>
                        </div>

                        <div className="absolute right-4 top-2 flex items-center gap-2 z-10 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[8px] font-bold uppercase tracking-wider">
                            {transitionPlacement.toUpperCase()}
                          </span>
                          <span className="text-[8px] text-on-surface-variant/70 font-mono">
                            {transitionDuration.toFixed(1)}s
                          </span>
                        </div>

                        {duration > 0 && (
                          <>
                            {transitionPlacement !== "outro" && (
                              <div
                                className="absolute inset-y-1 left-1 rounded-l-lg bg-secondary/30 border border-secondary/50"
                                style={{ width: transitionWidth }}
                              />
                            )}
                            {transitionPlacement !== "intro" && (
                              <div
                                className="absolute inset-y-1 right-1 rounded-r-lg bg-secondary/30 border border-secondary/50"
                                style={{ width: transitionWidth }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Track A1 - AUDIO */}
                    <div className="h-14 relative flex items-center mb-2 w-full">
                      {/* A1 Label Header */}
                      <div className="absolute left-3 top-0 bottom-0 w-12 bg-surface-container-high/95 border border-outline-variant/20 rounded-lg flex flex-col items-center justify-center z-20 shadow-sm">
                        <span className="text-[10px] font-black font-mono text-secondary leading-none">A1</span>
                        <span className="text-[7px] font-heading font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">Audio</span>
                      </div>
                      
                      {/* Audio Clip Block */}
                      <div className={cn(
                        "absolute left-18 right-3 top-0 bottom-0 rounded-lg overflow-hidden border transition-all duration-300",
                        recipe.keepAudio 
                          ? "border-secondary/20 bg-secondary/5 shadow-inner" 
                          : "border-outline-variant/10 bg-surface-container-low/20 opacity-40"
                      )}>
                        {/* Audio Waveform decoration */}
                        <div className="absolute inset-0 flex items-center px-4 gap-px opacity-30 pointer-events-none">
                          {waveformData.map((h, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 rounded-full min-w-[2px] transition-all",
                                recipe.keepAudio ? "bg-secondary" : "bg-on-surface-variant/40"
                              )}
                              style={{ height: `${h * recipe.volume}%` }}
                            />
                          ))}
                        </div>

                        {/* Mute/Volume Indicator badge */}
                        <div className="absolute top-2 left-4 flex items-center gap-2 z-10">
                          <span className="material-symbols-outlined text-[13px] text-secondary">
                            {recipe.keepAudio ? "volume_up" : "volume_off"}
                          </span>
                          <span className="text-[9px] text-on-surface font-semibold uppercase tracking-wider">
                            {recipe.keepAudio ? `Volume: ${Math.round(recipe.volume * 100)}%` : "Track Muted"}
                          </span>
                          {recipe.audioEqualizer !== "none" && (
                            <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[8px] font-bold uppercase tracking-wider border border-secondary/10">
                              EQ: {recipe.audioEqualizer}
                            </span>
                          )}
                        </div>

                        {/* Mute/Solo button toggle inside track */}
                        <div className="absolute right-4 top-2 flex items-center gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRecipeChange({ keepAudio: !recipe.keepAudio }); }}
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-heading font-bold uppercase tracking-wider transition-all border cursor-pointer",
                              recipe.keepAudio 
                                ? "border-secondary text-secondary bg-secondary/5" 
                                : "border-outline-variant/15 text-on-surface-variant hover:border-secondary hover:text-secondary"
                            )}
                          >
                            Mute
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Track X1 - TEXT */}
                    <div className="h-14 relative flex items-center w-full">
                      <div className="absolute left-3 top-0 bottom-0 w-12 bg-surface-container-high/95 border border-outline-variant/20 rounded-lg flex flex-col items-center justify-center z-20 shadow-sm">
                        <span className="text-[10px] font-black font-mono text-primary leading-none">X1</span>
                        <span className="text-[7px] font-heading font-semibold uppercase tracking-wider text-on-surface-variant/60 mt-0.5">Text</span>
                      </div>

                      <div
                        className={cn(
                          "absolute left-18 right-3 top-0 bottom-0 rounded-lg overflow-hidden border border-dashed transition-all duration-300",
                          recipe.captionEnabled ? "border-primary/30 bg-primary/5" : "border-outline-variant/15 bg-surface-container-low/20"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleTrackDrop(e, "text")}
                      >
                        <div className="absolute top-2 left-4 flex items-center gap-2 z-10 pointer-events-none">
                          <span className="material-symbols-outlined text-[13px] text-primary">closed_caption</span>
                          <span className="text-[10px] text-on-surface font-semibold uppercase tracking-wider">
                            {recipe.captionEnabled ? recipe.captionText : "Drop text to create a caption lane"}
                          </span>
                        </div>
                        {recipe.captionEnabled && (
                          <div
                            className="absolute inset-y-1 rounded-lg bg-primary/10 border border-primary/30 flex items-center px-4"
                            style={{
                              left: outputDuration > 0 ? `${Math.max(0, Math.min(95, ((recipe.captionStartTime || 0) / outputDuration) * 100))}%` : "0.25rem",
                              right: outputDuration > 0
                                ? `${Math.max(0, Math.min(95, 100 - (((recipe.captionEndTime ?? outputDuration) / outputDuration) * 100)))}%`
                                : "0.25rem",
                            }}
                          >
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-primary">
                              <span className="material-symbols-outlined text-[13px]">subtitle</span>
                              Caption Track
                            </div>
                            <div className="ml-auto text-[9px] text-on-surface-variant/70 font-mono truncate max-w-[55%]">
                              {(recipe.captionStartTime || 0).toFixed(1)}s - {(recipe.captionEndTime ?? outputDuration).toFixed(1)}s
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 left-18 right-3 z-30 pointer-events-none">
                      <div
                        className="absolute top-0 bottom-0 transition-[left] duration-75"
                        style={{ left: `${playheadProgress * 100}%` }}
                      >
                        {/* Playhead line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                        {/* Playhead handle (diamond) */}
                        <div className={cn(
                          "absolute -top-1 -left-[5px] w-[11px] h-[11px] bg-red-500 rotate-45 rounded-[2px] shadow-lg border",
                          isScrubbingTimeline ? "shadow-red-500/60 border-red-300" : "shadow-red-500/30 border-red-400"
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <aside className="w-full lg:w-80 shrink-0 bg-surface-container rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden h-auto lg:h-full max-h-[60vh] lg:max-h-none">
             <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface-container/95 backdrop-blur-sm">
                <h2 className="font-title-md text-on-surface flex items-center gap-2">
                  {activeTool === "properties" && (
                    <>
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      Properties
                    </>
                  )}
                  {activeTool === "audio" && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-secondary">audio_wave</span>
                      Audio Mixer
                    </>
                  )}
                  {activeTool === "effects" && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-primary">auto_fix_high</span>
                      Creative Effects
                    </>
                  )}
                  {activeTool === "transitions" && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-secondary">animation</span>
                      Transitions
                    </>
                  )}
                  {activeTool === "brand" && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-tertiary">branding_watermark</span>
                      Watermark Editor
                    </>
                  )}
                  {activeTool === "captions" && (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-primary">closed_caption</span>
                      Subtitles & Captions
                    </>
                  )}
                </h2>
                {activeTool !== "properties" && (
                  <button
                    onClick={() => setActiveTool("properties")}
                    className="p-1 rounded-md hover:bg-surface-variant/40 text-on-surface-variant flex items-center justify-center transition-all bg-transparent border-0 cursor-pointer"
                    title="Back to Properties"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {activeTool === "properties" && (
                  <>
                    {/* Format & Preset Section */}
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[16px] text-primary">aspect_ratio</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Format</span>
                      </div>
                      <PresetSelector recipe={recipe} onChange={handleRecipeChange} onNext={() => handleToolNext("properties")} />
                    </div>

                    {/* Framing Section */}
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[16px] text-secondary">crop</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Framing</span>
                      </div>
                      <FramingControl recipe={recipe} onChange={handleRecipeChange} onNext={() => handleToolNext("properties")} />
                    </div>

                    {/* Color Grading */}
                    <ColorGradingPanel recipe={recipe} onChange={handleRecipeChange} />

                    {/* Rotation Section */}
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">rotate_right</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Rotation</span>
                      </div>
                      <RotateControl recipe={recipe} onChange={handleRecipeChange} onNext={() => handleToolNext("properties")} />
                    </div>

                    {/* Trim Section */}
                    {file && duration > 0 && (
                      <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[16px] text-secondary">cut</span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Trim</span>
                        </div>
                        <TrimControl recipe={recipe} onChange={handleRecipeChange} duration={duration} />
                      </div>
                    )}

                    {/* Navigation to next tool */}
                    <button
                      type="button"
                      onClick={() => handleToolNext("properties")}
                      className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Next: Audio
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </>
                )}

                {activeTool === "audio" && (
                  <>
                    <AudioMixer
                      recipe={recipe}
                      onChange={handleRecipeChange}
                      duration={duration}
                      onNext={() => handleToolNext("audio")}
                      onDragStart={handleTimelineItemDragStart as any}
                    />
                  </>
                )}

                {activeTool === "framing" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">crop_rotate</span>
                      <h3 className="text-[14px] font-semibold uppercase tracking-wider text-on-surface">Smart Reframing</h3>
                    </div>
                    <FramingControl recipe={recipe} onChange={handleRecipeChange} onNext={() => handleToolNext("framing")} />
                  </div>
                )}

            {file && file.size > 100 * 1024 * 1024 && (
              <p className="text-[var(--warning)] text-sm">
                ⚠️ Large file - processing may take several minutes
              </p>
            )}      
                {activeTool === "effects" && (
                  <EffectsPanel recipe={recipe} onChange={handleRecipeChange} />
                )}

                {activeTool === "transitions" && (
                    <TransitionsPanel
                      recipe={recipe}
                      onChange={handleRecipeChange}
                      onDragStart={handleTimelineItemDragStart as any}
                    />
                )}

                {activeTool === "brand" && (
                  <BrandKitPanel recipe={recipe} onChange={handleRecipeChange} />
                )}
                {activeTool === "captions" && (
                  <CaptionsPanel
                    recipe={recipe}
                    onChange={handleRecipeChange}
                    onDragStart={handleTimelineItemDragStart as any}
                    duration={duration}
                  />
                )}
             </div>
          </aside>
        </main>
      )}

      {currentTab === "export" && (
        <main className="fixed left-20 right-0 top-16 bottom-8 overflow-y-auto bg-background p-8">
          <div className="max-w-6xl mx-auto">
             <div className="mb-8">
               <h2 className="text-3xl font-bold tracking-tight mb-2">Export & Render</h2>
               <p className="text-sm text-on-surface-variant">Configure your export settings and render the final video</p>
             </div>
             <PremiumExportPanel
                recipe={recipe}
                onChange={handleRecipeChange}
                status={status}
                progress={progress}
                result={result}
                error={error}
                onExport={handleExport}
                onCancel={cancelExport}
                onReset={reset}
             />
          </div>
        </main>
      )}

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center px-gutter h-8 z-50 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="flex items-center gap-md">
          <span className="font-label-md text-label-md text-on-surface-variant/70">Reframe Studio</span>
          <div className="h-3 w-px bg-outline-variant/20"></div>
          <span className="font-label-md text-label-md text-tertiary flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            WASM Muxer Online
          </span>
        </div>
        <div className="flex items-center gap-lg">
          <span className="font-label-md text-label-md text-on-surface-variant/70 hover:text-on-surface cursor-pointer">Shortcuts</span>
          <span className="font-label-md text-label-md text-on-surface-variant/70 hover:text-on-surface cursor-pointer">Privacy</span>
        </div>
      </footer>
    </div>
  );
}
