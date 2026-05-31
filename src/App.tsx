import { useCallback, useRef, useState } from "react";
import "./App.css";

import { HomeScreen } from "./components/HomeScreen";
import { RoomScreen } from "./components/RoomScreen";
import type { CanvasImageLayer } from "./features/canvas/canvasTypes";
import { generateRoomCode } from "./features/rooms/roomCode";
import { useRoomRealtime } from "./features/rooms/useRoomRealtime";
import type { WindowPosition, WindowSize } from "./features/windows/windowTypes";
import type { YouTubePlayerHandle } from "./features/music/YoutubePlayer";
import {
  deleteCanvasLayer as deleteCanvasLayerRow,
  fetchCanvasLayers,
  fetchRoomMessages,
  fetchRoomState,
  fetchRoomWindows,
  findRoomByCode,
  insertCanvasLayer,
  insertChatMessage,
  insertDefaultRoomWindows,
  insertInitialRoomState,
  insertRoom,
  updateCanvasLayerPosition as updateCanvasLayerPositionRow,
  updateCanvasLayerSize as updateCanvasLayerSizeRow,
  updateCanvasLayerZIndex as updateCanvasLayerZIndexRow,
  updateRoomPlayback,
  updateRoomWindowMinimized as updateRoomWindowMinimizedRow,
  updateRoomWindowPosition as updateRoomWindowPositionRow,
  updateRoomWindowSize as updateRoomWindowSizeRow,
  updateRoomYoutubeUrl,
  uploadCanvasAsset,
} from "./lib/roomRepository";
import type { Room, RoomMessage, RoomState, RoomWindow } from "./types/room";

function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomState, setCurrentRoomState] = useState<RoomState | null>(
    null
  );
  const [canvasLayers, setCanvasLayers] = useState<CanvasImageLayer[]>([]);

  const [chatMessages, setChatMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [roomWindows, setRoomWindows] = useState<RoomWindow[]>([]);

  const youtubePlayerRef = useRef<YouTubePlayerHandle | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackUpdatedAt, setPlaybackUpdatedAt] = useState("");
  const [syncingPlayback, setSyncingPlayback] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const applyRoomState = useCallback((nextState: RoomState) => {
    setCurrentRoomState(nextState);
    setYoutubeUrl(nextState.youtube_url || "");
    setIsPlaying(Boolean(nextState.is_playing));
    setPlaybackSeconds(Number(nextState.playback_seconds || 0));
    setPlaybackUpdatedAt(nextState.playback_updated_at || "");
  }, []);

  const mergeRoomWindow = useCallback((changedWindow: RoomWindow) => {
    setRoomWindows((currentWindows) => {
      const exists = currentWindows.some(
        (roomWindow) => roomWindow.id === changedWindow.id
      );

      if (!exists) {
        return [...currentWindows, changedWindow];
      }

      return currentWindows.map((roomWindow) =>
        roomWindow.id === changedWindow.id ? changedWindow : roomWindow
      );
    });
  }, []);

  const mergeCanvasLayer = useCallback((changedLayer: CanvasImageLayer) => {
    setCanvasLayers((currentLayers) => {
      const exists = currentLayers.some((layer) => layer.id === changedLayer.id);

      if (!exists) {
        return [...currentLayers, changedLayer];
      }

      return currentLayers.map((layer) =>
        layer.id === changedLayer.id ? changedLayer : layer
      );
    });
  }, []);

  const removeCanvasLayerFromState = useCallback((id: string) => {
    setCanvasLayers((currentLayers) =>
      currentLayers.filter((layer) => layer.id !== id)
    );
  }, []);

  const addRealtimeChatMessage = useCallback((newMessage: RoomMessage) => {
    setChatMessages((currentMessages) => {
      const alreadyExists = currentMessages.some(
        (message) => message.id === newMessage.id
      );

      if (alreadyExists) {
        return currentMessages;
      }

      return [...currentMessages, newMessage];
    });
  }, []);

  useRoomRealtime({
    room: currentRoom,
    roomState: currentRoomState,
    onRoomStateChange: applyRoomState,
    onMessageInsert: addRealtimeChatMessage,
    onWindowChange: mergeRoomWindow,
    onCanvasLayerDelete: removeCanvasLayerFromState,
    onCanvasLayerChange: mergeCanvasLayer,
  });

  async function loadRoomState(roomId: string) {
    const { data, error } = await fetchRoomState(roomId);

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo cargar el estado de la sala.");
      return null;
    }

    applyRoomState(data);
    return data;
  }

  async function loadRoomMessages(roomId: string) {
    const { data, error } = await fetchRoomMessages(roomId);

    if (error || !data) {
      console.error(error);
      setMessage("No se pudieron cargar los mensajes del chat.");
      return;
    }

    setChatMessages(data);
  }

  async function loadOrCreateRoomWindows(roomId: string) {
    const { data: existingWindows, error: selectError } = await fetchRoomWindows(
      roomId
    );

    if (selectError) {
      console.error(selectError);
      setMessage("No se pudieron cargar las ventanas de la sala.");
      return;
    }

    if (existingWindows && existingWindows.length > 0) {
      setRoomWindows(existingWindows);
      return;
    }

    const { data: createdWindows, error: insertError } =
      await insertDefaultRoomWindows(roomId);

    if (insertError || !createdWindows) {
      console.error(insertError);
      setMessage("No se pudieron crear las ventanas iniciales.");
      return;
    }

    setRoomWindows(createdWindows);
  }

  async function loadCanvasLayers(roomId: string) {
    const { data, error } = await fetchCanvasLayers(roomId);

    if (error || !data) {
      console.error(error);
      setMessage("No se pudieron cargar los elementos del canvas.");
      return;
    }

    setCanvasLayers(data);
  }

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      const code = generateRoomCode();
      const { data: roomData, error: roomError } = await insertRoom(code);

      if (roomError || !roomData) {
        console.error(roomError);
        setMessage("No se pudo crear la sala.");
        return;
      }

      const { data: stateData, error: stateError } =
        await insertInitialRoomState(roomData.id);

      if (stateError || !stateData) {
        console.error(stateError);
        setMessage("La sala se creó, pero no se pudo crear su estado inicial.");
        return;
      }

      setCurrentRoom(roomData);
      applyRoomState(stateData);
      setChatMessages([]);
      await loadOrCreateRoomWindows(roomData.id);
      await loadCanvasLayers(roomData.id);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al crear la sala.");
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    setLoading(true);
    setMessage("");

    try {
      const cleanCode = roomCode.trim().toUpperCase();

      if (!cleanCode) {
        setMessage("Escribe un código de sala.");
        return;
      }

      const { data: roomData, error: roomError } = await findRoomByCode(
        cleanCode
      );

      if (roomError || !roomData) {
        console.error(roomError);
        setMessage("No encontramos una sala con ese código.");
        return;
      }

      setCurrentRoom(roomData);
      await loadRoomState(roomData.id);
      await loadRoomMessages(roomData.id);
      await loadOrCreateRoomWindows(roomData.id);
      await loadCanvasLayers(roomData.id);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al intentar entrar a la sala.");
    } finally {
      setLoading(false);
    }
  }

  async function saveYoutubeUrl() {
    if (!currentRoomState) {
      setMessage("No hay estado de sala para actualizar.");
      return;
    }

    setSavingYoutube(true);
    setMessage("");

    try {
      const { data, error } = await updateRoomYoutubeUrl(
        currentRoomState.id,
        youtubeUrl
      );

      if (error || !data) {
        console.error(error);
        setMessage("No se pudo guardar el enlace de YouTube.");
        return;
      }

      applyRoomState(data);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al guardar el enlace de YouTube.");
    } finally {
      setSavingYoutube(false);
    }
  }

  async function updatePlayback(nextIsPlaying: boolean, nextSeconds: number) {
    if (!currentRoomState) {
      setMessage("No hay estado de sala para actualizar.");
      return;
    }

    setSyncingPlayback(true);
    setMessage("");

    try {
      const { data, error } = await updateRoomPlayback(
        currentRoomState.id,
        nextIsPlaying,
        nextSeconds
      );

      if (error || !data) {
        console.error(error);
        setMessage("No se pudo sincronizar la reproducción.");
        return;
      }

      applyRoomState(data);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al sincronizar la reproducción.");
    } finally {
      setSyncingPlayback(false);
    }
  }

  function playForEveryone() {
    const currentSeconds =
      youtubePlayerRef.current?.getCurrentTime() ?? playbackSeconds;
    void updatePlayback(true, currentSeconds);
  }

  function pauseForEveryone() {
    const currentSeconds =
      youtubePlayerRef.current?.getCurrentTime() ?? playbackSeconds;
    void updatePlayback(false, currentSeconds);
  }

  function syncToStart() {
    void updatePlayback(false, 0);
  }

  async function sendChatMessage() {
    if (!currentRoom) {
      setMessage("No hay sala activa.");
      return;
    }

    const cleanContent = chatInput.trim();

    if (!cleanContent) {
      return;
    }

    setSendingChatMessage(true);

    try {
      const { error } = await insertChatMessage(
        currentRoom.id,
        username.trim() || "Invitado",
        cleanContent
      );

      if (error) {
        console.error(error);
        setMessage("No se pudo enviar el mensaje.");
        return;
      }

      setChatInput("");
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al enviar el mensaje.");
    } finally {
      setSendingChatMessage(false);
    }
  }

  async function updateRoomWindowPosition(
    windowKey: string,
    nextPosition: WindowPosition
  ) {
    if (!currentRoom) {
      return;
    }

    const { data, error } = await updateRoomWindowPositionRow(
      currentRoom.id,
      windowKey,
      nextPosition
    );

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo guardar la posición de la ventana.");
      return;
    }

    mergeRoomWindow(data);
  }

  async function updateRoomWindowMinimized(
    windowKey: string,
    nextIsMinimized: boolean
  ) {
    if (!currentRoom) {
      return;
    }

    const { data, error } = await updateRoomWindowMinimizedRow(
      currentRoom.id,
      windowKey,
      nextIsMinimized
    );

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo actualizar el estado de la ventana.");
      return;
    }

    mergeRoomWindow(data);
  }

  async function updateRoomWindowSize(windowKey: string, nextSize: WindowSize) {
    if (!currentRoom) {
      return;
    }

    const { data, error } = await updateRoomWindowSizeRow(
      currentRoom.id,
      windowKey,
      nextSize
    );

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo guardar el tamaño de la ventana.");
      return;
    }

    mergeRoomWindow(data);
  }

  async function createCanvasLayer(payload: {
    type: "image" | "gif";
    src: string;
    x: number;
    y: number;
    w: number;
    h: number;
    file?: File;
  }) {
    if (!currentRoom) {
      return;
    }

    let finalSrc = payload.src;

    if (payload.file) {
      const { data: uploadedUrl, error } = await uploadCanvasAsset(
        currentRoom.id,
        payload.file
      );

      if (error || !uploadedUrl) {
        console.error(error);
        setMessage("No se pudo subir la imagen al Storage.");
        return;
      }

      finalSrc = uploadedUrl;
    }

    const nextZ =
      canvasLayers.length === 0
        ? 30
        : Math.max(...canvasLayers.map((layer) => layer.z || 0)) + 1;

    const { data, error } = await insertCanvasLayer({
      roomId: currentRoom.id,
      type: payload.type,
      src: finalSrc,
      x: payload.x,
      y: payload.y,
      w: payload.w,
      h: payload.h,
      zIndex: nextZ,
    });

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo agregar el elemento al canvas.");
      return;
    }

    mergeCanvasLayer(data);
  }

  async function updateCanvasLayerPosition(
    id: string,
    nextPosition: WindowPosition
  ) {
    setCanvasLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              x: nextPosition.x,
              y: nextPosition.y,
            }
          : layer
      )
    );

    const { error } = await updateCanvasLayerPositionRow(id, nextPosition);

    if (error) {
      console.error(error);
      setMessage("No se pudo mover el elemento.");
    }
  }

  async function updateCanvasLayerSize(
    id: string,
    nextSize: { w: number; h: number }
  ) {
    setCanvasLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              w: nextSize.w,
              h: nextSize.h,
            }
          : layer
      )
    );

    const { error } = await updateCanvasLayerSizeRow(id, nextSize);

    if (error) {
      console.error(error);
      setMessage("No se pudo redimensionar el elemento.");
    }
  }

  async function moveCanvasLayerInStack(
    id: string,
    direction: "backward" | "forward"
  ) {
    const sortedLayers = [...canvasLayers].sort((firstLayer, secondLayer) =>
      firstLayer.z === secondLayer.z
        ? firstLayer.id.localeCompare(secondLayer.id)
        : firstLayer.z - secondLayer.z
    );
    const currentIndex = sortedLayers.findIndex((layer) => layer.id === id);
    const targetIndex =
      direction === "forward" ? currentIndex + 1 : currentIndex - 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= sortedLayers.length
    ) {
      return;
    }

    const currentLayer = sortedLayers[currentIndex];
    const targetLayer = sortedLayers[targetIndex];
    const currentNextZ = targetLayer.z;
    const targetNextZ = currentLayer.z;

    setCanvasLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id === currentLayer.id) {
          return { ...layer, z: currentNextZ, z_index: currentNextZ };
        }

        if (layer.id === targetLayer.id) {
          return { ...layer, z: targetNextZ, z_index: targetNextZ };
        }

        return layer;
      })
    );

    const [currentResult, targetResult] = await Promise.all([
      updateCanvasLayerZIndexRow(currentLayer.id, currentNextZ),
      updateCanvasLayerZIndexRow(targetLayer.id, targetNextZ),
    ]);

    if (currentResult.error || targetResult.error) {
      console.error(currentResult.error || targetResult.error);
      setMessage("No se pudo cambiar la capa del elemento.");
    }
  }

  async function deleteCanvasLayer(id: string) {
    removeCanvasLayerFromState(id);

    const { error } = await deleteCanvasLayerRow(id);

    if (error) {
      console.error(error);
      setMessage("No se pudo eliminar el elemento.");
    }
  }

  function leaveRoom() {
    setCurrentRoom(null);
    setCurrentRoomState(null);
    setYoutubeUrl("");
    setIsPlaying(false);
    setPlaybackSeconds(0);
    setPlaybackUpdatedAt("");
    setChatMessages([]);
    setChatInput("");
    setRoomCode("");
    setMessage("");
    setCanvasLayers([]);
  }

  return (
    <main className="app">
      {currentRoom ? (
        <RoomScreen
          key={currentRoom.id}
          room={currentRoom}
          roomState={currentRoomState}
          username={username}
          youtubeUrl={youtubeUrl}
          isPlaying={isPlaying}
          playbackSeconds={playbackSeconds}
          playbackUpdatedAt={playbackUpdatedAt}
          savingYoutube={savingYoutube}
          syncingPlayback={syncingPlayback}
          youtubePlayerRef={youtubePlayerRef}
          onWindowSizeChange={updateRoomWindowSize}
          onYoutubeUrlChange={setYoutubeUrl}
          onSaveYoutubeUrl={saveYoutubeUrl}
          onPlayForEveryone={playForEveryone}
          onPauseForEveryone={pauseForEveryone}
          chatMessages={chatMessages}
          chatInput={chatInput}
          sendingChatMessage={sendingChatMessage}
          onChatInputChange={setChatInput}
          onSendChatMessage={sendChatMessage}
          onSyncToStart={syncToStart}
          canvasLayers={canvasLayers}
          onCreateCanvasLayer={createCanvasLayer}
          onMoveCanvasLayer={updateCanvasLayerPosition}
          onResizeCanvasLayer={updateCanvasLayerSize}
          onDeleteCanvasLayer={deleteCanvasLayer}
          onMoveCanvasLayerInStack={moveCanvasLayerInStack}
          roomWindows={roomWindows}
          onWindowPositionChange={updateRoomWindowPosition}
          onWindowMinimizedChange={updateRoomWindowMinimized}
          onLeaveRoom={leaveRoom}
        />
      ) : (
        <HomeScreen
          username={username}
          roomCode={roomCode}
          loading={loading}
          message={message}
          onUsernameChange={setUsername}
          onRoomCodeChange={setRoomCode}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}
    </main>
  );
}

export default App;
