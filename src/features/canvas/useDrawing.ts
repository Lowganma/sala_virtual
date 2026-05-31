import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { CanvasView } from "./canvasTypes";
import { isTypingInEditableElement } from "./canvasClipboard";
import type { DrawingSettings, StrokePoint } from "./drawingTypes";

type UseDrawingOptions = {
  settings: DrawingSettings;
  view: CanvasView;
  viewportRef: RefObject<HTMLElement | null>;
  onCommitStroke: (settings: DrawingSettings, points: StrokePoint[]) => void;
};

const INTERACTIVE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a",
  "iframe",
  "[contenteditable='true']",
  ".floating-window",
  ".canvas-layer",
  ".canvas-sidebar",
  ".viewport-tools",
  ".drawing-toolbar",
].join(",");

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

export function useDrawing({
  settings,
  view,
  viewportRef,
  onCommitStroke,
}: UseDrawingOptions) {
  const settingsRef = useRef(settings);
  const pointsRef = useRef<StrokePoint[]>([]);
  const [previewStroke, setPreviewStroke] = useState<StrokePoint[] | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const getWorldPoint = useCallback(
    (clientX: number, clientY: number): StrokePoint | null => {
      const viewportElement = viewportRef.current;

      if (!viewportElement) {
        return null;
      }

      const rect = viewportElement.getBoundingClientRect();

      // Convierte coordenadas de pantalla al mundo transformado por pan/zoom.
      return {
        x: (clientX - rect.left - view.panX) / view.zoom,
        y: (clientY - rect.top - view.panY) / view.zoom,
      };
    },
    [view.panX, view.panY, view.zoom, viewportRef]
  );

  const finishStroke = useCallback(() => {
    const points = pointsRef.current;

    pointsRef.current = [];
    setPreviewStroke(null);

    if (settingsRef.current.tool === "pan" || points.length < 2) {
      return;
    }

    onCommitStroke(settingsRef.current, points);
  }, [onCommitStroke]);

  const handleDrawingMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (
        event.button !== 0 ||
        settings.tool === "pan" ||
        isTypingInEditableElement() ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const firstPoint = getWorldPoint(event.clientX, event.clientY);

      if (!firstPoint) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      pointsRef.current = [firstPoint];
      setPreviewStroke([firstPoint]);

      function handleMouseMove(moveEvent: MouseEvent) {
        const nextPoint = getWorldPoint(moveEvent.clientX, moveEvent.clientY);

        if (!nextPoint) {
          return;
        }

        pointsRef.current = [...pointsRef.current, nextPoint];
        setPreviewStroke(pointsRef.current);
      }

      function handleMouseUp() {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        finishStroke();
      }

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [finishStroke, getWorldPoint, settings.tool]
  );

  return {
    previewStroke,
    handleDrawingMouseDown,
  };
}
