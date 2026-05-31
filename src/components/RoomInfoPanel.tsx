import type { Room } from "../types/room";

type RoomInfoPanelProps = {
  room: Room;
  username: string;
};

export function RoomInfoPanel({ room, username }: RoomInfoPanelProps) {
  return (
    <div className="room-info-panel">
      <h1>Sala: {room.code}</h1>

      <p>
        Código: <strong>{room.code}</strong>
      </p>

      <p>
        Usuario: <strong>{username || "Invitado"}</strong>
      </p>
    </div>
  );
}