var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STATE_LOSING = 0;
const STATE_RUNNING = 1;
const TICK = 80;
const SQUARE_SIZE = 10; // cual sera la dimesion de cada casilla (10)
const BOARD_HEIGHT = 50; // altura del tablero (50)
const BOARD_WIDTH = 50;
const ROWS = 6; // numero de filas de aliens
const INITIAL_POSITION = 2; // posicion inicial del jugador
const MOVEMENT = 0.5;
const SHOOT = 2;
const WIN = 1;
const LOSE = 0;
const DIRECTION_MAPS = {
    'left': -MOVEMENT,
    'right': MOVEMENT,
    'a': -MOVEMENT,
    'd': MOVEMENT,
    'A': -MOVEMENT,
    'D': MOVEMENT,
    'ArrowLeft': -MOVEMENT,
    'ArrowRight': MOVEMENT,
    'S': SHOOT,
    's': SHOOT,
    'ArrowDown': SHOOT,
    'shoot': SHOOT
};
const ENEMY = 0;
const PLAYER = 1;
;
let state = {
    canvas: null,
    context: null,
    player: {
        lives: 3,
        direction: 1,
        ammunition: 100,
        position: { x: Math.floor(BOARD_WIDTH / 2), y: BOARD_HEIGHT - INITIAL_POSITION }
    },
    enemies: [],
    bullets: [],
    score: 0,
    highScore: 0,
    runState: STATE_LOSING
};
const hs = localStorage.getItem('high_score');
if (hs) {
    state.highScore = parseInt(hs);
}
let highScoreLabel = document.getElementById('hiscore');
highScoreLabel.textContent = `${state.highScore}`;
const drawPixel = (color, x, y, bullet) => {
    state.context.fillStyle = color;
    if (bullet) {
        state.context.fillRect(x * SQUARE_SIZE + SQUARE_SIZE / 4, y * SQUARE_SIZE, SQUARE_SIZE / 2, SQUARE_SIZE);
    }
    else {
        state.context.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    }
};
const draw = () => {
    state.context.clearRect(0, 0, 500, 500);
    // print player
    drawPixel("#14d4d8", state.player.position.x, state.player.position.y, false);
    // print bullets
    state.bullets.forEach(bullet => {
        if (bullet.target === ENEMY) {
            drawPixel("#fefefe", bullet.x, bullet.y, true);
        }
        else if (bullet.target === PLAYER) {
            drawPixel("#4b2f36", bullet.x, bullet.y, true);
        }
    });
    // print enemies
    state.enemies.forEach(enemy => {
        drawPixel("#e9f722", enemy.position.x, enemy.position.y, false);
    });
};
const clearBoard = () => {
    state.context.clearRect(0, 0, BOARD_WIDTH * SQUARE_SIZE, BOARD_HEIGHT * SQUARE_SIZE);
};
const printMessage = (message) => {
    state.context.fillStyle = 'white';
    state.context.clearRect(0, 0, BOARD_WIDTH * SQUARE_SIZE, BOARD_HEIGHT * SQUARE_SIZE);
    state.context.font = "bold 75px Arial";
    let w = state.context.measureText(message);
    let x = (BOARD_WIDTH * SQUARE_SIZE - w.width) / 2;
    let y = (BOARD_HEIGHT * SQUARE_SIZE + 32) / 2;
    state.context.fillText(message, x, y, BOARD_WIDTH * SQUARE_SIZE);
};
const showModal = (title, message, win) => {
    Swal.fire({
        title: title,
        html: `<p class="${win ? "has-text-success-dark" : "has-text-danger-dark"}">${message}</p><p>You scored: ${state.score}</p>`,
    });
};
const wait = (ms) => __awaiter(this, void 0, void 0, function* () {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
});
const generateEnemies = () => {
    for (let i = 1; i <= ROWS; i++) {
        for (let j = 5; j < BOARD_WIDTH - (4 + MOVEMENT); j += 2) {
            state.enemies.push({ position: { x: j - MOVEMENT, y: i * 2 } });
        }
    }
};
const updateLives = () => {
    const lbl = document.getElementById('lives');
    lbl.innerHTML = "";
    for (let idx = 0; idx < state.player.lives; idx++) {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart ml-1';
        lbl.appendChild(heart);
    }
};
const updateAmmunition = () => {
    const lbl = document.getElementById('ammunition');
    lbl.innerHTML = "";
    if (state.player.ammunition > 5) {
        for (let idx = 0; idx < 5; idx++) {
            const bullet = document.createElement('i');
            bullet.className = 'fas fa-thermometer-full ml-1';
            lbl.appendChild(bullet);
        }
        const plus = document.createElement('i');
        plus.className = 'fas fa-plus ml-1';
        lbl.appendChild(plus);
        const txt = document.createElement('span');
        txt.className = "ml-1";
        txt.textContent = `(${state.player.ammunition})`;
        lbl.appendChild(txt);
    }
    else if (state.player.ammunition > 0) {
        for (let idx = 0; idx < state.player.ammunition; idx++) {
            const bullet = document.createElement('i');
            bullet.className = 'fas fa-thermometer-full ml-1';
            lbl.appendChild(bullet);
        }
    }
    else {
        const txt = document.createElement('span');
        txt.className = "ml-1";
        txt.textContent = `(${state.player.ammunition})`;
        lbl.appendChild(txt);
        onGameOver();
        printMessage("Game Over");
        showModal("Game Over", "You're out of ammunition!", LOSE);
    }
};
const playerShoot = () => {
    if (state.player.ammunition > 0) {
        state.bullets.push({ x: state.player.position.x + 0.0, y: state.player.position.y + 0.0, target: ENEMY });
        state.player.ammunition -= 1;
        updateAmmunition();
        if (state.player.ammunition > 1) {
            requestAnimationFrame(draw);
        }
    }
};
const enemyShoot = () => {
    let idx = Math.floor(Math.random() * state.enemies.length);
    state.bullets.push({ x: state.enemies[idx].position.x + 0.0, y: state.enemies[idx].position.y + 0.0 + 1, target: PLAYER });
};
const onHitPlayer = () => {
    if (state.player.lives === 1) {
        onLose();
    }
    wait(500);
};
const onHitEnemy = (x, y) => {
    if (x === state.enemies[0].position.x && y === state.enemies[0].position.y) {
        state.enemies = JSON.parse(JSON.stringify(state.enemies).replace(`{\"x\":${x},\"y\":${y}},`, ""));
    }
    else {
        state.enemies = JSON.parse(JSON.stringify(state.enemies).replace(`,{\"x\":${x},\"y\":${y}}`, ""));
    }
    if (state.enemies.length === 0) {
        onWin();
    }
};
const detectCollision = () => {
    state.bullets.forEach(bullet => {
        if (bullet.target === PLAYER) {
        }
        else {
        }
    });
};
const newGame = () => {
    if (state.runState === STATE_RUNNING) {
        // si aun esta en curso el juego entonces avisa al usuario
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        Toast.fire({
            icon: 'error',
            title: "You're playing a game"
        });
    }
    else {
        // limpia el tablero
        clearBoard();
        // reinicio de variables de juego
        state.player = {
            lives: 3,
            direction: 1,
            ammunition: 5,
            position: { x: Math.floor(BOARD_WIDTH / 2), y: BOARD_HEIGHT - INITIAL_POSITION }
        };
        state.enemies = [];
        state.bullets = [];
        state.score = 0;
        state.runState = STATE_RUNNING;
        // Inicializacion de los enemigos
        generateEnemies();
        updateLives();
        updateAmmunition();
        runGame();
    }
};
const onGameOver = () => {
    state.runState = STATE_LOSING;
    if (state.score > state.highScore) {
        state.highScore = state.score + 0.0;
        localStorage.setItem('high_score', state.highScore.toString());
    }
    highScoreLabel.textContent = `${state.highScore}`;
    clearBoard();
};
const onLose = () => {
    onGameOver();
    printMessage("Game Over");
    showModal("Game Over", "You Lose!", LOSE);
};
const onWin = () => {
    onGameOver();
    printMessage("You won!");
    showModal("Game Over", "You won!", WIN);
};
const checkPlayerMove = (x, direction) => {
    if (direction > 0) {
        const width = SQUARE_SIZE * BOARD_WIDTH;
        if ((x + direction) * SQUARE_SIZE < width - SQUARE_SIZE) {
            return true;
        }
        return false;
    }
    else {
        if (x + direction > 0) {
            return true;
        }
        return false;
    }
};
const movePlayer = () => {
    const direction = state.player.direction;
    if (direction === MOVEMENT || direction === -MOVEMENT) {
        if (checkPlayerMove(state.player.position.x, direction)) {
            state.player.position.x += direction;
            requestAnimationFrame(draw);
        }
    }
};
const runGame = () => __awaiter(this, void 0, void 0, function* () {
    let counter = 0;
    while (state.runState === STATE_RUNNING) {
        if (counter === 50) {
            enemyShoot();
            counter = 0;
        }
        requestAnimationFrame(draw);
        yield wait(TICK);
        counter++;
    }
});
window.onload = () => {
    state.canvas = document.querySelector('canvas');
    state.context = state.canvas.getContext('2d');
    window.onkeydown = (e) => {
        const direction = DIRECTION_MAPS[e.key];
        if (state.runState === STATE_RUNNING) {
            if (direction) { // si la direccion existe entonces...
                if (direction === SHOOT) {
                    playerShoot();
                }
                else {
                    state.player.direction = direction;
                    movePlayer();
                }
            }
        }
    };
};
