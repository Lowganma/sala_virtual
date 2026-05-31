import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import { CanvasArea } from "./CanvasArea";
import { CanvasSidebar } from "./CanvasSidebar";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { CanvasImageLayer } from "../features/canvas/CanvasImageLayer";
import type { CanvasImageLayer as CanvasImageLayerType } from "../features/canvas/canvasTypes";
import { ChatPanel } from "../features/chat/ChatPanel";
import { MusicPanel } from "../features/music/MusicPanel";
import type { YouTubePlayerHandle } from "../features/music/YoutubePlayer";
import { DEFAULT_WINDOWS } from "../features/windows/defaultWindows";
import { FloatingWindow } from "../features/windows/FloatingWindow";
import type { WindowPosition, WindowSize } from "../features/windows/windowTypes";
import type { Room, RoomMessage, RoomState, RoomWindow } from "../types/room";

type CanvasLayerPayload = {
  type: "image" | "gif";
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  file?: File;
};

type LayerEntry =
  | { key: string; type: "canvas"; id: string }
  | { key: string; type: "window"; windowKey: string };

type RoomScreenProps = {
  room: Room;
  roomState: RoomState | null;
  username: string;
  youtubeUrl: string;
  isPlaying: boolean;
  playbackSeconds: number;
  playbackUpdatedAt: string;
  savingYoutube: boolean;
  syncingPlayback: boolean;
  youtubePlayerRef: RefObject<YouTubePlayerHandle | null>;
  chatMessages: RoomMessage[];
  chatInput: string;
  sendingChatMessage: boolean;
  roomWindows: RoomWindow[];
  onWindowSizeChange: (windowKey: string, nextSize: WindowSize) => void;
  onWindowPositionChange: (
    windowKey: string,
    nextPosition: WindowPosition
  ) => void;
  onWindowMinimizedChange: (
    windowKey: string,
    nextIsMinimized: boolean
  ) => void;
  onChatInputChange: (value: string) => void;
  onSendChatMessage: () => void;
  onYoutubeUrlChange: (value: string) => void;
  onSaveYoutubeUrl: () => void;
  onPlayForEveryone: () => void;
  onPauseForEveryone: () => void;
  onSyncToStart: () => void;
  canvasLayers: CanvasImageLayerType[];
  onCreateCanvasLayer: (payload: CanvasLayerPayload) => void;
  onMoveCanvasLayer: (id: string, nextPosition: WindowPosition) => void;
  onResizeCanvasLayer: (id: string, nextSize: { w: number; h: number }) => void;
  onDeleteCanvasLayer: (id: string) => void;
  onMoveCanvasLayerInStack: (
    id: string,
    direction: "backward" | "forward"
  ) => void;
  onLeaveRoom: () => void;
};

function isTypingInEditableElement() {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    activeElement?.getAttribute("contenteditable") === "true"
  );
}

export function RoomScreen({
  room,
  roomState,
  username,
  youtubeUrl,
  isPlaying,
  playbackSeconds,
  playbackUpdatedAt,
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
  onYoutubeUrlChange,
  onSaveYoutubeUrl,
  onPlayForEveryone,
  onPauseForEveryone,
  onSyncToStart,
  canvasLayers,
  onCreateCanvasLayer,
  onMoveCanvasLayer,
  onResizeCanvasLayer,
  onDeleteCanvasLayer,
  onMoveCanvasLayerInStack,
  onLeaveRoom,
}: RoomScreenProps) {
  const [selectedWindowKey, setSelectedWindowKey] = useState<string | null>(
    null
  );
  const [selectedCanvasLayerId, setSelectedCanvasLayerId] = useState<
    string | null
  >(null);
  const [manualLayerOrder, setManualLayerOrder] = useState<string[]>([]);

  const sortedCanvasLayers = useMemo(
    () =>
      [...canvasLayers].sort((firstLayer, secondLayer) =>
        firstLayer.z === secondLayer.z
          ? firstLayer.id.localeCompare(secondLayer.id)
          : firstLayer.z - secondLayer.z
      ),
    [canvasLayers]
  );

  const windowsByKey = useMemo(
    () =>
      new Map(
        roomWindows.map((roomWindow) => [roomWindow.window_key, roomWindow])
      ),
    [roomWindows]
  );

  const baseLayerEntries = useMemo<LayerEntry[]>(() => {
    const canvasEntries = sortedCanvasLayers.map((layer) => ({
      key: `canvas:${layer.id}`,
      type: "canvas" as const,
      id: layer.id,
    }));
    const windowEntries = (
      roomWindows.length > 0
        ? roomWindows.map((roomWindow) => roomWindow.window_key)
        : DEFAULT_WINDOWS.map((windowConfig) => windowConfig.window_key)
    ).map((windowKey) => ({
      key: `window:${windowKey}`,
      type: "window" as const,
      windowKey,
    }));

    return [...windowEntries, ...canvasEntries];
  }, [roomWindows, sortedCanvasLayers]);

  const effectiveLayerOrder = useMemo(() => {
    const entriesByKey = new Map(
      baseLayerEntries.map((entry) => [entry.key, entry])
    );
    const keptEntries = manualLayerOrder
      .map((key) => entriesByKey.get(key))
      .filter((entry): entry is LayerEntry => Boolean(entry));
    const missingEntries = baseLayerEntries.filter(
      (entry) => !manualLayerOrder.includes(entry.key)
    );

    return [...keptEntries, ...missingEntries];
  }, [baseLayerEntries, manualLayerOrder]);

  const layerIndexes = useMemo(
    () =>
      new Map(
        effectiveLayerOrder.map((entry, index) => [entry.key, index + 1])
      ),
    [effectiveLayerOrder]
  );

  function getWindowPosition(
    windowKey: string,
    fallback: WindowPosition
  ): WindowPosition {
    const savedWindow = windowsByKey.get(windowKey);

    if (!savedWindow) {
      return fallback;
    }

    return {
      x: Number(savedWindow.x),
      y: Number(savedWindow.y),
    };
  }

  function getWindowSize(windowKey: string, fallback: WindowSize): WindowSize {
    const savedWindow = windowsByKey.get(windowKey);

    if (!savedWindow) {
      return fallback;
    }

    return {
      width: Number(savedWindow.width),
      height: Number(savedWindow.height),
    };
  }

  function getWindowIsMinimized(windowKey: string) {
    return Boolean(windowsByKey.get(windowKey)?.is_minimized);
  }

  function getLayerIndex(layerKey: string) {
    return layerIndexes.get(layerKey) ?? 1;
  }

  function getVisualZIndex(layerKey: string) {
    return 10 + getLayerIndex(layerKey);
  }

  function moveElementInStack(
    layerKey: string,
    direction: "backward" | "forward"
  ) {
    const currentIndex = effectiveLayerOrder.findIndex(
      (entry) => entry.key === layerKey
    );
    const targetIndex =
      direction === "forward" ? currentIndex + 1 : currentIndex - 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= effectiveLayerOrder.length
    ) {
      return;
    }

    const currentEntry = effectiveLayerOrder[currentIndex];
    const targetEntry = effectiveLayerOrder[targetIndex];
    const nextOrder = effectiveLayerOrder.map((entry) => entry.key);

    [nextOrder[currentIndex], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[currentIndex],
    ];

    setManualLayerOrder(nextOrder);

    if (currentEntry.type === "canvas" && targetEntry.type === "canvas") {
      onMoveCanvasLayerInStack(currentEntry.id, direction);
    }
  }

  function toggleWindow(windowKey: string) {
    onWindowMinimizedChange(windowKey, !getWindowIsMinimized(windowKey));
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingInEditableElement()) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (!selectedCanvasLayerId) {
        return;
      }

      event.preventDefault();
      void onDeleteCanvasLayer(selectedCanvasLayerId);
      setSelectedCanvasLayerId(null);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDeleteCanvasLayer, selectedCanvasLayerId]);

  return (
    <main className="room-layout">
      <CanvasArea
        onPasteImage={handlePasteImage}
        onCanvasMouseDown={() => {
          setSelectedCanvasLayerId(null);
          setSelectedWindowKey(null);
        }}
      >
        {sortedCanvasLayers.map((layer) => (
          <CanvasImageLayer
            key={layer.id}
            layer={layer}
            isSelected={selectedCanvasLayerId === layer.id}
            onSelect={setSelectedCanvasLayerId}
            onMove={(id, nextPosition) =>
              void onMoveCanvasLayer(id, nextPosition)
            }
            onResize={(id, nextSize) => void onResizeCanvasLayer(id, nextSize)}
            zIndex={getVisualZIndex(`canvas:${layer.id}`)}
            layerIndex={getLayerIndex(`canvas:${layer.id}`)}
            layerCount={effectiveLayerOrder.length}
            onMoveBackward={(id) => moveElementInStack(`canvas:${id}`, "backward")}
            onMoveForward={(id) => moveElementInStack(`canvas:${id}`, "forward")}
          />
        ))}

        {!getWindowIsMinimized("room-info") && (
          <FloatingWindow
            title="Sala"
            className="room-info-window"
            position={getWindowPosition("room-info", { x: 120, y: 120 })}
            size={getWindowSize("room-info", { width: 260, height: 180 })}
            isSelected={selectedWindowKey === "room-info"}
            zIndex={getVisualZIndex("window:room-info")}
            layerIndex={getLayerIndex("window:room-info")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={getLayerIndex("window:room-info") > 1}
            canMoveForward={
              getLayerIndex("window:room-info") < effectiveLayerOrder.length
            }
            onMoveBackward={() => moveElementInStack("window:room-info", "backward")}
            onMoveForward={() => moveElementInStack("window:room-info", "forward")}
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
            zIndex={getVisualZIndex("window:music")}
            layerIndex={getLayerIndex("window:music")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={getLayerIndex("window:music") > 1}
            canMoveForward={
              getLayerIndex("window:music") < effectiveLayerOrder.length
            }
            onMoveBackward={() => moveElementInStack("window:music", "backward")}
            onMoveForward={() => moveElementInStack("window:music", "forward")}
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
            zIndex={getVisualZIndex("window:chat")}
            layerIndex={getLayerIndex("window:chat")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={getLayerIndex("window:chat") > 1}
            canMoveForward={
              getLayerIndex("window:chat") < effectiveLayerOrder.length
            }
            onMoveBackward={() => moveElementInStack("window:chat", "backward")}
            onMoveForward={() => moveElementInStack("window:chat", "forward")}
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
        items={DEFAULT_WINDOWS.map((windowConfig) => ({
          key: windowConfig.window_key,
          label:
            windowConfig.window_key === "music"
              ? "Música"
              : windowConfig.window_key === "chat"
                ? "Chat"
                : "Sala",
          isMinimized: getWindowIsMinimized(windowConfig.window_key),
        }))}
        onToggleItem={toggleWindow}
      />
    </main>
  );
}
