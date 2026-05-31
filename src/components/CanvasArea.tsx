import type { ReactNode } from "react";
import { CanvasViewport } from "../features/canvas/CanvasViewport";

type CanvasAreaProps = {
  roomId: string;
  children?: ReactNode;
  onPasteImage?: (payload: {
    src: string;
    type: "image" | "gif";
    x: number;
    y: number;
    file?: File;
  }) => void;
  onCanvasMouseDown?: () => void;
};

export function CanvasArea({
  roomId,
  children,
  onPasteImage,
  onCanvasMouseDown,
}: CanvasAreaProps) {
  return (
    <CanvasViewport
      roomId={roomId}
      onPasteImage={onPasteImage}
      onCanvasMouseDown={onCanvasMouseDown}
    >
      {children}
    </CanvasViewport>
  );
}