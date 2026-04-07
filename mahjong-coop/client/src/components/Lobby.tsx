import React, { useState } from 'react';

interface LobbyProps {
  onJoin: (name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');

  return (
    <div className="lobby-overlay">
      <div className="lobby-card">
        <h2>Collaborative Mahjong</h2>
        <p>Enter your name to join the live session</p>
        <input 
          type="text" 
          placeholder="Your Name..." 
          value={name} 
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => name && onJoin(name)}>Join Game</button>
      </div>
    </div>
  );
};

export default Lobby;