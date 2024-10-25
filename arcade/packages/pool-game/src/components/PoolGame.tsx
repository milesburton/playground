// src/components/PoolGame.tsx
import React, { useEffect, useRef, useState } from 'react';
import { GameSetup } from '../game/gameSetup';
import { GameState, TABLE_CONFIG } from '../game/types';
import GameStatusDisplay from './GameStatusDisplay';
import '../index.css'; // Import Tailwind CSS


const PoolGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameSetup | undefined>();
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Initialize game with config
    gameRef.current = new GameSetup(canvas, context, TABLE_CONFIG);

    // Set up state update interval
    const stateUpdateInterval = setInterval(() => {
      if (gameRef.current) {
        const currentState = gameRef.current.getGameState();
        setGameState(currentState);
      }
    }, 1000 / 60); // Update at 60fps

    // Cleanup function
    return () => {
      clearInterval(stateUpdateInterval);
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = undefined;
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        {/* Pinball-Style Header */}
        <h1 className="font-pinball text-5xl text-center text-white py-4 text-shadow-pinball">
          English Pool
        </h1>

        {/* Pool Table Canvas */}
        <div className="relative w-full pb-[50%]">
          <canvas
            ref={canvasRef}
            width={TABLE_CONFIG.width}
            height={TABLE_CONFIG.height}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        {/* Game Status Display */}
        {gameState && <GameStatusDisplay gameState={gameState} />}
      </div>
    </div>
  );
};

export default PoolGame;
