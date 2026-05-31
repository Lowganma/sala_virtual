import type { ReactNode } from "react";
import { CanvasViewport } from "../features/canvas/CanvasViewport";

type CanvasAreaProps = {
  children?: ReactNode;
};

export function CanvasArea({ children }: CanvasAreaProps) {
  return <CanvasViewport activeTool="hand">{children}</CanvasViewport>;
}