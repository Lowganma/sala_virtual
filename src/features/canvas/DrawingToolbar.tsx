import { useState } from "react";
import type {
  DrawingLayerType,
  DrawingSettings,
  DrawingTool,
} from "./drawingTypes";

type DrawingToolbarProps = {
  settings: DrawingSettings;
  isLoading?: boolean;
  onSettingsChange: (settings: DrawingSettings) => void;
  onUndoStroke?: () => void;
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
  onUndoStroke,
  onClearLayer,
}: DrawingToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isBrush = settings.tool === "brush";

  function updateSettings(partialSettings: Partial<DrawingSettings>) {
    onSettingsChange({
      ...settings,
      ...partialSettings,
    });
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        className="drawing-toolbar-toggle"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setIsCollapsed(false)}
        aria-label="Mostrar herramientas de dibujo"
        title="Mostrar herramientas de dibujo"
      >
        ✏️ Dibujo
      </button>
    );
  }

  return (
    <div
      className="drawing-toolbar"
      onMouseDown={(event) => event.stopPropagation()}
      aria-label="Herramientas de dibujo"
    >
      <button
        type="button"
        className="drawing-toolbar-collapse-button"
        onClick={() => setIsCollapsed(true)}
        aria-label="Ocultar herramientas de dibujo"
        title="Ocultar herramientas de dibujo"
      >
        −
      </button>

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

      <label className="drawing-field brush-field">
        <span>Intensidad {Math.round(settings.brushIntensity * 100)}%</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={settings.brushIntensity}
          disabled={!isBrush}
          onChange={(event) =>
            updateSettings({ brushIntensity: Number(event.target.value) })
          }
        />
      </label>

      <label className="drawing-field brush-field">
        <span>Suavidad {Math.round(settings.brushSoftness * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.brushSoftness}
          disabled={!isBrush}
          onChange={(event) =>
            updateSettings({ brushSoftness: Number(event.target.value) })
          }
        />
      </label>

      <label className="drawing-field brush-field">
        <span>Suavizado {Math.round(settings.brushSmoothing * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.brushSmoothing}
          disabled={!isBrush}
          onChange={(event) =>
            updateSettings({ brushSmoothing: Number(event.target.value) })
          }
        />
      </label>

      {onUndoStroke && (
        <button
          type="button"
          className="drawing-undo-button"
          onClick={onUndoStroke}
          title="Deshacer último trazo de la capa activa (Ctrl+Z)"
        >
          Deshacer
        </button>
      )}

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
