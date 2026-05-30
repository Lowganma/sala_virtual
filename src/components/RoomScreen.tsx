import type { RefObject } from "react";
import type { Room, RoomState } from "../types/room";
import { YouTubePlayer } from "./YouTubePlayer";
import type { YouTubePlayerHandle } from "./YouTubePlayer";

type RoomScreenProps = {
  room: Room;
  roomState: RoomState | null;
  username: string;
  sharedMessage: string;
  youtubeUrl: string;
  isPlaying: boolean;
  playbackSeconds: number;
  playbackUpdatedAt: string;
  saving: boolean;
  savingYoutube: boolean;
  syncingPlayback: boolean;
  youtubePlayerRef: RefObject<YouTubePlayerHandle | null>;
  onSharedMessageChange: (value: string) => void;
  onYoutubeUrlChange: (value: string) => void;
  onSaveMessage: () => void;
  onSaveYoutubeUrl: () => void;
  onPlayForEveryone: () => void;
  onPauseForEveryone: () => void;
  onSyncToStart: () => void;
  onLeaveRoom: () => void;
};


export function RoomScreen({
  room,
  roomState,
  username,
  sharedMessage,
  youtubeUrl,
  isPlaying,
  playbackSeconds,
  playbackUpdatedAt,
  saving,
  savingYoutube,
  syncingPlayback,
  youtubePlayerRef,
  onSharedMessageChange,
  onYoutubeUrlChange,
  onSaveMessage,
  onSaveYoutubeUrl,
  onPlayForEveryone,
  onPauseForEveryone,
  onSyncToStart,
  onLeaveRoom,
}: RoomScreenProps) {

  return (
    <section className="card">
      <h1>Sala: {room.code}</h1>

      <p>
        Comparte este código con otra persona:
        <strong> {room.code}</strong>
      </p>

      <p>
        Usuario actual:
        <strong> {username || "Invitado"}</strong>
      </p>

      <hr />

      <label>Mensaje compartido</label>

      <input
        value={sharedMessage}
        onChange={(event) => onSharedMessageChange(event.target.value)}
        placeholder="Escribe un mensaje para la sala..."
        disabled={!roomState}
      />

      <button onClick={onSaveMessage} disabled={saving || !roomState}>
        {saving ? "Guardando..." : "Guardar mensaje"}
      </button>

      <div className="shared-box">
        <p className="preview-title">Todos deberían ver:</p>
        <p>{sharedMessage || "Todavía no hay mensaje compartido."}</p>
      </div>

      <hr />

      <label>Música de YouTube</label>

      <input
        value={youtubeUrl}
        onChange={(event) => onYoutubeUrlChange(event.target.value)}
        placeholder="Pega un enlace de YouTube..."
        disabled={!roomState}
      />

      <button onClick={onSaveYoutubeUrl} disabled={savingYoutube || !roomState}>
        {savingYoutube ? "Guardando música..." : "Guardar música"}
      </button>

      <div className="shared-box">
        <p className="preview-title">Video compartido:</p>

        <YouTubePlayer
          ref={youtubePlayerRef}
          youtubeUrl={youtubeUrl}
          isPlaying={isPlaying}
          playbackSeconds={playbackSeconds}
          playbackUpdatedAt={playbackUpdatedAt}
        />

        <div className="player-controls">
          <button onClick={onPlayForEveryone} disabled={syncingPlayback || !roomState}>
            Reproducir para todos
          </button>

          <button onClick={onPauseForEveryone} disabled={syncingPlayback || !roomState}>
            Pausar para todos
          </button>

          <button onClick={onSyncToStart} disabled={syncingPlayback || !roomState}>
            Reiniciar para todos
          </button>
        </div>
      </div>

      <button className="secondary" onClick={onLeaveRoom}>
        Salir de la sala
      </button>
    </section>
  );
}