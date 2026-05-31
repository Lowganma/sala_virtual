import type { RoomMessage } from "../types/room";

type ChatPanelProps = {
  chatMessages: RoomMessage[];
  chatInput: string;
  sendingChatMessage: boolean;
  onChatInputChange: (value: string) => void;
  onSendChatMessage: () => void;
};

export function ChatPanel({
  chatMessages,
  chatInput,
  sendingChatMessage,
  onChatInputChange,
  onSendChatMessage,
}: ChatPanelProps) {
  return (
    <div className="chat-panel compact-chat-panel">
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <p className="empty-chat">Sin mensajes.</p>
        ) : (
          chatMessages.map((chatMessage) => (
            <div className="chat-message" key={chatMessage.id}>
              <div className="chat-message-header">
                <strong>{chatMessage.username}</strong>
                <span>
                  {new Date(chatMessage.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p>{chatMessage.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="chat-form compact-chat-form">
        <input
          value={chatInput}
          onChange={(event) => onChatInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSendChatMessage();
            }
          }}
          placeholder="Mensaje..."
        />

        <button onClick={onSendChatMessage} disabled={sendingChatMessage}>
          {sendingChatMessage ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}