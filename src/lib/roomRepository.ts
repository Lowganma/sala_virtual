import { normalizeCanvasLayer } from "../features/canvas/canvasLayerMapper";
import type { CanvasImageLayer } from "../features/canvas/canvasTypes";
import { DEFAULT_WINDOWS } from "../features/windows/defaultWindows";
import type { WindowPosition, WindowSize } from "../features/windows/windowTypes";
import { supabase } from "./supabaseClient";
import type { Room, RoomMessage, RoomState, RoomWindow } from "../types/room";

type CreateCanvasLayerPayload = {
  roomId: string;
  type: "image" | "gif";
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
};

export async function insertRoom(code: string) {
  return supabase.from("rooms").insert({ code }).select().single<Room>();
}

export async function insertInitialRoomState(roomId: string) {
  return supabase
    .from("room_state")
    .insert({
      room_id: roomId,
      message: "",
      youtube_url: "",
      is_playing: false,
      playback_seconds: 0,
      playback_updated_at: new Date().toISOString(),
    })
    .select()
    .single<RoomState>();
}

export async function findRoomByCode(code: string) {
  return supabase.from("rooms").select("*").eq("code", code).single<Room>();
}

export async function fetchRoomState(roomId: string) {
  return supabase
    .from("room_state")
    .select("*")
    .eq("room_id", roomId)
    .single<RoomState>();
}

export async function updateRoomMessage(stateId: string, message: string) {
  return supabase
    .from("room_state")
    .update({
      message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stateId)
    .select()
    .single<RoomState>();
}

export async function updateRoomYoutubeUrl(stateId: string, youtubeUrl: string) {
  return supabase
    .from("room_state")
    .update({
      youtube_url: youtubeUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stateId)
    .select()
    .single<RoomState>();
}

export async function updateRoomPlayback(
  stateId: string,
  isPlaying: boolean,
  playbackSeconds: number
) {
  const now = new Date().toISOString();

  return supabase
    .from("room_state")
    .update({
      is_playing: isPlaying,
      playback_seconds: playbackSeconds,
      playback_updated_at: now,
      updated_at: now,
    })
    .eq("id", stateId)
    .select()
    .single<RoomState>();
}

export async function fetchRoomMessages(roomId: string) {
  return supabase
    .from("room_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .returns<RoomMessage[]>();
}

export async function insertChatMessage(
  roomId: string,
  username: string,
  content: string
) {
  return supabase.from("room_messages").insert({
    room_id: roomId,
    username,
    content,
  });
}

export async function fetchRoomWindows(roomId: string) {
  return supabase
    .from("room_windows")
    .select("*")
    .eq("room_id", roomId)
    .returns<RoomWindow[]>();
}

export async function insertDefaultRoomWindows(roomId: string) {
  const windowsToInsert = DEFAULT_WINDOWS.map((windowConfig) => ({
    room_id: roomId,
    window_key: windowConfig.window_key,
    x: windowConfig.x,
    y: windowConfig.y,
    width: windowConfig.width,
    height: windowConfig.height,
    is_minimized: windowConfig.is_minimized,
  }));

  return supabase
    .from("room_windows")
    .insert(windowsToInsert)
    .select()
    .returns<RoomWindow[]>();
}

export async function updateRoomWindowPosition(
  roomId: string,
  windowKey: string,
  nextPosition: WindowPosition
) {
  return supabase
    .from("room_windows")
    .update({
      x: nextPosition.x,
      y: nextPosition.y,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .eq("window_key", windowKey)
    .select()
    .single<RoomWindow>();
}

export async function updateRoomWindowMinimized(
  roomId: string,
  windowKey: string,
  nextIsMinimized: boolean
) {
  return supabase
    .from("room_windows")
    .update({
      is_minimized: nextIsMinimized,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .eq("window_key", windowKey)
    .select()
    .single<RoomWindow>();
}

export async function updateRoomWindowSize(
  roomId: string,
  windowKey: string,
  nextSize: WindowSize
) {
  return supabase
    .from("room_windows")
    .update({
      width: nextSize.width,
      height: nextSize.height,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .eq("window_key", windowKey)
    .select()
    .single<RoomWindow>();
}

export async function fetchCanvasLayers(roomId: string) {
  const { data, error } = await supabase
    .from("canvas_layers")
    .select("*")
    .eq("room_id", roomId)
    .order("z_index", { ascending: true });

  return {
    data: data ? data.map(normalizeCanvasLayer) : null,
    error,
  };
}

export async function uploadCanvasAsset(roomId: string, file: File) {
  const extension = file.name.split(".").pop() || "png";
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `${roomId}/${crypto.randomUUID()}.${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("canvas-assets")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage.from("canvas-assets").getPublicUrl(filePath);

  return { data: data.publicUrl, error: null };
}

export async function insertCanvasLayer(payload: CreateCanvasLayerPayload) {
  const { data, error } = await supabase
    .from("canvas_layers")
    .insert({
      room_id: payload.roomId,
      type: payload.type,
      src: payload.src,
      x: payload.x,
      y: payload.y,
      w: payload.w,
      h: payload.h,
      z_index: payload.zIndex,
    })
    .select()
    .single();

  return {
    data: data ? normalizeCanvasLayer(data) : null,
    error,
  };
}

export async function updateCanvasLayerPosition(
  id: string,
  nextPosition: { x: number; y: number }
) {
  return supabase
    .from("canvas_layers")
    .update({
      x: nextPosition.x,
      y: nextPosition.y,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function updateCanvasLayerSize(
  id: string,
  nextSize: { w: number; h: number }
) {
  return supabase
    .from("canvas_layers")
    .update({
      w: nextSize.w,
      h: nextSize.h,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}


export async function updateCanvasLayerZIndex(id: string, zIndex: number) {
  return supabase
    .from("canvas_layers")
    .update({
      z_index: zIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteCanvasLayer(id: string) {
  return supabase.from("canvas_layers").delete().eq("id", id);
}

export type { CanvasImageLayer };
