import type { RefObject } from "react";
import type { Room, RoomMessage, RoomState, RoomWindow } from "../types/room";
import type { YouTubePlayerHandle } from "./YouTubePlayer";
import { CanvasArea } from "./CanvasArea";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { MusicPanel } from "./MusicPanel";
import { ChatPanel } from "./ChatPanel";
import { FloatingWindow } from "./FloatingWindow";
import { CanvasSidebar } from "./CanvasSidebar";

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
  roomWindows: RoomWindow[];
  onWindowPositionChange: (
  windowKey: string,
  nextPosition: { x: number; y: number }
) => void;
  onWindowMinimizedChange: (
  windowKey: string,
  nextIsMinimized: boolean
) => void;
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
  roomWindows,
  onWindowPositionChange,
  onWindowMinimizedChange,
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

  function getWindowPosition(
  windowKey: string,
  fallback: { x: number; y: number }
) {
  const savedWindow = roomWindows.find(
    (roomWindow) => roomWindow.window_key === windowKey
  );

  if (!savedWindow) {
    return fallback;
  }

  return {
    x: Number(savedWindow.x),
    y: Number(savedWindow.y),
  };
}

  function getWindowIsMinimized(windowKey: string) {
  const savedWindow = roomWindows.find(
    (roomWindow) => roomWindow.window_key === windowKey
  );

  return Boolean(savedWindow?.is_minimized);
}

function toggleWindow(windowKey: string) {
  const currentValue = getWindowIsMinimized(windowKey);
  onWindowMinimizedChange(windowKey, !currentValue);
}

  return (
  <main className="room-layout">
    <CanvasArea>
      {!getWindowIsMinimized("room-info") && (
        <FloatingWindow
          title="Sala"
          className="room-info-window"
          position={getWindowPosition("room-info", { x: 120, y: 120 })}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("room-info", nextPosition)
          }
        >
          <RoomInfoPanel room={room} username={username} />

          <button className="secondary" onClick={onLeaveRoom}>
            Salir de la sala
          </button>
        </FloatingWindow>
      )}

      {!getWindowIsMinimized("music") && (
        <FloatingWindow
          title="Música"
          className="music-window"
          position={getWindowPosition("music", { x: 440, y: 120 })}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("music", nextPosition)
          }
        >
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
        </FloatingWindow>
      )}

      {!getWindowIsMinimized("chat") && (
        <FloatingWindow
          title="Chat"
          className="chat-window"
          position={getWindowPosition("chat", { x: 820, y: 120 })}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("chat", nextPosition)
          }
        >
          <ChatPanel
            chatMessages={chatMessages}
            chatInput={chatInput}
            sendingChatMessage={sendingChatMessage}
            onChatInputChange={onChatInputChange}
            onSendChatMessage={onSendChatMessage}
          />
        </FloatingWindow>
      )}
    </CanvasArea>

    <CanvasSidebar
      items={[
        {
          key: "room-info",
          label: "Sala",
          isMinimized: getWindowIsMinimized("room-info"),
        },
        {
          key: "music",
          label: "Música",
          isMinimized: getWindowIsMinimized("music"),
        },
        {
          key: "chat",
          label: "Chat",
          isMinimized: getWindowIsMinimized("chat"),
        },
      ]}
      onToggleItem={toggleWindow}
    />
  </main>
);
}