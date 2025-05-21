const initialSpeed = 0.25; // Slower initial speed
const speedIncrement = 0.02; // Slower speed increase after each collision
const maxSpeed = 5; // Maximum speed limit
const friction = 0.98; // Higher friction for sliding effect
const winScore = 10;

const startBtn = document.getElementById('start-btn');
const modal = document.getElementById('game-over-modal');
const playAgainBtn = document.getElementById('play-again-btn');

let speed = initialSpeed;
let penguins = [];
let scores = [0, 0];
let gameRunning = false;

const colorFilters = {
    red: 'hue-rotate(-10deg) saturate(600%) contrast(1)',
    blue: 'hue-rotate(180deg) saturate(2)',
    green: 'hue-rotate(90deg) saturate(2)',
    purple: 'hue-rotate(270deg) saturate(2)',
    orange: 'hue-rotate(45deg) saturate(3)',
    black: 'brightness(0)'
};

document.getElementById('confirm-selection').addEventListener('click', () => {
    const p1Color = document.getElementById('player1-color').value;
    const p2Color = document.getElementById('player2-color').value;

    document.getElementById('penguin1').style.filter = colorFilters[p1Color];
    document.getElementById('penguin2').style.filter = colorFilters[p2Color];

    document.getElementById('character-select').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
});


startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', () => {
  resetGame();
});

function startGame() {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

  if (gameRunning) return;
  gameRunning = true;
  modal.style.display = 'none';
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  resetPositions();

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  requestAnimationFrame(updateGame);
}

function handleKeyDown(e) {
  handleKey(e, true);
}

function handleKeyUp(e) {
  handleKey(e, false);
}

function handleKey(event, isKeyDown) {
  switch (event.code) {
    case 'KeyW': penguins[0].up = isKeyDown; break;
    case 'KeyS': penguins[0].down = isKeyDown; break;
    case 'KeyA': penguins[0].left = isKeyDown; break;
    case 'KeyD': penguins[0].right = isKeyDown; break;
    case 'ArrowUp': penguins[1].up = isKeyDown; break;
    case 'ArrowDown': penguins[1].down = isKeyDown; break;
    case 'ArrowLeft': penguins[1].left = isKeyDown; break;
    case 'ArrowRight': penguins[1].right = isKeyDown; break;
  }
}

function updateGame() {
  if (!gameRunning) return; // Stop the loop if game is over

  const gameContainer = document.getElementById('game-container');
  const rect = gameContainer.getBoundingClientRect();

  penguins.forEach(penguin => {
    if (penguin.up) penguin.vy -= speed;
    if (penguin.down) penguin.vy += speed;
    if (penguin.left) penguin.vx -= speed;
    if (penguin.right) penguin.vx += speed;

    penguin.vx *= friction;
    penguin.vy *= friction;

    penguin.x += penguin.vx;
    penguin.y += penguin.vy;

    if (penguin.x < 0 || penguin.x > rect.width - penguin.element.offsetWidth ||
        penguin.y < 0 || penguin.y > rect.height - penguin.element.offsetHeight) {
      handlePenguinFall(penguin);
      return;
    }

    penguin.element.style.left = `${penguin.x}px`;
    penguin.element.style.top = `${penguin.y}px`;
  });

  handleCollision();

  requestAnimationFrame(updateGame);
}

function handlePenguinFall(penguin) {
  const fallenPenguinIndex = penguins.indexOf(penguin);
  const otherPenguinIndex = 1 - fallenPenguinIndex;

  scores[otherPenguinIndex]++;
  updateScore();

  if (scores[otherPenguinIndex] >= winScore) {
    gameRunning = false;
    modal.querySelector('p').textContent = `Player ${otherPenguinIndex + 1} wins the game!`;
    modal.style.display = 'block';
  } else {
    alert(`Penguin ${fallenPenguinIndex + 1} fell off the iceberg!`);
    resetPositions();
  }
}

function resetPositions() {
  penguins = [
    {
      element: document.getElementById('penguin1'),
      x: 100,
      y: 150,
      vx: 0,
      vy: 0,
      up: false,
      down: false,
      left: false,
      right: false
    },
    {
      element: document.getElementById('penguin2'),
      x: 400,
      y: 150,
      vx: 0,
      vy: 0,
      up: false,
      down: false,
      left: false,
      right: false
    }
  ];

  penguins.forEach(penguin => {
    penguin.element.style.left = `${penguin.x}px`;
    penguin.element.style.top = `${penguin.y}px`;
  });

  speed = initialSpeed; // Reset speed to initial value after a fall
}

function updateScore() {
  document.getElementById('player1-score').textContent = `Player 1: ${scores[0]}`;
  document.getElementById('player2-score').textContent = `Player 2: ${scores[1]}`;
}

function resetGame() {
  scores = [0, 0];
  updateScore();
  resetPositions();
  modal.style.display = 'none';
  gameRunning = true;
  requestAnimationFrame(updateGame);
}

function handleCollision() {
  const p1 = penguins[0];
  const p2 = penguins[1];

  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < p1.element.offsetWidth) {
    const angle = Math.atan2(dy, dx);
    const magnitude = 5; // Adjusted collision magnitude

    p1.vx = Math.cos(angle) * magnitude;
    p1.vy = Math.sin(angle) * magnitude;
    p2.vx = -Math.cos(angle) * magnitude;
    p2.vy = -Math.sin(angle) * magnitude;

    if (speed + speedIncrement <= maxSpeed) {
      speed += speedIncrement; // Increase speed after each collision
    }
  }
}
