export function drawTable(ctx: CanvasRenderingContext2D): void {
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
}
