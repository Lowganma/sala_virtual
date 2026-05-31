import type { RefObject } from "react";
import type { Room, RoomMessage, RoomState } from "../types/room";
import type { YouTubePlayerHandle } from "./YouTubePlayer";
import { CanvasArea } from "./CanvasArea";
import { MusicPanel } from "./MusicPanel";
import { ChatPanel } from "./ChatPanel";

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
  chatMessages: RoomMessage[];
  chatInput: string;
  sendingChatMessage: boolean;
  onChatInputChange: (value: string) => void;
  onSendChatMessage: () => void;
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
  chatMessages,
  chatInput,
  sendingChatMessage,
  onChatInputChange,
  onSendChatMessage,
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
    <main className="room-layout">
    <CanvasArea />

    <aside className="room-sidebar">
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

      

      <MusicPanel
  youtubePlayerRef={youtubePlayerRef}
  youtubeUrl={youtubeUrl}
  isPlaying={isPlaying}
  playbackSeconds={playbackSeconds}
  playbackUpdatedAt={playbackUpdatedAt}
  savingYoutube={savingYoutube}
  syncingPlayback={syncingPlayback}
  canUseRoomState={Boolean(roomState)}
  onYoutubeUrlChange={onYoutubeUrlChange}
  onSaveYoutubeUrl={onSaveYoutubeUrl}
  onPlayForEveryone={onPlayForEveryone}
  onPauseForEveryone={onPauseForEveryone}
  onSyncToStart={onSyncToStart}
/>

            <ChatPanel
        chatMessages={chatMessages}
        chatInput={chatInput}
        sendingChatMessage={sendingChatMessage}
        onChatInputChange={onChatInputChange}
        onSendChatMessage={onSendChatMessage}
      />

           <button className="secondary" onClick={onLeaveRoom}>
        Salir de la sala
      </button>
    </section>
  </aside>
</main>
);
}