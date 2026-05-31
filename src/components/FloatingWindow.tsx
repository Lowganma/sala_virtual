import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Position = {
  x: number;
  y: number;
};

type FloatingWindowProps = {
  title: string;
  className?: string;
  position: Position;
  onPositionChange: (nextPosition: Position) => void;
  children: ReactNode;
};

export function FloatingWindow({
  title,
  className = "",
  position,
  onPositionChange,
  children,
}: FloatingWindowProps) {
  const [localPosition, setLocalPosition] = useState(position);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    windowX: number;
    windowY: number;
  } | null>(null);

  useEffect(() => {
    if (dragStart) {
      return;
    }

    setLocalPosition(position);
  }, [position, dragStart]);

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    setDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      windowX: localPosition.x,
      windowY: localPosition.y,
    });
  }

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    if (!dragStart) {
      return;
    }

    const deltaX = event.clientX - dragStart.mouseX;
    const deltaY = event.clientY - dragStart.mouseY;

    setLocalPosition({
      x: dragStart.windowX + deltaX,
      y: dragStart.windowY + deltaY,
    });
  }

  function finishDrag() {
    if (!dragStart) {
      return;
    }

    setDragStart(null);
    onPositionChange(localPosition);
  }

  return (
    <section
      className={`floating-window ${className}`}
      style={{
        left: localPosition.x,
        top: localPosition.y,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={finishDrag}
      onMouseLeave={finishDrag}
    >
      <header
        className="floating-window-header"
        onMouseDown={handleMouseDown}
      >
        <span>{title}</span>
      </header>

      <div className="floating-window-body">{children}</div>
    </section>
  );
}