"use client";

import { useState, useEffect, useRef } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import { cn } from "@/lib/utils";
import { EditRecipe, ExportResult, ExportStatus } from "@/lib/types";
import { DEFAULT_RECIPE } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import LandingPage from "./LandingPage";
import DashboardView from "./DashboardView";
import MediaLibraryView from "./MediaLibraryView";
import ColorGradingPanel from "./ColorGradingPanel";
import ExportPanel from "./ExportPanel";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioSpeedControl from "./AudioSpeedControl";

import {
  Home,
  Film,
  Layers,
  Sliders,
  Play,
  Activity,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Crop,
  Scissors,
  RotateCw,
  Volume2,
  SlidersHorizontal,
  Edit2,
  Check,
  Menu
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
  const [currentTab, setCurrentTab] = useState<"landing" | "dashboard" | "library" | "editor" | "color" | "export">("landing");
  const [activeInspectorTab, setActiveInspectorTab] = useState<"layout" | "color" | "audio" | "export">("layout");

  const handleTabChange = (tab: "landing" | "dashboard" | "library" | "editor" | "color" | "export") => {
    if (tab === "color") {
      setCurrentTab("editor");
      setActiveInspectorTab("color");
    } else if (tab === "export") {
      setCurrentTab("editor");
      setActiveInspectorTab("export");
    } else {
      setCurrentTab(tab);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Media Library state
  const [mediaFiles, setMediaFiles] = useState<CachedMedia[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | undefined>(undefined);

  // Hook-based core editor engine
  const {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    isValidating,
    updateRecipe,
    handleFileSelect,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
  } = useVideoEditor();

  // Load projects from mock localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lumina_projects");
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored projects", e);
      }
    } else {
      // Seed default project for professional presentation
      const defaultProj: Project = {
        id: "proj-default",
        title: "Master Sequence Composition",
        createdAt: new Date().toISOString(),
        duration: 12.4,
        recipe: DEFAULT_RECIPE,
      };
      setProjects([defaultProj]);
      localStorage.setItem("lumina_projects", JSON.stringify([defaultProj]));
    }
  }, []);

  // Update recipe if active project changes
  useEffect(() => {
    if (activeProjectId) {
      const activeProj = projects.find(p => p.id === activeProjectId);
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
      const updatedProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, title: tempTitle };
        }
        return p;
      });
      setProjects(updatedProjects);
      localStorage.setItem("lumina_projects", JSON.stringify(updatedProjects));
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
    localStorage.setItem("lumina_projects", JSON.stringify(updated));
    setActiveProjectId(newId);
    reset(); // Clear current active video
    handleTabChange("editor");
    setActiveInspectorTab("layout");
  };

  // Open existing project
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    handleTabChange("editor");
    setActiveInspectorTab("layout");
  };

  // Delete project composition
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("lumina_projects", JSON.stringify(updated));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      reset();
    }
  };

  // Handle new file upload from media library or quick drag-drops
  const handleMediaUpload = async (uploadedFile: File) => {
    const newId = `media-${Date.now()}`;
    const newMedia: CachedMedia = {
      id: newId,
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type,
      url: URL.createObjectURL(uploadedFile),
      file: uploadedFile,
    };
    
    setMediaFiles(prev => [newMedia, ...prev]);
    // Automatically load it into the active editor
    await handleFileSelect(uploadedFile);
    setSelectedMediaId(newId);
    
    // Sync into project details
    if (activeProjectId) {
      const updated = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            fileDetails: { name: uploadedFile.name, size: uploadedFile.size },
          };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem("lumina_projects", JSON.stringify(updated));
    }

    // Direct transition to standard Editor workspace
    setCurrentTab("editor");
  };

  // Select video item from Media bin
  const handleSelectMedia = async (media: CachedMedia) => {
    setSelectedMediaId(media.id);
    await handleFileSelect(media.file);
    setCurrentTab("editor");
  };

  // Delete video item from Media catalog
  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mediaToDelete = mediaFiles.find(m => m.id === id);
    if (mediaToDelete) {
      URL.revokeObjectURL(mediaToDelete.url);
    }
    setMediaFiles(prev => prev.filter(m => m.id !== id));
    if (selectedMediaId === id) {
      setSelectedMediaId(undefined);
      reset();
    }
  };

  // Sync edits in editor back to local projects
  const handleRecipeChange = (updates: Partial<EditRecipe>) => {
    updateRecipe(updates);
    if (activeProjectId) {
      const updated = projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            recipe: { ...p.recipe, ...updates },
          };
        }
        return p;
      });
      setProjects(updated);
      localStorage.setItem("lumina_projects", JSON.stringify(updated));
    }
  };

  const isProcessing = status === "loading-engine" || status === "exporting";

  // Render navigation rail sidebar content
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "library", label: "Media Bin", icon: <Film className="w-4 h-4" /> },
    { id: "editor", label: "Creative Studio", icon: <Layers className="w-4 h-4" /> },
  ] as const;

  // Complete bypass for marketing landing view
  if (currentTab === "landing") {
    return <LandingPage onStart={() => handleTabChange("dashboard")} />;
  }

  return (
    <div className="min-h-screen flex bg-bg text-text selection:bg-accent/30 selection:text-white transition-colors duration-200">
      
      {/* ── Left Sidebar Navigation Rail (Desktop) ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col justify-between border-r border-border bg-surface shrink-0 z-30 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="space-y-6">
          {/* Logo & Collapse Switcher */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-border">
            {!sidebarCollapsed && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleTabChange("landing")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTabChange("landing");
                  }
                }}
                className="flex items-center gap-2 cursor-pointer group text-left"
              >
                <Film className="w-5 h-5 text-accent animate-pulse" />
                <span className="font-display font-medium text-sm uppercase tracking-widest text-text group-hover:text-accent transition-colors">
                  LUMINA <span className="text-accent">CUT</span>
                </span>
              </div>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => handleTabChange("landing")}
                className="w-5 h-5 mx-auto text-accent cursor-pointer hover:rotate-12 transition-transform focus:outline-none focus:ring-1 focus:ring-accent rounded flex items-center justify-center"
                aria-label="Go to Landing Page"
              >
                <Film className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded bg-bg border border-border hover:bg-surface-bright text-muted hover:text-text shrink-0"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-2 space-y-1.5">
            {navigationItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                    active
                      ? "bg-accent/10 text-accent border-l-2 border-accent"
                      : "text-muted hover:bg-bg hover:text-text"
                  )}
                >
                  <span className={cn(active ? "text-accent" : "text-muted")}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Details Rail footer */}
        <div className="p-4 border-t border-border space-y-3 font-mono text-[9px] text-muted">
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center justify-between">
                <span>WASM Muxer</span>
                <span className="text-secondary font-medium">READY</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cache limit</span>
                <span>2.0GB</span>
              </div>
            </>
          )}
          {sidebarCollapsed && (
            <div className="w-2.5 h-2.5 rounded-full bg-secondary mx-auto animate-pulse" title="Engine Muxer Active" />
          )}
        </div>
      </aside>

      {/* Mobile Header Bottom drawers */}
      {mobileMenuOpen && (
        <div
          role="button"
          tabIndex={-1}
          aria-label="Close Mobile Navigation"
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMobileMenuOpen(false);
            }
          }}
        >
          <aside className="w-64 h-full bg-surface border-r border-border p-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="font-display font-medium text-sm uppercase tracking-widest">LUMINA CUT</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-muted hover:text-text font-mono text-xs">✕</button>
              </div>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                      currentTab === item.id
                        ? "bg-accent/10 text-accent border-l-2 border-accent"
                        : "text-muted hover:bg-bg hover:text-text"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main App Shell Body ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Panel */}
        <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between gap-4 z-20">
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar toggle trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded border border-border bg-bg hover:bg-surface-bright text-muted hover:text-text shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Editable Project Title composition */}
            <div className="flex items-center gap-2 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                    className="px-2 py-1 bg-bg border border-accent rounded-lg text-sm font-heading font-medium outline-none"
                  />
                  <button onClick={saveTitle} className="p-1 text-secondary hover:bg-bg rounded">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={startEditingTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startEditingTitle();
                    }
                  }}
                  className="flex items-center gap-2 group cursor-pointer text-left"
                >
                  <h1 className="font-heading font-medium text-sm tracking-wide text-text truncate group-hover:text-accent transition-colors">
                    {projectTitle}
                  </h1>
                  <Edit2 className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Engine Status Indicators and Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-bg border border-border rounded-full font-mono text-[9px] text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse" />
              WASM Engine Online
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Inner Tab Router */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              projects={projects}
              onCreateProject={handleCreateProject}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentTab === "library" && (
            <MediaLibraryView
              mediaFiles={mediaFiles}
              onUpload={handleMediaUpload}
              onSelectMedia={handleSelectMedia}
              selectedMediaId={selectedMediaId}
              onDeleteMedia={handleDeleteMedia}
            />
          )}

          {currentTab === "editor" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 animate-fade-in items-start">
              {/* Left Column: Pinned Video Preview & Sequence Timeline */}
              <div className="space-y-6 lg:sticky lg:top-4">
                {/* Media Preview Monitor */}
                <div className="bg-surface border border-border rounded-xl p-5">
                  {!file ? (
                    <div className="py-24 text-center space-y-4 max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-surface border border-dashed border-border rounded-full flex items-center justify-center mx-auto text-muted">
                        <Film className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">No source video selected</h4>
                        <p className="text-xs text-muted mt-1">
                          Upload a video clip in the **Media Bin** or import one directly using the dashboard.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabChange("library")}
                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium uppercase tracking-wider"
                      >
                        Go to Media Bin
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <VideoPreview file={file} recipe={recipe} />
                    </div>
                  )}
                </div>

                {/* Track timeline controls */}
                {file && (
                  <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Scissors className="w-3.5 h-3.5 text-accent" />
                      <h3 className="text-xs font-medium uppercase tracking-widest text-muted font-mono">
                        Sequence Timeline
                      </h3>
                    </div>
                    <TrimControl
                      recipe={recipe}
                      onChange={handleRecipeChange}
                      duration={duration}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Tabbed Inspector Tool Suite */}
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                  <div className="border-b border-border pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-accent" />
                      Inspector
                    </h3>
                    <button
                      onClick={resetSettings}
                      className="text-[10px] text-muted hover:text-accent font-mono uppercase tracking-wider"
                    >
                      Reset
                    </button>
                  </div>

                  {file ? (
                    <div className="space-y-6">
                       {/* Premium Rounded Button Tab Switcher */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-bg/80 border border-border rounded-xl font-heading text-[11px] uppercase tracking-wider font-medium">
                        <button
                          onClick={() => setActiveInspectorTab("layout")}
                          className={cn(
                            "py-2 px-1 rounded-lg text-center transition-all cursor-pointer font-medium",
                            activeInspectorTab === "layout"
                              ? "bg-accent/15 text-accent shadow-sm"
                              : "text-muted hover:bg-surface hover:text-text"
                          )}
                        >
                          Layout
                        </button>
                        <button
                          onClick={() => setActiveInspectorTab("color")}
                          className={cn(
                            "py-2 px-1 rounded-lg text-center transition-all cursor-pointer font-medium",
                            activeInspectorTab === "color"
                              ? "bg-accent/15 text-accent shadow-sm"
                              : "text-muted hover:bg-surface hover:text-text"
                          )}
                        >
                          Color
                        </button>
                        <button
                          onClick={() => setActiveInspectorTab("audio")}
                          className={cn(
                            "py-2 px-1 rounded-lg text-center transition-all cursor-pointer font-medium",
                            activeInspectorTab === "audio"
                              ? "bg-accent/15 text-accent shadow-sm"
                              : "text-muted hover:bg-surface hover:text-text"
                          )}
                        >
                          Audio
                        </button>
                        <button
                          onClick={() => setActiveInspectorTab("export")}
                          className={cn(
                            "py-2 px-1 rounded-lg text-center transition-all cursor-pointer font-medium",
                            activeInspectorTab === "export"
                              ? "bg-accent/15 text-accent shadow-sm"
                              : "text-muted hover:bg-surface hover:text-text"
                          )}
                        >
                          Compile
                        </button>
                      </div>

                      {/* Content Panel based on active sub-tab */}
                      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                        {activeInspectorTab === "layout" && (
                          <div className="space-y-6 animate-fade-in">
                            <div className="space-y-2">
                              <span className="text-[10px] text-muted uppercase font-medium tracking-widest font-mono">Aspect Presets</span>
                              <PresetSelector recipe={recipe} onChange={handleRecipeChange} />
                            </div>

                            <div className="space-y-2 border-t border-border pt-4">
                              <span className="text-[10px] text-muted uppercase font-medium tracking-widest font-mono">Framing Model</span>
                              <FramingControl recipe={recipe} onChange={handleRecipeChange} />
                            </div>

                            <div className="space-y-2 border-t border-border pt-4">
                              <span className="text-[10px] text-muted uppercase font-medium tracking-widest font-mono">Rotations</span>
                              <RotateControl recipe={recipe} onChange={handleRecipeChange} />
                            </div>
                          </div>
                        )}

                        {activeInspectorTab === "color" && (
                          <div className="animate-fade-in">
                            <ColorGradingPanel recipe={recipe} onChange={handleRecipeChange} />
                          </div>
                        )}

                        {activeInspectorTab === "audio" && (
                          <div className="space-y-6 animate-fade-in">
                            <div className="space-y-2">
                              <span className="text-[10px] text-muted uppercase font-medium tracking-widest font-mono">Audio Speed</span>
                              <AudioSpeedControl recipe={recipe} onChange={handleRecipeChange} />
                            </div>

                            <div className="space-y-2 border-t border-border pt-4">
                              <span className="text-[10px] text-muted uppercase font-medium tracking-widest font-mono">Orientation Flips</span>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleRecipeChange({ flipH: !recipe.flipH })}
                                  className={cn(
                                    "flex-1 py-2.5 border rounded-lg font-heading text-xs font-medium uppercase tracking-wider transition-all active:scale-95",
                                    recipe.flipH
                                      ? "bg-accent border-accent text-white shadow-lg shadow-accent/10"
                                      : "border-border text-muted hover:border-accent hover:text-text bg-surface"
                                  )}
                                >
                                  Horizontal Flip
                                </button>
                                <button
                                  onClick={() => handleRecipeChange({ flipV: !recipe.flipV })}
                                  className={cn(
                                    "flex-1 py-2.5 border rounded-lg font-heading text-xs font-medium uppercase tracking-wider transition-all active:scale-95",
                                    recipe.flipV
                                      ? "bg-accent border-accent text-white shadow-lg shadow-accent/10"
                                      : "border-border text-muted hover:border-accent hover:text-text bg-surface"
                                  )}
                                >
                                  Vertical Flip
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeInspectorTab === "export" && (
                          <div className="animate-fade-in">
                            <ExportPanel
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
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted text-center py-6 font-sans">
                      Load a source video to inspect parameters.
                    </p>
                  )}
                </div>

                {file && activeInspectorTab !== "export" && (
                  <button
                    onClick={() => setActiveInspectorTab("export")}
                    className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-heading text-sm font-medium uppercase tracking-widest shadow-lg shadow-accent/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Go to Compiler Export
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Glassmorphic Upload/Metadata Analysis Loading Overlay ── */}
      {isValidating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <h4 className="font-heading font-medium text-sm text-text">Analyzing Video Assets</h4>
            <p className="text-xs text-muted font-mono">Running Magic Bytes & Header Inspections...</p>
          </div>
        </div>
      )}
    </div>
  );
}
