import type { CanvasImageLayer } from "./canvasTypes";

type CanvasLayerRow = {
  id: string;
  room_id?: string;
  type: "image" | "gif";
  src: string;
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
  z_index: number | string;
  created_at?: string;
  updated_at?: string;
};

export function normalizeCanvasLayer(layer: CanvasLayerRow): CanvasImageLayer {
  return {
    id: layer.id,
    room_id: layer.room_id,
    type: layer.type,
    src: layer.src,
    x: Number(layer.x),
    y: Number(layer.y),
    w: Number(layer.w),
    h: Number(layer.h),
    z: Number(layer.z_index),
    z_index: Number(layer.z_index),
    created_at: layer.created_at,
    updated_at: layer.updated_at,
  };
}
