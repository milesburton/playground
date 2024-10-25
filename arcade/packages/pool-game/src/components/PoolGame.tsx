import { useEffect, useRef } from "react";
import { setupGame } from "../game/gameSetup";
import { useGameLoop } from "../hooks/useGameLoop";

const PoolGame = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useGameLoop();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setupGame(canvas, context);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{ maxWidth: "100%" }}
    />
  );
};

export default PoolGame;
