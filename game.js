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
const THEME_PALETTES = {
  classic: {
    background: "#0c1113",
    grid: "rgba(220, 229, 231, 0.045)",
    paddle: "#dce5e7",
    ball: "#f6df68",
    bricks: ["#56666c", "#84969b", "#b6c4c7", "#e6c847"],
    overlay: "rgba(9, 12, 14, 0.62)",
    pageColor: "#090c0e"
  },
  uzi: {
    background: "#2f2c43",
    grid: "rgba(226, 226, 231, 0.08)",
    paddle: "#e2e2e7",
    ball: "#8c79b2",
    bricks: ["#512850", "#5e2682", "#8c79b2", "#e2e2e7"],
    overlay: "rgba(47, 44, 67, 0.7)",
    pageColor: "#2f2c43"
  },
  "n-gray": {
    background: "#0c1113",
    grid: "rgba(220, 229, 231, 0.045)",
    paddle: "#dce5e7",
    ball: "#f6df68",
    bricks: ["#56666c", "#84969b", "#b6c4c7", "#e6c847"],
    overlay: "rgba(9, 12, 14, 0.62)",
    pageColor: "#090c0e"
  },
  "n-alt": {
    background: "#101c20",
    grid: "rgba(205, 239, 231, 0.07)",
    paddle: "#e0eceb",
    ball: "#ffbd80",
    bricks: ["#35505b", "#66898e", "#b1cfca", "#f0b37e"],
    overlay: "rgba(8, 20, 24, 0.72)",
    pageColor: "#101c20"
  }
};
let PALETTE = THEME_PALETTES.classic;


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
let musicEnabled = false;
let currentView = "play";
const upgrades = { paddle: 0, power: 0 };
const MAX_LIVES = 5;
const balls = [ball];
const activeEffects = { shield: 0, power: 0, wide: 0, electric: 0, cold: 0, hot: 0, noise: 0, distortion: 0, glow: 0 };
const enemies = [];
const powerupDrops = [];
const POWERUP_TYPES = ["wide", "shield", "power", "multi", "cold", "hot"];
let lives = 3;
let gameOver = false;
let aimAngle = 0;

const pauseButton = document.getElementById("pause-button");
const musicButton = document.getElementById("music-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const DEFAULT_KEYBINDS = {
  left: ["arrowleft", "a"],
  right: ["arrowright", "d"],
  pause: ["p"],
  restart: ["r"]
};
const keybinds = loadKeybinds();
let keybindCapture = null;

function loadKeybinds() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("block-bounce-keybinds"));
    return Object.fromEntries(Object.entries(DEFAULT_KEYBINDS).map(function ([action, defaults]) {
      const savedKeys = saved && saved[action];
      const validKeys = Array.isArray(savedKeys)
        ? savedKeys.filter(function (key) { return typeof key === "string" && key.length > 0; })
        : [];
      return [action, validKeys.length ? validKeys : defaults.slice()];
    }));
  } catch (error) {
    return Object.fromEntries(Object.entries(DEFAULT_KEYBINDS).map(function ([action, defaults]) {
      return [action, defaults.slice()];
    }));
  }
}

function saveKeybinds() {
  try {
    window.localStorage.setItem("block-bounce-keybinds", JSON.stringify(keybinds));
  } catch (error) {
    document.getElementById("keybind-note").textContent = "Keybinds apply for this session only.";
  }
}


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  if (keybindCapture) {
    event.preventDefault();
    if (key === "escape") {
      keybindCapture = null;
      updateKeybindInterface();
      return;
    }
    if (["shift", "control", "alt", "meta"].includes(key)) {
      return;
    }
    keybinds[keybindCapture] = [key];
    keybindCapture = null;
    saveKeybinds();
    updateKeybindInterface();
    return;
  }

  if (currentView !== "play") {
    return;
  }
  keys[key] = true;
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  if (event.repeat) {
    return;
  }
  if (keybinds.pause.includes(key)) {
    paused = !paused;
    updateInterface();
  } else if (keybinds.restart.includes(key)) {
    restartGame();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

pauseButton.addEventListener("click", function () {
  paused = !paused;
  updateInterface();
});

document.getElementById("restart-button").addEventListener("click", restartGame);

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);

canvas.addEventListener("pointermove", function (event) {
  const bounds = canvas.getBoundingClientRect();
  const pointerX = (event.clientX - bounds.left) / bounds.width * WIDTH;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, pointerX - paddle.width / 2));
  aimAngle = Math.max(-0.65, Math.min(0.65, (pointerX / WIDTH - 0.5) * 1.3));
});

musicButton.addEventListener("click", function () {
  musicEnabled = !musicEnabled;
  if (!toggleLofiMusic(musicEnabled)) {
    musicEnabled = false;
  }
  updateInterface();
});

document.querySelectorAll("[data-view-target]").forEach(function (button) {
  button.addEventListener("click", function () {
    showView(button.dataset.viewTarget);
  });
});

document.querySelector("[data-home-link]").addEventListener("click", function (event) {
  event.preventDefault();
  showView("play");
});

document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
  button.addEventListener("click", function () {
    applyTheme(button.dataset.themeChoice);
  });
});

document.querySelectorAll("[data-bind]").forEach(function (button) {
  button.addEventListener("click", function () {
    keybindCapture = button.dataset.bind;
    updateKeybindInterface();
  });
});

document.getElementById("reset-keybinds").addEventListener("click", function () {
  for (const [action, defaults] of Object.entries(DEFAULT_KEYBINDS)) {
    keybinds[action] = defaults.slice();
  }
  saveKeybinds();
  updateKeybindInterface();
});

document.querySelectorAll("[data-upgrade]").forEach(function (button) {
  button.addEventListener("click", function () {
    purchaseUpgrade(button.dataset.upgrade);
  });
});

function showView(viewName) {
  const views = document.querySelectorAll("[data-view]");
  if (!Array.from(views).some(function (view) { return view.dataset.view === viewName; })) {
    return;
  }
  currentView = viewName;
  views.forEach(function (view) {
    view.hidden = view.dataset.view !== currentView;
  });
  document.querySelectorAll("[data-view-target]").forEach(function (button) {
    if (button.dataset.viewTarget === currentView) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }
  keybindCapture = null;
  updateKeybindInterface();
  updateInterface();
}

function updateKeybindInterface() {
  document.querySelectorAll("[data-bind]").forEach(function (button) {
    const action = button.dataset.bind;
    const keysForAction = keybinds[action].map(formatKey);
    button.textContent = keybindCapture === action ? "PRESS KEY" : keysForAction.join(" / ");
    button.setAttribute("aria-pressed", String(keybindCapture === action));
  });
  const note = document.getElementById("keybind-note");
  note.textContent = keybindCapture
    ? `Press a key for ${keybindCapture.toUpperCase()}, or Escape to cancel.`
    : "Select a binding, then press a key.";
}

function formatKey(key) {
  const labels = { arrowleft: "←", arrowright: "→", arrowup: "↑", arrowdown: "↓", " ": "SPACE" };
  return labels[key] || key.toUpperCase();
}

function applyTheme(themeName) {
  const selectedTheme = THEME_PALETTES[themeName] ? themeName : "classic";
  PALETTE = THEME_PALETTES[selectedTheme];
  document.documentElement.dataset.theme = selectedTheme;
  document.getElementById("theme-color-meta").setAttribute("content", PALETTE.pageColor);
  document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === selectedTheme));
  });
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    fullscreenButton.title = "Fullscreen is unavailable in this browser";
  }
  updateFullscreenButton();
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = isFullscreen ? "EXIT FULL" : "FULLSCREEN";
  fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
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

function registerBrickBreak(brick, sourceBall) {
  score += brick.maxHits * 100;
  credits += brick.reward;

  switch (brick.kind) {
    case "life":
      lives = Math.min(MAX_LIVES, lives + 1);
      break;
    case "enemy":
      spawnEnemy(brick);
      break;
    case "power":
      powerupDrops.push({
        x: brick.x + brick.width / 2 - 9,
        y: brick.y,
        width: 18,
        height: 14,
        type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
      });
      break;
    case "multi":
      spawnExtraBalls(sourceBall);
      break;
    case "vein": {
      const neighbors = bricks.filter(function (candidate) {
        return Math.abs(candidate.x - brick.x) <= BRICK_WIDTH + BRICK_GAP &&
          Math.abs(candidate.y - brick.y) <= BRICK_HEIGHT + BRICK_GAP;
      });
      for (const neighbor of neighbors) {
        damageBrick(neighbor, 1, sourceBall);
      }
      break;
    }
    case "electric":
    case "cold":
    case "hot":
    case "noise":
    case "distortion":
    case "glow":
      activeEffects[brick.kind] = 8;
      break;
  }

  if (bricks.length === 0) {
    wave += 1;
    bricks = makeBricks();
  }
  updateInterface();
}

function damageBrick(brick, damage, sourceBall) {
  const index = bricks.indexOf(brick);
  if (index < 0) {
    return;
  }
  brick.hits -= damage;
  if (brick.hits <= 0) {
    bricks.splice(index, 1);
    registerBrickBreak(brick, sourceBall);
  }
}

function spawnEnemy(brick) {
  if (enemies.length < 5) {
    enemies.push({
      x: brick.x + brick.width / 2 - 9,
      y: brick.y + brick.height,
      width: 18,
      height: 14,
      speed: 1.25,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function spawnExtraBalls(sourceBall = balls[0]) {
  if (!sourceBall) {
    return;
  }
  for (const direction of [-1, 1]) {
    if (balls.length >= 6) {
      break;
    }
    const angle = direction * 0.48;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    balls.push({
      ...sourceBall,
      vx: sourceBall.vx * cosine - sourceBall.vy * sine,
      vy: sourceBall.vx * sine + sourceBall.vy * cosine
    });
  }
}

function activatePowerup(type) {
  if (type === "multi") {
    spawnExtraBalls();
  } else {
    activeEffects[type] = type === "shield" ? 16 : 10;
    if (type === "wide") {
      updatePaddleWidth();
    }
  }
  updateInterface();
}

function updatePaddleWidth() {
  const baseWidth = 90 + upgrades.paddle * 12;
  paddle.width = Math.min(WIDTH - 20, baseWidth + (activeEffects.wide > 0 ? 30 : 0));
  paddle.x = Math.min(paddle.x, WIDTH - paddle.width);
}

function updatePowerupDrops() {
  for (let index = powerupDrops.length - 1; index >= 0; index--) {
    const drop = powerupDrops[index];
    drop.y += 1.8;
    if (boxesTouch(drop, paddle)) {
      activatePowerup(drop.type);
      powerupDrops.splice(index, 1);
    } else if (drop.y > HEIGHT) {
      powerupDrops.splice(index, 1);
    }
  }
}

function updateEnemies() {
  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    enemy.y += enemy.speed;
    enemy.phase += 0.06;
    enemy.x += Math.sin(enemy.phase) * 0.8;
    if (boxesTouch(enemy, paddle)) {
      enemies.splice(index, 1);
      loseLife();
      break;
    }
    if (enemy.y > HEIGHT) {
      enemies.splice(index, 1);
    }
  }
}

function updateEffectTimers() {
  let changed = false;
  for (const [effect, remaining] of Object.entries(activeEffects)) {
    if (remaining > 0) {
      activeEffects[effect] = Math.max(0, remaining - 1 / 60);
      changed = changed || activeEffects[effect] === 0;
    }
  }
  if (changed) {
    updatePaddleWidth();
    updateInterface();
  }
}

function restartGame() {
  bricks = makeBricks();
  score = 0;
  credits = 0;
  wave = 1;
  upgrades.paddle = 0;
  upgrades.power = 0;
  lives = 3;
  gameOver = false;
  for (const effect of Object.keys(activeEffects)) {
    activeEffects[effect] = 0;
  }
  enemies.length = 0;
  powerupDrops.length = 0;
  balls.splice(0, balls.length, ball);
  paddle.width = 90;
  paddle.x = WIDTH / 2 - paddle.width / 2;
  paused = false;
  showView("play");
  resetBall();
  updateInterface();
}

function updateInterface() {
  document.getElementById("score-value").textContent = String(score).padStart(4, "0");
  document.getElementById("credits-value").textContent = String(credits).padStart(2, "0");
  document.getElementById("wave-value").textContent = String(wave).padStart(2, "0");
  document.getElementById("lives-value").textContent = String(lives);
  document.getElementById("shop-credits-value").textContent = String(credits).padStart(2, "0");
  const activePowerups = Object.entries(activeEffects)
    .filter(function ([, remaining]) { return remaining > 0; })
    .map(function ([effect, remaining]) { return `${effect.toUpperCase()} ${Math.ceil(remaining)}s`; });
  document.getElementById("powerup-value").textContent = activePowerups.join(" / ") || "NONE";
  document.getElementById("game-status").textContent = paused ? "PAUSED" : "ACTIVE";
  pauseButton.innerHTML = `${paused ? "RESUME" : "PAUSE"} <kbd>${formatKey(keybinds.pause[0])}</kbd>`;
  document.getElementById("restart-button").innerHTML = `RESTART <kbd>${formatKey(keybinds.restart[0])}</kbd>`;
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
  for (let index = balls.length - 1; index >= 0; index--) {
    const currentBall = balls[index];
    moveBall(currentBall);
    bounceOffWalls(currentBall);   // collisions.js
    bounceOffPaddle(currentBall);  // collisions.js
    bounceOffBricks(currentBall);  // collisions.js
    if (currentBall.y > HEIGHT) {
      balls.splice(index, 1);
    }
  }

  if (balls.length === 0) {
    if (activeEffects.shield > 0) {
      activeEffects.shield = 0;
      balls.push(ball);
      resetBall();
    } else {
      loseLife();
    }
  }
  updatePowerupDrops();
  updateEnemies();
  updateEffectTimers();
}

function loseLife() {
  lives -= 1;
  enemies.length = 0;
  if (lives <= 0) {
    lives = 0;
    gameOver = true;
    updateInterface();
    return;
  }
  balls.splice(0, balls.length, ball);
  resetBall();
  updateInterface();
}

function movePaddle() {
  const movingLeft = keybinds.left.some(function (key) { return keys[key]; });
  const movingRight = keybinds.right.some(function (key) { return keys[key]; });
  if (movingLeft !== movingRight) {
    const direction = movingLeft ? -1 : 1;
    paddle.x += direction * (activeEffects.electric > 0 ? -paddle.speed : paddle.speed);
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall(currentBall) {
  const speedFactor = (activeEffects.hot > 0 ? 1.25 : 1) * (activeEffects.cold > 0 ? 0.72 : 1);
  currentBall.x += currentBall.vx * speedFactor;
  currentBall.y += currentBall.vy * speedFactor;
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
  for (const currentBall of balls) {
    ctx.fillRect(currentBall.x, currentBall.y, currentBall.width, currentBall.height);
  }
  ctx.shadowBlur = 0;

  const aimStartX = paddle.x + paddle.width / 2;
  ctx.strokeStyle = PALETTE.ball;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(aimStartX, paddle.y);
  ctx.lineTo(aimStartX + Math.sin(aimAngle) * 48, paddle.y - Math.cos(aimAngle) * 48);
  ctx.stroke();
  ctx.globalAlpha = 1;

  drawBrickSystem();  // bricks.js

  if (paused || gameOver) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = PALETTE.ball;
    ctx.font = "700 28px 'Barlow Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(gameOver ? "GAME OVER" : "PAUSED", WIDTH / 2, HEIGHT / 2);
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
    if (currentView === "play" && !paused && !gameOver) {
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