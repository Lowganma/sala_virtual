import { useEffect, useMemo, useRef } from "react";
import type {
  CanvasStroke,
  DrawingLayerType,
  DrawingSettings,
  StrokePoint,
} from "./drawingTypes";

type DrawingCanvasProps = {
  layerType: DrawingLayerType;
  width: number;
  height: number;
  strokes: CanvasStroke[];
  previewStroke: StrokePoint[] | null;
  settings: DrawingSettings;
  className?: string;
};

type DrawableStroke = Pick<
  CanvasStroke,
  | "tool"
  | "color"
  | "size"
  | "opacity"
  | "brush_intensity"
  | "brush_softness"
  | "brush_smoothing"
  | "points"
  | "layer_type"
>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function drawStrokePath(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  const [firstPoint, secondPoint] = stroke.points;

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  if (stroke.tool !== "brush" || stroke.brush_smoothing <= 0 || !secondPoint) {
    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }

    return;
  }

  const smoothing = clamp(stroke.brush_smoothing, 0, 1);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const previousPoint = stroke.points[index - 1];
    const currentPoint = stroke.points[index];
    const nextPoint = stroke.points[index + 1];
    const controlX = currentPoint.x * smoothing + previousPoint.x * (1 - smoothing);
    const controlY = currentPoint.y * smoothing + previousPoint.y * (1 - smoothing);
    const midX = (currentPoint.x + nextPoint.x) / 2;
    const midY = (currentPoint.y + nextPoint.y) / 2;

    context.quadraticCurveTo(controlX, controlY, midX, midY);
  }

  const lastPoint = stroke.points.at(-1);

  if (lastPoint) {
    context.lineTo(lastPoint.x, lastPoint.y);
  }
}

function drawStroke(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  if (stroke.points.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.size;

  if (stroke.tool === "eraser") {
    // El borrador es un trazo negativo y solo afecta al canvas de esta capa.
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 1;
    context.strokeStyle = "rgba(0, 0, 0, 1)";
  } else {
    context.globalCompositeOperation = "source-over";
    context.globalAlpha =
      stroke.tool === "brush"
        ? clamp(stroke.opacity * stroke.brush_intensity, 0.05, 1)
        : 1;
    context.strokeStyle = stroke.color;

    if (stroke.tool === "brush" && stroke.brush_softness > 0) {
      context.shadowBlur = stroke.size * stroke.brush_softness;
      context.shadowColor = stroke.color;
    }
  }

  drawStrokePath(context, stroke);
  context.stroke();
  context.restore();
}

export function DrawingCanvas({
  layerType,
  width,
  height,
  strokes,
  previewStroke,
  settings,
  className,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerStrokes = useMemo(
    () => strokes.filter((stroke) => stroke.layer_type === layerType),
    [layerType, strokes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    // Renderiza de nuevo todos los trazos persistidos para reconstruir la capa.
    for (const stroke of layerStrokes) {
      drawStroke(context, stroke);
    }

    if (
      previewStroke &&
      settings.tool !== "pan" &&
      settings.layerType === layerType
    ) {
      const isBrush = settings.tool === "brush";

      drawStroke(context, {
        layer_type: layerType,
        tool: settings.tool,
        color: settings.color,
        size: settings.size,
        opacity: settings.tool === "pencil" ? 1 : settings.opacity,
        brush_intensity: isBrush ? settings.brushIntensity : 1,
        brush_softness: isBrush ? settings.brushSoftness : 0,
        brush_smoothing: isBrush ? settings.brushSmoothing : 0,
        points: previewStroke,
      });
    }
  }, [height, layerStrokes, layerType, previewStroke, settings, width]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      aria-hidden="true"
    />
  );
}
