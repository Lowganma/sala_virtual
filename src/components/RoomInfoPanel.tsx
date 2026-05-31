import type { Room } from "../types/room";

type RoomInfoPanelProps = {
  room: Room;
  username: string;
};

export function RoomInfoPanel({ room, username }: RoomInfoPanelProps) {
  return (
    <>
      <h1>Sala: {room.code}</h1>

      <p>
        Comparte este código con otra persona:
        <strong> {room.code}</strong>
      </p>

      <p>
        Usuario actual:
        <strong> {username || "Invitado"}</strong>
      </p>
    </>
  );
}