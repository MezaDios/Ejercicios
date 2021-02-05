const STATE_RUNNING = 0;
const STATE_LOSING = 1;
const TICK = 80; // ticks del juego (80)
const SQUARE_SIZE = 25; // cual sera la dimesion de cada casilla (10)
const BOARD_HEIGHT = 20; // altura del tablero (50)
const BOARD_WIDTH = 20; // anchura del tablero (50)
const GROW_SCALE = 1; // que tanto crecera la serpiente al recoger la bolita (3)
const DIRECTION_MAPS = { // desplazamiento que hara al presionar una tecla, [x,y]
    'W': [0, -1],
    'A': [-1, 0],
    'S': [0, 1],
    'D': [1, 0],
    'w': [0, -1],
    'a': [-1, 0],
    's': [0, 1],
    'd': [1, 0],
    'ArrowUp': [0, -1],
    'ArrowLeft': [-1, 0],
    'ArrowDown': [0, 1],
    'ArrowRight': [1, 0],
    'up': [0, -1],
    'left': [-1, 0],
    'down': [0, 1],
    'right': [1, 0]
}

const INITIAL_SNAKE = [{ x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
{ x: BOARD_WIDTH / 2 - 1, y: BOARD_HEIGHT / 2 },
{ x: BOARD_WIDTH / 2 - 2, y: BOARD_HEIGHT / 2 }]; // posicion inicial de la serpiente (25,25 24,25)

var CELLS = [];

let state = {
    canvas: null,
    context: null,
    snake: JSON.parse(JSON.stringify(INITIAL_SNAKE)),
    direction: { x: 1, y: 0 },
    prey: { x: 1, y: 0 },
    growing: 0,
    runState: STATE_LOSING,
    score: 0,
    highScore: 0,
    prevDirection: { x: 1, y: 0 },
    availableCells: JSON.parse(JSON.stringify(CELLS))
};

const hs = localStorage.getItem('high_score');

if (hs) {
    state.highScore = parseInt(hs);
}

let highScoreLabel = document.getElementById('hiscore');
highScoreLabel.textContent = state.highScore;

let timeout;

const randomXY = () => {
    if (state.availableCells.length === 0) {
        return { x: -1, y: -1 }
    } else {
        return state.availableCells[Math.floor(Math.random() * state.availableCells.length)];
    }
};

const drawPixel = (color, x, y) => {
    state.context.fillStyle = color;
    state.context.fillRect(
        x * SQUARE_SIZE,
        y * SQUARE_SIZE,
        SQUARE_SIZE,
        SQUARE_SIZE,
    );
};

const draw = () => {
    state.context.clearRect(0, 0, 500, 500);

    for (let idx = 0; idx < state.snake.length; idx++) {
        const { x, y } = state.snake[idx];
        if (idx === 0) {
            drawPixel("#113311", x, y);
        } else {
            drawPixel("#22dd22", x, y);
        }
    }

    const { x, y } = state.prey;
    drawPixel("yellow", x, y);

};

const detectCollision = () => {
    const head = state.snake[0];
    if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
        return true;
    }

    for (let idx = 1; idx < state.snake.length; idx++) {
        const sq = state.snake[idx];

        if (sq.x === head.x && sq.y === head.y) {
            return true;
        }
    }
    return false;
};

const clearBoard = () => {
    state.snake = [];
};

const initializeCells = () => {

    for (var i = 0; i < BOARD_WIDTH; i++) {
        for (var j = 0; j < BOARD_HEIGHT; j++) {
            CELLS.push({ x: i, y: j });
        }
    }

    for (let idx = 0; idx < INITIAL_SNAKE.length; idx++) {
        const x = INITIAL_SNAKE[idx].x;
        const y = INITIAL_SNAKE[idx].y;
        CELLS = JSON.parse(JSON.stringify(CELLS).replace(`,{\"x\":${x},\"y\":${y}}`, ""));
    }

    document.getElementById('button').removeAttribute('disabled');
};

const newGame = () => {
    if (state.runState === STATE_LOSING) {
        state.snake = JSON.parse(JSON.stringify(INITIAL_SNAKE));
        state.direction = { x: 1, y: 0 };
        state.growing = 0;
        state.runState = STATE_RUNNING;
        state.score = 0;
        state.prevDirection = { x: 1, y: 0 };
        state.availableCells = JSON.parse(JSON.stringify(CELLS));
        state.prey = randomXY();
        tick();
    } else {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        })

        Toast.fire({
            icon: 'error',
            title: "You're playing a game"
        })
    }
};

const onScore = async () => {

    const scoreLabel = document.getElementById('score');

    console.log('score');
    state.growing += GROW_SCALE;
    state.prey = randomXY();

    state.score++;

    scoreLabel.textContent = state.score;

    if (state.score > state.highScore) {
        highScoreLabel.textContent = state.score;
    }

    if (state.snake.length === BOARD_HEIGHT * BOARD_WIDTH) {
        state.runState = STATE_LOSING;
        state.growing = 0;

        if (state.score > state.highScore) {
            state.highScore = state.score + 0.0;

            localStorage.setItem('high_score', state.highScore);
        }

        highScoreLabel.textContent = state.highScore;

        clearBoard();

        Swal.fire({
            title: "<a>Game Over</a>",
            html: `<p class="text-success">You won!</p><p>You scored: ${state.score}</p>`,
        });
    }

};

const onGameOver = async () => {
    state.runState = STATE_LOSING;
    state.growing = 0;

    if (state.score > state.highScore) {
        state.highScore = state.score + 0.0;

        localStorage.setItem('high_score', state.highScore);
    }

    highScoreLabel.textContent = state.highScore;

    clearBoard();
    Swal.fire({
        title: "<a>Game Over</a>",
        html: `<p class="text-danger">You Lose!</p><p>You scored: ${state.score}</p>`,
    });

    clearTimeout(timeout);
};

const disableCell = (x, y) => {
    if (state.availableCells[0].x === x && state.availableCells[0].y === y) {
        state.availableCells = JSON.parse(JSON.stringify(state.availableCells).replace(`{\"x\":${x},\"y\":${y}},`, ""))
    } else {
        state.availableCells = JSON.parse(JSON.stringify(state.availableCells).replace(`,{\"x\":${x},\"y\":${y}}`, ""));
    }
};

const move = async () => {

    const dx = state.direction.x;
    const dy = state.direction.y;
    const highestIndex = state.snake.length - 1;

    if (-dx !== state.prevDirection.x && -dy !== state.prevDirection.y) {
        for (let idx = highestIndex; idx >= 0; idx--) {
            const sq = state.snake[idx];

            if (idx === 0) {
                sq.x += dx;
                sq.y += dy;
            } else {
                sq.x = state.snake[idx - 1].x;
                sq.y = state.snake[idx - 1].y;
            }
            disableCell(sq.x, sq.y);
        }

        state.prevDirection.x = dx + 0.0;
        state.prevDirection.y = dy + 0.0;

    } else if (dx === state.prevDirection.x && dy === state.prevDirection.y) {
        for (let idx = highestIndex; idx >= 0; idx--) {
            const sq = state.snake[idx];

            if (idx === 0) {
                sq.x += dx;
                sq.y += dy;
            } else {
                sq.x = state.snake[idx - 1].x;
                sq.y = state.snake[idx - 1].y;
            }
            disableCell(sq.x, sq.y);
        }

        state.prevDirection.x = dx + 0.0;
        state.prevDirection.y = dy + 0.0;

    } else {
        state.direction.x = state.prevDirection.x;
        state.direction.y = state.prevDirection.y;
        move();
    }

}

const wait = async (ms) => {
    return new Promise(resolve => {
        timeout = setTimeout(resolve, ms);
    });
}

const tick = async () => {
    while (state.runState === STATE_RUNNING) {
        let interval = TICK;
        const head = state.snake[0];
        const tail = {};
        const highestIndex = state.snake.length - 1;

        Object.assign(tail, state.snake[highestIndex]);

        let didScore = (
            head.x === state.prey.x && head.y === state.prey.y
        );

        await move();

        if (didScore) {
            await onScore();
        } else if (detectCollision()) {
            console.log("collision detected");
            await onGameOver();
        }

        if (state.growing > 0) {
            state.snake.push(tail);
            state.growing -= 1;
        } else {
            if (state.availableCells.length > 0) {
                state.availableCells.push(tail);
            }
        }

        requestAnimationFrame(draw);
        await wait(interval);
    }
    // setTimeout(tick, interval);

}

window.onload = () => {
    state.canvas = document.getElementById('canvas');
    state.context = state.canvas.getContext('2d');

    window.onkeydown = e => {
        const direction = DIRECTION_MAPS[e.key];

        if (direction) { // si la direccion existe entonces...

            const [x, y] = direction;

            if (-x !== state.direction.x && -y !== state.direction.y) {
                state.direction.x = x;
                state.direction.y = y;
            }

        }
    };

};

var static = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '50%', bottom: '100px' },
    color: 'white',
    shape: 'circle'
});

var joystick = static[0];

joystick.on('dir:up dir:left dir:down dir:right',
    function (evt, data) {

        const direction = DIRECTION_MAPS[data.direction.angle];

        if (direction) { // si la direccion existe entonces...

            const [x, y] = direction;
            if (-x !== state.direction.x && -y !== state.direction.y) {
                state.direction.x = x;
                state.direction.y = y;
            }

        }
    }
);

initializeCells();
