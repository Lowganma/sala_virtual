import type { RefObject } from "react";
import { YouTubePlayer } from "./YouTubePlayer";
import type { YouTubePlayerHandle } from "./YouTubePlayer";

type MusicPanelProps = {
  youtubePlayerRef: RefObject<YouTubePlayerHandle | null>;
  youtubeUrl: string;
  isPlaying: boolean;
  playbackSeconds: number;
  playbackUpdatedAt: string;
  savingYoutube: boolean;
  syncingPlayback: boolean;
  canUseRoomState: boolean;
  onYoutubeUrlChange: (value: string) => void;
  onSaveYoutubeUrl: () => void;
  onPlayForEveryone: () => void;
  onPauseForEveryone: () => void;
  onSyncToStart: () => void;
};

export function MusicPanel({
  youtubePlayerRef,
  youtubeUrl,
  isPlaying,
  playbackSeconds,
  playbackUpdatedAt,
  savingYoutube,
  syncingPlayback,
  canUseRoomState,
  onYoutubeUrlChange,
  onSaveYoutubeUrl,
  onPlayForEveryone,
  onPauseForEveryone,
  onSyncToStart,
}: MusicPanelProps) {
  return (
    <>

      <label>Música de YouTube</label>

      <input
        value={youtubeUrl}
        onChange={(event) => onYoutubeUrlChange(event.target.value)}
        placeholder="Pega un enlace de YouTube..."
        disabled={!canUseRoomState}
      />

      <button onClick={onSaveYoutubeUrl} disabled={savingYoutube || !canUseRoomState}>
        {savingYoutube ? "Guardando música..." : "Guardar música"}
      </button>

      <div className="shared-box">
        <p className="preview-title">Video compartido:</p>

        <YouTubePlayer
          ref={youtubePlayerRef}
          youtubeUrl={youtubeUrl}
          isPlaying={isPlaying}
          playbackSeconds={playbackSeconds}
          playbackUpdatedAt={playbackUpdatedAt}
        />

        <div className="player-controls">
          <button onClick={onPlayForEveryone} disabled={syncingPlayback || !canUseRoomState}>
            Reproducir para todos
          </button>

          <button onClick={onPauseForEveryone} disabled={syncingPlayback || !canUseRoomState}>
            Pausar para todos
          </button>

          <button onClick={onSyncToStart} disabled={syncingPlayback || !canUseRoomState}>
            Reiniciar para todos
          </button>
        </div>
      </div>
    </>
  );
}