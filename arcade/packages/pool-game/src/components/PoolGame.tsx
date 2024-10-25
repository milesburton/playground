// src/components/PoolGame.tsx
import { useEffect, useRef, useState } from 'react';
import { GameSetup } from '../game/gameSetup';
import { GameState, TABLE_CONFIG } from '../game/types';
import GameStatusDisplay from './GameStatusDisplay';

const PoolGame = (): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<GameSetup>();
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Initialize game with config
        gameRef.current = new GameSetup(
            canvas,
            context,
            TABLE_CONFIG
        );

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
                {/* Pool Table Canvas */}
                <canvas
                    ref={canvasRef}
                    width={TABLE_CONFIG.width}
                    height={TABLE_CONFIG.height}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                    }}
                />

                {/* Game Status Display */}
                {gameState && <GameStatusDisplay gameState={gameState} />}
            </div>
        </div>
    );
};

export default PoolGame;