import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Opponent, ScorePoint } from '../types';

interface LiveChartProps {
  data: ScorePoint[];
  currentPlayerName: string;
  opponents: Opponent[];
}

function LiveChart({ data, currentPlayerName, opponents }: LiveChartProps) {
  return (
    <section className="panel chart-card">
      <div className="panel__eyebrow">Metricas</div>
      <h2>Evolucion de puntaje</h2>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#9fb2c8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9fb2c8', fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                color: '#e2e8f0',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey={currentPlayerName}
              stroke="#f59e0b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            {opponents.map((opponent) => (
              <Line
                key={opponent.name}
                type="monotone"
                dataKey={opponent.name}
                stroke={opponent.color}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default LiveChart;
