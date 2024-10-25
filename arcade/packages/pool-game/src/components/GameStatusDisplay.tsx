// src/components/GameStatusDisplay.tsx
import React from 'react';
import { GameState } from '../game/types';
import './GameStatusDisplay.css'; // Create this CSS file

interface GameStatusDisplayProps {
    gameState: GameState;
}

const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ gameState }) => {
    const getPlayerTypeDisplay = (playerNumber: 1 | 2) => {
        const type = playerNumber === 1 ? gameState.player1Type : gameState.player2Type;
        if (!type) return '< OPEN >';
        return `< ${type.toUpperCase()} >`;
    };

    const getStatusMessage = () => {
        if (gameState.gameOver) {
            return `★ PLAYER ${gameState.winner} WINS! ★`;
        }
        if (gameState.isBreakShot) {
            return '★ BREAK SHOT ★';
        }
        return `PLAYER ${gameState.currentPlayer} SHOOTING`;
    };

    return (
        <div className="arcade-display">
            <div className="scanline"></div>
            <div className="crt-overlay"></div>

            <div className="grid grid-cols-3 gap-4 p-4 relative">
                {/* Player 1 Section */}
                <div className={`text-center p-2 rounded ${
                    gameState.currentPlayer === 1
                        ? 'active-player'
                        : ''
                }`}>
                    <div className="text-lg mb-2">PLAYER-1</div>
                    <div className="text-sm tracking-wider">
                        {getPlayerTypeDisplay(1)}
                    </div>
                </div>

                {/* Center Status Section */}
                <div className="text-center flex flex-col justify-center">
                    <div className={`text-xl tracking-wider ${
                        gameState.gameOver
                            ? 'game-over'
                            : gameState.isBreakShot
                                ? 'break-shot'
                                : 'normal-shot'
                    }`}>
                        {getStatusMessage()}
                    </div>
                </div>

                {/* Player 2 Section */}
                <div className={`text-center p-2 rounded ${
                    gameState.currentPlayer === 2
                        ? 'active-player'
                        : ''
                }`}>
                    <div className="text-lg mb-2">PLAYER-2</div>
                    <div className="text-sm tracking-wider">
                        {getPlayerTypeDisplay(2)}
                    </div>
                </div>
            </div>

            {/* Power Meter */}
            {gameState.isShooting && (
                <div className="power-meter-container">
                    <div className="power-meter">
                        <div className="power-bar"
                            style={{ width: `${gameState.cuePower * 100}%` }}>
                            <div className="power-gradient"></div>
                        </div>
                        <div className="power-markers">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="marker"></div>
                            ))}
                        </div>
                    </div>
                    <div className="power-text">
                        POWER: {Math.round(gameState.cuePower * 100)}%
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameStatusDisplay;