// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks() {
  const list = [];

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        row,
        Shaded: { ...Shaded, shade: 80 + row * 40 }
      });
    }
  }

  return list;
}

//Renders bricks using the data in their Shaded component.
function drawBrickSystem() {
  for (const brick of bricks) {
    ctx.fillStyle = PALETTE.bricks[brick.row];
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.strokeStyle = "rgba(9, 12, 14, 0.52)";
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x + .5, brick.y + .5, brick.width - 1, brick.height - 1);
  }
}