const initialSpeed = 0.25;
const speedIncrement = 0.02;
const maxSpeed = 5;
const friction = 0.98;
const slapCooldown = 1000; // 1 second cooldown
const slapForce = 8; // Increased force for slapping
const slapRange = 80; // Range within which slap is effective
const winScore = 10;

// FIXED: Standard iceberg dimensions for consistent multiplayer gameplay
const STANDARD_ICEBERG_WIDTH = 1920;
const STANDARD_ICEBERG_HEIGHT = 1080;

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
// Online multiplayer variables
let socket = null;
let isOnlineMode = false;
let currentRoomId = null;
let myPlayerIndex = null;
let isHost = false;

let lastPositionSync = 0;
const POSITION_SYNC_INTERVAL = 50;

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

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // FIXED: Use standard dimensions for consistent multiplayer gameplay
      const scorebarHeight = 60;
      const icebergWidth = STANDARD_ICEBERG_WIDTH;
      const icebergHeight = STANDARD_ICEBERG_HEIGHT;
      
      // Center the iceberg horizontally and vertically (accounting for scoreboard)
      const offsetX = (canvas.width - icebergWidth) / 2;
      const offsetY = scorebarHeight + (canvas.height - scorebarHeight - icebergHeight) / 2;
      
      // Store iceberg bounds for penguin positioning
      window.icebergBounds = {
        x: offsetX,
        y: offsetY,
        width: icebergWidth,
        height: icebergHeight
      };
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the iceberg at standard size
      ctx.drawImage(icebergImage, offsetX, offsetY, icebergWidth, icebergHeight);
      
      // Get pixel data for collision detection
      icebergData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      resolve();
    };
    icebergImage.onerror = reject;
    icebergImage.src = 'iceberg1.svg';
  });
}

function resizeCanvas() {
  if (!canvas || !ctx || !icebergImage) return;
  
  // Set canvas size to window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // FIXED: Recalculate positioning with standard dimensions
  const scorebarHeight = 60;
  const icebergWidth = STANDARD_ICEBERG_WIDTH;
  const icebergHeight = STANDARD_ICEBERG_HEIGHT;
  
  // Center the iceberg
  const offsetX = (canvas.width - icebergWidth) / 2;
  const offsetY = scorebarHeight + (canvas.height - scorebarHeight - icebergHeight) / 2;
  
  // Update iceberg bounds
  window.icebergBounds = {
    x: offsetX,
    y: offsetY,
    width: icebergWidth,
    height: icebergHeight
  };
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(icebergImage, offsetX, offsetY, icebergWidth, icebergHeight);
  
  // Update pixel data for collision detection
  icebergData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Reposition penguins if they exist
  if (penguins.length > 0) {
    resetPositions();
  }
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

  if (isOnlineMode) {
    // Online mode - only need player1 selection
    document.getElementById('confirm-selection').disabled = !playerSelections.player1;
  } else {
    // Local mode - need both selections to be different
    const bothSelected = playerSelections.player1 && playerSelections.player2;
    const different = playerSelections.player1 !== playerSelections.player2;
    document.getElementById('confirm-selection').disabled = !(bothSelected && different);
  }
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
  if (isOnlineMode) {
    document.getElementById('character-select').style.display = 'none';
    document.getElementById('online-setup').style.display = 'block';
  } else {
    const p1Color = playerSelections.player1;
    const p2Color = playerSelections.player2;
  }
  // Load iceberg image first
  try {
    await loadIcebergImage();
  } catch (error) {
    console.error('Failed to load iceberg image:', error);
    alert('Failed to load iceberg image.');
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
  if (isOnlineMode) {
    backToModeSelection();
  } else {
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
  }
});

function startGame() {

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
  
  let controlledPenguinIndex = 0;
  if (isOnlineMode) {
    controlledPenguinIndex = myPlayerIndex;
    if (controlledPenguinIndex === null || controlledPenguinIndex === undefined) {
      return; // Don't process input if we don't know our player index yet
    }
  }
  
  if (!isOnlineMode) {
    // Local mode - control both penguins
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
  } else {
    // Online mode - control only my penguin
    const myPenguin = penguins[controlledPenguinIndex];
    if (!myPenguin) return;
    
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp': 
        myPenguin.up = isKeyDown; 
        break;
      case 'KeyS':
      case 'ArrowDown': 
        myPenguin.down = isKeyDown; 
        break;
      case 'KeyA':
      case 'ArrowLeft': 
        myPenguin.left = isKeyDown; 
        break;
      case 'KeyD':
      case 'ArrowRight': 
        myPenguin.right = isKeyDown; 
        break;
    }
    
    // Send input to server immediately
    if (socket && socket.connected) {
      socket.emit('game-input', {
        type: 'movement',
        keys: {
          up: myPenguin.up,
          down: myPenguin.down,
          left: myPenguin.left,
          right: myPenguin.right
        }
      });
    }
  }

  // Slap keys (only on key down)
  if (isKeyDown) {
    if (!isOnlineMode) {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          performSlap(0);
          break;
        case 'Enter':
          event.preventDefault();
          performSlap(1);
          break;
      }
    } else {
      switch (event.code) {
        case 'Space':
        case 'Enter':
          event.preventDefault();
          performSlap(controlledPenguinIndex);
          if (socket && socket.connected) {
            socket.emit('game-input', {
              type: 'slap',
              playerIndex: controlledPenguinIndex
            });
          }
          break;
      }
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

  penguins.forEach((penguin, idx) => {
    // In online mode, only apply physics to my penguin
    // Opponent position comes from server updates
    const isMyPenguin = !isOnlineMode || idx === myPlayerIndex;
    
    if (isMyPenguin) {
      // Apply movement forces
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

      const penguinWidth = penguin.element.offsetWidth;
      const penguinHeight = penguin.element.offsetHeight;

      if (isOnIceberg(newX, newY, penguinWidth, penguinHeight)) {
        penguin.x = newX;
        penguin.y = newY;
        
        // Update visual position
        penguin.element.style.left = `${penguin.x}px`;
        penguin.element.style.top = `${penguin.y}px`;

        // Sync position in online mode
        if (isOnlineMode && socket && socket.connected) {
          const now = Date.now();
          if (now - lastPositionSync > POSITION_SYNC_INTERVAL) {
            socket.emit('position-sync', {
              x: penguin.x,
              y: penguin.y,
              vx: penguin.vx,
              vy: penguin.vy
            });
            lastPositionSync = now;
          }
        }
      } else {
        handlePenguinFall(penguin);
        return;
      }
    } else {
      // For opponent penguin, just update visual position from synced data
      penguin.element.style.left = `${penguin.x}px`;
      penguin.element.style.top = `${penguin.y}px`;
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
    const message = `Player ${otherPenguinIndex + 1} wins the game!`;
    modal.querySelector('p').textContent = message;
    modal.style.display = 'block';

    if (isOnlineMode && socket && socket.connected) {
      socket.emit('game-over', { message: message, scores: scores });
    }
  } else {
    if (isOnlineMode && socket && socket.connected && myPlayerIndex === otherPenguinIndex) {
      socket.emit('score-update', { scores: scores });
    }
    setTimeout(() => {
      resetPositions();
    }, 500);
  }
}

function findRandomIcebergPosition() {
  if (!icebergData || !window.icebergBounds) return { x: 100, y: 100 };
  
  const bounds = window.icebergBounds;
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random position within iceberg bounds
    const x = bounds.x + Math.random() * (bounds.width - 50);
    const y = bounds.y + Math.random() * (bounds.height - 50);
    
    // Check if this position is on solid iceberg
    if (isOnIceberg(x, y, 50, 50)) {
      return { x, y };
    }
  }
  
  // Fallback to center of iceberg bounds if no valid position found
  return { 
    x: bounds.x + bounds.width / 2 - 25, 
    y: bounds.y + bounds.height / 2 - 25 
  };
}

function resetPositions() {
  // Find random safe starting positions on the iceberg
  const pos1 = findRandomIcebergPosition();
  const pos2 = findRandomIcebergPosition();
  
  // Ensure positions are different enough
  while (Math.abs(pos1.x - pos2.x) < 100 && Math.abs(pos1.y - pos2.y) < 100) {
    const newPos = findRandomIcebergPosition();
    pos2.x = newPos.x;
    pos2.y = newPos.y;
  }

  penguins = [
    {
      element: document.getElementById('penguin1'),
      x: pos1.x,
      y: pos1.y,
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
      x: pos2.x,
      y: pos2.y,
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

// New event listeners for mode selection
document.getElementById('local-mode-btn').addEventListener('click', () => {
  isOnlineMode = false;
  document.getElementById('game-mode-select').style.display = 'none';
  document.getElementById('character-select').style.display = 'block';
});

document.getElementById('online-mode-btn').addEventListener('click', () => {
  isOnlineMode = true;
  initializeOnlineMode();
  document.getElementById('game-mode-select').style.display = 'none';
  document.getElementById('online-setup').style.display = 'block';
});

// Add remaining online multiplayer functions...
function joinRoom() {
  const roomId = document.getElementById('room-id-input').value.trim();
  if (!roomId) {
    showRoomStatus('Please enter a room ID', 'error');
    return;
  }
  
  if (!playerSelections.player1) {
    showRoomStatus('Please select a penguin color first', 'error');
    return;
  }
  
  currentRoomId = roomId;
  socket.emit('join-room', {
    roomId: roomId,
    playerData: { color: playerSelections.player1 }
  });
  
  document.getElementById('current-room-id').textContent = roomId;
  document.getElementById('waiting-area').style.display = 'block';
}

function updateRoomState(data) {
  myPlayerIndex = data.players.find(p => p.id === socket.id)?.playerIndex;
  isHost = myPlayerIndex === 0;
  
  const playersDiv = document.getElementById('online-players');
  playersDiv.innerHTML = '';
  
  data.players.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-info';
    playerDiv.textContent = `Player ${player.playerIndex + 1} (${player.color})`;
    if (player.ready) playerDiv.classList.add('ready');
    playersDiv.appendChild(playerDiv);
  });
  
  document.getElementById('ready-btn').disabled = !data.canStart;
  showRoomStatus('Connected to room!', 'success');
}

function updatePlayerReadyState(data) {
  if (data.allReady) {
    showRoomStatus('Both players ready! Starting game...', 'success');
  }
}

function startOnlineGame() {
  document.getElementById('online-setup').style.display = 'none';
  document.getElementById('instructions').style.display = 'block';
}

function showRoomStatus(message, type) {
  const statusDiv = document.getElementById('room-status');
  statusDiv.textContent = message;
  statusDiv.className = type;
}

function backToModeSelection() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  document.getElementById('online-setup').style.display = 'none';
  document.getElementById('game-mode-select').style.display = 'block';
  
  // Reset selections
  playerSelections = { player1: null, player2: null };
  currentRoomId = null;
  myPlayerIndex = null;
  isHost = false;
}

// Event listeners for online mode
// Mode selection
document.getElementById('local-mode-btn').addEventListener('click', () => {
  isOnlineMode = false;
  document.getElementById('game-mode-select').style.display = 'none';
  document.getElementById('character-select').style.display = 'block';
  
  // Show both player selections for local mode
  document.querySelector('.player-select:nth-child(2)').style.display = 'block';
  document.querySelector('.player-select:nth-child(3)').style.display = 'block';
});

document.getElementById('online-mode-btn').addEventListener('click', () => {
  isOnlineMode = true;
  initializeOnlineMode();
  document.getElementById('game-mode-select').style.display = 'none';
  document.getElementById('character-select').style.display = 'block';
  document.getElementById('online-setup').style.display = 'none'; // Hide online setup initially
  
  // Hide player 2 selection for online mode
  document.querySelector('.player-select:nth-child(3)').style.display = 'none';
});

document.getElementById('join-room-btn').addEventListener('click', joinRoom);

document.getElementById('ready-btn').addEventListener('click', () => {
  socket.emit('player-ready');
  document.getElementById('ready-btn').textContent = 'Waiting for opponent...';
  document.getElementById('ready-btn').disabled = true;
});

document.getElementById('back-to-mode-btn').addEventListener('click', backToModeSelection);

// ========== ONLINE MULTIPLAYER FUNCTIONS ==========

function initializeOnlineMode() {
  socket = io();
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'connection-status';
  document.body.appendChild(statusDiv);
  
  socket.on('connect', () => {
    document.getElementById('connection-status').textContent = 'Connected';
    document.getElementById('connection-status').className = 'connected';
  });
  
  socket.on('disconnect', () => {
    document.getElementById('connection-status').textContent = 'Disconnected';
    document.getElementById('connection-status').className = 'disconnected';
  });
  
  socket.on('room-state', (data) => {
    updateRoomState(data);
  });
  
  socket.on('player-ready-update', (data) => {
    updatePlayerReadyState(data);
  });
  
  socket.on('game-start', () => {
    startOnlineGame();
  });
  
  socket.on('opponent-input', (data) => {
    handleOpponentInput(data);
  });
  
  socket.on('opponent-position', (data) => {
    updateOpponentPosition(data);
  });
  
  socket.on('score-sync', (data) => {
    scores = data.scores;
    updateScore();
  });
  
  socket.on('game-over-sync', (data) => {
    gameRunning = false;
    modal.querySelector('p').textContent = data.message;
    modal.style.display = 'block';
  });
  
  socket.on('game-reset', () => {
    resetGame();
  });
  
  socket.on('player-left', () => {
    alert('Your opponent left the game');
    backToModeSelection();
  });
  
  socket.on('join-error', (data) => {
    showRoomStatus(data.message, 'error');
  });
}

function joinRoom() {
  const roomId = document.getElementById('room-id-input').value.trim();
  if (!roomId) {
    showRoomStatus('Please enter a room ID', 'error');
    return;
  }
  
  if (!playerSelections.player1) {
    showRoomStatus('Please select a penguin color first', 'error');
    return;
  }
  
  currentRoomId = roomId;
  socket.emit('join-room', {
    roomId: roomId,
    playerData: { color: playerSelections.player1 }
  });
  
  document.getElementById('current-room-id').textContent = roomId;
  document.getElementById('waiting-area').style.display = 'block';
}

function updateRoomState(data) {
  myPlayerIndex = data.players.find(p => p.id === socket.id)?.playerIndex;
  isHost = myPlayerIndex === 0;
  
  // Get opponent color
  const opponentPlayer = data.players.find(p => p.id !== socket.id);
  if (opponentPlayer) {
    playerSelections.player2 = opponentPlayer.color;
  }
  
  const playersDiv = document.getElementById('online-players');
  playersDiv.innerHTML = '';
  
  data.players.forEach(player => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-info';
    const isMe = player.id === socket.id;
    playerDiv.textContent = `Player ${player.playerIndex + 1} (${player.color})${isMe ? ' - YOU' : ''}`;
    if (player.ready) playerDiv.classList.add('ready');
    playersDiv.appendChild(playerDiv);
  });
  
  document.getElementById('ready-btn').disabled = !data.canStart;
  showRoomStatus('Connected to room!', 'success');
}

function updatePlayerReadyState(data) {
  if (data.allReady) {
    showRoomStatus('Both players ready! Starting game...', 'success');
  }
}

async function startOnlineGame() {
  try {
    await loadIcebergImage();
  } catch (error) {
    console.error('Failed to load iceberg image:', error);
    alert('Failed to load iceberg image.');
    return;
  }

  const p1Color = playerSelections.player1;
  const p2Color = playerSelections.player2;

  document.getElementById('penguin1').innerHTML = penguinSVG;
  document.getElementById('penguin2').innerHTML = penguinSVG;
  document.getElementById('penguin1').style.filter = colorFilters[p1Color];
  document.getElementById('penguin2').style.filter = colorFilters[p2Color];

  document.getElementById('online-setup').style.display = 'none';
  document.getElementById('instructions').style.display = 'block';
}

function handleOpponentInput(data) {
  const opponentIndex = data.playerIndex;
  const opponent = penguins[opponentIndex];
  
  if (!opponent) return;

  if (data.inputData.type === 'movement') {
    opponent.up = data.inputData.keys.up;
    opponent.down = data.inputData.keys.down;
    opponent.left = data.inputData.keys.left;
    opponent.right = data.inputData.keys.right;
    
    // Apply movement immediately for responsiveness
    if (opponent.up) opponent.vy -= speed;
    if (opponent.down) opponent.vy += speed;
    if (opponent.left) opponent.vx -= speed;
    if (opponent.right) opponent.vx += speed;
  } else if (data.inputData.type === 'slap') {
    performSlap(opponentIndex);
  }
}

function updateOpponentPosition(data) {
  const opponentIndex = data.playerIndex;
  const opponent = penguins[opponentIndex];
  
  if (!opponent) return;

  opponent.x = data.position.x;
  opponent.y = data.position.y;
  opponent.vx = data.position.vx || 0;
  opponent.vy = data.position.vy || 0;
}

function showRoomStatus(message, type) {
  const statusDiv = document.getElementById('room-status');
  statusDiv.textContent = message;
  statusDiv.className = type;
}

function backToModeSelection() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  const statusDiv = document.getElementById('connection-status');
  if (statusDiv) statusDiv.remove();
  
  document.getElementById('online-setup').style.display = 'none';
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('character-select').style.display = 'none'; // Hide character select
  document.getElementById('game-mode-select').style.display = 'block';
  
  playerSelections = { player1: null, player2: null };
  currentRoomId = null;
  myPlayerIndex = null;
  isHost = false;
  isOnlineMode = false;
  gameRunning = false;
  
  document.getElementById('waiting-area').style.display = 'none';
  document.getElementById('room-status').textContent = '';
  
  // Reset character selection UI
  createPenguinOptions('player1', 'player1-options');
  createPenguinOptions('player2', 'player2-options');
  document.getElementById('confirm-selection').disabled = true;
}


// Initialize the game when page loads
// Replace the existing window load listener with:
window.addEventListener('load', () => {
  createPenguinOptions('player1', 'player1-options');
  createPenguinOptions('player2', 'player2-options');
  document.getElementById('character-select').style.display = 'none';
  document.getElementById('game-mode-select').style.display = 'block';
});

window.addEventListener('resize', resizeCanvas)