import React from 'react';

const LiveChart: React.FC = () => (
  <div className="chart-container">
    <h4>Team Match Velocity</h4>
    <svg viewBox="0 0 400 100" className="mini-chart">
      <path d="M0 80 Q 50 20, 100 70 T 200 40 T 300 60 T 400 20" fill="none" stroke="#10b981" strokeWidth="3" />
      <rect x="0" y="0" width="400" height="100" fill="url(#grad)" opacity="0.1" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default LiveChart;