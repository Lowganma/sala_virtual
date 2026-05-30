type HomeScreenProps = {
    username: string;
    roomCode: string;
    loading: boolean;
    message: string;
    onUsernameChange: (value: string) => void;
    onRoomCodeChange: (value: string) => void;
    onCreateRoom: () => void;
    onJoinRoom: () => void;
};

export function HomeScreen({
    username,
    roomCode,
    loading,
    message,
    onUsernameChange,
    onRoomCodeChange,
    onCreateRoom,
    onJoinRoom,
}: HomeScreenProps) {
return (
    <section className="card">
        <h1>Sala Virtual   </h1>

        <p>
            Crea una sala o entra con un codigo para compartir una pantalla en tiempo real.
            
        </p>

        <label>Tu nombre</label>
        <input
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Ej: Williams"
        />
         <button onClick={onCreateRoom} disabled={loading}>
        {loading ? "Creando..." : "Crear sala"}
      </button>

      <hr />

      <label>Código de sala</label>
      <input
        value={roomCode}
        onChange={(event) => onRoomCodeChange(event.target.value)}
        placeholder="Ej: ABC123"
      />

      <button onClick={onJoinRoom} disabled={loading}>
        {loading ? "Buscando..." : "Unirse a sala"}
      </button>

      {message && <p className="message">{message}</p>}
    </section>
  );
}