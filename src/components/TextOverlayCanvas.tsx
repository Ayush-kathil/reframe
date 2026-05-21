"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useTimelineStore } from "@/store/timelineStore";
import { useEditorStore } from "@/store/editorStore";

type TextOverlayCanvasProps = {
  bounds: {
    displayWidth: number;
    displayHeight: number;
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  naturalSize: {
    width: number;
    height: number;
  };
  isActive: boolean;
};

export default function TextOverlayCanvas({ bounds, naturalSize, isActive }: TextOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  const {
    textObjects,
    updateTextObject,
    setSelectedTextId,
    selectedTextId,
  } = useTimelineStore();

  const { currentTime } = useEditorStore();

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: isActive,
      renderOnAddRemove: true,
      preserveObjectStacking: true,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [isActive]);

  // Sync dimensions
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setDimensions({
      width: bounds.displayWidth + bounds.offsetX * 2,
      height: bounds.displayHeight + bounds.offsetY * 2,
    });
    // The viewport transform scales the internal logical coordinates to match the display scale
    // and offsets it so (0,0) starts at the top-left of the actual video.
    const vpt: [number, number, number, number, number, number] = [
      bounds.scale, 0,
      0, bounds.scale,
      bounds.offsetX, bounds.offsetY,
    ];
    fabricCanvas.setViewportTransform(vpt);
    fabricCanvas.renderAll();
  }, [fabricCanvas, bounds]);

  // Sync text objects with Fabric
  useEffect(() => {
    if (!fabricCanvas) return;

    const existingObjects = fabricCanvas.getObjects() as fabric.IText[];
    const existingIds = new Set(existingObjects.map((o) => (o as any).name));
    const activeTextObjects = textObjects.filter(
      (t) => currentTime >= t.startTime && currentTime <= t.startTime + t.duration
    );
    const activeIds = new Set(activeTextObjects.map((t) => t.id));

    // Remove objects that shouldn't be rendered
    existingObjects.forEach((obj) => {
      if ((obj as any).name && !activeIds.has((obj as any).name)) {
        fabricCanvas.remove(obj);
      }
    });

    // Add or update active objects
    activeTextObjects.forEach((storeObj) => {
      const existing = existingObjects.find((o) => (o as any).name === storeObj.id);

      if (existing) {
        // Only update properties if not currently being actively edited/dragged by user
        if (fabricCanvas.getActiveObject() !== existing && !(existing as any).isEditing) {
          existing.set({
            text: storeObj.text,
            left: storeObj.left,
            top: storeObj.top,
            scaleX: storeObj.scaleX,
            scaleY: storeObj.scaleY,
            fill: storeObj.fill,
            fontFamily: storeObj.fontFamily,
            fontSize: storeObj.fontSize,
            stroke: storeObj.stroke || null,
            strokeWidth: storeObj.strokeWidth || 0,
            shadow: storeObj.shadow ? new fabric.Shadow(storeObj.shadow) : null,
          });
        }
      } else {
        const textObj = new fabric.IText(storeObj.text, {
          name: storeObj.id,
          left: storeObj.left,
          top: storeObj.top,
          scaleX: storeObj.scaleX,
          scaleY: storeObj.scaleY,
          fill: storeObj.fill,
          fontFamily: storeObj.fontFamily,
          fontSize: storeObj.fontSize,
          stroke: storeObj.stroke || null,
          strokeWidth: storeObj.strokeWidth || 0,
          shadow: storeObj.shadow ? new fabric.Shadow(storeObj.shadow) : null,
          selectable: isActive,
          evented: isActive,
          transparentCorners: false,
          cornerColor: "#8b5cf6",
          cornerStrokeColor: "#ffffff",
          borderColor: "#8b5cf6",
          cornerSize: 10,
          padding: 6,
        });

        fabricCanvas.add(textObj);
      }
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, textObjects, currentTime, isActive]);

  // Sync active selection
  useEffect(() => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (selectedTextId) {
      const target = objects.find((o) => (o as any).name === selectedTextId);
      if (target && fabricCanvas.getActiveObject() !== target) {
        fabricCanvas.setActiveObject(target);
        fabricCanvas.renderAll();
      }
    } else {
      if (fabricCanvas.getActiveObject()) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
    }
  }, [fabricCanvas, selectedTextId]);

  // Setup Event Listeners
  useEffect(() => {
    if (!fabricCanvas || !isActive) return;

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj || !(obj as any).name) return;

      updateTextObject((obj as any).name, {
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        text: obj.text,
      });
    };

    const handleSelectionCreated = (e: any) => {
      const obj = e.selected?.[0];
      if (obj && (obj as any).name) {
        setSelectedTextId((obj as any).name);
      }
    };

    const handleSelectionCleared = () => {
      setSelectedTextId(null);
    };

    fabricCanvas.on("object:modified", handleObjectModified);
    fabricCanvas.on("selection:created", handleSelectionCreated);
    fabricCanvas.on("selection:updated", handleSelectionCreated);
    fabricCanvas.on("selection:cleared", handleSelectionCleared);

    return () => {
      fabricCanvas.off("object:modified", handleObjectModified);
      fabricCanvas.off("selection:created", handleSelectionCreated);
      fabricCanvas.off("selection:updated", handleSelectionCreated);
      fabricCanvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [fabricCanvas, isActive, updateTextObject, setSelectedTextId]);

  return (
    <div className={`absolute inset-0 z-30 ${!isActive ? "pointer-events-none" : ""}`}>
      <canvas ref={canvasRef} className="h-full w-full outline-none" />
    </div>
  );
}
