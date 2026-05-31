import { useEffect, useMemo, useRef } from "react";
import type {
  CanvasStroke,
  DrawingLayerType,
  DrawingStrokeDraft,
  StrokePoint,
} from "./drawingTypes";

type DrawingCanvasProps = {
  layerType: DrawingLayerType;
  width: number;
  height: number;
  strokes: CanvasStroke[];
  previewStroke: DrawingStrokeDraft | null;
  className?: string;
};

type DrawableStroke = CanvasStroke | DrawingStrokeDraft;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function drawRoundDot(context: CanvasRenderingContext2D, point: StrokePoint, size: number) {
  context.beginPath();
  context.arc(point.x, point.y, Math.max(1, size) / 2, 0, Math.PI * 2);
  context.fill();
}

function drawPencilStroke(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  const [firstPoint] = stroke.points;

  if (!firstPoint) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = Math.max(1, stroke.size);
  context.globalAlpha = clamp(stroke.opacity ?? 1, 0, 1);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (stroke.points.length === 1) {
    drawRoundDot(context, firstPoint, stroke.size);
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const current = stroke.points[index];
    const next = stroke.points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    context.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const lastPoint = stroke.points.at(-1);

  if (lastPoint) {
    context.lineTo(lastPoint.x, lastPoint.y);
  }

  context.stroke();
  context.restore();
}

function drawBrushStroke(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  const [firstPoint] = stroke.points;

  if (!firstPoint) {
    return;
  }

  const size = Math.max(1, stroke.size);
  const taper = clamp(stroke.brush_softness ?? 0.35, 0, 1);
  const flow = clamp(stroke.brush_intensity ?? 0.6, 0, 1);
  const opacity = clamp(stroke.opacity ?? 0.7, 0, 1);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (stroke.points.length === 1) {
    context.globalAlpha = opacity * flow;
    drawRoundDot(context, firstPoint, size * (1 - taper * 0.5));
    context.restore();
    return;
  }

  const total = stroke.points.length - 1;

  for (let index = 1; index < stroke.points.length; index += 1) {
    const previousPoint = stroke.points[index - 1];
    const nextPoint = stroke.points[index];
    const progress = total <= 0 ? 1 : index / total;
    const edge = Math.min(progress, 1 - progress) * 2;
    const taperFactor = 1 - taper * (1 - edge);

    context.lineWidth = Math.max(1, size * taperFactor);
    context.globalAlpha = opacity * flow;
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
  }

  context.restore();
}

function drawEraserStroke(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  const [firstPoint] = stroke.points;

  if (!firstPoint) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "destination-out";
  context.lineWidth = Math.max(8, stroke.size);
  context.globalAlpha = 1;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(0, 0, 0, 1)";
  context.fillStyle = "rgba(0, 0, 0, 1)";

  if (stroke.points.length === 1) {
    drawRoundDot(context, firstPoint, Math.max(8, stroke.size));
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const current = stroke.points[index];
    const next = stroke.points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    context.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const lastPoint = stroke.points.at(-1);

  if (lastPoint) {
    context.lineTo(lastPoint.x, lastPoint.y);
  }

  context.stroke();
  context.restore();
}

function drawStroke(context: CanvasRenderingContext2D, stroke: DrawableStroke) {
  if (stroke.tool === "brush") {
    drawBrushStroke(context, stroke);
    return;
  }

  if (stroke.tool === "eraser") {
    drawEraserStroke(context, stroke);
    return;
  }

  drawPencilStroke(context, stroke);
}

export function DrawingCanvas({
  layerType,
  width,
  height,
  strokes,
  previewStroke,
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

    // Renderiza siempre desde datos persistidos para reconstruir la capa en orden.
    for (const stroke of layerStrokes) {
      drawStroke(context, stroke);
    }

    if (previewStroke?.layer_type === layerType) {
      drawStroke(context, previewStroke);
    }
  }, [height, layerStrokes, layerType, previewStroke, width]);

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
