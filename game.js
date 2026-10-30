// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450
const PALETTE = {
  background: "#0c1113",
  grid: "rgba(220, 229, 231, 0.045)",
  paddle: "#dce5e7",
  ball: "#f6df68",
  bricks: ["#56666c", "#84969b", "#b6c4c7", "#e6c847"]
};


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 4;

const ball = {
  x: 0,
  y: 0,
  width: 12,
  height: 12,
  vx: 0,
  vy: 0
};

// Put the ball in the center and reset its speed and direction.
function resetBall() {
  ball.x = WIDTH / 2 - ball.width / 2;
  ball.y = HEIGHT / 2 - ball.height / 2;
  ball.vx = BALL_SPEED;  // right
  ball.vy = BALL_SPEED;  // down
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: 90,
  height: 12,
  speed: 6
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
let score = 0;
let credits = 0;
let wave = 1;
let paused = false;
let shopOpen = false;
let musicEnabled = false;
const upgrades = { paddle: 0, power: 0 };

const shopMenu = document.getElementById("shop-menu");
const shopButton = document.getElementById("shop-button");
const pauseButton = document.getElementById("pause-button");
const musicButton = document.getElementById("music-button");


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  keys[event.key.toLowerCase()] = true;
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }

  if (event.repeat) {
    return;
  }
  if (event.key.toLowerCase() === "p") {
    paused = !paused;
    updateInterface();
  } else if (event.key.toLowerCase() === "r") {
    restartGame();
  } else if (event.key === "Escape" && shopOpen) {
    setShopOpen(false);
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

document.getElementById("shop-close").addEventListener("click", function () {
  setShopOpen(false);
});

shopButton.addEventListener("click", function () {
  setShopOpen(!shopOpen);
});

pauseButton.addEventListener("click", function () {
  paused = !paused;
  updateInterface();
});

document.getElementById("restart-button").addEventListener("click", restartGame);

musicButton.addEventListener("click", function () {
  musicEnabled = !musicEnabled;
  if (!toggleLofiMusic(musicEnabled)) {
    musicEnabled = false;
  }
  updateInterface();
});

document.querySelectorAll("[data-upgrade]").forEach(function (button) {
  button.addEventListener("click", function () {
    purchaseUpgrade(button.dataset.upgrade);
  });
});

function setShopOpen(isOpen) {
  shopOpen = isOpen;
  shopMenu.hidden = !shopOpen;
  shopButton.setAttribute("aria-expanded", String(shopOpen));
  updateInterface();
}

function upgradeCost(type) {
  return type === "paddle" ? 10 + upgrades.paddle * 10 : 20 + upgrades.power * 15;
}

function purchaseUpgrade(type) {
  const maximum = type === "paddle" ? 4 : 2;
  const price = upgradeCost(type);
  if (upgrades[type] >= maximum || credits < price) {
    return;
  }

  credits -= price;
  upgrades[type] += 1;
  if (type === "paddle") {
    paddle.width = 90 + upgrades.paddle * 12;
    paddle.x = Math.min(paddle.x, WIDTH - paddle.width);
  }
  updateInterface();
}

function registerBrickBreak(brick) {
  score += brick.maxHits * 100;
  credits += brick.reward;
  if (bricks.length === 0) {
    wave += 1;
    bricks = makeBricks();
  }
  updateInterface();
}

function restartGame() {
  bricks = makeBricks();
  score = 0;
  credits = 0;
  wave = 1;
  upgrades.paddle = 0;
  upgrades.power = 0;
  paddle.width = 90;
  paddle.x = WIDTH / 2 - paddle.width / 2;
  paused = false;
  setShopOpen(false);
  resetBall();
  updateInterface();
}

function updateInterface() {
  document.getElementById("score-value").textContent = String(score).padStart(4, "0");
  document.getElementById("credits-value").textContent = String(credits).padStart(2, "0");
  document.getElementById("wave-value").textContent = String(wave).padStart(2, "0");
  document.getElementById("game-status").textContent = shopOpen ? "SHOP" : paused ? "PAUSED" : "ACTIVE";
  pauseButton.innerHTML = `${paused ? "RESUME" : "PAUSE"} <kbd>P</kbd>`;
  musicButton.textContent = musicEnabled ? "LOFI ON" : "LOFI OFF";
  musicButton.setAttribute("aria-pressed", String(musicEnabled));

  document.querySelectorAll("[data-upgrade]").forEach(function (button) {
    const type = button.dataset.upgrade;
    const maximum = type === "paddle" ? 4 : 2;
    const price = upgradeCost(type);
    const level = upgrades[type];
    button.querySelector(".upgrade-price").textContent = level === maximum ? "MAX" : `${price} CR`;
    button.querySelector("strong").textContent = `${type === "paddle" ? "WIDE PADDLE" : "IMPACT CORE"} ${level}/${maximum}`;
    button.disabled = level === maximum || credits < price;
  });
}


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  movePaddle();
  moveBall();

  bounceOffWalls();   // collisions.js
  bounceOffPaddle();  // collisions.js
  bounceOffBricks();  // collisions.js

  // The ball fell off the bottom: back to the center.
  if (ball.y > HEIGHT) {
    resetBall();
  }
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall() {
  ball.x = ball.x + ball.vx;
  ball.y = ball.y + ball.vy;
}


// ------------------------------------------------------------
// DRAW: paints the playfield and its objects.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = PALETTE.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  for (let x = 30; x < WIDTH; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 30; y < HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  ctx.shadowColor = PALETTE.paddle;
  ctx.shadowBlur = 12;
  ctx.fillStyle = PALETTE.paddle;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.shadowColor = PALETTE.ball;
  ctx.shadowBlur = 18;
  ctx.fillStyle = PALETTE.ball;
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  ctx.shadowBlur = 0;

  drawBrickSystem();  // bricks.js

  if (paused || shopOpen) {
    ctx.fillStyle = "rgba(9, 12, 14, 0.62)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = PALETTE.ball;
    ctx.font = "700 28px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shopOpen ? "SUPPLY DEPOT" : "PAUSED", WIDTH / 2, HEIGHT / 2);
  }
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP) {
    if (!paused && !shopOpen) {
      update();
    }
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  bricks = makeBricks();  // bricks.js
  resetBall();
  updateInterface();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);