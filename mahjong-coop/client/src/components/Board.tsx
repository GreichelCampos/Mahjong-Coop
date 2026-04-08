import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Tile from './Tile';
import type { TableTheme, Tile as TileType } from '../types';

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 780;
const TILE_WIDTH = 82;
const TILE_HEIGHT = 112;
const TILE_X_STEP = TILE_WIDTH * 0.92;
const TILE_Y_STEP = TILE_HEIGHT * 0.82;
const DEPTH_OFFSET = 11;
const VISUAL_CENTER_BLEND = 0;
const VISUAL_BIAS_X = 0;
const VISUAL_BIAS_Y = 0;

interface BoardProps {
  tiles: TileType[];
  onTileClick: (id: number) => void;
  isSelectable: (tile: TileType) => boolean;
  theme: TableTheme;
}

function Board({ tiles, onTileClick, isSelectable, theme }: BoardProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [boardScale, setBoardScale] = useState(1);
  const activeTiles = tiles.filter((tile) => !tile.isMatched);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) return;

    const updateScale = () => {
      const styles = window.getComputedStyle(frame);
      const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(frame.clientWidth - paddingX, 0);
      const availableHeight = Math.max(frame.clientHeight - paddingY, 0);
      const scale = Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);

      setBoardScale(Number.isFinite(scale) && scale > 0 ? Math.min(scale, 1) : 1);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(frame);

    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const metrics = activeTiles.reduce(
    (accumulator, tile) => {
      const left = (tile.x ?? 0) * TILE_X_STEP;
      const top = (tile.y ?? 0) * TILE_Y_STEP - (tile.z ?? 0) * DEPTH_OFFSET;
      const right = left + TILE_WIDTH;
      const bottom = top + TILE_HEIGHT;
      const centerX = left + TILE_WIDTH / 2;
      const centerY = top + TILE_HEIGHT / 2;

      return {
        minLeft: Math.min(accumulator.minLeft, left),
        minTop: Math.min(accumulator.minTop, top),
        maxRight: Math.max(accumulator.maxRight, right),
        maxBottom: Math.max(accumulator.maxBottom, bottom),
        totalCenterX: accumulator.totalCenterX + centerX,
        totalCenterY: accumulator.totalCenterY + centerY,
        count: accumulator.count + 1,
      };
    },
    {
      minLeft: Number.POSITIVE_INFINITY,
      minTop: Number.POSITIVE_INFINITY,
      maxRight: Number.NEGATIVE_INFINITY,
      maxBottom: Number.NEGATIVE_INFINITY,
      totalCenterX: 0,
      totalCenterY: 0,
      count: 0,
    },
  );

  const hasTiles = activeTiles.length > 0;
  const occupiedWidth = hasTiles ? metrics.maxRight - metrics.minLeft : 0;
  const occupiedHeight = hasTiles ? metrics.maxBottom - metrics.minTop : 0;
  const boundsCenterX = hasTiles ? metrics.minLeft + occupiedWidth / 2 : STAGE_WIDTH / 2;
  const boundsCenterY = hasTiles ? metrics.minTop + occupiedHeight / 2 : STAGE_HEIGHT / 2;
  const massCenterX = hasTiles ? metrics.totalCenterX / metrics.count : STAGE_WIDTH / 2;
  const massCenterY = hasTiles ? metrics.totalCenterY / metrics.count : STAGE_HEIGHT / 2;
  const visualCenterX = boundsCenterX + (massCenterX - boundsCenterX) * VISUAL_CENTER_BLEND;
  const visualCenterY = boundsCenterY + (massCenterY - boundsCenterY) * VISUAL_CENTER_BLEND;
  const idealOffsetX = hasTiles ? STAGE_WIDTH / 2 - visualCenterX + VISUAL_BIAS_X : 0;
  const idealOffsetY = hasTiles ? STAGE_HEIGHT / 2 - visualCenterY + VISUAL_BIAS_Y : 0;
  const minOffsetX = hasTiles ? -metrics.minLeft : 0;
  const maxOffsetX = hasTiles ? STAGE_WIDTH - metrics.maxRight : 0;
  const minOffsetY = hasTiles ? -metrics.minTop : 0;
  const maxOffsetY = hasTiles ? STAGE_HEIGHT - metrics.maxBottom : 0;
  const offsetX = Math.min(Math.max(idealOffsetX, minOffsetX), maxOffsetX);
  const offsetY = Math.min(Math.max(idealOffsetY, minOffsetY), maxOffsetY);

  return (
    <section className="table-shell" style={{ '--table-accent': theme.accent } as CSSProperties}>
      <div className="table-shell__frame" style={{ background: theme.background }}>
        <div className="table-shell__glow" />
        <div className="board-canvas" ref={frameRef}>
          <div
            className="board-scaler"
            style={{
              width: `${STAGE_WIDTH * boardScale}px`,
              height: `${STAGE_HEIGHT * boardScale}px`,
            }}
          >
            <div
              className="board-stage"
              style={{
                transform: `scale(${boardScale})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="board-stage__layout"
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
              >
                {activeTiles.map((tile) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    selectable={isSelectable(tile)}
                    onClick={() => onTileClick(tile.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Board;
