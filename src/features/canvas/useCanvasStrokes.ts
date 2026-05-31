import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type {
  CanvasStroke,
  DrawingLayerType,
  DrawingSettings,
  StrokePoint,
} from "./drawingTypes";

type StrokeRow = Omit<
  CanvasStroke,
  | "size"
  | "opacity"
  | "brush_intensity"
  | "brush_softness"
  | "brush_smoothing"
  | "points"
> & {
  size: number | string;
  opacity: number | string;
  brush_intensity?: number | string | null;
  brush_softness?: number | string | null;
  brush_smoothing?: number | string | null;
  points: unknown;
};

function isStrokePoint(value: unknown): value is StrokePoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Partial<StrokePoint>;

  return typeof point.x === "number" && typeof point.y === "number";
}

function numberOrDefault(value: number | string | null | undefined, fallback: number) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeStroke(row: StrokeRow): CanvasStroke {
  const points = Array.isArray(row.points)
    ? row.points.filter(isStrokePoint)
    : [];

  return {
    ...row,
    size: numberOrDefault(row.size, 4),
    opacity: numberOrDefault(row.opacity, 1),
    brush_intensity: numberOrDefault(row.brush_intensity, 1),
    brush_softness: numberOrDefault(row.brush_softness, 0.25),
    brush_smoothing: numberOrDefault(row.brush_smoothing, 0.35),
    points,
  };
}

export function useCanvasStrokes(roomId: string) {
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [isLoadingStrokes, setIsLoadingStrokes] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStrokes() {
      setIsLoadingStrokes(true);

      const { data, error } = await supabase
        .from("canvas_strokes")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
      }

      if (isMounted) {
        setStrokes(data ? data.map((row) => normalizeStroke(row as StrokeRow)) : []);
        setIsLoadingStrokes(false);
      }
    }

    void loadStrokes();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    const channel = supabase
      .channel(`canvas-strokes-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "canvas_strokes",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const nextStroke = normalizeStroke(payload.new as StrokeRow);

          setStrokes((currentStrokes) => {
            if (currentStrokes.some((stroke) => stroke.id === nextStroke.id)) {
              return currentStrokes;
            }

            return [...currentStrokes, nextStroke];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "canvas_strokes",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const deletedStroke = payload.old as { id?: string };

          if (!deletedStroke.id) {
            return;
          }

          setStrokes((currentStrokes) =>
            currentStrokes.filter((stroke) => stroke.id !== deletedStroke.id)
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const addStroke = useCallback(
    async (settings: DrawingSettings, points: StrokePoint[]) => {
      if (settings.tool === "pan" || points.length < 2) {
        return;
      }

      const isBrush = settings.tool === "brush";
      const { data, error } = await supabase
        .from("canvas_strokes")
        .insert({
          room_id: roomId,
          layer_type: settings.layerType,
          tool: settings.tool,
          color: settings.color,
          size: settings.size,
          opacity: settings.tool === "pencil" ? 1 : settings.opacity,
          brush_intensity: isBrush ? settings.brushIntensity : 1,
          brush_softness: isBrush ? settings.brushSoftness : 0,
          brush_smoothing: isBrush ? settings.brushSmoothing : 0,
          points,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        const savedStroke = normalizeStroke(data as StrokeRow);

        setStrokes((currentStrokes) => {
          if (currentStrokes.some((stroke) => stroke.id === savedStroke.id)) {
            return currentStrokes;
          }

          return [...currentStrokes, savedStroke];
        });
      }
    },
    [roomId]
  );

  const deleteStroke = useCallback(async (strokeId: string) => {
    setStrokes((currentStrokes) =>
      currentStrokes.filter((stroke) => stroke.id !== strokeId)
    );

    const { error } = await supabase
      .from("canvas_strokes")
      .delete()
      .eq("id", strokeId);

    if (error) {
      console.error(error);
    }
  }, []);

  const undoLastStroke = useCallback(
    async (layerType?: DrawingLayerType) => {
      const candidates = layerType
        ? strokes.filter((stroke) => stroke.layer_type === layerType)
        : strokes;
      const lastStroke = candidates.at(-1);

      if (!lastStroke) {
        return;
      }

      await deleteStroke(lastStroke.id);
    },
    [deleteStroke, strokes]
  );

  const clearLayer = useCallback(
    async (layerType: DrawingLayerType) => {
      setStrokes((currentStrokes) =>
        currentStrokes.filter((stroke) => stroke.layer_type !== layerType)
      );

      const { error } = await supabase
        .from("canvas_strokes")
        .delete()
        .eq("room_id", roomId)
        .eq("layer_type", layerType);

      if (error) {
        console.error(error);
      }
    },
    [roomId]
  );

  return {
    strokes,
    isLoadingStrokes,
    addStroke,
    undoLastStroke,
    clearLayer,
  };
}
