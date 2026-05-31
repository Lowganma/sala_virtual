import type { RefObject } from "react";
import type { Room, RoomMessage, RoomState } from "../types/room";
import type { YouTubePlayerHandle } from "./YouTubePlayer";
import { CanvasArea } from "./CanvasArea";
import { RoomSidebar } from "./RoomSidebar";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { SharedMessagePanel } from "./SharedMessagePanel";
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

    <RoomSidebar>
      <RoomInfoPanel room={room} username={username} />

      <SharedMessagePanel
        sharedMessage={sharedMessage}
        saving={saving}
        canUseRoomState={Boolean(roomState)}
        onSharedMessageChange={onSharedMessageChange}
        onSaveMessage={onSaveMessage}
      />

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
    </RoomSidebar>
  </main>
);
}