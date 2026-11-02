// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const BRICK_TYPES = {
  standard: { hits: 1, marker: "1", reward: 1 },
  reinforced: { hits: 2, marker: "2", reward: 2 },
  armored: { hits: 3, marker: "3", reward: 4 },
  coin: { hits: 1, marker: "$", reward: 12 },
  life: { hits: 1, marker: "+", reward: 2 },
  enemy: { hits: 1, marker: "E", reward: 1 },
  power: { hits: 1, marker: "P", reward: 1 },
  vein: { hits: 1, marker: "V", reward: 3 },
  glow: { hits: 1, marker: "*", reward: 5 },
  electric: { hits: 1, marker: "!", reward: 2 },
  cold: { hits: 1, marker: "C", reward: 2 },
  hot: { hits: 1, marker: "H", reward: 2 },
  noise: { hits: 1, marker: "N", reward: 2 },
  distortion: { hits: 1, marker: "~", reward: 2 },
  multi: { hits: 1, marker: "B", reward: 3 }
};
const SPECIAL_BRICKS = {
  0: "glow", 2: "coin", 4: "electric", 7: "cold",
  10: "life", 12: "power", 15: "hot", 17: "enemy",
  20: "vein", 23: "multi", 26: "noise", 29: "distortion"
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
      const index = row * BRICK_COLUMNS + col;
      const kind = SPECIAL_BRICKS[index] || ((index + wave) % 11 === 0
        ? "armored"
        : (index + wave) % 4 === 0
          ? "reinforced"
          : "standard");
      const variant = BRICK_TYPES[kind];

      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        row,
        kind,
        hits: variant.hits,
        maxHits: variant.hits,
        marker: variant.marker,
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
    if (brick.kind === "glow") {
      ctx.shadowColor = PALETTE.bricks[brick.row];
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = PALETTE.bricks[brick.row];
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(9, 12, 14, 0.52)";
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x + .5, brick.y + .5, brick.width - 1, brick.height - 1);

    ctx.fillStyle = PALETTE.paddle;
    ctx.font = "10px Space Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brick.marker, brick.x + brick.width / 2, brick.y + brick.height / 2);
  }
}