import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Tank, TankData } from './Tank';
import { io, Socket } from 'socket.io-client';

// Define interfaces for game state
interface Player {
  id: string;
  tank: Tank;
}

interface Obstacle {
  sprite: PIXI.Sprite;
  type: 'tree' | 'sand' | 'river';
  gridX: number;
  gridY: number;
}

// Define constants
const GRID_SIZE = 10;
const TILE_SIZE = 64;
const TURN_DURATION = 60000; // 60 seconds

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(TURN_DURATION);

  // Game state
  const playersRef = useRef<{ [id: string]: Player }>({});
  const obstaclesRef = useRef<Obstacle[]>([]);
  const appRef = useRef<PIXI.Application>();

  useEffect(() => {
    // Initialize Socket.IO client
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    // Initialize PixiJS application
    const app = new PIXI.Application({ width: 800, height: 600 });
    appRef.current = app;

    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view);
    }

    // Load assets
    PIXI.Loader.shared
      .add('tank', '/assets/tank.png')
      .add('tree', '/assets/tree.png')
      .add('sand', '/assets/sand.png')
      .add('river', '/assets/river.png')
      .load(() => {
        // Start the game after assets are loaded
        initializeGame(newSocket, app);
      });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      app.destroy(true, true);
    };
  }, []);

  const initializeGame = (socket: Socket, app: PIXI.Application) => {
    // Listen for game events
    socket.on('init', (data: { playerId: string; players: TankData[]; obstacles: any[]; currentTurn: string }) => {
      setCurrentPlayerId(data.playerId);
      createPlayers(data.players, app);
      createObstacles(data.obstacles, app);
      setIsMyTurn(data.currentTurn === data.playerId);
      startTurnTimer(data.currentTurn === data.playerId ? TURN_DURATION : 0);
    });

    socket.on('playerJoined', (data: TankData) => {
      addPlayer(data, app);
    });

    socket.on('playerMoved', (data: TankData) => {
      movePlayer(data);
    });

    socket.on('playerFired', (data: { playerId: string; direction: string }) => {
      handlePlayerFire(data);
    });

    socket.on('turnChanged', (data: { currentTurn: string; timeRemaining: number }) => {
      setIsMyTurn(data.currentTurn === currentPlayerId);
      startTurnTimer(data.timeRemaining);
    });

    socket.on('playerDisconnected', (data: { playerId: string }) => {
      removePlayer(data.playerId);
    });

    // Notify the server that the player is ready
    socket.emit('ready');
  };

  const createPlayers = (playersData: TankData[], app: PIXI.Application) => {
    playersData.forEach((data) => {
      addPlayer(data, app);
    });
  };

  const addPlayer = (data: TankData, app: PIXI.Application) => {
    const tank = new Tank(data, app);
    playersRef.current[data.playerId] = { id: data.playerId, tank };
    app.stage.addChild(tank.sprite);
  };

  const movePlayer = (data: TankData) => {
    const player = playersRef.current[data.playerId];
    if (player) {
      player.tank.updatePosition(data.gridX, data.gridY);
      player.tank.updateDirection(data.direction);
    }
  };

  const handlePlayerFire = (data: { playerId: string; direction: string }) => {
    const player = playersRef.current[data.playerId];
    if (player) {
      player.tank.fire(data.direction, playersRef.current, obstaclesRef.current);
    }
  };

  const removePlayer = (playerId: string) => {
    const player = playersRef.current[playerId];
    if (player) {
      appRef.current?.stage.removeChild(player.tank.sprite);
      delete playersRef.current[playerId];
    }
  };

  const createObstacles = (obstaclesData: any[], app: PIXI.Application) => {
    obstaclesData.forEach((data) => {
      const obstacleTexture = PIXI.Loader.shared.resources[data.type].texture!;
      const sprite = new PIXI.Sprite(obstacleTexture);

      const { x, y } = gridToIsometric(data.gridX, data.gridY);
      sprite.x = x;
      sprite.y = y;
      sprite.anchor.set(0.5);

      obstaclesRef.current.push({
        sprite,
        type: data.type,
        gridX: data.gridX,
        gridY: data.gridY,
      });

      app.stage.addChild(sprite);
    });
  };

  const gridToIsometric = (gridX: number, gridY: number) => {
    const centerX = appRef.current!.screen.width / 2;
    const x = (gridX - gridY) * (TILE_SIZE / 2) + centerX;
    const y = (gridX + gridY) * (TILE_SIZE / 4);
    return { x, y };
  };

  // Handle player input
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isMyTurn) return;

    const player = playersRef.current[currentPlayerId!];
    if (!player) return;

    let moved = false;
    let fired = false;
    let newDirection = player.tank.direction;

    switch (event.key) {
      case 'ArrowUp':
        moved = player.tank.move(0, -1, obstaclesRef.current, playersRef.current);
        newDirection = 'north';
        break;
      case 'ArrowDown':
        moved = player.tank.move(0, 1, obstaclesRef.current, playersRef.current);
        newDirection = 'south';
        break;
      case 'ArrowLeft':
        moved = player.tank.move(-1, 0, obstaclesRef.current, playersRef.current);
        newDirection = 'west';
        break;
      case 'ArrowRight':
        moved = player.tank.move(1, 0, obstaclesRef.current, playersRef.current);
        newDirection = 'east';
        break;
      case ' ':
        fired = true;
        break;
      default:
        break;
    }

    if (moved) {
      socket?.emit('move', {
        playerId: currentPlayerId,
        gridX: player.tank.gridX,
        gridY: player.tank.gridY,
        direction: newDirection,
      });
      endTurn();
    } else if (fired) {
      player.tank.fire(newDirection, playersRef.current, obstaclesRef.current);
      socket?.emit('fire', {
        playerId: currentPlayerId,
        direction: newDirection,
      });
      endTurn();
    }
  };

  const endTurn = () => {
    setIsMyTurn(false);
    socket?.emit('endTurn');
  };

  const startTurnTimer = (duration: number) => {
    setRemainingTime(duration);

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          if (isMyTurn) {
            endTurn();
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  // Attach keydown listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMyTurn, currentPlayerId]);

  // Render UI elements
  return (
    <div>
      <div ref={canvasRef}></div>
      <div className="ui-overlay">
        {isMyTurn ? <p>Your Turn</p> : <p>Waiting for other player...</p>}
        <p>Time Remaining: {Math.ceil(remainingTime / 1000)}s</p>
      </div>
    </div>
  );
};

export default Game;
