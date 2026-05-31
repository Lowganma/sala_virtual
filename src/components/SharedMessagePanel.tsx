type SharedMessagePanelProps = {
  sharedMessage: string;
  saving: boolean;
  canUseRoomState: boolean;
  onSharedMessageChange: (value: string) => void;
  onSaveMessage: () => void;
};

export function SharedMessagePanel({
  sharedMessage,
  saving,
  canUseRoomState,
  onSharedMessageChange,
  onSaveMessage,
}: SharedMessagePanelProps) {
  return (
    <>
      <hr />

      <label>Mensaje compartido</label>

      <input
        value={sharedMessage}
        onChange={(event) => onSharedMessageChange(event.target.value)}
        placeholder="Escribe un mensaje para la sala..."
        disabled={!canUseRoomState}
      />

      <button onClick={onSaveMessage} disabled={saving || !canUseRoomState}>
        {saving ? "Guardando..." : "Guardar mensaje"}
      </button>

      <div className="shared-box">
        <p className="preview-title">Todos deberían ver:</p>
        <p>{sharedMessage || "Todavía no hay mensaje compartido."}</p>
      </div>
    </>
  );
}