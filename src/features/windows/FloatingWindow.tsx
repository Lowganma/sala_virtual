import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LayerControls } from "../layers/LayerControls";
import type { WindowPosition, WindowSize } from "./windowTypes";

type FloatingWindowProps = {
  title: string;
  className?: string;
  position: WindowPosition;
  size: WindowSize;
  isSelected: boolean;
  zIndex: number;
  layerIndex: number;
  layerCount: number;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onSelect: () => void;
  onPositionChange: (nextPosition: WindowPosition) => void;
  onSizeChange: (nextSize: WindowSize) => void;
  children: ReactNode;
};

export function FloatingWindow({
  title,
  className = "",
  position,
  size,
  isSelected,
  zIndex,
  layerIndex,
  layerCount,
  canMoveBackward,
  canMoveForward,
  onMoveBackward,
  onMoveForward,
  onSelect,
  onPositionChange,
  onSizeChange,
  children,
}: FloatingWindowProps) {
  const [dragPosition, setDragPosition] = useState<WindowPosition | null>(null);
  const [resizeSize, setResizeSize] = useState<WindowSize | null>(null);

  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    windowX: number;
    windowY: number;
  } | null>(null);

  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
  } | null>(null);

  const localPosition = useMemo(
    () => dragPosition ?? position,
    [dragPosition, position]
  );
  const localSize = useMemo(() => resizeSize ?? size, [resizeSize, size]);

  useEffect(() => {
    if (!dragStart) {
      return;
    }

    const currentDragStart = dragStart as NonNullable<typeof dragStart>;

    let latestPosition = {
      x: currentDragStart.windowX,
      y: currentDragStart.windowY,
    };

    function handleWindowMouseMove(event: MouseEvent) {
      event.preventDefault();

      const deltaX = event.clientX - currentDragStart.mouseX;
      const deltaY = event.clientY - currentDragStart.mouseY;

      latestPosition = {
        x: currentDragStart.windowX + deltaX,
        y: currentDragStart.windowY + deltaY,
      };

      setDragPosition(latestPosition);
    }

    function handleWindowMouseUp() {
      setDragStart(null);
      setDragPosition(null);
      onPositionChange(latestPosition);
      document.body.classList.remove("is-dragging-window");
    }

    document.body.classList.add("is-dragging-window");

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      document.body.classList.remove("is-dragging-window");
    };
  }, [dragStart, onPositionChange]);

  useEffect(() => {
    if (!resizeStart) {
      return;
    }

    const currentResizeStart = resizeStart as NonNullable<typeof resizeStart>;

    let latestSize = {
      width: currentResizeStart.width,
      height: currentResizeStart.height,
    };

    function handleWindowMouseMove(event: MouseEvent) {
      event.preventDefault();

      const deltaX = event.clientX - currentResizeStart.mouseX;
      const deltaY = event.clientY - currentResizeStart.mouseY;

      latestSize = {
        width: Math.max(180, currentResizeStart.width + deltaX),
        height: Math.max(120, currentResizeStart.height + deltaY),
      };

      setResizeSize(latestSize);
    }

    function handleWindowMouseUp() {
      setResizeStart(null);
      setResizeSize(null);
      onSizeChange(latestSize);
      document.body.classList.remove("is-dragging-window");
    }

    document.body.classList.add("is-dragging-window");

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      document.body.classList.remove("is-dragging-window");
    };
  }, [resizeStart, onSizeChange]);

  return (
    <section
      className={`floating-window ${className} ${isSelected ? "selected" : ""}`}
      style={{
        left: localPosition.x,
        top: localPosition.y,
        width: localSize.width,
        height: localSize.height,
        zIndex,
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <header
        className="floating-window-header"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
          setDragStart({
            mouseX: event.clientX,
            mouseY: event.clientY,
            windowX: localPosition.x,
            windowY: localPosition.y,
          });
        }}
      >
        <strong>{title}</strong>
        {isSelected && (
          <LayerControls
            label="Ventana"
            layerIndex={layerIndex}
            layerCount={layerCount}
            canMoveBackward={canMoveBackward}
            canMoveForward={canMoveForward}
            onMoveBackward={onMoveBackward}
            onMoveForward={onMoveForward}
          />
        )}
        <span>⋮</span>
      </header>

      <div className="floating-window-body">{children}</div>

      <button
        className="window-resize-handle"
        aria-label="Redimensionar ventana"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
          setResizeStart({
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: localSize.width,
            height: localSize.height,
          });
        }}
      />
    </section>
  );
}
