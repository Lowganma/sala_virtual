export type DrawingTool = "pan" | "pencil" | "brush" | "eraser";

export type DrawingLayerType = "background" | "overlay";

export type StrokePoint = {
  x: number;
  y: number;
  brushIntensity?: number;
  brushSoftness?: number;
  brushSmoothing?: number;
};

export type CanvasStroke = {
  id: string;
  room_id: string;
  layer_type: DrawingLayerType;
  tool: Exclude<DrawingTool, "pan">;
  color: string;
  size: number;
  opacity: number;
  brush_intensity: number;
  brush_softness: number;
  brush_smoothing: number;
  points: StrokePoint[];
  created_at: string;
};

export type DrawingStrokeDraft = Pick<
  CanvasStroke,
  | "layer_type"
  | "tool"
  | "color"
  | "size"
  | "opacity"
  | "brush_intensity"
  | "brush_softness"
  | "brush_smoothing"
  | "points"
>;

export type DrawingSettings = {
  tool: DrawingTool;
  layerType: DrawingLayerType;
  color: string;
  size: number;
  opacity: number;
  brushIntensity: number;
  brushSoftness: number;
  brushSmoothing: number;
};

export const DEFAULT_DRAWING_SETTINGS: DrawingSettings = {
  tool: "pan",
  layerType: "background",
  color: "#ffffff",
  size: 4,
  opacity: 1,
  brushIntensity: 1,
  brushSoftness: 0.25,
  brushSmoothing: 0.35,
};
