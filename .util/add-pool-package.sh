#!/usr/bin/env fish

function setup_pool_game
    # Create the package directory
    mkdir -p packages/pool-game
    cd packages/pool-game

    # Initialize package.json
    set -l package_content '{
  "name": "@internal/pool-game",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"**/*.{ts,tsx,css,html}\"",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@internal/config": "workspace:*",
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}'
    echo $package_content > package.json

    # Create tsconfig.json
    set -l tsconfig '{
  "extends": "@internal/config/tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}'
    echo $tsconfig > tsconfig.json

    # Create tsconfig.node.json
    set -l tsconfig_node '{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}'
    echo $tsconfig_node > tsconfig.node.json

    # Create vite.config.ts
    set -l vite_config 'import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});'
    echo $vite_config > vite.config.ts

    # Create source directory structure
    mkdir -p src/{components,game,hooks,utils}

    # Create index.html
    set -l index_html '<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>English Pool</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>'
    echo $index_html > index.html

    # Create initial game files
    # Main entry point
    set -l main_tsx 'import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);'
    echo $main_tsx > src/main.tsx

    # App component
    set -l app_tsx 'import PoolGame from "./components/PoolGame";

function App(): JSX.Element {
  return (
    <div className="app">
      <h1>English Pool</h1>
      <PoolGame />
    </div>
  );
}

export default App;'
    echo $app_tsx > src/App.tsx

    # Base CSS
    set -l index_css 'body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

canvas {
  border: 2px solid #333;
  background-color: #0a4d1c;
}'
    echo $index_css > src/index.css

    # Create game components
    set -l pool_game_tsx 'import { useEffect, useRef } from "react";
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

export default PoolGame;'
    echo $pool_game_tsx > src/components/PoolGame.tsx

    # Create game setup
    set -l game_setup_ts 'import { drawTable } from "./render";

export function setupGame(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
): void {
  // Set up initial game state
  drawTable(context);
}

export function updateGame(): void {
  // Update game state
}

export function render(context: CanvasRenderingContext2D): void {
  // Render game state
  drawTable(context);
}'
    echo $game_setup_ts > src/game/gameSetup.ts

    # Create render utilities
    set -l render_ts 'export function drawTable(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw table felt
  ctx.fillStyle = "#0a4d1c";
  ctx.fillRect(0, 0, width, height);

  // Draw cushions
  ctx.fillStyle = "#8B4513";
  const cushionWidth = 20;

  // Top cushion
  ctx.fillRect(0, 0, width, cushionWidth);
  // Bottom cushion
  ctx.fillRect(0, height - cushionWidth, width, cushionWidth);
  // Left cushion
  ctx.fillRect(0, 0, cushionWidth, height);
  // Right cushion
  ctx.fillRect(width - cushionWidth, 0, cushionWidth, height);

  // Draw pockets
  const pocketRadius = 15;
  ctx.fillStyle = "#000000";

  // Top-left pocket
  ctx.beginPath();
  ctx.arc(cushionWidth, cushionWidth, pocketRadius, 0, Math.PI * 2);
  ctx.fill();

  // Top-right pocket
  ctx.beginPath();
  ctx.arc(width - cushionWidth, cushionWidth, pocketRadius, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-left pocket
  ctx.beginPath();
  ctx.arc(cushionWidth, height - cushionWidth, pocketRadius, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-right pocket
  ctx.beginPath();
  ctx.arc(width - cushionWidth, height - cushionWidth, pocketRadius, 0, Math.PI * 2);
  ctx.fill();
}'
    echo $render_ts > src/game/render.ts

    # Create game hook
    set -l use_game_loop_ts 'import { useEffect, useRef, useState } from "react";
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
}'
    echo $use_game_loop_ts > src/hooks/useGameLoop.ts

    # Update turbo.json in root to include dev command
    cd ../..
    set -l turbo_content (cat turbo.json | jq '.tasks.dev += {"persistent": true}')
    echo $turbo_content > turbo.json

    # Install dependencies
    pnpm install

    echo "✨ Pool game package has been set up!"
    echo "You can now run:"
    echo "- pnpm dev : Start the development server"
    echo "- pnpm build : Build the application"
    echo "- pnpm lint : Lint the code"
    echo "- pnpm format : Format the code"
end

setup_pool_game
