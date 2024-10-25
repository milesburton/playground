// src/components/PoolGame.tsx
import { useEffect, useRef } from 'react';
import { GameSetup } from '../game/gameSetup';
import { TABLE_CONFIG } from '../game/types';

const PoolGame = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameSetup>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Create new game instance
    gameRef.current = new GameSetup(canvas, context, TABLE_CONFIG);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={TABLE_CONFIG.width}
        height={TABLE_CONFIG.height}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          margin: '0 auto',
          backgroundColor: '#1a1a1a',
        }}
      />
    </div>
  );
};

export default PoolGame;