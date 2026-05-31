import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  getPastedCanvasImage,
  isTypingInEditableElement,
} from "./canvasClipboard";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { useCanvasStrokes } from "./useCanvasStrokes";
import { useCanvasViewport } from "./useCanvasViewport";
import { useDrawing } from "./useDrawing";
import { DEFAULT_DRAWING_SETTINGS } from "./drawingTypes";
import type { DrawingSettings } from "./drawingTypes";

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 4000;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

type CanvasViewportProps = {
  roomId: string;
  children?: ReactNode;
  onPasteImage?: (payload: {
    src: string;
    type: "image" | "gif";
    x: number;
    y: number;
    file?: File;
  }) => void;
  onCanvasMouseDown?: () => void;
};

export function CanvasViewport({
  roomId,
  children,
  onPasteImage,
  onCanvasMouseDown,
}: CanvasViewportProps) {
  const viewportRef = useRef<HTMLElement | null>(null);
  const panDragRef = useRef<{
    pointerStartX: number;
    pointerStartY: number;
    panStartX: number;
    panStartY: number;
  } | null>(null);

  const [viewportSize, setViewportSize] = useState({
    width: 1,
    height: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [drawingSettings, setDrawingSettings] = useState<DrawingSettings>(
    DEFAULT_DRAWING_SETTINGS
  );

  const { strokes, isLoadingStrokes, addStroke, undoLastStroke, clearLayer } =
    useCanvasStrokes(roomId);

  const { view, zoomAtPoint, panByPointerDrag, zoomIn, zoomOut, resetView } =
    useCanvasViewport({
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
    });

  const { previewStroke, handleDrawingMouseDown } = useDrawing({
    settings: drawingSettings,
    view,
    viewportRef,
    onCommitStroke: (settings, points) => {
      void addStroke(settings, points);
    },
  });

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(viewportRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();

      const rect = viewportElement!.getBoundingClientRect();

      zoomAtPoint({
        deltaY: event.deltaY,
        cursorX: event.clientX - rect.left,
        cursorY: event.clientY - rect.top,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
      });
    }

    viewportElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      viewportElement.removeEventListener("wheel", handleWheel);
    };
  }, [viewportSize.width, viewportSize.height, zoomAtPoint]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") {
        return;
      }

      if (isTypingInEditableElement()) {
        return;
      }

      event.preventDefault();
      void undoLastStroke(drawingSettings.layerType);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawingSettings.layerType, undoLastStroke]);

  useEffect(() => {
    function pasteAtViewportCenter({
      src,
      type,
      file,
    }: {
      src: string;
      type: "image" | "gif";
      file?: File;
    }) {
      if (!viewportRef.current || !onPasteImage) {
        return;
      }

      const centerX = viewportSize.width / 2;
      const centerY = viewportSize.height / 2;

      onPasteImage({
        src,
        type,
        x: (centerX - view.panX) / view.zoom,
        y: (centerY - view.panY) / view.zoom,
        file,
      });
    }

    function handlePaste(event: ClipboardEvent) {
      if (isTypingInEditableElement()) {
        return;
      }

      const pastedImage = getPastedCanvasImage(event);

      if (!pastedImage) {
        return;
      }

      event.preventDefault();
      pasteAtViewportCenter(pastedImage);
    }

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [
    onPasteImage,
    view.panX,
    view.panY,
    view.zoom,
    viewportSize.width,
    viewportSize.height,
  ]);

  return (
    <section
      ref={viewportRef}
      className={isPanning ? "canvas-main is-panning" : "canvas-main"}
      onMouseMove={(event) => {
        if (!panDragRef.current) {
          return;
        }

        const { pointerStartX, pointerStartY, panStartX, panStartY } =
          panDragRef.current;

        panByPointerDrag({
          pointerStartX,
          pointerStartY,
          panStartX,
          panStartY,
          clientX: event.clientX,
          clientY: event.clientY,
          viewportWidth: viewportSize.width,
          viewportHeight: viewportSize.height,
        });
      }}
      onMouseUp={() => {
        panDragRef.current = null;
        setIsPanning(false);
      }}
      onMouseLeave={() => {
        panDragRef.current = null;
        setIsPanning(false);
      }}
      onMouseDown={(event) => {
        const shouldPan = event.button === 1 || drawingSettings.tool === "pan";

        if (!shouldPan) {
          return;
        }

        event.preventDefault();
        setIsPanning(true);

        panDragRef.current = {
          pointerStartX: event.clientX,
          pointerStartY: event.clientY,
          panStartX: view.panX,
          panStartY: view.panY,
        };
      }}
    >
      <div className="viewport-tools">
        <button onClick={zoomIn}>+</button>
        <button onClick={zoomOut}>-</button>
        <button onClick={resetView}>Reset</button>
        <span>{Math.round(view.zoom * 100)}%</span>
      </div>

      <DrawingToolbar
        settings={drawingSettings}
        isLoading={isLoadingStrokes}
        onSettingsChange={setDrawingSettings}
        onUndoStroke={() => {
          void undoLastStroke(drawingSettings.layerType);
        }}
        onClearLayer={(layerType) => {
          void clearLayer(layerType);
        }}
      />

      <div
        className={
          drawingSettings.tool === "pan"
            ? "design-surface"
            : "design-surface is-drawing-mode"
        }
        onMouseDown={(event) => {
          handleDrawingMouseDown(event);
          onCanvasMouseDown?.();
        }}
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
        }}
      >
        <DrawingCanvas
          layerType="background"
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          strokes={strokes}
          previewStroke={previewStroke}
          className="drawing-canvas background-drawing-canvas"
        />

        <div className="canvas-world-grid" />

        <div className="canvas-empty-state">
          <h2>Canvas de la sala</h2>
          <p>
            Mundo editable de {WORLD_WIDTH} x {WORLD_HEIGHT}. Aquí agregaremos
            imágenes, GIFs, dibujo y módulos.
          </p>
        </div>
        {children}

        <DrawingCanvas
          layerType="overlay"
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          strokes={strokes}
          previewStroke={previewStroke}
          className="drawing-canvas overlay-drawing-canvas"
        />
      </div>
    </section>
  );
}
