import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
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
  const hasEnoughData = data.length > 1;

  return (
    <section className="panel chart-card">
      <div className="chart-card__header">
        <div>
          <div className="panel__eyebrow">Metricas</div>
          <h2>Evolucion de puntaje</h2>
        </div>
        <div className="chart-card__badge">
          {hasEnoughData ? `${data.length} muestras` : 'Esperando datos'}
        </div>
      </div>
      <div className="chart-card__body">
        {hasEnoughData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 4 }}>
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}s`}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={34}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.96)',
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: '14px',
                  color: '#e2e8f0',
                  boxShadow: '0 18px 30px rgba(2, 6, 23, 0.35)',
                }}
                labelFormatter={(value) => `Tiempo: ${value}s`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: '8px' }}
              />
              <Area
                type="monotone"
                dataKey={currentPlayerName}
                stroke="none"
                fill="url(#scoreAreaGradient)"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey={currentPlayerName}
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 2, strokeWidth: 0, fill: '#f59e0b' }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#fbbf24' }}
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
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-card__empty">
            <strong>La partida aun no genera suficiente historial.</strong>
            <p>La grafica aparecera automaticamente cuando se acumulen varios cambios de puntaje.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LiveChart;
