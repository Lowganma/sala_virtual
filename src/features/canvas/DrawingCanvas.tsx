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

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Pick<
    CanvasStroke,
    "tool" | "color" | "size" | "opacity" | "points" | "layer_type"
  >
) {
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
    context.globalAlpha = stroke.tool === "brush" ? stroke.opacity : 1;
    context.strokeStyle = stroke.color;
  }

  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (const point of stroke.points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

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
      drawStroke(context, {
        layer_type: layerType,
        tool: settings.tool,
        color: settings.color,
        size: settings.size,
        opacity: settings.tool === "pencil" ? 1 : settings.opacity,
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
