import type { TableTheme } from '../types';

interface ControlBarProps {
  themes: TableTheme[];
  activeThemeId: string;
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onBackToMenu: () => void;
  canUndo: boolean;
  onThemeChange: (theme: TableTheme) => void;
}

function ControlBar({
  themes,
  activeThemeId,
  onNewGame,
  onUndo,
  onHint,
  onShuffle,
  onBackToMenu,
  canUndo,
  onThemeChange,
}: ControlBarProps) {
  return (
    <section className="panel controls-card">
      <div className="panel__eyebrow">Controles</div>
      <div className="controls-grid">
        <button className="button button--secondary" onClick={onNewGame}>
          Nuevo juego
        </button>
        <button className="button button--ghost" onClick={onUndo} disabled={!canUndo}>
          Deshacer
        </button>
        <button className="button button--ghost" onClick={onHint}>
          Pista
        </button>
        <button className="button button--ghost" onClick={onShuffle}>
          Mezclar
        </button>
        <button className="button button--ghost" onClick={onBackToMenu}>
          Salir
        </button>
      </div>
      <div className="theme-picker">
        <span>Tema de mesa</span>
        <div className="pill-row">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-swatch ${theme.id === activeThemeId ? 'theme-swatch--active' : ''}`}
              style={{ background: theme.background }}
              title={theme.name}
              onClick={() => onThemeChange(theme)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ControlBar;
