interface StatCardsProps {
  remainingTiles: number;
  availablePairs: number;
  combo: number;
  accuracy: number;
  score: number;
  timeLabel: string;
}

function StatCards({
  remainingTiles,
  availablePairs,
  combo,
  accuracy,
  score,
  timeLabel,
}: StatCardsProps) {
  const cards = [
    { label: 'Puntaje', value: score },
    { label: 'Tiempo', value: timeLabel },
    { label: 'Fichas', value: remainingTiles },
    { label: 'Parejas', value: availablePairs },
    { label: 'Combo', value: `x${combo}` },
    { label: 'Precision', value: `${accuracy}%` },
  ];

  return (
    <section className="stats-grid">
      {cards.map((card) => (
        <article key={card.label} className="panel stat-card">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default StatCards;
