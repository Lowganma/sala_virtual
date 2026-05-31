import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type YouTubePlayerApi = {
  destroy: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeConstructor = new (
  element: HTMLElement,
  options: {
    videoId: string;
    playerVars: { playsinline: number; controls: number };
    events: { onReady: () => void };
  }
) => YouTubePlayerApi;

declare global {
  interface Window {
    YT?: { Player?: YouTubeConstructor };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerProps = {
  youtubeUrl: string;
  isPlaying: boolean;
  playbackSeconds: number;
  playbackUpdatedAt: string;
  onReady?: () => void;
};

export type YouTubePlayerHandle = {
  getCurrentTime: () => number;
};

function getYoutubeVideoId(url: string) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v") || "";
    }

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }

    return "";
  } catch {
    return "";
  }
}

function loadYouTubeApi() {
  return new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

export const YouTubePlayer = forwardRef<
  YouTubePlayerHandle,
  YouTubePlayerProps
>(function YouTubePlayer(
  {
    youtubeUrl,
    isPlaying,
    playbackSeconds,
    playbackUpdatedAt,
    onReady,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerApi | null>(null);
  const lastAppliedSyncRef = useRef<string>("");

  const videoId = getYoutubeVideoId(youtubeUrl);
  const syncCompensationSeconds = 0.35; // Compensación para la latencia de red y procesamiento

  useImperativeHandle(ref, () => ({
    getCurrentTime() {
      const player = playerRef.current;

      if (!player || typeof player.getCurrentTime !== "function") {
        return 0;
      }

      return Number(player.getCurrentTime() || 0);
    },
  }));

  useEffect(() => {
    if (!videoId || !containerRef.current) {
      return;
    }

    let cancelled = false;

    async function setupPlayer() {
      await loadYouTubeApi();

      const Player = window.YT?.Player;

      if (cancelled || !containerRef.current || !Player) {
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new Player(containerRef.current, {
        videoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
        },
        events: {
          onReady: () => {
            onReady?.();
          },
        },
      });
    }

    setupPlayer();

    return () => {
      cancelled = true;
    };
  }, [videoId, onReady]);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || !videoId || !playbackUpdatedAt) {
      return;
    }

    if (lastAppliedSyncRef.current === playbackUpdatedAt) {
      return;
    }

    lastAppliedSyncRef.current = playbackUpdatedAt;

    try {
      const baseSeconds = Number(playbackSeconds || 0);
      const updatedAtTime = new Date(playbackUpdatedAt).getTime();
      const nowTime = Date.now();

      const elapsedSeconds = Math.max(0, (nowTime - updatedAtTime) / 1000);
      const correctedSeconds = isPlaying
        ? baseSeconds + elapsedSeconds + syncCompensationSeconds
        : baseSeconds;

      player.seekTo(correctedSeconds, true);

      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch (error) {
      console.error("No se pudo sincronizar el reproductor:", error);
    }
  }, [videoId, isPlaying, playbackSeconds, playbackUpdatedAt]);

  if (!videoId) {
    return <p>Todavía no hay video válido.</p>;
  }

  return <div className="youtube-frame" ref={containerRef} />;
});