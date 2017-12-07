const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const PLAYER_WIDTH = 90;
const PLAYER_HEIGHT = 80;
const PLAYER_SPEED = 5;

const DEFENDER_WIDTH = 90;
const DEFENDER_HEIGHT = 80;
const UPPER_SPEED_BOUND = 2.5;
const LOWER_SPEED_BOUND = 1;

const healthBar = document.querySelector("progress");
const POWERUP_SIZE = 50;

let playerImage = new Image();
playerImage.src =
  "http://res.cloudinary.com/drf74sz84/image/upload/v1512676889/imageedit_22_7034149676_mifeg4.png";

let backgroundImage = new Image();
backgroundImage.src =
  "http://res.cloudinary.com/drf74sz84/image/upload/v1512676391/soccer_field_311115_xjnfel.jpg";

let defenderImage = new Image();
defenderImage.src =
  "http://res.cloudinary.com/drf74sz84/image/upload/v1512678817/imageedit_29_6866000074_eroqvr.png";

let rechargePowerUp = new Image();
rechargePowerUp.src =
  "http://res.cloudinary.com/drf74sz84/image/upload/v1512679206/imageedit_35_8222718104_vk4yzu.png";

goalImage = new Image();
goalImage.src =
  "http://res.cloudinary.com/drf74sz84/image/upload/v1512679345/imageedit_36_8616248447_ftkyrg.png";

class Game {
  constructor() {
    this.gameOver = false;
    this.numSpawn = 1;
    this.speedIncrement = 0.5;
    this.defenderDamage = 1;
    this.maxSpeed = UPPER_SPEED_BOUND;
    this.minSpeed = LOWER_SPEED_BOUND;
  }
  updateScene() {
    if (recharge.onGround) {
      recharge.checkRecharge();
    }
    if (goal.onGround) {
      goal.checkGoal();
    }
    player.checkBounds();
    player.moveToward(mouse, player.speed);
    defenders.forEach(defender => defender.moveToward(player, defender.speed));
    defenders[0].checkDefenderCollision();
    player.checkHit();
    scoreboard.updateScore();
    if (healthBar.value > 0) {
      requestAnimationFrame(this.drawScene.bind(this));
    } else {
      this.endGame();
    }
  }

  drawScene() {
    this.clearBackground();
    player.draw();
    defenders.forEach(defender => defender.draw());
    this.updateScene();
  }

  endGame() {
    this.gameOver = true;
    ctx.font = "120px Serif";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "70px Serif";
    ctx.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = "left";
  }

  resetGame() {
    healthBar.value = 100;
    recharge.onGround = false;
    goal.onGround = false;
    scoreboard.resetScore();
    this.resetDefenders();
    this.gameOver = false;
    requestAnimationFrame(this.drawScene.bind(this));
  }

  spawnDefender(x, y) {
    defenders.push(
      new Defender(x, y, DEFENDER_WIDTH, DEFENDER_HEIGHT, game.randomSpeed())
    );
  }

  resetDefenders() {
    this.numSpawn = 1;
    this.maxSpeed = UPPER_SPEED_BOUND;
    this.minSpeed = LOWER_SPEED_BOUND;
    this.defenderDamage = 1;
    defenders = [];
    this.spawnDefender(-100, -100);
    this.spawnDefender(canvas.width + 100, -100);
    this.spawnDefender(-100, canvas.height + 100);
    this.spawnDefender(canvas.width + 100, canvas.width + 50);
  }

  clearBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }

  randomLocation(max, size) {
    return Math.random() * (max - size);
  }

  randomSpeed() {
    return Math.random() * (this.maxSpeed - this.minSpeed) + this.minSpeed;
  }
}

class Scoreboard {
  constructor() {
    this.score = 0;
    this.highScore = 0;
    this.scoreMiliseconds = 0;
    this.scoreText = document.getElementById("score");
    this.highScoreText = document.getElementById("highscore");
  }

  //Danico helped me with scoreboard
  storeScore() {
    if (typeof Storage !== "undefined") {
      localStorage.setItem("highScore", this.highScore);
    }
  }

  retrieveScore() {
    if (typeof Storage !== "undefined") {
      if (
        localStorage.getItem("highScore") === undefined ||
        localStorage.getItem("highScore") === null
      ) {
        this.highScoreText.innerHTML = 0;
      }
      this.highScoreText.innerHTML = localStorage.getItem("highScore");
      this.highScore = localStorage.getItem("highScore");
    }
  }

  resetScore() {
    this.scoreMiliseconds = 0;
    scoreboard.retrieveScore();
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText.innerHTML = this.highScore;
      scoreboard.storeScore();
    }
    this.score = 0;
    this.scoreText.innerHTML = 0;
  }

  updateScore() {
    this.scoreMiliseconds++;
    if (this.scoreMiliseconds % 100 === 0) {
      this.score++;
      if (this.score % 5 === 0) {
        if (game.maxSpeed < player.speed - game.speedIncrement) {
          game.minSpeed += game.speedIncrement;
          game.maxSpeed += game.speedIncrement;
        }
        for (let x = 0; x < game.numSpawn; x++) {
          game.spawnDefender(canvas.width / 2, canvas.height + 50);
        }
      }
      recharge.checkPowerups();
      this.scoreText.innerHTML = this.score;
    }
  }
}

class Sprite {
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  moveToward(leader, speed) {
    let dx = leader.x - this.x;
    let dy = leader.y - this.y;
    let hypot = this.distanceTo(leader);
    let speedx = speed * (dx / hypot);
    let speedy = speed * (dy / hypot);
    if (hypot > speed) {
      this.x += speedx;
      this.y += speedy;
    }
  }
  bounce(sprite2, amount) {
    let spriteBounceX = this.x + this.width / 2;
    let spriteBounceY = this.y + this.height / 2;
    let sprite2MidX = sprite2.x + sprite2.width / 2;
    let sprite2MidY = sprite2.y + sprite2.height / 2;
    if (spriteBounceX > sprite2MidX) {
      this.x = this.x + amount;
    } else {
      this.x = this.x - amount;
    }
    if (spriteBounceY > sprite2MidY) {
      this.y = this.y + amount;
    } else {
      this.y = this.y - amount;
    }
  }
  checkBounds() {
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }
    if (this.y < 0) {
      this.y = 0;
    } else if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
    }
  }

  hasCollidedWith(sprite2) {
    return (
      this.x < sprite2.x + sprite2.width &&
      this.x + this.width > sprite2.x &&
      this.y < sprite2.y + sprite2.height &&
      this.height + this.y > sprite2.y
    );
  }

  distanceTo(sprite2) {
    return Math.hypot(this.x - sprite2.x, this.y - sprite2.y);
  }
}

class Player extends Sprite {
  constructor(x, y, width, height, speed) {
    super();
    this.image = playerImage;
    Object.assign(this, {
      x,
      y,
      width,
      height,
      speed
    });
  }
  checkHit() {
    defenders.forEach(defender => {
      if (defender.hasCollidedWith(player)) {
        defender.bounce(player, 10);
        healthBar.value -= game.defenderDamage;
      }
    });
  }
}

class Defender extends Sprite {
  constructor(x, y, width, height, speed) {
    super();
    this.image = defenderImage;
    Object.assign(this, {
      x,
      y,
      width,
      height,
      speed
    });
  }
  checkDefenderCollision() {
    for (let x = 0; x < defenders.length; x++) {
      for (let y = defenders.length - 1; y > x; y--) {
        if (defenders[x].hasCollidedWith(defenders[y])) {
          defenders[x].bounce(defenders[y], 1);
        }
      }
    }
  }
}

class Powerup extends Sprite {
  checkPowerups() {
    if (scoreboard.score % 5 === 0) {
      recharge.drawPowerup();
      recharge.onGround = true;
    }
    if (scoreboard.score % 10 === 0) {
      goal.drawPowerup();
      goal.onGround = true;
      game.defenderDamage += 1;
    }
    if (scoreboard.score % 25 === 0) {
      game.numSpawn++;
    }
  }
  drawPowerup() {
    this.x = game.randomLocation(canvas.width, this.width);
    this.y = game.randomLocation(canvas.height, this.width);
    this.draw();
  }
}

class Recharge extends Powerup {
  constructor(x, y, width, height) {
    super();
    this.image = rechargePowerUp;
    this.onGround = false;
    this.healthValue = 30;
    Object.assign(this, {
      x,
      y,
      width,
      height
    });
  }
  checkRecharge() {
    this.draw();
    if (player.hasCollidedWith(recharge)) {
      healthBar.value += this.healthValue;
      this.onGround = false;
    }
  }
}

class Goal extends Powerup {
  constructor(x, y, width, height) {
    super();
    this.goalPower = 3;
    this.onGround = false;
    this.image = goalImage;
    Object.assign(this, {
      x,
      y,
      width,
      height
    });
  }
  checkGoal() {
    this.draw();
    if (player.hasCollidedWith(goal)) {
      for (let x = 0; x < this.goalPower; x++) {
        defenders.shift();
      }
      game.minSpeed = game.minSpeed - game.speedIncrement;
      game.maxSpeed = game.maxSpeed - game.speedIncrement;
      this.onGround = false;
    }
  }
}

function updateMouse(event) {
  const { left, top } = canvas.getBoundingClientRect();
  mouse.x = event.clientX - left;
  mouse.y = event.clientY - top;
}

function mouseClick(event) {
  if (game.gameOver) {
    game.resetGame();
  }
}

document.body.addEventListener("mousemove", updateMouse);

let game = new Game();
let scoreboard = new Scoreboard();
let player = new Player(
  canvas.width / 2,
  canvas.height / 2,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED
);
let goal = new Goal(
  game.randomLocation(canvas.width, POWERUP_SIZE),
  game.randomLocation(canvas.height, POWERUP_SIZE),
  POWERUP_SIZE,
  POWERUP_SIZE
);
let recharge = new Recharge(
  game.randomLocation(canvas.width, POWERUP_SIZE),
  game.randomLocation(canvas.height, POWERUP_SIZE),
  POWERUP_SIZE,
  POWERUP_SIZE
);

let defenders = [
  new Defender(-100, -100, DEFENDER_WIDTH, DEFENDER_HEIGHT, game.randomSpeed()),
  new Defender(
    canvas.width + 100,
    -100,
    DEFENDER_WIDTH,
    DEFENDER_HEIGHT,
    game.randomSpeed()
  ),
  new Defender(
    -100,
    canvas.height + 100,
    DEFENDER_WIDTH,
    DEFENDER_HEIGHT,
    game.randomSpeed()
  ),
  new Defender(
    canvas.width + 100,
    canvas.width + 100,
    DEFENDER_WIDTH,
    DEFENDER_HEIGHT,
    game.randomSpeed()
  )
];

let mouse = {
  x: 0,
  y: 0
};

scoreboard.retrieveScore();
requestAnimationFrame(game.drawScene.bind(game));
