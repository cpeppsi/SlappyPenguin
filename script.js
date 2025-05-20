document.getElementById('start-btn').addEventListener('click', startGame);

const initialSpeed = 0.25; // Slower initial speed
const speedIncrement = 0.02; // Slower speed increase after each collision
const maxSpeed = 5; // Maximum speed limit
let speed = initialSpeed;
const friction = 0.98; // Higher friction for sliding effect
const winScore = 10;
let penguins = [];
let scores = [0, 0];

function startGame() {
    console.log('Game started');
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    resetPositions();

    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));

    requestAnimationFrame(updateGame);
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

        if (penguin.x < 0 || penguin.x > rect.width - penguin.element.offsetWidth || penguin.y < 0 || penguin.y > rect.height - penguin.element.offsetHeight) {
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

    scores[otherPenguinIndex] += 1;
    updateScore();

    if (scores[otherPenguinIndex] >= winScore) {
        alert(`Player ${otherPenguinIndex + 1} wins the game!`);
        resetGame();
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
    resetPositions(); // Reset positions instead of reloading
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
