import { useState } from "react";
import type { CanvasImageLayer as CanvasImageLayerType } from "./canvasTypes";

type CanvasImageLayerProps = {
  layer: CanvasImageLayerType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, nextPosition: { x: number; y: number }) => void;
  onResize: (id: string, nextSize: { w: number; h: number }) => void;
};

export function CanvasImageLayer({
  layer,
  isSelected,
  onSelect,
  onMove,
  onResize,
}: CanvasImageLayerProps) {
  const [hasImageError, setHasImageError] = useState(false);

  function startMove(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    onSelect(layer.id);

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startX = layer.x;
    const startY = layer.y;

    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      onMove(layer.id, {
        x: startX + deltaX,
        y: startY + deltaY,
      });
    }

    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("is-dragging-window");
    }

    document.body.classList.add("is-dragging-window");

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function startResize(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    onSelect(layer.id);

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startW = layer.w;
    const startH = layer.h;

    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      onResize(layer.id, {
        w: Math.max(80, startW + deltaX),
        h: Math.max(80, startH + deltaY),
      });
    }

    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("is-dragging-window");
    }

    document.body.classList.add("is-dragging-window");

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div
      className={isSelected ? "canvas-layer selected" : "canvas-layer"}
      style={{
        left: layer.x,
        top: layer.y,
        width: layer.w,
        height: layer.h,
        zIndex: layer.z,
      }}
      onMouseDown={startMove}
      title={layer.src}
    >
      {hasImageError ? (
        <div className="canvas-layer-error">
          <strong>Imagen no disponible</strong>
          <span>Selecciona y presiona Supr para eliminarla.</span>
        </div>
      ) : (
        <img
          src={layer.src}
          draggable={false}
          alt=""
          onError={() => setHasImageError(true)}
        />
      )}

      {isSelected && (
        <button
          className="resize-handle"
          onMouseDown={startResize}
          aria-label="Redimensionar"
        />
      )}
    </div>
  );
}