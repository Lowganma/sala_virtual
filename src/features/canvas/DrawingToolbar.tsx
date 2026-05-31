import type { DrawingLayerType, DrawingSettings, DrawingTool } from "./drawingTypes";

type DrawingToolbarProps = {
  settings: DrawingSettings;
  isLoading?: boolean;
  onSettingsChange: (settings: DrawingSettings) => void;
  onClearLayer?: (layerType: DrawingLayerType) => void;
};

const TOOL_LABELS: Array<{ tool: DrawingTool; label: string; title: string }> = [
  { tool: "pan", label: "✋", title: "Pan / Mano" },
  { tool: "pencil", label: "✏️", title: "Lápiz" },
  { tool: "brush", label: "🖌️", title: "Pincel" },
  { tool: "eraser", label: "⌫", title: "Borrador" },
];

export function DrawingToolbar({
  settings,
  isLoading = false,
  onSettingsChange,
  onClearLayer,
}: DrawingToolbarProps) {
  function updateSettings(partialSettings: Partial<DrawingSettings>) {
    onSettingsChange({
      ...settings,
      ...partialSettings,
    });
  }

  return (
    <div
      className="drawing-toolbar"
      onMouseDown={(event) => event.stopPropagation()}
      aria-label="Herramientas de dibujo"
    >
      <div className="drawing-tool-buttons">
        {TOOL_LABELS.map(({ tool, label, title }) => (
          <button
            key={tool}
            type="button"
            className={settings.tool === tool ? "active" : ""}
            onClick={() => updateSettings({ tool })}
            title={title}
            aria-label={title}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="drawing-field drawing-layer-field">
        <span>Capa</span>
        <select
          value={settings.layerType}
          onChange={(event) =>
            updateSettings({ layerType: event.target.value as DrawingLayerType })
          }
        >
          <option value="background">Fondo</option>
          <option value="overlay">Encima</option>
        </select>
      </label>

      <label className="drawing-field drawing-color-field">
        <span>Color</span>
        <input
          type="color"
          value={settings.color}
          disabled={settings.tool === "eraser"}
          onChange={(event) => updateSettings({ color: event.target.value })}
        />
      </label>

      <label className="drawing-field">
        <span>Tamaño {settings.size}px</span>
        <input
          type="range"
          min="1"
          max="64"
          step="1"
          value={settings.size}
          onChange={(event) => updateSettings({ size: Number(event.target.value) })}
        />
      </label>

      <label className="drawing-field">
        <span>Opacidad {Math.round(settings.opacity * 100)}%</span>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={settings.opacity}
          disabled={settings.tool === "pencil" || settings.tool === "eraser"}
          onChange={(event) =>
            updateSettings({ opacity: Number(event.target.value) })
          }
        />
      </label>

      {onClearLayer && (
        <button
          type="button"
          className="drawing-clear-button"
          disabled={isLoading}
          onClick={() => onClearLayer(settings.layerType)}
        >
          Limpiar capa
        </button>
      )}
    </div>
  );
}
