// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const BRICK_VARIANTS = {
  standard: { hits: 1, color: "#87989c", reward: 2 },
  reinforced: { hits: 2, color: "#e6c847", reward: 4 },
  armored: { hits: 3, color: "#df8060", reward: 7 }
};

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks() {
  const list = [];

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      const variant = row === 0 && col % 3 === 1
        ? BRICK_VARIANTS.armored
        : (row + col) % 3 === 0
          ? BRICK_VARIANTS.reinforced
          : BRICK_VARIANTS.standard;

      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        row,
        hits: variant.hits,
        maxHits: variant.hits,
        color: variant.color,
        reward: variant.reward,
        Shaded: { ...Shaded, shade: 80 + row * 40 }
      });
    }
  }

  return list;
}

//Renders bricks using the data in their Shaded component.
function drawBrickSystem() {
  for (const brick of bricks) {
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.strokeStyle = "rgba(9, 12, 14, 0.52)";
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x + .5, brick.y + .5, brick.width - 1, brick.height - 1);

    if (brick.hits > 1) {
      ctx.fillStyle = "rgba(9, 12, 14, 0.78)";
      ctx.font = "10px Space Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
  }
}