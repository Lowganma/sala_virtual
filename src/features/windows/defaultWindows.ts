import type { RoomWindow } from "../../types/room";

export type DefaultWindowConfig = Pick<
  RoomWindow,
  "window_key" | "x" | "y" | "width" | "height" | "is_minimized"
>;

export const DEFAULT_WINDOWS: DefaultWindowConfig[] = [
  {
    window_key: "room-info",
    x: 120,
    y: 120,
    width: 280,
    height: 220,
    is_minimized: false,
  },
  {
    window_key: "music",
    x: 440,
    y: 120,
    width: 340,
    height: 520,
    is_minimized: false,
  },
  {
    window_key: "chat",
    x: 820,
    y: 120,
    width: 340,
    height: 360,
    is_minimized: false,
  },
];
