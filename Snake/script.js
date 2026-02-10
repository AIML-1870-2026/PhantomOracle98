const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    { x: 10, y: 10 }
];

let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};

let dx = 1;
let dy = 0;
let nextDx = 1;
let nextDy = 0;

let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 100; // milliseconds

let gameLoopId;
let lastMoveTime = 0;

// DOM elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Update high score display
updateHighScoreDisplay();

// Event listeners
document.addEventListener('keydown', handleKeyPress);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    
    // Arrow keys
    if (e.key === 'ArrowUp' && dy === 0) { nextDx = 0; nextDy = -1; }
    else if (e.key === 'ArrowDown' && dy === 0) { nextDx = 0; nextDy = 1; }
    else if (e.key === 'ArrowLeft' && dx === 0) { nextDx = -1; nextDy = 0; }
    else if (e.key === 'ArrowRight' && dx === 0) { nextDx = 1; nextDy = 0; }
    
    // WASD keys
    else if (key === 'w' && dy === 0) { nextDx = 0; nextDy = -1; }
    else if (key === 's' && dy === 0) { nextDx = 0; nextDy = 1; }
    else if (key === 'a' && dx === 0) { nextDx = -1; nextDy = 0; }
    else if (key === 'd' && dx === 0) { nextDx = 1; nextDy = 0; }
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startBtn.textContent = 'Restart';
        pauseBtn.disabled = false;
        gameLoop();
    }
}

function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
        if (!gamePaused) {
            gameLoop();
        }
    }
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    nextDx = 1;
    nextDy = 0;
    score = 0;
    gameRunning = false;
    gamePaused = false;
    startBtn.textContent = 'Start Game';
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    scoreDisplay.textContent = 'Score: 0';
    generateFood();
    draw();
    clearInterval(gameLoopId);
}

function gameLoop() {
    const now = Date.now();
    
    if (now - lastMoveTime >= gameSpeed) {
        if (!gamePaused) {
            dx = nextDx;
            dy = nextDy;
            
            // Calculate new head position
            const head = snake[0];
            const newHead = {
                x: (head.x + dx + tileCount) % tileCount,
                y: (head.y + dy + tileCount) % tileCount
            };
            
            // Check collision with self
            if (isCollisionWithSelf(newHead)) {
                endGame();
                return;
            }
            
            // Add new head
            snake.unshift(newHead);
            
            // Check if food is eaten
            if (newHead.x === food.x && newHead.y === food.y) {
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;
                generateFood();
                // Increase speed slightly as score increases
                gameSpeed = Math.max(50, 100 - Math.floor(score / 10));
            } else {
                // Remove tail if no food eaten
                snake.pop();
            }
            
            lastMoveTime = now;
        }
        
        draw();
    }
    
    if (gameRunning) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

function isCollisionWithSelf(head) {
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }
    return false;
}

function generateFood() {
    let newFood;
    let foodOnSnake;
    const fruits = ['apple', 'pear', 'plum', 'strawberry', 'orange'];
    
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: fruits[Math.floor(Math.random() * fruits.length)]
        };
        
        for (let segment of snake) {
            if (newFood.x === segment.x && newFood.y === segment.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

function draw() {
    // Clear canvas with cream background
    ctx.fillStyle = '#fffef8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw decorative leaves
    drawLeaves();
    
    // Draw caterpillar
    drawCaterpillar();
    
    // Draw food (fruit)
    drawFruit();
}

function drawLeaves() {
    // Top left leaves
    drawLeaf(20, 15, 25, '#6BA82F', -30);
    drawLeaf(35, 25, 20, '#7FBC3D', -15);
    
    // Bottom right leaves
    drawLeaf(canvas.width - 30, canvas.height - 20, 28, '#8FCC42', 45);
    drawLeaf(canvas.width - 50, canvas.height - 35, 22, '#6BA82F', 60);
}

function drawLeaf(x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Leaf shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size / 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Leaf vein
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    
    ctx.restore();
}

function drawCaterpillar() {
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const centerX = segment.x * gridSize + gridSize / 2;
        const centerY = segment.y * gridSize + gridSize / 2;
        const radius = gridSize / 2 - 2;
        
        if (i === 0) {
            // Red head
            drawCircleSegment(centerX, centerY, radius, '#C41E3A', true);
            // Eyes
            drawEyes(centerX, centerY, nextDx, nextDy);
        } else {
            // Green body with color variation
            const hueVariation = (i % 3) * 5;
            let color;
            if (i % 2 === 0) {
                color = '#76C442'; // Bright green
            } else {
                color = '#8FCC42'; // Light green-yellow
            }
            drawCircleSegment(centerX, centerY, radius, color, false);
        }
    }
}

function drawCircleSegment(x, y, radius, color, isHead) {
    // Main circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add textured pattern like Eric Carle's collage style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Dark shading for depth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Lighter highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - radius / 4, y - radius / 4, radius / 2, 0, Math.PI * 2);
    ctx.stroke();
}

function drawEyes(x, y, dirX, dirY) {
    const eyeRadius = 3;
    const eyeDistance = 5;
    
    // Position eyes based on direction
    let eyeX1 = x, eyeY1 = y - eyeDistance;
    let eyeX2 = x, eyeY2 = y + eyeDistance;
    
    if (dirX !== 0 || dirY !== 0) {
        eyeX1 = x - eyeDistance / 2;
        eyeY1 = y - eyeDistance / 2;
        eyeX2 = x + eyeDistance / 2;
        eyeY2 = y - eyeDistance / 2;
    }
    
    // Draw eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY1, eyeRadius - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeX2, eyeY2, eyeRadius - 1, 0, Math.PI * 2);
    ctx.fill();
}

function drawFruit() {
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const fruitType = food.type || 'apple';
    
    switch (fruitType) {
        case 'apple':
            drawApple(centerX, centerY);
            break;
        case 'pear':
            drawPear(centerX, centerY);
            break;
        case 'plum':
            drawPlum(centerX, centerY);
            break;
        case 'strawberry':
            drawStrawberry(centerX, centerY);
            break;
        case 'orange':
            drawOrange(centerX, centerY);
            break;
        default:
            drawApple(centerX, centerY);
    }
}

function drawApple(x, y) {
    const size = 6;
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(x, y + 1, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine
    ctx.fillStyle = 'rgba(255, 200, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 1, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Stem
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size - 1);
    ctx.lineTo(x, y - size - 4);
    ctx.stroke();
    
    // Leaf
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + 2, y - size - 2, 2, 1.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPear(x, y) {
    const size = 6;
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.7, size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine
    ctx.fillStyle = 'rgba(255, 245, 200, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x - 1, y - 1, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Stem
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - size - 4);
    ctx.stroke();
}

function drawPlum(x, y) {
    const size = 5;
    ctx.fillStyle = '#551A8B';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine
    ctx.fillStyle = 'rgba(180, 100, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 1.5, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Stem
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size - 1);
    ctx.lineTo(x, y - size - 4);
    ctx.stroke();
}

function drawStrawberry(x, y) {
    const size = 5;
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(x, y + 1, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Seeds
    ctx.fillStyle = '#FFD700';
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            if (i * i + j * j <= 5) {
                ctx.fillRect(x + i * 1.5, y + j * 1.5, 0.8, 0.8);
            }
        }
    }
    
    // Leaves
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(x - 2, y - size - 1);
    ctx.lineTo(x - 1, y - size - 3);
    ctx.lineTo(x, y - size - 1);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y - size - 1);
    ctx.lineTo(x + 1, y - size - 3);
    ctx.lineTo(x + 2, y - size - 1);
    ctx.fill();
}

function drawOrange(x, y) {
    const size = 6;
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Segments
    ctx.strokeStyle = 'rgba(200, 100, 0, 0.5)';
    ctx.lineWidth = 0.5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.stroke();
    }
    
    // Shine
    ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function endGame() {
    gameRunning = false;
    clearInterval(gameLoopId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateHighScoreDisplay();
        alert(`Game Over! New High Score: ${score}`);
    } else {
        alert(`Game Over! Score: ${score}\nHigh Score: ${highScore}`);
    }
    
    resetGame();
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// Initial draw
draw();
pauseBtn.disabled = true;
