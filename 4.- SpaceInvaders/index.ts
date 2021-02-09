const STATE_LOSING = 0;
const STATE_RUNNING = 1;
const STATE_PAUSE = 2;
const TICK = 5;
const MOVING_TIMER = 36;
const SQUARE_SIZE = 20; // cual sera la dimesion de cada casilla (10)
const BULLET_WIDTH = SQUARE_SIZE / 5;
const BOARD_HEIGHT = 25; // altura del tablero (50)
const BOARD_WIDTH = 25;
const ROWS = 6; // numero de filas de aliens
const INITIAL_POSITION = 2; // posicion inicial del jugador
const MOVEMENT = 0.5;
const BULLET_MOVEMENT = 0.1;
const ENEMY_MOVEMENT = 0.4;
const SHOOT = 2;
const WIN = 1;
const LOSE = 0;
const DIRECTION_MAPS = { // desplazamiento que hara al presionar una tecla, en eje X, 0  es disparo
    'left': -MOVEMENT,
    'right': MOVEMENT,
    'ArrowLeft': -MOVEMENT,
    'ArrowRight': MOVEMENT,
    'shoot': SHOOT,
    'x': SHOOT,
    'X': SHOOT
};
const ENEMY = 0;
const PLAYER = 1;
const LEFT = 0;
const RIGHT = 1;

interface Bullet {
    x: number;
    y: number;
    target: number;
};

interface Player {
    lives: number;
    direction: number;
    ammunition: number;
    position: { x: number; y: number; };
}

interface Enemy {
    position: { x: number; y: number; };
    score: number;
}

interface State {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    player: Player;
    bullets: Array<Bullet>;
    score: number;
    highScore: number;
    runState: number;
    enemies: Array<Enemy>;
}

let state: State = {
    canvas: null,
    context: null,
    player: {
        lives: 3,
        direction: 1,
        ammunition: 100,
        position: { x: Math.floor(BOARD_WIDTH / 2), y: BOARD_HEIGHT - INITIAL_POSITION }
    },
    enemies: [],
    bullets: [], // {x,y,target}
    score: 0,
    highScore: 0,
    runState: STATE_LOSING
}

let timeout: NodeJS.Timeout;

let enemiesDirection = RIGHT;

let shootAvailable = true;
let moveCounter = MOVING_TIMER;

const hs = localStorage.getItem('high_score');

if (hs) {
    state.highScore = parseInt(hs);
}

let scoreLabel = document.getElementById('score');
let highScoreLabel = document.getElementById('hiscore');
highScoreLabel.textContent = `${state.highScore}`;

const drawPixel = (color: string, x: number, y: number, bullet: boolean) => {
    state.context.fillStyle = color;
    if (bullet) {
        state.context.fillRect(
            x * SQUARE_SIZE + (SQUARE_SIZE / 2 - BULLET_WIDTH / 2),
            y * SQUARE_SIZE,
            BULLET_WIDTH,
            SQUARE_SIZE,
        );
    } else {
        state.context.fillRect(
            x * SQUARE_SIZE,
            y * SQUARE_SIZE,
            SQUARE_SIZE,
            SQUARE_SIZE,
        );
    }
};

const draw = () => {
    state.context.clearRect(0, 0, 500, 500);

    // print player
    drawPixel("#14d4d8", state.player.position.x, state.player.position.y, false);

    // print enemies
    state.enemies.forEach(enemy => {
        drawPixel("#e9f722", enemy.position.x, enemy.position.y, false);
    });

    // print bullets
    state.bullets.forEach(bullet => {
        if (bullet.target === ENEMY) {
            drawPixel("#fefefe", bullet.x, bullet.y, true);
        } else if (bullet.target === PLAYER) {
            drawPixel("#ea4335", bullet.x, bullet.y, true);
        }
    });

};

const clearBoard = () => {
    state.context.clearRect(0, 0, BOARD_WIDTH * SQUARE_SIZE, BOARD_HEIGHT * SQUARE_SIZE);
};

const printMessage = (message: string) => {
    state.context.fillStyle = 'white';
    state.context.clearRect(0, 0, BOARD_WIDTH * SQUARE_SIZE, BOARD_HEIGHT * SQUARE_SIZE);
    state.context.font = "bold 75px Arial";

    let w = state.context.measureText(message);
    let x = (BOARD_WIDTH * SQUARE_SIZE - w.width) / 2;
    let y = (BOARD_HEIGHT * SQUARE_SIZE + 32) / 2;

    state.context.fillText(message, x, y, BOARD_WIDTH * SQUARE_SIZE);
};

const showModal = (title: string, message: string, win: number) => {
    Swal.fire({
        title: title,
        html: `<p class="${win ? "has-text-success-dark" : "has-text-danger-dark"}">${message}</p><p id="final">You scored: ${state.score}</p>`,
    });
}

const wait = async (ms: number) => {
    return new Promise(resolve => {
        timeout = setTimeout(resolve, ms);
    });
};

const generateEnemies = () => {
    for (let i = 1; i <= ROWS; i++) {
        for (let j = 4; j < BOARD_WIDTH - 4 + MOVEMENT; j += 2) {
            state.enemies.push({ position: { x: j - MOVEMENT, y: i * 2 }, score: (ROWS * 10) - ((i - 1) * 10) });
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

    } else if (state.player.ammunition > 0) {

        for (let idx = 0; idx < state.player.ammunition; idx++) {
            const bullet = document.createElement('i');
            bullet.className = 'fas fa-thermometer-full ml-1';
            lbl.appendChild(bullet);
        }

    } else {
        const txt = document.createElement('span');
        txt.className = "ml-1";
        txt.textContent = `(${state.player.ammunition})`;
        lbl.appendChild(txt);

        onGameOver();

        printMessage("Game Over");

        showModal("Game Over", "You ran out of ammunition!", LOSE);
    }

};

const playerShoot = () => {
    if (shootAvailable === true) {
        shootAvailable = false;
        if (state.player.ammunition > 0) {
            state.bullets.push({ x: state.player.position.x + 0.0, y: state.player.position.y + 0.0, target: ENEMY });
            state.player.ammunition -= 1;
            updateAmmunition();
            if (state.player.ammunition > 1) {
                requestAnimationFrame(draw);
            }
        }
    }
};

const enemyShoot = async () => {
    let idx = Math.floor(Math.random() * state.enemies.length);

    state.bullets.push({ x: state.enemies[idx].position.x + 0.0, y: state.enemies[idx].position.y + 0.0 + 1, target: PLAYER });

};

const onScore = (score: number) => {

    anime({
        targets: '#score',
        textContent: [state.score, state.score + score],
        round: 1,
        easing: 'easeInOutExpo'
    });

    state.score += score;

    if (state.score > state.highScore) {

        anime({
            targets: '#hiscore',
            textContent: [state.highScore, state.score],
            round: 1,
            easing: 'easeInOutExpo'
        });

        state.highScore = state.score + 0.0;

        localStorage.setItem('high_score', state.highScore.toString());
    }

};

const onHitPlayer = async () => {

    state.player.lives -= 1;
    updateLives();
    if (state.player.lives === 0) {
        onLose();
    }
    //await wait(500);
};

const onHitEnemy = async (enemy: Enemy) => {
    const { x, y } = enemy.position;
    const { score } = enemy;

    onScore(score);

    if (x === state.enemies[0].position.x && y === state.enemies[0].position.y) {
        if (state.enemies.length === 1) {
            state.enemies = JSON.parse(JSON.stringify(state.enemies).replace(`{"position":{"x":${x},"y":${y}},"score":${score}}`, ""));
        } else {
            state.enemies = JSON.parse(JSON.stringify(state.enemies).replace(`{"position":{"x":${x},"y":${y}},"score":${score}},`, ""));
        }
    } else {
        state.enemies = JSON.parse(JSON.stringify(state.enemies).replace(`,{"position":{"x":${x},"y":${y}},"score":${score}}`, ""));
    }

    if (state.enemies.length === 0) {
        onWin();
    }
};

const detectCollision = async () => {
    for (let idx = 0; idx < state.bullets.length; idx++) {
        const bullet = state.bullets[idx];

        /*
            Primer condicion, si la bala pega en el borde izquierdo
            Segunda condicion, si la bala pega en el borde derecho
            Tercera condicion, si la bala pega en medio
        */

        /*
            Primera condicion, si la bala pega en el tope
            Segunda condicion, si la bala pega en el fondo
            Tercera condicion, si la bala pega en medio
        */

        if (bullet.target === PLAYER) {// px12.5 pxn250 pxnw270 bx9.5 bxn188 bxnw 192
            const playerX = state.player.position.x * SQUARE_SIZE;
            const playerMaxX = playerX + SQUARE_SIZE;
            const playerY = state.player.position.y * SQUARE_SIZE;
            const playerMaxY = playerY + SQUARE_SIZE;

            const bulletX = bullet.x * SQUARE_SIZE + (SQUARE_SIZE / 2) - (BULLET_WIDTH / 2);
            const bulletMaxX = bulletX + BULLET_WIDTH;
            const bulletY = bullet.y * SQUARE_SIZE;
            const bulletMaxY = bulletY + SQUARE_SIZE;

            if (
                (
                    (
                        bulletX <= playerX
                        && playerX <= bulletMaxX
                    ) || (
                        bulletX <= playerMaxX
                        && bulletMaxX >= playerMaxX
                    ) || (
                        bulletX >= playerX
                        && bulletMaxX <= playerMaxX
                    )
                )
                &&
                (
                    (
                        bulletMaxY >= playerY
                        && playerY <= bulletY
                    ) || (
                        bulletMaxY >= playerMaxY
                        && bulletY <= playerMaxY
                    )
                )
            ) {
                console.log('----------------')
                console.log('player got hit');
                console.log(`player X:${state.player.position.x} y:${state.player.position.y}`);
                console.log(`bullet x:${bullet.x} y:${bullet.y}`);

                draw();
                await removeBullet(bullet);
                await onHitPlayer();
            }
        } else {

            const bulletX = bullet.x * SQUARE_SIZE + (SQUARE_SIZE / 2) - (BULLET_WIDTH / 2);
            const bulletMaxX = bulletX + BULLET_WIDTH;
            const bulletY = bullet.y * SQUARE_SIZE;
            const bulletMaxY = bulletY + SQUARE_SIZE;

            for (let i = 0; i < state.enemies.length; i++) {
                const enemy = state.enemies[i];

                const enemyX = enemy.position.x * SQUARE_SIZE;
                const enemyMaxX = enemyX + SQUARE_SIZE;
                const enemyY = enemy.position.y * SQUARE_SIZE;
                const enemyMaxY = enemyY + SQUARE_SIZE;

                if (
                    (
                        (
                            bulletX <= enemyX
                            && enemyX <= bulletMaxX
                        ) || (
                            bulletX <= enemyMaxX
                            && bulletMaxX >= enemyMaxX
                        ) || (
                            bulletX >= enemyX
                            && bulletMaxX <= enemyMaxX
                        )
                    )
                    &&
                    (
                        (
                            bulletY <= enemyMaxY
                            && enemyMaxY <= bulletY
                        ) || (
                            bulletMaxY >= enemyMaxY
                            && bulletY <= enemyMaxY
                        ))
                ) {
                    console.log('--------------');
                    console.log('enemy got hit');
                    console.log(`enemy x:${enemy.position.x} y:${enemy.position.y}`);
                    console.log(`bullet x:${bullet.x} y:${bullet.y}`);
                    console.log(`enemyX:${enemyX}`);
                    console.log(`enemyMaxX:${enemyMaxX}`);
                    console.log(`enemyY:${enemyY}`);
                    console.log(`enemyMaxY:${enemyMaxY}`);
                    console.log(`bulletX:${bulletX}`);
                    console.log(`bulletMaxX:${bulletMaxX}`);
                    console.log(`bulletY:${bulletY}`);
                    console.log(`bulletMaxY:${bulletMaxY}`);
                    draw();
                    await removeBullet(bullet);
                    await onHitEnemy(enemy);
                }
            }
        }

        if (bullet.y === 0 || bullet.y + 1 === BOARD_HEIGHT) {
            removeBullet(bullet);
        }
    }
};

const onPause = () => {
    clearTimeout(timeout);
    printMessage("Pause");
    requestAnimationFrame(() => { printMessage("Pause") });
};

const moveBullets = async () => {
    state.bullets.forEach(bullet => {
        if (bullet.target === PLAYER) {
            bullet.y = Math.round((bullet.y + BULLET_MOVEMENT) * 10000) / 10000;
        } else {
            bullet.y = Math.ceil((bullet.y - BULLET_MOVEMENT) * 100) / 100;
        }
    });
};

const removeBullet = async (bullet: Bullet) => {
    const { x, y, target } = bullet;
    if (x === state.bullets[0].x && y === state.bullets[0].y) {
        state.bullets = JSON.parse(JSON.stringify(state.bullets).replace(`{\"x\":${x},\"y\":${y},\"target\":${target}},`, ""));
    } else {
        state.bullets = JSON.parse(JSON.stringify(state.bullets).replace(`,{\"x\":${x},\"y\":${y},\"target\":${target}}`, ""));
    }
};

const newGame = () => {

    if (state.runState === STATE_RUNNING || state.runState === STATE_PAUSE) {
        // si aun esta en curso el juego entonces avisa al usuario
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
        });

        Toast.fire({
            icon: 'error',
            title: "You're playing a game"
        });

    } else {
        // limpia el tablero
        clearBoard();

        // reinicio de variables de juego
        state.player = {
            lives: 5,
            direction: 1,
            ammunition: BOARD_WIDTH * ROWS,
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

        moveCounter = MOVING_TIMER;
        enemiesDirection = RIGHT;
        shootAvailable = true;

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

    clearTimeout(timeout);

    clearBoard();

};

const onLose = () => {

    onGameOver();

    printMessage("Game Over");

    showModal("Game Over", "You Lose! You died.", LOSE);

};

const onWin = () => {

    onGameOver();

    printMessage("You won!");

    showModal("Game Over", "You won! There aren't more enemies.", WIN);

};

const checkPlayerMove = (x: number, direction: number) => {
    if (direction > 0) {
        const width = SQUARE_SIZE * BOARD_WIDTH;
        if ((x + direction) * SQUARE_SIZE < width - SQUARE_SIZE) {
            return true;
        }
        return false;
    } else {
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

const findEdgestEnemy = (direction: number): Enemy => {
    let edgest: Enemy = { position: { x: (direction === LEFT) ? Infinity : -1, y: -1 }, score: 0 };
    let highestY = -1;

    if (direction === LEFT) {
        state.enemies.forEach(enemy => {
            const { x, y } = enemy.position;
            if (x < edgest.position.x) {
                edgest = enemy;
            }
            if (y > highestY) {
                highestY = y;
            }
        });
    } else {
        state.enemies.forEach(enemy => {
            const { x, y } = enemy.position;
            if (x > edgest.position.x) {
                edgest = enemy;
                highestY = y;
            }
            if (y > highestY) {
                highestY = y;
            }
        });
    }

    return { position: { x: edgest.position.x, y: highestY }, score: 0 };
};

const checkEnemyMove = (enemy: Enemy, direction: number) => {
    const { x, y } = enemy.position;

    if (x === 0.5 || x === BOARD_WIDTH - 1 - MOVEMENT) {
        if (y + ENEMY_MOVEMENT + 1 > BOARD_HEIGHT - 2) {
            onGameOver();

            printMessage("Game Over");

            showModal("Game Over", "You ran out of space!", LOSE);
            return false;
        }
        return true;
    } else {
        if (direction === LEFT) {
            const width = SQUARE_SIZE * BOARD_WIDTH;
            if ((x + MOVEMENT) * SQUARE_SIZE < width - SQUARE_SIZE) {
                return true;
            }
            return false;
        } else {
            if (x + MOVEMENT > 0) {
                return true;
            }
            return false;
        }
    }
};

const moveEnemies = async () => {

    const pivot = findEdgestEnemy(enemiesDirection);

    const { x } = pivot.position;

    if (checkEnemyMove(pivot, enemiesDirection)) {

        if ((x === 0.5 && enemiesDirection === LEFT) || (x === BOARD_WIDTH - 1 - MOVEMENT && enemiesDirection === RIGHT)) {
            state.enemies.forEach(enemy => {
                enemy.position.y = Math.round((enemy.position.y + ENEMY_MOVEMENT) * 10000) / 10000;
            });
            if (enemiesDirection === LEFT) {
                enemiesDirection = RIGHT;
                if (moveCounter > 3) {
                    moveCounter -= 1.5;
                }
            } else {
                enemiesDirection = LEFT;
                if (moveCounter > 3) {
                    moveCounter -= 1.8;
                }
            }
        } else {
            state.enemies.forEach(enemy => {
                enemy.position.x += (enemiesDirection === LEFT) ? -MOVEMENT : MOVEMENT;
            });
        }
    }
};

const runGame = async () => {
    let counter = 0;
    let interval = TICK;
    while (state.runState === STATE_RUNNING) {

        if (state.runState === STATE_RUNNING) {
            if (counter % Math.round(moveCounter) === 0) {
                await moveEnemies();
            }
        }

        if (state.runState === STATE_RUNNING) {
            if (counter % 108 === 0) {
                await enemyShoot();
            }
        }

        if (state.runState === STATE_RUNNING) {
            if (counter % 72 === 0) {
                shootAvailable = true;
            }
        }

        if (state.runState === STATE_RUNNING) {
            if (counter % 3 === 0) {
                await moveBullets();
                await detectCollision();
            }
        }

        if (state.runState === STATE_RUNNING) {
            requestAnimationFrame(draw);
            await wait(interval);
            counter++;
        }
    }
}

window.onload = () => {

    state.canvas = document.querySelector('canvas');

    state.context = state.canvas.getContext('2d');

    document.getElementById('button').removeAttribute('disabled');

    window.onkeydown = (e: KeyboardEvent) => {
        const direction = DIRECTION_MAPS[e.key];

        if (state.runState === STATE_RUNNING) {
            if (direction) { // si la direccion existe entonces...

                if (direction === SHOOT) {
                    playerShoot();
                } else {
                    state.player.direction = direction;
                    movePlayer();
                }

            }
        }

        if (e.key === 'p' || e.key === 'P') {
            if (state.runState === STATE_RUNNING) {
                state.runState = STATE_PAUSE;
                onPause();
            } else if (state.runState === STATE_PAUSE) {
                state.runState = STATE_RUNNING;
                runGame();
            }
        }
    };

};

