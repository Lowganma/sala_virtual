export type Room = {
  id: string;
  code: string;
  created_at: string;
};

export type RoomState = {
  id: string;
  room_id: string;
  message: string;
  youtube_url: string;
  is_playing: boolean;
  playback_seconds: number;
  playback_updated_at: string;
  updated_at: string;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  username: string;
  content: string;
  created_at: string;
};