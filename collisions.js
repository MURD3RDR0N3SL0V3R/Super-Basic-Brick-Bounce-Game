// ============================================================
// collisions.js: what happens when the ball touches something
//
// To "bounce", we flip the ball's speed:
//   hit something sideways -> vx = -vx
//   hit something above or below -> vy = -vy
// ============================================================

// Returns true if two rectangles (like the ball and a brick) overlap.
function boxesTouch(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


// The ball bounces off the left, right, and top walls.
// (The bottom is not a wall: falling off the bottom resets the ball.)
function bounceOffWalls(currentBall = ball) {
  if (currentBall.x < 0) {
    currentBall.x = 0;
    currentBall.vx = -currentBall.vx;
  }
  if (currentBall.x + currentBall.width > WIDTH) {
    currentBall.x = WIDTH - currentBall.width;
    currentBall.vx = -currentBall.vx;
  }
  if (currentBall.y < 0) {
    currentBall.y = 0;
    currentBall.vy = -currentBall.vy;
  }
}


// The ball bounces off the top of the paddle.
// ball.vy > 0 means "the ball is moving down", so it only bounces
// when it is falling onto the paddle.
function bounceOffPaddle(currentBall = ball) {
  if (boxesTouch(currentBall, paddle) && currentBall.vy > 0) {
    currentBall.y = paddle.y - currentBall.height;
    const contactOffset = (currentBall.x + currentBall.width / 2 - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = Math.max(-1.05, Math.min(1.05, contactOffset * 0.62 + aimAngle * 0.55));
    const speed = Math.hypot(currentBall.vx, currentBall.vy) || BALL_SPEED;
    currentBall.vx = Math.sin(angle) * speed;
    currentBall.vy = -Math.cos(angle) * speed;
  }
}


// Bounce off a brick and apply the purchased impact upgrade.
function bounceOffBricks(currentBall = ball) {
  for (let index = 0; index < bricks.length; index++) {
    const brick = bricks[index];
    if (!boxesTouch(currentBall, brick)) {
      continue;  // not touching this brick, check the next one
    }

    // How far has the ball pushed into the brick on each side?
    const overlapX = Math.min(currentBall.x + currentBall.width, brick.x + brick.width) - Math.max(currentBall.x, brick.x);
    const overlapY = Math.min(currentBall.y + currentBall.height, brick.y + brick.height) - Math.max(currentBall.y, brick.y);

    if (overlapX < overlapY) {
      // The ball hit the brick's left or right side.
      currentBall.vx = -currentBall.vx;
      if (currentBall.x < brick.x) {
        currentBall.x = brick.x - currentBall.width;
      } else {
        currentBall.x = brick.x + brick.width;
      }
    } else {
      // The ball hit the brick's top or bottom.
      currentBall.vy = -currentBall.vy;
      if (currentBall.y < brick.y) {
        currentBall.y = brick.y - currentBall.height;
      } else {
        currentBall.y = brick.y + brick.height;
      }
    }

    brick.hits -= 1 + upgrades.power + (activeEffects.power > 0 ? 1 : 0);
    if (brick.hits <= 0) {
      bricks.splice(index, 1);
      registerBrickBreak(brick, currentBall);
    }

    break;  // bounce off one brick per update, then stop looking
  }
}