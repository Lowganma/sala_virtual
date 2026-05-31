export type DrawingTool = "pan" | "pencil" | "brush" | "eraser";

export type DrawingLayerType = "background" | "overlay";

export type StrokePoint = {
  x: number;
  y: number;
};

export type CanvasStroke = {
  id: string;
  room_id: string;
  layer_type: DrawingLayerType;
  tool: Exclude<DrawingTool, "pan">;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
  created_at: string;
};

export type DrawingSettings = {
  tool: DrawingTool;
  layerType: DrawingLayerType;
  color: string;
  size: number;
  opacity: number;
};

export const DEFAULT_DRAWING_SETTINGS: DrawingSettings = {
  tool: "pan",
  layerType: "background",
  color: "#ffffff",
  size: 4,
  opacity: 1,
};
