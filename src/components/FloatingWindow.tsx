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

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    setDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      windowX: localPosition.x,
      windowY: localPosition.y,
    });
  }

  return (
    <section
      className={`floating-window ${className}`}
      style={{
        left: localPosition.x,
        top: localPosition.y,
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className="floating-window-header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
      </header>

      <div className="floating-window-body">{children}</div>
    </section>
  );
}