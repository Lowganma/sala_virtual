import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type {
  CanvasStroke,
  DrawingLayerType,
  DrawingSettings,
  StrokePoint,
} from "./drawingTypes";

type StrokeRow = Omit<CanvasStroke, "size" | "opacity" | "points"> & {
  size: number | string;
  opacity: number | string;
  points: unknown;
};

function isStrokePoint(value: unknown): value is StrokePoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Partial<StrokePoint>;

  return typeof point.x === "number" && typeof point.y === "number";
}

function normalizeStroke(row: StrokeRow): CanvasStroke {
  const points = Array.isArray(row.points)
    ? row.points.filter(isStrokePoint)
    : [];

  return {
    ...row,
    size: Number(row.size),
    opacity: Number(row.opacity),
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

      const { data, error } = await supabase
        .from("canvas_strokes")
        .insert({
          room_id: roomId,
          layer_type: settings.layerType,
          tool: settings.tool,
          color: settings.color,
          size: settings.size,
          opacity: settings.tool === "pencil" ? 1 : settings.opacity,
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
    clearLayer,
  };
}
