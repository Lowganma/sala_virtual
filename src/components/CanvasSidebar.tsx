type CanvasSidebarItem = {
  key: string;
  label: string;
  isMinimized: boolean;
};

type CanvasSidebarProps = {
  items: CanvasSidebarItem[];
  onToggleItem: (key: string) => void;
};

export function CanvasSidebar({ items, onToggleItem }: CanvasSidebarProps) {
  return (
    <aside className="canvas-sidebar">
      <button className="canvas-sidebar-main-button">☰</button>

      <div className="canvas-sidebar-menu">
        <p className="canvas-sidebar-title">Módulos</p>

        {items.map((item) => (
          <button
            key={item.key}
            className={item.isMinimized ? "module-button minimized" : "module-button"}
            onClick={() => onToggleItem(item.key)}
          >
            {item.isMinimized ? `Mostrar ${item.label}` : `Ocultar ${item.label}`}
          </button>
        ))}

        <hr />

        <button className="module-button" disabled>
          + Imagen
        </button>

        <button className="module-button" disabled>
          + GIF
        </button>

        <button className="module-button" disabled>
          + Texto
        </button>
      </div>
    </aside>
  );
}