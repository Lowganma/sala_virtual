import { useState } from "react";
import type { CanvasViewportControls } from "../features/canvas/CanvasViewport";

type CanvasSidebarItem = {
  key: string;
  label: string;
  isMinimized: boolean;
};

type CanvasSidebarProps = {
  items: CanvasSidebarItem[];
  viewportControls?: CanvasViewportControls | null;
  onToggleItem: (key: string) => void;
};

export function CanvasSidebar({
  items,
  viewportControls,
  onToggleItem,
}: CanvasSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={isCollapsed ? "canvas-sidebar is-collapsed" : "canvas-sidebar"}
    >
      <button
        type="button"
        className="canvas-sidebar-main-button"
        onClick={() => setIsCollapsed((currentValue) => !currentValue)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
        title={isCollapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
      >
        ☰
      </button>

      {!isCollapsed && (
        <div className="canvas-sidebar-menu">
          <p className="canvas-sidebar-title">Vista</p>

          {viewportControls && (
            <div className="canvas-zoom-controls" aria-label="Zoom del canvas">
              <button type="button" onClick={viewportControls.zoomOut}>
                −
              </button>
              <span>{Math.round(viewportControls.zoom * 100)}%</span>
              <button type="button" onClick={viewportControls.zoomIn}>
                +
              </button>
              <button type="button" onClick={viewportControls.resetView}>
                Reset
              </button>
            </div>
          )}

          <hr />

          <p className="canvas-sidebar-title">Módulos</p>

          {items.map((item) => (
            <button
              key={item.key}
              className={
                item.isMinimized ? "module-button minimized" : "module-button"
              }
              onClick={() => onToggleItem(item.key)}
            >
              {item.isMinimized
                ? `Mostrar ${item.label}`
                : `Ocultar ${item.label}`}
            </button>
          ))}

          <hr />

          <button type="button" className="module-button" disabled>
            + Imagen
          </button>

          <button type="button" className="module-button" disabled>
            + GIF
          </button>

          <button type="button" className="module-button" disabled>
            + Texto
          </button>
        </div>
      )}
    </aside>
  );
}
