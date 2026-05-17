"use client";

import { Plus, Video, Calendar, ArrowRight, HardDrive, Cpu, Film, Trash2 } from "lucide-react";
import { EditRecipe } from "@/lib/types";

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

interface DashboardViewProps {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export default function DashboardView({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: DashboardViewProps) {
  // Format file size nicely
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Summary & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Workspace</h2>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest font-mono">
            Manage recent cuts, templates, and system render workloads
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-lg shadow-accent/15 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-surface border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest font-mono">Recent Projects</div>
            <div className="text-xl font-bold font-mono mt-0.5">{projects.length}</div>
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest font-mono">Client-Side Cache Limit</div>
            <div className="text-xl font-bold font-mono mt-0.5">2.0 GB</div>
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl flex items-center gap-4">
          <div className="p-3 bg-tertiary/10 border border-tertiary/20 rounded-lg text-tertiary">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-widest font-mono">WASM Engine Status</div>
            <div className="text-xl font-bold text-secondary font-mono mt-0.5">Ready</div>
          </div>
        </div>
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted font-mono">
          Recent Cuts
        </h3>

        {projects.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-xl space-y-4">
            <div className="w-12 h-12 bg-surface/50 border border-border rounded-full flex items-center justify-center mx-auto text-muted">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">No recent projects found</p>
              <p className="text-xs text-muted mt-1">Get started by creating your very first video composition.</p>
            </div>
            <button
              onClick={onCreateProject}
              className="px-4 py-2 border border-border rounded-lg text-xs font-semibold uppercase tracking-wider bg-surface/80 hover:bg-surface transition-all active:scale-95"
            >
              Start Composition
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group relative bg-surface border border-border rounded-xl p-5 hover:border-accent transition-all cursor-pointer hover:shadow-lg hover:shadow-shadow/50 flex flex-col justify-between h-44"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-heading font-bold text-sm truncate group-hover:text-accent transition-colors">
                      {project.title}
                    </h4>
                    <button
                      onClick={(e) => onDeleteProject(project.id, e)}
                      className="p-1.5 rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-muted font-mono space-y-1 mt-2">
                    {project.fileDetails && (
                      <p className="truncate">File: {project.fileDetails.name}</p>
                    )}
                    {project.fileDetails && (
                      <p>Size: {formatSize(project.fileDetails.size)}</p>
                    )}
                    <p className="capitalize">Format: {project.recipe.format}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-border pt-3 mt-4">
                  <div className="flex items-center gap-1.5 text-muted text-[10px] font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <span className="text-accent text-xs font-semibold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Open
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
