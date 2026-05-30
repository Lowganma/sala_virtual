import { useEffect,useRef, useState } from "react";
import "./App.css";

import { supabase } from "./lib/supabaseClient";
import type { Room, RoomState } from "./types/room";

import { HomeScreen } from "./components/HomeScreen";
import { RoomScreen } from "./components/RoomScreen";

import type { YouTubePlayerHandle } from "./components/YoutubePlayer";

function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

function App() {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomState, setCurrentRoomState] = useState<RoomState | null>(
    null
  );

  const youtubePlayerRef = useRef<YouTubePlayerHandle | null>(null);
  const [sharedMessage, setSharedMessage] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackUpdatedAt, setPlaybackUpdatedAt] = useState("");
  const [syncingPlayback, setSyncingPlayback] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
  if (!currentRoomState) {
    return;
  }

  const channel = supabase
    .channel(`room-state-${currentRoomState.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "room_state",
        filter: `id=eq.${currentRoomState.id}`,
      },
      (payload) => {
        const newState = payload.new as RoomState;

        setCurrentRoomState(newState);
        setSharedMessage(newState.message || "");
        setYoutubeUrl(newState.youtube_url || "");
        setIsPlaying(Boolean(newState.is_playing));
        setPlaybackSeconds(Number(newState.playback_seconds || 0));
        setPlaybackUpdatedAt(newState.playback_updated_at || "");
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentRoomState?.id]);

  async function loadRoomState(roomId: string) {
    const { data, error } = await supabase
      .from("room_state")
      .select("*")
      .eq("room_id", roomId)
      .single();

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo cargar el estado de la sala.");
      return null;
    }

    setCurrentRoomState(data);
    setSharedMessage(data.message || "");
    setYoutubeUrl(data.youtube_url || "");
    setIsPlaying(Boolean(data.is_playing));
    setPlaybackSeconds(Number(data.playback_seconds || 0));
    setPlaybackUpdatedAt(data.playback_updated_at || "");

    return data;
  }

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      const code = generateRoomCode();

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .insert({ code })
        .select()
        .single();

      if (roomError || !roomData) {
        console.error(roomError);
        setMessage("No se pudo crear la sala.");
        return;
      }

      const { data: stateData, error: stateError } = await supabase
        .from("room_state")
        .insert({
          room_id: roomData.id,
          message: "",
          youtube_url: "",
        })
        .select()
        .single();

      if (stateError || !stateData) {
        console.error(stateError);
        setMessage("La sala se creó, pero no se pudo crear su estado inicial.");
        return;
      }

      setCurrentRoom(roomData);
      setCurrentRoomState(stateData);
      setSharedMessage(stateData.message || "");
      setYoutubeUrl(stateData.youtube_url || "");
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

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (roomError || !roomData) {
        console.error(roomError);
        setMessage("No encontramos una sala con ese código.");
        return;
      }

      setCurrentRoom(roomData);
      await loadRoomState(roomData.id);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al intentar entrar a la sala.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSharedMessage() {
    if (!currentRoomState) {
      setMessage("No hay estado de sala para actualizar.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("room_state")
        .update({
          message: sharedMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRoomState.id)
        .select()
        .single();

      if (error || !data) {
        console.error(error);
        setMessage("No se pudo guardar el mensaje.");
        return;
      }

      setCurrentRoomState(data);
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al guardar el mensaje.");
    } finally {
      setSaving(false);
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
    const { data, error } = await supabase
      .from("room_state")
      .update({
        youtube_url: youtubeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentRoomState.id)
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo guardar el enlace de YouTube.");
      return;
    }

    setCurrentRoomState(data);
    setYoutubeUrl(data.youtube_url || "");
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
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("room_state")
      .update({
        is_playing: nextIsPlaying,
        playback_seconds: nextSeconds,
        playback_updated_at: now,
        updated_at: now,
      })
      .eq("id", currentRoomState.id)
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      setMessage("No se pudo sincronizar la reproducción.");
      return;
    }

    setCurrentRoomState(data);
    setIsPlaying(Boolean(data.is_playing));
    setPlaybackSeconds(Number(data.playback_seconds || 0));
    setPlaybackUpdatedAt(data.playback_updated_at || "");
  } catch (error) {
    console.error(error);
    setMessage("Ocurrió un error al sincronizar la reproducción.");
  } finally {
    setSyncingPlayback(false);
  }
}

function playForEveryone() {
  const currentSeconds = youtubePlayerRef.current?.getCurrentTime() ?? playbackSeconds;
  updatePlayback(true, currentSeconds);
}

function pauseForEveryone() {
  const currentSeconds = youtubePlayerRef.current?.getCurrentTime() ?? playbackSeconds;
  updatePlayback(false, currentSeconds);
}

function syncToStart() {
  updatePlayback(false, 0);
}

  function leaveRoom() {
    setCurrentRoom(null);
    setCurrentRoomState(null);
    setSharedMessage("");
    setYoutubeUrl("");
    setIsPlaying(false);
    setPlaybackSeconds(0);
    setPlaybackUpdatedAt("");
    setRoomCode("");
    setMessage("");
  }

  return (
    <main className="app">
      {currentRoom ? (
        <RoomScreen
          room={currentRoom}
          roomState={currentRoomState}
          username={username}
          sharedMessage={sharedMessage}
          youtubeUrl={youtubeUrl}
          isPlaying={isPlaying}
          playbackSeconds={playbackSeconds}
          playbackUpdatedAt={playbackUpdatedAt}
          saving={saving}
          savingYoutube={savingYoutube}
          syncingPlayback={syncingPlayback}
          youtubePlayerRef={youtubePlayerRef}
          onSharedMessageChange={setSharedMessage}
          onYoutubeUrlChange={setYoutubeUrl}
          onSaveMessage={saveSharedMessage}
          onSaveYoutubeUrl={saveYoutubeUrl}
          onPlayForEveryone={playForEveryone}
          onPauseForEveryone={pauseForEveryone}
          onSyncToStart={syncToStart}
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