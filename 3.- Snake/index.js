const STATE_RUNNING = 0;
const STATE_LOSING = 1;
const TICK = 80; // ticks del juego
const SQUARE_SIZE = 10; // cual sera la dimesion de cada casilla
const BOARD_HEIGHT = 50; // altura del tablero
const BOARD_WIDTH = 50; // anchura del tablero
const GROW_SCALE = 3; // que tanto crecera la serpiente al recoger la bolita
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
    'ArrowRight': [1, 0]
}

const randomXY = () => {
    return {
        x: Math.floor(Math.random() * BOARD_WIDTH),
        y: Math.floor(Math.random() * BOARD_HEIGHT)
    };
};

let state = {
    canvas: null,
    context: null,
    snake: [{ x: 25, y: 25 }, { x: 24, y: 24 }],
    direction: { x: 1, y: 0 },
    prey: randomXY(),
    growing: 0,
    runState: STATE_LOSING,
    score: 0,
    highScore: 0
};

const hs = localStorage.getItem('high_score');

if (hs) {
    state.highScore = parseInt(hs);
}

let highScoreLabel = document.getElementById('hiscore');
highScoreLabel.textContent = state.highScore;

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
        drawPixel("#22dd22", x, y);
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

const newGame = () => {
    if (state.runState === STATE_LOSING) {
        state.snake = [{ x: 25, y: 25 }, { x: 24, y: 24 }];
        state.direction = { x: 1, y: 0 };
        state.prey = randomXY();
        state.growing = 0;
        state.runState = STATE_RUNNING;
        state.score = 0;
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

const onScore = () => {
    const tail = {};
    const highestIndex = state.snake.length - 1;

    const scoreLabel = document.getElementById('score');

    Object.assign(tail, state.snake[highestIndex]);

    console.log('score')
    state.growing += GROW_SCALE;
    state.prey = randomXY();

    if (state.growing > 0) {
        state.snake.push(tail);
        state.growing -= 1;
    }

    state.score++;

    scoreLabel.textContent = state.score;

    if (state.score > state.highScore) {
        highScoreLabel.textContent = state.score;
    }
};

const onGameOver = () => {

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

};

const wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

const tick = async () => {
    while (state.runState === STATE_RUNNING) {
        let interval = TICK;
        const head = state.snake[0];
        const dx = state.direction.x;
        const dy = state.direction.y;
        const highestIndex = state.snake.length - 1;


        let didScore = (
            head.x === state.prey.x && head.y === state.prey.y
        );

        if (state.runState === STATE_RUNNING) {
            for (let idx = highestIndex; idx >= 0; idx--) {
                const sq = state.snake[idx];

                if (idx === 0) {
                    sq.x += dx;
                    sq.y += dy;
                } else {
                    sq.x = state.snake[idx - 1].x;
                    sq.y = state.snake[idx - 1].y;
                }
            }
        }

        if (detectCollision()) {
            console.log("collision detected");
            onGameOver();
        }

        if (didScore) {
            onScore();
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
