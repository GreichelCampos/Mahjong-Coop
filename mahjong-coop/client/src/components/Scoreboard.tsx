import type { PlayerStanding } from '../types';

interface ScoreboardProps {
  players: PlayerStanding[];
}

function Scoreboard({ players }: ScoreboardProps) {
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return (
    <section className="panel sidebar-card">
      <div className="panel__eyebrow">Ranking</div>
      <h2>Tabla en vivo</h2>
      <div className="ranking-list">
        {ranking.map((player, index) => (
          <article key={player.name} className={`ranking-row ${player.isCurrentPlayer ? 'ranking-row--me' : ''}`}>
            <div className="ranking-row__identity">
              <span className="ranking-row__place">#{index + 1}</span>
              <span className="ranking-row__dot" style={{ backgroundColor: player.color }} />
              <span>{player.name}</span>
            </div>
            <strong>{player.score}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Scoreboard;
