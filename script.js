const initialSpeed = 0.25;
const speedIncrement = 0.02;
const maxSpeed = 5;
const friction = 0.98;
const slapCooldown = 1000; // 1 second cooldown
const slapForce = 8; // Increased force for slapping
const slapRange = 80; // Range within which slap is effective
const winScore = 10;

const startBtn = document.getElementById('start-btn');
const modal = document.getElementById('game-over-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const characterSelectBtn = document.getElementById('character-select-btn');

let speed = initialSpeed;
let penguins = [];
let scores = [0, 0];
let gameRunning = false;
let icebergImage = null;
let icebergData = null;
let canvas = null;
let ctx = null;

// Penguin SVG template
const penguinSVG = `
  <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <!-- Penguin body (black/gray) -->
    <rect x="12" y="8" width="26" height="35" fill="#2c2c2c"/>
    <rect x="10" y="12" width="2" height="27" fill="#2c2c2c"/>
    <rect x="38" y="12" width="2" height="27" fill="#2c2c2c"/>
    <rect x="8" y="16" width="2" height="19" fill="#2c2c2c"/>
    <rect x="40" y="16" width="2" height="19" fill="#2c2c2c"/>
    <rect x="6" y="20" width="2" height="11" fill="#2c2c2c"/>
    <rect x="42" y="20" width="2" height="11" fill="#2c2c2c"/>
    <rect x="4" y="24" width="2" height="3" fill="#2c2c2c"/>
    <rect x="44" y="24" width="2" height="3" fill="#2c2c2c"/>
    
    <!-- White belly -->
    <rect x="16" y="12" width="18" height="27" fill="#ffffff"/>
    <rect x="14" y="16" width="2" height="19" fill="#ffffff"/>
    <rect x="34" y="16" width="2" height="19" fill="#ffffff"/>
    <rect x="12" y="20" width="2" height="11" fill="#ffffff"/>
    <rect x="36" y="20" width="2" height="11" fill="#ffffff"/>
    
    <!-- Left wing (normal position) -->
    <rect x="6" y="16" width="8" height="12" fill="#666666"/>
    <rect x="4" y="20" width="2" height="4" fill="#666666"/>
    
    <!-- Right wing (raised for slapping) -->
    <g id="right-wing">
      <rect x="36" y="12" width="8" height="8" fill="#666666"/>
      <rect x="40" y="8" width="4" height="4" fill="#666666"/>
      <rect x="42" y="6" width="2" height="2" fill="#666666"/>
    </g>
    
    <!-- Head -->
    <rect x="14" y="4" width="22" height="8" fill="#2c2c2c"/>
    <rect x="12" y="6" width="2" height="4" fill="#2c2c2c"/>
    <rect x="36" y="6" width="2" height="4" fill="#2c2c2c"/>
    <rect x="10" y="8" width="2" height="2" fill="#2c2c2c"/>
    <rect x="38" y="8" width="2" height="2" fill="#2c2c2c"/>
    
    <!-- Eyes -->
    <rect x="18" y="6" width="2" height="2" fill="#000000"/>
    <rect x="30" y="6" width="2" height="2" fill="#000000"/>
    
    <!-- Beak -->
    <rect x="22" y="8" width="6" height="2" fill="#ff8c00"/>
    <rect x="24" y="6" width="2" height="2" fill="#ff8c00"/>
    <rect x="20" y="10" width="2" height="2" fill="#ff8c00"/>
    <rect x="28" y="10" width="2" height="2" fill="#ff8c00"/>
    
    <!-- Feet -->
    <rect x="16" y="43" width="6" height="4" fill="#ff8c00"/>
    <rect x="28" y="43" width="6" height="4" fill="#ff8c00"/>
    <rect x="14" y="47" width="2" height="2" fill="#ff8c00"/>
    <rect x="22" y="47" width="2" height="2" fill="#ff8c00"/>
    <rect x="26" y="47" width="2" height="2" fill="#ff8c00"/>
    <rect x="34" y="47" width="2" height="2" fill="#ff8c00"/>
  </svg>
`;

const colorFilters = {
    red: 'hue-rotate(-30deg) saturate(700%) contrast(1)',
    blue: 'hue-rotate(180deg) saturate(2)',
    green: 'hue-rotate(90deg) saturate(2)',
    yellow: 'hue-rotate(30deg) saturate(3) brightness(1.2)',
    purple: 'hue-rotate(270deg) saturate(700%)',
    orange: 'hue-rotate(0deg) saturate(100%)',
    pink: 'hue-rotate(300deg) saturate(100%)',
};

const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];
let playerSelections = { player1: null, player2: null };

function loadIcebergImage() {
  return new Promise((resolve, reject) => {
    icebergImage = new Image();
    icebergImage.crossOrigin = 'anonymous';
    icebergImage.onload = function() {
      canvas = document.getElementById('game-canvas');
      ctx = canvas.getContext('2d');
      
      // Draw the iceberg image to fill the canvas
      ctx.drawImage(icebergImage, 0, 0, canvas.width, canvas.height);
      
      // Get pixel data for collision detection
      icebergData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      resolve();
    };
    icebergImage.onerror = reject;
    icebergImage.src = 'iceberg1.svg';
  });
}

function isOnIceberg(x, y, width, height) {
  if (!icebergData) return false;
  
  // Check multiple points around the penguin's base
  const checkPoints = [
    { x: x + width/2, y: y + height }, // Bottom center
    { x: x + 5, y: y + height }, // Bottom left
    { x: x + width - 5, y: y + height }, // Bottom right
  ];
  
  for (let point of checkPoints) {
    const px = Math.floor(point.x);
    const py = Math.floor(point.y);
    
    if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
      return false; // Outside canvas bounds
    }
    
    const index = (py * canvas.width + px) * 4;
    const alpha = icebergData.data[index + 3];
    
    // If any point has solid pixels (alpha > 0), penguin is on iceberg
    if (alpha > 50) { // Threshold for solid areas
      return true;
    }
  }
  
  return false;
}

function createPenguinOptions(playerId, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  colors.forEach(color => {
    const div = document.createElement('div');
    div.classList.add('penguin-option');
    div.innerHTML = penguinSVG;
    div.style.filter = colorFilters[color];
    div.dataset.color = color;

    div.addEventListener('click', () => {
      handleSelection(playerId, color);
    });

    container.appendChild(div);
  });
}

function handleSelection(player, color) {
  playerSelections[player] = color;
  updateSelectionStyles();

  const bothSelected = playerSelections.player1 && playerSelections.player2;
  const different = playerSelections.player1 !== playerSelections.player2;
  document.getElementById('confirm-selection').disabled = !(bothSelected && different);
}

function updateSelectionStyles() {
  colors.forEach(color => {
    const p1Els = document.querySelectorAll('#player1-options .penguin-option');
    p1Els.forEach(el => {
      el.classList.remove('selected', 'disabled');
      if (el.dataset.color === playerSelections.player1) el.classList.add('selected');
      if (el.dataset.color === playerSelections.player2) el.classList.add('disabled');
    });

    const p2Els = document.querySelectorAll('#player2-options .penguin-option');
    p2Els.forEach(el => {
      el.classList.remove('selected', 'disabled');
      if (el.dataset.color === playerSelections.player2) el.classList.add('selected');
      if (el.dataset.color === playerSelections.player1) el.classList.add('disabled');
    });
  });
}

document.getElementById('confirm-selection').addEventListener('click', async () => {
  const p1Color = playerSelections.player1;
  const p2Color = playerSelections.player2;

  // Load iceberg image first
  try {
    await loadIcebergImage();
  } catch (error) {
    console.error('Failed to load iceberg image:', error);
    alert('Failed to load iceberg image. Please make sure iceberg1.svg is available.');
    return;
  }

  // Set penguin sprites and colors
  document.getElementById('penguin1').innerHTML = penguinSVG;
  document.getElementById('penguin2').innerHTML = penguinSVG;
  document.getElementById('penguin1').style.filter = colorFilters[p1Color];
  document.getElementById('penguin2').style.filter = colorFilters[p2Color];

  document.getElementById('character-select').style.display = 'none';
  document.getElementById('instructions').style.display = 'block';
});

startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', () => {
  resetGame();
});
characterSelectBtn.addEventListener('click', () => {
  playerSelections = { player1: null, player2: null };
  document.getElementById('confirm-selection').disabled = true;
  createPenguinOptions('player1', 'player1-options');
  createPenguinOptions('player2', 'player2-options');
  modal.style.display = 'none';
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('character-select').style.display = 'block';
  scores = [0, 0];
  updateScore();
  gameRunning = false;
});

function startGame() {
    // document.getElementById('instructions').style.display = 'none';
    // document.getElementById('game-container').style.display = 'block';

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
  if (!penguins.length) return;
  
  // Movement keys
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

  // Slap keys (only on key down)
  if (isKeyDown) {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        performSlap(0); // Player 1 slap
        break;
      case 'Enter':
        event.preventDefault();
        performSlap(1); // Player 2 slap
        break;
    }
  }
}

function performSlap(playerIndex) {
  const penguin = penguins[playerIndex];
  const currentTime = Date.now();

  // Check cooldown
  if (penguin.lastSlap && currentTime - penguin.lastSlap < slapCooldown) {
    return; // Still cooling down
  }

  penguin.lastSlap = currentTime;
  penguin.element.classList.add('slapping');

  // Remove slapping class after animation
  setTimeout(() => {
    penguin.element.classList.remove('slapping');
  }, 300);

  // Check if other penguin is in range
  const otherPenguin = penguins[1 - playerIndex];
  const dx = penguin.x - otherPenguin.x;
  const dy = penguin.y - otherPenguin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < slapRange) {
    // Apply slap force
    const angle = Math.atan2(dy, dx);
    otherPenguin.vx = -Math.cos(angle) * slapForce;
    otherPenguin.vy = -Math.sin(angle) * slapForce;

    // Add some extra dramatic effect
    otherPenguin.element.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      otherPenguin.element.style.transform = '';
    }, 500);
  }
}

function updateGame() {
  if (!gameRunning) return;

  const gameContainer = document.getElementById('game-container');
  const rect = gameContainer.getBoundingClientRect();

  penguins.forEach(penguin => {
    // Movement
    if (penguin.up) penguin.vy -= speed;
    if (penguin.down) penguin.vy += speed;
    if (penguin.left) penguin.vx -= speed;
    if (penguin.right) penguin.vx += speed;

    // Apply friction
    penguin.vx *= friction;
    penguin.vy *= friction;

    // Calculate new position
    const newX = penguin.x + penguin.vx;
    const newY = penguin.y + penguin.vy;

    // Check if new position would be on the iceberg
    const penguinWidth = penguin.element.offsetWidth;
    const penguinHeight = penguin.element.offsetHeight;

    if (isOnIceberg(newX, newY, penguinWidth, penguinHeight)) {
      // Update position if still on iceberg
      penguin.x = newX;
      penguin.y = newY;
      
      // Update visual position
      penguin.element.style.left = `${penguin.x}px`;
      penguin.element.style.top = `${penguin.y}px`;
    } else {
      // Penguin fell off the iceberg
      handlePenguinFall(penguin);
      return;
    }
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
  // Find safe starting positions on the iceberg
  let p1X = 150, p1Y = 200; // Default positions
  let p2X = 350, p2Y = 200;
  
  // Try to find better positions on the iceberg if possible
  if (icebergData) {
    for (let y = 100; y < 300; y += 10) {
      for (let x = 50; x < 250; x += 10) {
        if (isOnIceberg(x, y, 50, 50)) {
          p1X = x;
          p1Y = y;
          break;
        }
      }
      if (p1X !== 150) break;
    }
    
    for (let y = 100; y < 300; y += 10) {
      for (let x = 350; x < 550; x += 10) {
        if (isOnIceberg(x, y, 50, 50)) {
          p2X = x;
          p2Y = y;
          break;
        }
      }
      if (p2X !== 350) break;
    }
  }

  penguins = [
    {
      element: document.getElementById('penguin1'),
      x: p1X,
      y: p1Y,
      vx: 0,
      vy: 0,
      up: false,
      down: false,
      left: false,
      right: false,
      lastSlap: 0
    },
    {
      element: document.getElementById('penguin2'),
      x: p2X,
      y: p2Y,
      vx: 0,
      vy: 0,
      up: false,
      down: false,
      left: false,
      right: false,
      lastSlap: 0
    }
  ];

  penguins.forEach(penguin => {
    penguin.element.style.left = `${penguin.x}px`;
    penguin.element.style.top = `${penguin.y}px`;
    penguin.element.style.transform = '';
  });

  speed = initialSpeed;
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
  if (penguins.length < 2) return;
  
  const p1 = penguins[0];
  const p2 = penguins[1];

  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < p1.element.offsetWidth) {
    const angle = Math.atan2(dy, dx);
    const magnitude = 5;

    p1.vx = Math.cos(angle) * magnitude;
    p1.vy = Math.sin(angle) * magnitude;
    p2.vx = -Math.cos(angle) * magnitude;
    p2.vy = -Math.sin(angle) * magnitude;

    if (speed + speedIncrement <= maxSpeed) {
      speed += speedIncrement;
    }
  }
}

// Initialize the game when page loads
window.addEventListener('load', () => {
  createPenguinOptions('player1', 'player1-options');
  createPenguinOptions('player2', 'player2-options');
  document.getElementById('character-select').style.display = 'block';
});