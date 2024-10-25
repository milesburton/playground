import { useEffect, useRef, useState } from "react";
import { updateGame, render } from "../game/gameSetup";

export interface GameState {
  isRunning: boolean;
}

export function useGameLoop(): GameState {
  const [isRunning, setIsRunning] = useState(true);
  const frameRef = useRef<number>();

  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      frameRef.current = requestAnimationFrame(gameLoop);
    };

    if (isRunning) {
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRunning]);

  return { isRunning };
}
