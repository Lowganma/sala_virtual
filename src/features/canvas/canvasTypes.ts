export type Tool = "select" | "hand" | "pencil" | "brush" | "eraser";

export type CanvasView = {
  zoom: number;
  panX: number;
  panY: number;
};

export type CanvasDocument = {
  roomId: string;
  worldWidth: number;
  worldHeight: number;
  wallColor: string;
};