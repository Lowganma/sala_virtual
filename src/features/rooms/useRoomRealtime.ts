import { useEffect } from "react";
import { normalizeCanvasLayer } from "../canvas/canvasLayerMapper";
import type { CanvasImageLayer } from "../canvas/canvasTypes";
import { supabase } from "../../lib/supabaseClient";
import type { Room, RoomMessage, RoomState, RoomWindow } from "../../types/room";

type UseRoomRealtimeOptions = {
  room: Room | null;
  roomState: RoomState | null;
  onRoomStateChange: (roomState: RoomState) => void;
  onMessageInsert: (message: RoomMessage) => void;
  onWindowChange: (roomWindow: RoomWindow) => void;
  onCanvasLayerDelete: (id: string) => void;
  onCanvasLayerChange: (layer: CanvasImageLayer) => void;
};

/**
 * Keeps Supabase realtime wiring in one place so App can focus on UI state and
 * user actions. The handlers intentionally merge rows instead of replacing full
 * collections to avoid flicker while local optimistic updates are in progress.
 */
export function useRoomRealtime({
  room,
  roomState,
  onRoomStateChange,
  onMessageInsert,
  onWindowChange,
  onCanvasLayerDelete,
  onCanvasLayerChange,
}: UseRoomRealtimeOptions) {
  useEffect(() => {
    if (!roomState) {
      return;
    }

    const channel = supabase
      .channel(`room-state-${roomState.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_state",
          filter: `id=eq.${roomState.id}`,
        },
        (payload) => onRoomStateChange(payload.new as RoomState)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomState, onRoomStateChange]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const channel = supabase
      .channel(`room-messages-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => onMessageInsert(payload.new as RoomMessage)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room, onMessageInsert]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const channel = supabase
      .channel(`room-windows-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_windows",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => onWindowChange(payload.new as RoomWindow)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room, onWindowChange]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const channel = supabase
      .channel(`canvas-layers-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "canvas_layers",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            onCanvasLayerDelete((payload.old as { id: string }).id);
            return;
          }

          onCanvasLayerChange(normalizeCanvasLayer(payload.new as never));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room, onCanvasLayerDelete, onCanvasLayerChange]);
}
