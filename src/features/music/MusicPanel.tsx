import type { RefObject } from "react";
import { YouTubePlayer } from "./YoutubePlayer";
import type { YouTubePlayerHandle } from "./YoutubePlayer";

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
    <div className="music-panel">
      <div className="music-url-row">
        <input
          value={youtubeUrl}
          onChange={(event) => onYoutubeUrlChange(event.target.value)}
          placeholder="URL de YouTube..."
          disabled={!canUseRoomState}
        />

        <button
          className="compact-button"
          onClick={onSaveYoutubeUrl}
          disabled={savingYoutube || !canUseRoomState}
          title="Guardar música"
        >
          💾
        </button>
      </div>

      <div className="music-video-shell">
        <YouTubePlayer
          ref={youtubePlayerRef}
          youtubeUrl={youtubeUrl}
          isPlaying={isPlaying}
          playbackSeconds={playbackSeconds}
          playbackUpdatedAt={playbackUpdatedAt}
        />
      </div>

      <div className="media-controls-row">
        <button
          className="media-button"
          onClick={onPlayForEveryone}
          disabled={syncingPlayback || !canUseRoomState}
          title="Reproducir"
        >
          ▶
        </button>

        <button
          className="media-button"
          onClick={onPauseForEveryone}
          disabled={syncingPlayback || !canUseRoomState}
          title="Pausar"
        >
          ⏸
        </button>

        <button
          className="media-button"
          onClick={onSyncToStart}
          disabled={syncingPlayback || !canUseRoomState}
          title="Reiniciar"
        >
          ⏮
        </button>
      </div>
    </div>
  );
}