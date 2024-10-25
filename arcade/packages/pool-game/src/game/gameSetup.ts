import { drawTable } from "./render";

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
}
