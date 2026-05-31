import type { RefObject } from "react";
import type { Room, RoomMessage, RoomState, RoomWindow } from "../types/room";
import type { YouTubePlayerHandle } from "./YouTubePlayer";
import { CanvasArea } from "./CanvasArea";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { MusicPanel } from "./MusicPanel";
import { ChatPanel } from "./ChatPanel";
import { FloatingWindow } from "./FloatingWindow";
import { CanvasSidebar } from "./CanvasSidebar";
import { useState, useEffect } from "react";
import type { CanvasImageLayer as CanvasImageLayerType } from "../features/canvas/canvasTypes";
import { CanvasImageLayer } from "../features/canvas/CanvasImageLayer";


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
  onWindowSizeChange: (
  windowKey: string,
  nextSize: { width: number; height: number }
) => void;
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
  canvasLayers: CanvasImageLayerType[];
  onCreateCanvasLayer: (payload: {
    type: "image" | "gif";
    src: string;
    x: number;
    y: number;
    w: number;
    h: number;
    file?: File;
  }) => void;
  onMoveCanvasLayer: (
    id: string,
    nextPosition: { x: number; y: number }
  ) => void;
  onResizeCanvasLayer: (id: string, nextSize: { w: number; h: number }) => void;
  onDeleteCanvasLayer: (id: string) => void;
    
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
  onWindowSizeChange,
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
  canvasLayers,
  onCreateCanvasLayer,
  onMoveCanvasLayer,
  onResizeCanvasLayer,
  onDeleteCanvasLayer,
  onLeaveRoom,
}: RoomScreenProps) {

const [selectedWindowKey, setSelectedWindowKey] = useState<string | null>(null);
const [selectedCanvasLayerId, setSelectedCanvasLayerId] = useState<string | null>(
  null
);

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

  function getWindowSize(
  windowKey: string,
  fallback: { width: number; height: number }
) {
  const savedWindow = roomWindows.find(
    (roomWindow) => roomWindow.window_key === windowKey
  );

  if (!savedWindow) {
    return fallback;
  }

  return {
    width: Number(savedWindow.width),
    height: Number(savedWindow.height),
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

function handlePasteImage(payload: {
  src: string;
  type: "image" | "gif";
  x: number;
  y: number;
  file?: File;
}) {
  void onCreateCanvasLayer({
    type: payload.type,
    src: payload.src,
    x: payload.x - 160,
    y: payload.y - 120,
    w: 320,
    h: 240,
    file: payload.file,
  });
}

function moveCanvasLayer(
  id: string,
  nextPosition: { x: number; y: number }
) {
  void onMoveCanvasLayer(id, nextPosition);
}

function resizeCanvasLayer(id: string, nextSize: { w: number; h: number }) {
  void onResizeCanvasLayer(id, nextSize);
}

function deleteSelectedCanvasLayer() {
  if (!selectedCanvasLayerId) {
    return;
  }

  void onDeleteCanvasLayer(selectedCanvasLayerId);
  setSelectedCanvasLayerId(null);
}

useEffect(() => {
  function isTypingInInput() {
    const activeElement = document.activeElement;

    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement ||
      activeElement?.getAttribute("contenteditable") === "true"
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (isTypingInInput()) {
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (!selectedCanvasLayerId) {
        return;
      }

      event.preventDefault();
      deleteSelectedCanvasLayer();
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedCanvasLayerId]);

  return (
  <main className="room-layout">
    <CanvasArea onPasteImage={handlePasteImage}
    onCanvasMouseDown={() => {
      setSelectedCanvasLayerId(null);
      setSelectedWindowKey(null);
    }}>
      {canvasLayers.map((layer) => (
  <CanvasImageLayer
    key={layer.id}
    layer={layer}
    isSelected={selectedCanvasLayerId === layer.id}
    onSelect={setSelectedCanvasLayerId}
    onMove={moveCanvasLayer}
    onResize={resizeCanvasLayer}
  />
))}

      {!getWindowIsMinimized("room-info") && (
        <FloatingWindow
          title="Sala"
          className="room-info-window"
          position={getWindowPosition("room-info", { x: 120, y: 120 })}
          size={getWindowSize("room-info", { width: 260, height: 180 })}
          isSelected={selectedWindowKey === "room-info"}
          onSelect={() => setSelectedWindowKey("room-info")}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("room-info", nextPosition)
          }
          onSizeChange={(nextSize) => onWindowSizeChange("room-info", nextSize)}
        >
          <RoomInfoPanel room={room} username={username} />

          <button className="ghost-danger-button" onClick={onLeaveRoom}>
            Salir
          </button>
        </FloatingWindow>
      )}

      {!getWindowIsMinimized("music") && (
        <FloatingWindow
          title="Música"
          className="music-window"
          position={getWindowPosition("music", { x: 440, y: 120 })}
          size={getWindowSize("music", { width: 280, height: 520 })}
          isSelected={selectedWindowKey === "music"}
          onSelect={() => setSelectedWindowKey("music")}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("music", nextPosition)
          }
          onSizeChange={(nextSize) => onWindowSizeChange("music", nextSize)}
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
          size={getWindowSize("chat", { width: 280, height: 360 })}
          isSelected={selectedWindowKey === "chat"}
          onSelect={() => setSelectedWindowKey("chat")}
          onPositionChange={(nextPosition) =>
            onWindowPositionChange("chat", nextPosition)
          }
          onSizeChange={(nextSize) => onWindowSizeChange("chat", nextSize)}
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