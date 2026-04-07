import type { ScreenState } from '../types';

interface LobbyProps {
  screen: ScreenState;
  playerName: string;
  tempName: string;
  setTempName: (value: string) => void;
  roomName: string;
  setRoomName: (value: string) => void;
  roomCode: string;
  inputCode: string;
  setInputCode: (value: string) => void;
  playerCount: number;
  setPlayerCount: (value: number) => void;
  currentPlayers: number;
  loadingProgress: number;
  isCopied: boolean;
  onConfirmName: () => void;
  onSelectCreate: () => void;
  onSelectJoin: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onCopyCode: () => void;
  onStartMatch: () => void;
  onBackToMenu?: () => void;
}

const playerOptions = [1, 2, 3, 4];

function Lobby({
  screen,
  playerName,
  tempName,
  setTempName,
  roomName,
  setRoomName,
  roomCode,
  inputCode,
  setInputCode,
  playerCount,
  setPlayerCount,
  currentPlayers,
  loadingProgress,
  isCopied,
  onConfirmName,
  onSelectCreate,
  onSelectJoin,
  onCreateRoom,
  onJoinRoom,
  onCopyCode,
  onStartMatch,
  onBackToMenu,
}: LobbyProps) {
  if (screen === 'welcome') {
    return (
      <section className="panel panel--centered welcome-panel">
        <div className="panel__eyebrow">Mahjong Coop</div>
        <h1>Bienvenido a la mesa cooperativa</h1>
        <p>Ingresa tu nombre para entrar al flujo de partida.</p>
        <input
          className="field"
          type="text"
          value={tempName}
          placeholder="Tu nombre"
          onChange={(event) => setTempName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && tempName.trim()) {
              onConfirmName();
            }
          }}
        />
        <button className="button button--primary" onClick={onConfirmName} disabled={!tempName.trim()}>
          Continuar
        </button>
      </section>
    );
  }

  if (screen === 'menu') {
    return (
      <section className="panel panel--centered menu-panel">
        <div className="panel__eyebrow">Hola, {playerName || 'Jugador'}</div>
        <h1>Prepara una partida</h1>
        <p>Elige si quieres crear una sala o unirte a una ya existente.</p>
        <div className="player-count-picker">
          <span>Jugadores</span>
          <div className="pill-row">
            {playerOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`pill ${playerCount === option ? 'pill--active' : ''}`}
                onClick={() => setPlayerCount(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="cta-grid">
          <button className="button button--primary" onClick={onSelectCreate}>
            Crear sala
          </button>
          <button className="button button--ghost" onClick={onSelectJoin}>
            Unirme con codigo
          </button>
        </div>
      </section>
    );
  }

  if (screen === 'matchmaking') {
    return (
      <section className="panel panel--centered matchmaking-panel">
        <div className="panel__eyebrow">Configuracion</div>
        <h1>{roomCode ? 'Unirse a sala' : 'Crear una nueva sala'}</h1>
        {!roomCode ? (
          <>
            <p>Define un nombre para tu mesa.</p>
            <input
              className="field"
              type="text"
              value={roomName}
              placeholder="Nombre de la sala"
              onChange={(event) => setRoomName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && roomName.trim()) {
                  onCreateRoom();
                }
              }}
            />
            <button className="button button--primary" onClick={onCreateRoom} disabled={!roomName.trim()}>
              Generar codigo
            </button>
          </>
        ) : null}
        {roomCode ? null : (
          <button className="button button--ghost" onClick={onBackToMenu}>
            Volver
          </button>
        )}
        {!roomCode && <div className="divider">o</div>}
        {!roomCode && (
          <>
            <p>Si ya tienes codigo, usalo aqui.</p>
            <input
              className="field field--code"
              type="text"
              maxLength={6}
              value={inputCode}
              placeholder="ABC123"
              onChange={(event) => setInputCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && inputCode.trim().length === 6) {
                  onJoinRoom();
                }
              }}
            />
            <button className="button button--secondary" onClick={onJoinRoom} disabled={inputCode.trim().length !== 6}>
              Entrar a la sala
            </button>
          </>
        )}
      </section>
    );
  }

  if (screen === 'lobby') {
    return (
      <section className="panel panel--centered lobby-panel">
        <div className="panel__eyebrow">Sala lista</div>
        <h1>{roomName}</h1>
        <div className="room-code-card">
          <span>Codigo</span>
          <strong>{roomCode}</strong>
          <button className="button button--ghost" onClick={onCopyCode}>
            {isCopied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <div className="status-list">
          <div>
            <span>Jugadores conectados</span>
            <strong>
              {currentPlayers}/{playerCount}
            </strong>
          </div>
          <div>
            <span>Anfitrion</span>
            <strong>{playerName}</strong>
          </div>
        </div>
        <button
          className="button button--primary"
          onClick={onStartMatch}
          disabled={currentPlayers !== playerCount}
        >
          Iniciar partida
        </button>
        <button className="button button--ghost" onClick={onBackToMenu}>
          Cancelar
        </button>
      </section>
    );
  }

  if (screen === 'loading') {
    return (
      <section className="panel panel--centered loading-panel">
        <div className="panel__eyebrow">Cargando mesa</div>
        <h1>Preparando tablero cooperativo</h1>
        <p>Sincronizando fichas, jugadores y estadisticas en vivo.</p>
        <div className="progress">
          <div className="progress__bar" style={{ width: `${loadingProgress}%` }} />
        </div>
        <strong>{loadingProgress}%</strong>
      </section>
    );
  }

  return null;
}

export default Lobby;
