type LayerControlsProps = {
  label: string;
  layerIndex: number;
  layerCount: number;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onMoveBackward: () => void;
  onMoveForward: () => void;
};

export function LayerControls({
  label,
  layerIndex,
  layerCount,
  canMoveBackward,
  canMoveForward,
  onMoveBackward,
  onMoveForward,
}: LayerControlsProps) {
  return (
    <div
      className="layer-controls"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="layer-badge"
        type="button"
        title={`${label}: ${layerIndex}/${layerCount}`}
      >
        {label} {layerIndex}/{layerCount}
      </button>

      <button
        className="layer-button"
        type="button"
        onClick={onMoveBackward}
        disabled={!canMoveBackward}
        title="Mover una capa hacia atrás"
      >
        ◀
      </button>

      <button
        className="layer-button"
        type="button"
        onClick={onMoveForward}
        disabled={!canMoveForward}
        title="Mover una capa hacia adelante"
      >
        ▶
      </button>
    </div>
  );
}
