import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Position = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type FloatingWindowProps = {
  title: string;
  className?: string;
  position: Position;
  size: Size;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (nextPosition: Position) => void;
  onSizeChange: (nextSize: Size) => void;
  children: ReactNode;
};

export function FloatingWindow({
  title,
  className = "",
  position,
  size,
  isSelected,
  onSelect,
  onPositionChange,
  onSizeChange,
  children,
}: FloatingWindowProps) {
  const [localPosition, setLocalPosition] = useState(position);
  const [localSize, setLocalSize] = useState(size);

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

  useEffect(() => {
    if (dragStart) {
      return;
    }

    setLocalPosition(position);
  }, [position, dragStart]);

  useEffect(() => {
    if (resizeStart) {
      return;
    }

    setLocalSize(size);
  }, [size, resizeStart]);

  useEffect(() => {
    if (!dragStart) {
      return;
    }

    let latestPosition = {
      x: dragStart.windowX,
      y: dragStart.windowY,
    };

    function handleWindowMouseMove(event: MouseEvent) {
      event.preventDefault();

      const deltaX = event.clientX - dragStart.mouseX;
      const deltaY = event.clientY - dragStart.mouseY;

      latestPosition = {
        x: dragStart.windowX + deltaX,
        y: dragStart.windowY + deltaY,
      };

      setLocalPosition(latestPosition);
    }

    function handleWindowMouseUp() {
      setDragStart(null);
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

    let latestSize = {
      width: resizeStart.width,
      height: resizeStart.height,
    };

    function handleWindowMouseMove(event: MouseEvent) {
      event.preventDefault();

      const deltaX = event.clientX - resizeStart.mouseX;
      const deltaY = event.clientY - resizeStart.mouseY;

      latestSize = {
        width: Math.max(180, resizeStart.width + deltaX),
        height: Math.max(120, resizeStart.height + deltaY),
      };

      setLocalSize(latestSize);
    }

    function handleWindowMouseUp() {
      setResizeStart(null);
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

  function handleHeaderMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    onSelect();

    setDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      windowX: localPosition.x,
      windowY: localPosition.y,
    });
  }

  function handleResizeMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    onSelect();

    setResizeStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      width: localSize.width,
      height: localSize.height,
    });
  }

  return (
    <section
      className={
        isSelected
          ? `floating-window selected ${className}`
          : `floating-window ${className}`
      }
      style={{
        left: localPosition.x,
        top: localPosition.y,
        width: localSize.width,
        height: localSize.height,
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <header
        className="floating-window-header"
        onMouseDown={handleHeaderMouseDown}
      >
        <span>{title}</span>
      </header>

      <div className="floating-window-body">{children}</div>

      {isSelected && (
        <button
          className="window-resize-handle"
          onMouseDown={handleResizeMouseDown}
          aria-label="Redimensionar ventana"
        />
      )}
    </section>
  );
}