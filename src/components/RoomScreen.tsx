import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import { CanvasArea } from "./CanvasArea";
import type { CanvasViewportControls } from "../features/canvas/CanvasViewport";
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

type ElementGroup = {
  id: string;
  elementKeys: string[];
};

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

function loadElementPreferences(roomId: string) {
  const savedState = window.localStorage.getItem(`sala-virtual-elements-${roomId}`);

  if (!savedState) {
    return {
      lockedElementKeys: new Set<string>(),
      elementGroups: [] as ElementGroup[],
    };
  }

  try {
    const parsedState = JSON.parse(savedState) as {
      lockedElementKeys?: string[];
      elementGroups?: ElementGroup[];
    };

    return {
      lockedElementKeys: new Set(parsedState.lockedElementKeys ?? []),
      elementGroups: parsedState.elementGroups ?? [],
    };
  } catch (error) {
    console.error(error);

    return {
      lockedElementKeys: new Set<string>(),
      elementGroups: [] as ElementGroup[],
    };
  }
}

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
  const [manualLayerOrder, setManualLayerOrder] = useState<string[]>([]);
  const [selectedElementKeys, setSelectedElementKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [lockedElementKeys, setLockedElementKeys] = useState<Set<string>>(
    () => loadElementPreferences(room.id).lockedElementKeys
  );
  const [elementGroups, setElementGroups] = useState<ElementGroup[]>(
    () => loadElementPreferences(room.id).elementGroups
  );
  const [viewportControls, setViewportControls] =
    useState<CanvasViewportControls | null>(null);

  const handleViewportControlsChange = useCallback(
    (nextViewportControls: CanvasViewportControls | null) => {
      setViewportControls(nextViewportControls);
    },
    []
  );

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

  const selectedKeys = useMemo(
    () => Array.from(selectedElementKeys),
    [selectedElementKeys]
  );

  const storageKey = `sala-virtual-elements-${room.id}`;

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        lockedElementKeys: Array.from(lockedElementKeys),
        elementGroups,
      })
    );
  }, [elementGroups, lockedElementKeys, storageKey]);

  function getGroupForElement(elementKey: string) {
    return elementGroups.find((group) => group.elementKeys.includes(elementKey));
  }

  function getMoveGroupKeys(elementKey: string) {
    const group = getGroupForElement(elementKey);

    return group ? group.elementKeys : [elementKey];
  }

  function isElementLocked(elementKey: string) {
    return lockedElementKeys.has(elementKey);
  }

  function selectElement(elementKey: string, addToSelection = false) {
    setSelectedElementKeys((currentSelection) => {
      if (!addToSelection) {
        return new Set([elementKey]);
      }

      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(elementKey)) {
        nextSelection.delete(elementKey);
      } else {
        nextSelection.add(elementKey);
      }

      if (nextSelection.size === 0) {
        nextSelection.add(elementKey);
      }

      return nextSelection;
    });
  }

  function clearElementSelection() {
    setSelectedElementKeys(new Set());
  }

  function toggleSelectedElementLock() {
    if (selectedKeys.length === 0) {
      return;
    }

    const shouldUnlock = selectedKeys.every((key) => lockedElementKeys.has(key));

    setLockedElementKeys((currentLockedKeys) => {
      const nextLockedKeys = new Set(currentLockedKeys);

      for (const key of selectedKeys) {
        if (shouldUnlock) {
          nextLockedKeys.delete(key);
        } else {
          nextLockedKeys.add(key);
        }
      }

      return nextLockedKeys;
    });
  }

  function groupSelectedElements() {
    if (selectedKeys.length < 2) {
      return;
    }

    const nextGroup: ElementGroup = {
      id: crypto.randomUUID(),
      elementKeys: selectedKeys,
    };

    setElementGroups((currentGroups) => [
      ...currentGroups.filter(
        (group) => !group.elementKeys.some((key) => selectedElementKeys.has(key))
      ),
      nextGroup,
    ]);
  }

  function ungroupSelectedElements() {
    if (selectedKeys.length === 0) {
      return;
    }

    setElementGroups((currentGroups) =>
      currentGroups.filter(
        (group) => !group.elementKeys.some((key) => selectedElementKeys.has(key))
      )
    );
  }

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
    if (isElementLocked(layerKey)) {
      return;
    }

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

  function moveCanvasLayerWithGroup(
    id: string,
    nextPosition: WindowPosition
  ) {
    const elementKey = `canvas:${id}`;

    if (isElementLocked(elementKey)) {
      return;
    }

    const currentLayer = canvasLayers.find((layer) => layer.id === id);

    if (!currentLayer) {
      return;
    }

    const deltaX = nextPosition.x - currentLayer.x;
    const deltaY = nextPosition.y - currentLayer.y;

    for (const groupKey of getMoveGroupKeys(elementKey)) {
      if (isElementLocked(groupKey)) {
        continue;
      }

      if (groupKey.startsWith("canvas:")) {
        const layerId = groupKey.replace("canvas:", "");
        const layer = canvasLayers.find(
          (canvasLayer) => canvasLayer.id === layerId
        );

        if (layer) {
          void onMoveCanvasLayer(layerId, {
            x: layer.x + deltaX,
            y: layer.y + deltaY,
          });
        }

        continue;
      }

      const windowKey = groupKey.replace("window:", "");
      const position = getWindowPosition(windowKey, { x: 0, y: 0 });
      onWindowPositionChange(windowKey, {
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
    }
  }

  function moveWindowWithGroup(
    windowKey: string,
    nextPosition: WindowPosition
  ) {
    const elementKey = `window:${windowKey}`;

    if (isElementLocked(elementKey)) {
      return;
    }

    const currentPosition = getWindowPosition(windowKey, { x: 0, y: 0 });
    const deltaX = nextPosition.x - currentPosition.x;
    const deltaY = nextPosition.y - currentPosition.y;

    for (const groupKey of getMoveGroupKeys(elementKey)) {
      if (isElementLocked(groupKey)) {
        continue;
      }

      if (groupKey.startsWith("canvas:")) {
        const layerId = groupKey.replace("canvas:", "");
        const layer = canvasLayers.find(
          (canvasLayer) => canvasLayer.id === layerId
        );

        if (layer) {
          void onMoveCanvasLayer(layerId, {
            x: layer.x + deltaX,
            y: layer.y + deltaY,
          });
        }

        continue;
      }

      const groupedWindowKey = groupKey.replace("window:", "");
      const position = getWindowPosition(groupedWindowKey, { x: 0, y: 0 });
      onWindowPositionChange(groupedWindowKey, {
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
    }
  }

  function resizeCanvasLayerIfUnlocked(
    id: string,
    nextSize: { w: number; h: number }
  ) {
    if (isElementLocked(`canvas:${id}`)) {
      return;
    }

    void onResizeCanvasLayer(id, nextSize);
  }

  function resizeWindowIfUnlocked(windowKey: string, nextSize: WindowSize) {
    if (isElementLocked(`window:${windowKey}`)) {
      return;
    }

    onWindowSizeChange(windowKey, nextSize);
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

      const selectedCanvasIds = selectedKeys
        .filter((key) => key.startsWith("canvas:") && !lockedElementKeys.has(key))
        .map((key) => key.replace("canvas:", ""));

      if (selectedCanvasIds.length === 0) {
        return;
      }

      event.preventDefault();

      for (const id of selectedCanvasIds) {
        void onDeleteCanvasLayer(id);
      }

      clearElementSelection();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lockedElementKeys, onDeleteCanvasLayer, selectedKeys]);

  const selectedItemsAreLocked =
    selectedKeys.length > 0 && selectedKeys.every((key) => isElementLocked(key));
  const selectedItemsHaveGroup = selectedKeys.some((key) => getGroupForElement(key));

  return (
    <main className="room-layout">
      {selectedKeys.length > 0 && (
        <div
          className="element-selection-toolbar"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <strong>{selectedKeys.length} seleccionado(s)</strong>
          <span>Shift + click para multiselección</span>
          <button type="button" onClick={toggleSelectedElementLock}>
            {selectedItemsAreLocked ? "Desbloquear" : "Bloquear"}
          </button>
          <button
            type="button"
            onClick={groupSelectedElements}
            disabled={selectedKeys.length < 2}
          >
            Agrupar
          </button>
          <button
            type="button"
            onClick={ungroupSelectedElements}
            disabled={!selectedItemsHaveGroup}
          >
            Desagrupar
          </button>
        </div>
      )}

      <CanvasArea
        roomId={room.id}
        onPasteImage={handlePasteImage}
        onCanvasMouseDown={clearElementSelection}
        onViewportControlsChange={handleViewportControlsChange}
      >
        {sortedCanvasLayers.map((layer) => (
          <CanvasImageLayer
            key={layer.id}
            layer={layer}
            isSelected={selectedElementKeys.has(`canvas:${layer.id}`)}
            isLocked={isElementLocked(`canvas:${layer.id}`)}
            onSelect={(id, addToSelection) =>
              selectElement(`canvas:${id}`, addToSelection)
            }
            onMove={moveCanvasLayerWithGroup}
            onResize={resizeCanvasLayerIfUnlocked}
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
            isSelected={selectedElementKeys.has("window:room-info")}
            isLocked={isElementLocked("window:room-info")}
            zIndex={getVisualZIndex("window:room-info")}
            layerIndex={getLayerIndex("window:room-info")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={
              !isElementLocked("window:room-info") &&
              getLayerIndex("window:room-info") > 1
            }
            canMoveForward={
              !isElementLocked("window:room-info") &&
              getLayerIndex("window:room-info") < effectiveLayerOrder.length
            }
            onMoveBackward={() =>
              moveElementInStack("window:room-info", "backward")
            }
            onMoveForward={() =>
              moveElementInStack("window:room-info", "forward")
            }
            onSelect={(addToSelection) =>
              selectElement("window:room-info", addToSelection)
            }
            onPositionChange={(nextPosition) =>
              moveWindowWithGroup("room-info", nextPosition)
            }
            onSizeChange={(nextSize) =>
              resizeWindowIfUnlocked("room-info", nextSize)
            }
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
            isSelected={selectedElementKeys.has("window:music")}
            isLocked={isElementLocked("window:music")}
            zIndex={getVisualZIndex("window:music")}
            layerIndex={getLayerIndex("window:music")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={
              !isElementLocked("window:music") &&
              getLayerIndex("window:music") > 1
            }
            canMoveForward={
              !isElementLocked("window:music") &&
              getLayerIndex("window:music") < effectiveLayerOrder.length
            }
            onMoveBackward={() => moveElementInStack("window:music", "backward")}
            onMoveForward={() => moveElementInStack("window:music", "forward")}
            onSelect={(addToSelection) =>
              selectElement("window:music", addToSelection)
            }
            onPositionChange={(nextPosition) =>
              moveWindowWithGroup("music", nextPosition)
            }
            onSizeChange={(nextSize) => resizeWindowIfUnlocked("music", nextSize)}
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
            isSelected={selectedElementKeys.has("window:chat")}
            isLocked={isElementLocked("window:chat")}
            zIndex={getVisualZIndex("window:chat")}
            layerIndex={getLayerIndex("window:chat")}
            layerCount={effectiveLayerOrder.length}
            canMoveBackward={
              !isElementLocked("window:chat") &&
              getLayerIndex("window:chat") > 1
            }
            canMoveForward={
              !isElementLocked("window:chat") &&
              getLayerIndex("window:chat") < effectiveLayerOrder.length
            }
            onMoveBackward={() => moveElementInStack("window:chat", "backward")}
            onMoveForward={() => moveElementInStack("window:chat", "forward")}
            onSelect={(addToSelection) =>
              selectElement("window:chat", addToSelection)
            }
            onPositionChange={(nextPosition) =>
              moveWindowWithGroup("chat", nextPosition)
            }
            onSizeChange={(nextSize) => resizeWindowIfUnlocked("chat", nextSize)}
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
        viewportControls={viewportControls}
        onToggleItem={toggleWindow}
      />
    </main>
  );
}
