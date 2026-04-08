import type { Tile as TileType } from '../types';

interface TileProps {
  tile: TileType;
  selectable: boolean;
  onClick: () => void;
}

const TILE_WIDTH = 82;
const TILE_HEIGHT = 112;
const DEPTH_OFFSET = 11;

function renderDotsTile(value: number) {
  const dotPatterns: Record<number, number[]> = {
    0: [1],
    1: [2],
    2: [3],
    3: [2, 2],
    4: [2, 1, 2],
    5: [2, 2, 2],
    6: [2, 1, 1, 2],
    7: [2, 2, 2, 2],
    8: [3, 3, 3],
  };

  const palette = ['mahjong-dot--red', 'mahjong-dot--green', 'mahjong-dot--blue'];
  const rows = dotPatterns[value] ?? [1];
  let dotIndex = 0;

  return (
    <span className="mahjong-glyph mahjong-glyph--dots" aria-hidden="true">
      {rows.map((count, rowIndex) => (
        <span key={`row-${value}-${rowIndex}`} className="mahjong-dots-row">
          {Array.from({ length: count }, () => {
            const className = palette[dotIndex % palette.length];
            dotIndex += 1;

            return <span key={`dot-${value}-${rowIndex}-${dotIndex}`} className={`mahjong-dot ${className}`} />;
          })}
        </span>
      ))}
    </span>
  );
}

function renderBambooTile(value: number) {
  if (value === 0) {
    return (
      <span className="mahjong-glyph mahjong-glyph--bamboo mahjong-glyph--special" aria-hidden="true">
        <span className="mahjong-chinese mahjong-chinese--accent">{'\u96C0'}</span>
      </span>
    );
  }

  const rows = value < 3 ? [value + 1] : [2, Math.max(1, value - 1)];

  return (
    <span className="mahjong-glyph mahjong-glyph--bamboo" aria-hidden="true">
      {rows.map((count, rowIndex) => (
        <span key={`bamboo-row-${value}-${rowIndex}`} className="mahjong-bamboo-row">
          {Array.from({ length: count }, (_, stemIndex) => (
            <span key={`bamboo-${value}-${rowIndex}-${stemIndex}`} className="mahjong-bamboo-stick">
              <span className="mahjong-bamboo-stick__top" />
              <span className="mahjong-bamboo-stick__body" />
              <span className="mahjong-bamboo-stick__bottom" />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function renderCharacterTile(value: number) {
  const numerals = ['\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D', '\u4E03', '\u516B', '\u4E5D'];

  return (
    <span className="mahjong-glyph mahjong-glyph--chars" aria-hidden="true">
      <span className="mahjong-chinese mahjong-chinese--number">{numerals[value] ?? numerals[0]}</span>
      <span className="mahjong-chinese mahjong-chinese--main">{'\u842C'}</span>
    </span>
  );
}

function renderWindTile(value: number) {
  const winds = ['\u6771', '\u5357', '\u897F', '\u5317'];

  return (
    <span className="mahjong-glyph mahjong-glyph--honor" aria-hidden="true">
      <span className="mahjong-chinese mahjong-chinese--honor">{winds[value] ?? winds[0]}</span>
    </span>
  );
}

function renderDragonTile(value: number) {
  const dragons = [
    { symbol: '\u4E2D', className: 'mahjong-chinese--red' },
    { symbol: '\u767C', className: 'mahjong-chinese--green' },
    { symbol: '\u767D', className: 'mahjong-chinese--plain' },
  ];

  return (
    <span className="mahjong-glyph mahjong-glyph--honor" aria-hidden="true">
      <span className={`mahjong-chinese mahjong-chinese--honor ${dragons[value]?.className ?? ''}`}>
        {dragons[value]?.symbol ?? '\u767D'}
      </span>
    </span>
  );
}

function renderFlowerOrSeasonTile(category: string, value: number) {
  const symbols =
    category === 'flowers'
      ? ['\u6885', '\u862D', '\u83CA', '\u7AF9']
      : ['\u6625', '\u590F', '\u79CB', '\u51AC'];

  return (
    <span className="mahjong-glyph mahjong-glyph--honor" aria-hidden="true">
      <span className="mahjong-chinese mahjong-chinese--honor mahjong-chinese--accent">
        {symbols[value] ?? symbols[0]}
      </span>
    </span>
  );
}

function renderTileFace(tile: TileType) {
  const category = tile.category ?? 'memory';
  const value = tile.value ?? 0;
  const label = tile.label ?? tile.symbol;

  switch (category) {
    case 'dots':
      return renderDotsTile(value);
    case 'bamboo':
      return renderBambooTile(value);
    case 'chars':
      return renderCharacterTile(value);
    case 'winds':
      return renderWindTile(value);
    case 'dragons':
      return renderDragonTile(value);
    case 'flowers':
    case 'seasons':
      return renderFlowerOrSeasonTile(category, value);
    default:
      return (
        <span className="mahjong-glyph mahjong-glyph--honor" aria-hidden="true">
          <span className="mahjong-chinese mahjong-chinese--honor">{label}</span>
        </span>
      );
  }
}

function Tile({ tile, selectable, onClick }: TileProps) {
  const x = tile.x ?? 0;
  const y = tile.y ?? 0;
  const z = tile.z ?? 0;
  const category = tile.category ?? 'memory';
  const value = tile.value ?? 0;

  return (
    <button
      type="button"
      className={`tile tile--${category} ${
        tile.isSelected ? 'tile--selected' : ''
      } ${tile.isHinted ? 'tile--hinted' : ''} ${!selectable ? 'tile--blocked' : ''}`}
      onClick={onClick}
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        left: x * (TILE_WIDTH * 0.92),
        top: y * (TILE_HEIGHT * 0.82) - z * DEPTH_OFFSET,
        zIndex: z * 100 + Math.round(y * 10),
      }}
    >
      <span className="tile__shadow" />
      <span className="tile__depth" />
      <span className="tile__face" aria-label={`Ficha ${category} ${value + 1}`}>
        {renderTileFace(tile)}
      </span>
    </button>
  );
}

export default Tile;
