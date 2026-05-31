import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  getPastedCanvasImage,
  isTypingInEditableElement,
} from "./canvasClipboard";
import { useCanvasViewport } from "./useCanvasViewport";
import type { Tool } from "./canvasTypes";

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 4000;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

type CanvasViewportProps = {
  activeTool: Tool;
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
  activeTool,
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

  const { view, zoomAtPoint, panByPointerDrag, zoomIn, zoomOut, resetView } =
    useCanvasViewport({
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
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
        const shouldPan = event.button === 1 || activeTool === "hand";

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

      <div
        className="design-surface"
        onMouseDown={() => onCanvasMouseDown?.()}
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
        }}
      >
        <div className="canvas-world-grid" />

        <div className="canvas-empty-state">
          <h2>Canvas de la sala</h2>
          <p>
            Mundo editable de {WORLD_WIDTH} x {WORLD_HEIGHT}. Aquí agregaremos
            imágenes, GIFs, dibujo y módulos.
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
