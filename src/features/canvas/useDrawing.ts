import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { CanvasView } from "./canvasTypes";
import { isTypingInEditableElement } from "./canvasClipboard";
import type {
  DrawingSettings,
  DrawingStrokeDraft,
  DrawingTool,
  StrokePoint,
} from "./drawingTypes";

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

const MIN_STEP_BY_TOOL: Record<Exclude<DrawingTool, "pan">, number> = {
  pencil: 1.2,
  brush: 1.8,
  eraser: 1.7,
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function createStrokeDraft(
  settings: DrawingSettings,
  points: StrokePoint[]
): DrawingStrokeDraft | null {
  if (settings.tool === "pan") {
    return null;
  }

  const isBrush = settings.tool === "brush";

  return {
    layer_type: settings.layerType,
    tool: settings.tool,
    color: settings.color,
    size: settings.size,
    opacity: settings.tool === "eraser" ? 1 : settings.opacity,
    brush_intensity: isBrush ? settings.brushIntensity : 1,
    brush_softness: isBrush ? settings.brushSoftness : 0,
    brush_smoothing: isBrush ? settings.brushSmoothing : 0,
    points,
  };
}

function getInterpolationStep(settings: DrawingSettings) {
  if (settings.tool === "pan") {
    return 1.8;
  }

  const baseStep = MIN_STEP_BY_TOOL[settings.tool];

  if (settings.tool !== "brush") {
    return baseStep;
  }

  return baseStep * (1 - settings.brushSmoothing * 0.35);
}

export function appendInterpolatedPoint(
  previousPoints: StrokePoint[],
  nextPoint: StrokePoint,
  minStep: number
): StrokePoint[] {
  const last = previousPoints[previousPoints.length - 1];

  if (!last) {
    return [nextPoint];
  }

  const distance = Math.hypot(last.x - nextPoint.x, last.y - nextPoint.y);

  if (distance < minStep) {
    return previousPoints;
  }

  const steps = Math.max(1, Math.floor(distance / minStep));
  const interpolated: StrokePoint[] = [];

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;

    interpolated.push({
      x: last.x + (nextPoint.x - last.x) * progress,
      y: last.y + (nextPoint.y - last.y) * progress,
    });
  }

  return [...previousPoints, ...interpolated];
}

export function useDrawing({
  settings,
  view,
  viewportRef,
  onCommitStroke,
}: UseDrawingOptions) {
  const activeSettingsRef = useRef<DrawingSettings | null>(null);
  const pointsRef = useRef<StrokePoint[]>([]);
  const [previewStroke, setPreviewStroke] = useState<DrawingStrokeDraft | null>(
    null
  );

  useEffect(() => {
    if (!activeSettingsRef.current) {
      return;
    }

    // Mantiene el preview estable durante el trazo aunque la toolbar cambie.
    setPreviewStroke(createStrokeDraft(activeSettingsRef.current, pointsRef.current));
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
    const strokeSettings = activeSettingsRef.current;

    pointsRef.current = [];
    activeSettingsRef.current = null;
    setPreviewStroke(null);

    if (!strokeSettings || strokeSettings.tool === "pan" || points.length < 2) {
      return;
    }

    onCommitStroke(strokeSettings, points);
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

      activeSettingsRef.current = { ...settings };
      pointsRef.current = [firstPoint];
      setPreviewStroke(createStrokeDraft(settings, pointsRef.current));

      function handleMouseMove(moveEvent: MouseEvent) {
        const nextPoint = getWorldPoint(moveEvent.clientX, moveEvent.clientY);
        const strokeSettings = activeSettingsRef.current;

        if (!nextPoint || !strokeSettings) {
          return;
        }

        pointsRef.current = appendInterpolatedPoint(
          pointsRef.current,
          nextPoint,
          getInterpolationStep(strokeSettings)
        );
        setPreviewStroke(createStrokeDraft(strokeSettings, pointsRef.current));
      }

      function handleMouseUp() {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        finishStroke();
      }

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [finishStroke, getWorldPoint, settings]
  );

  return {
    previewStroke,
    handleDrawingMouseDown,
  };
}
