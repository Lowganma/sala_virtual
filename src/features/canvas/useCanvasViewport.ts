import { useCallback, useMemo, useState } from "react";

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type UseCanvasViewportOptions = {
  minZoom: number;
  maxZoom: number;
  worldWidth: number;
  worldHeight: number;
};

export function useCanvasViewport({
  minZoom,
  maxZoom,
  worldWidth,
  worldHeight,
}: UseCanvasViewportOptions) {
  const [view, setView] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const clampPan = useCallback(
    (
      panX: number,
      panY: number,
      zoom: number,
      viewportWidth: number,
      viewportHeight: number
    ) => {
      const minPanX = Math.min(0, viewportWidth - worldWidth * zoom);
      const minPanY = Math.min(0, viewportHeight - worldHeight * zoom);

      return {
        panX: clamp(panX, minPanX, 0),
        panY: clamp(panY, minPanY, 0),
      };
    },
    [worldWidth, worldHeight]
  );

  const zoomAtPoint = useCallback(
    ({
      deltaY,
      cursorX,
      cursorY,
      viewportWidth,
      viewportHeight,
    }: {
      deltaY: number;
      cursorX: number;
      cursorY: number;
      viewportWidth: number;
      viewportHeight: number;
    }) => {
      setView((previousView) => {
        const nextZoom = clamp(
          previousView.zoom * (deltaY > 0 ? 0.9 : 1.1),
          minZoom,
          maxZoom
        );

        const worldX = (cursorX - previousView.panX) / previousView.zoom;
        const worldY = (cursorY - previousView.panY) / previousView.zoom;

        const rawPanX = cursorX - worldX * nextZoom;
        const rawPanY = cursorY - worldY * nextZoom;

        return {
          zoom: nextZoom,
          ...clampPan(
            rawPanX,
            rawPanY,
            nextZoom,
            viewportWidth,
            viewportHeight
          ),
        };
      });
    },
    [clampPan, minZoom, maxZoom]
  );

  const panByPointerDrag = useCallback(
    ({
      pointerStartX,
      pointerStartY,
      panStartX,
      panStartY,
      clientX,
      clientY,
      viewportWidth,
      viewportHeight,
    }: {
      pointerStartX: number;
      pointerStartY: number;
      panStartX: number;
      panStartY: number;
      clientX: number;
      clientY: number;
      viewportWidth: number;
      viewportHeight: number;
    }) => {
      setView((previousView) => {
        const nextPanX = panStartX + (clientX - pointerStartX);
        const nextPanY = panStartY + (clientY - pointerStartY);

        return {
          ...previousView,
          ...clampPan(
            nextPanX,
            nextPanY,
            previousView.zoom,
            viewportWidth,
            viewportHeight
          ),
        };
      });
    },
    [clampPan]
  );

  const zoomIn = useCallback(() => {
    setView((previousView) => ({
      ...previousView,
      zoom: clamp(previousView.zoom * 1.1, minZoom, maxZoom),
    }));
  }, [minZoom, maxZoom]);

  const zoomOut = useCallback(() => {
    setView((previousView) => ({
      ...previousView,
      zoom: clamp(previousView.zoom * 0.9, minZoom, maxZoom),
    }));
  }, [minZoom, maxZoom]);

  const resetView = useCallback(() => {
    setView({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  }, []);

  return useMemo(
    () => ({
      view,
      zoomAtPoint,
      panByPointerDrag,
      zoomIn,
      zoomOut,
      resetView,
    }),
    [view, zoomAtPoint, panByPointerDrag, zoomIn, zoomOut, resetView]
  );
}