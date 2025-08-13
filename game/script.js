let ctx;
let canvas;
let maze;
let mazeHeight;
let mazeWidth;
let player;
let gameTime = 0;
let timerInterval;
let deliveries = 0;
let gameActive = true;
let playerDirection = 'right';
let messageShown = false;  

const images = {
    player: new Image(),
    road: new Image(),
    wall: new Image(),
    wall1: new Image(),
    building: new Image(),
    house: new Image(),
    shop: new Image(),
    office: new Image(),
    mall: new Image(),
    gym: new Image(),
    medical: new Image()
};

let audio = {
    move: new Audio('assets/move-sound.mp3'),
    delivery: new Audio('assets/delivery-sound.mp3'),
    win: new Audio('assets/win-sound.mp3'),
    lose: new Audio('assets/lose-sound.mp3')
};

function loadImages() {
    images.player.src = 'assets/deliveryBoy.png';
    images.road.src = 'assets/roads.png';
    images.wall.src = 'assets/wall.png';
    images.wall1.src = 'assets/wall1.png';
    images.building.src = 'assets/building.png';
    images.house.src = 'assets/house.png';
    images.shop.src = 'assets/shop.png';
    images.office.src = 'assets/office.png';
    images.mall.src = 'assets/mall.png';
    images.gym.src = 'assets/gym.png';
    images.medical.src = 'assets/medical.png';
   
}

class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.col = 0;
        this.row = 0;
        playerDirection = 'right'; 
    }
}

class MazeCell {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.eastWall = true;
        this.northWall = true;
        this.southWall = true;
        this.westWall = true;
        this.visited = false;
        this.building = null;
    }
}

class Maze {
    constructor(cols, rows, cellSize) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.cells = [];
        this.generate();
    }

    generate() {
        gameTime = 0;
        deliveries = 0;
        gameActive = true;
        document.getElementById('deliveries').textContent = '0';
        updateTimer();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateGameTime, 1000);

    
const dpr = window.devicePixelRatio || 1;
const resolutionFactor = 16;  

const displayWidth = this.cols * this.cellSize;
const displayHeight = this.rows * this.cellSize;

canvas.width = displayWidth * dpr * resolutionFactor;
canvas.height = displayHeight * dpr * resolutionFactor;

ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(dpr * resolutionFactor, dpr * resolutionFactor);

canvas.style.width = `${displayWidth}px`;
canvas.style.height = `${displayHeight}px`;



        for (let col = 0; col < this.cols; col++) {
            this.cells[col] = [];
            for (let row = 0; row < this.rows; row++) {
                this.cells[col][row] = new MazeCell(col, row);
            }
        }

        let rndCol = Math.floor(Math.random() * this.cols);
        let rndRow = Math.floor(Math.random() * this.rows);
        let stack = [];
        stack.push(this.cells[rndCol][rndRow]);

        let currCell, dir, foundNeighbor, nextCell;

        while (this.hasUnvisited()) {
            currCell = stack[stack.length - 1];
            currCell.visited = true;

            if (this.hasUnvisitedNeighbor(currCell)) {
                nextCell = null;
                foundNeighbor = false;
                do {
                    dir = Math.floor(Math.random() * 4);
                    switch (dir) {
                        case 0:
                            if (currCell.col !== (this.cols - 1) && !this.cells[currCell.col + 1][currCell.row].visited) {
                                currCell.eastWall = false;
                                nextCell = this.cells[currCell.col + 1][currCell.row];
                                nextCell.westWall = false;
                                foundNeighbor = true;
                            }
                            break;
                        case 1:
                            if (currCell.row !== 0 && !this.cells[currCell.col][currCell.row - 1].visited) {
                                currCell.northWall = false;
                                nextCell = this.cells[currCell.col][currCell.row - 1];
                                nextCell.southWall = false;
                                foundNeighbor = true;
                            }
                            break;
                        case 2:
                            if (currCell.row !== (this.rows - 1) && !this.cells[currCell.col][currCell.row + 1].visited) {
                                currCell.southWall = false;
                                nextCell = this.cells[currCell.col][currCell.row + 1];
                                nextCell.northWall = false;
                                foundNeighbor = true;
                            }
                            break;
                        case 3:
                            if (currCell.col !== 0 && !this.cells[currCell.col - 1][currCell.row].visited) {
                                currCell.westWall = false;
                                nextCell = this.cells[currCell.col - 1][currCell.row];
                                nextCell.eastWall = false;
                                foundNeighbor = true;
                            }
                            break;
                    }
                    if (foundNeighbor) stack.push(nextCell);
                } while (!foundNeighbor);
            } else {
                stack.pop();
            }
        }

        this.addBuildings();
        this.redraw();
    }

    addBuildings() {
        const buildingTypes = ['house', 'shop', 'office', 'mall', 'gym', 'medical'];
        const buildingCount = Math.floor(this.cols * this.rows * 0.2);

        for (let i = 0; i < buildingCount; i++) {
            const col = Math.floor(Math.random() * this.cols);
            const row = Math.floor(Math.random() * this.rows);

            if ((col === 0 && row === 0) || (col === this.cols - 1 && row === this.rows - 1)) continue;

            const randomBuilding = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            this.cells[col][row].building = randomBuilding;
        }
    }

    hasUnvisited() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!this.cells[col][row].visited) return true;
            }
        }
        return false;
    }

    hasUnvisitedNeighbor(mazeCell) {
        return ((mazeCell.col !== 0 && !this.cells[mazeCell.col - 1][mazeCell.row].visited) ||
                (mazeCell.col !== (this.cols - 1) && !this.cells[mazeCell.col + 1][mazeCell.row].visited) ||
                (mazeCell.row !== 0 && !this.cells[mazeCell.col][mazeCell.row - 1].visited) ||
                (mazeCell.row !== (this.rows - 1) && !this.cells[mazeCell.col][mazeCell.row + 1].visited));
    }

    redraw() {
        ctx.clearRect(0, 0, mazeWidth, mazeHeight);

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                ctx.drawImage(images.road, col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const cell = this.cells[col][row];

                if (cell.eastWall) {
                    ctx.drawImage(images.wall, (col + 1) * this.cellSize - 20, row * this.cellSize, 40, this.cellSize);
                }
                if (cell.northWall) {
                    ctx.drawImage(images.wall1, col * this.cellSize, row * this.cellSize - 5, this.cellSize, 30);
                }
                if (cell.southWall) {
                    ctx.drawImage(images.wall1, col * this.cellSize, (row + 1) * this.cellSize - 15, this.cellSize, 25);
                }
                if (cell.westWall) {
                    ctx.drawImage(images.wall, col * this.cellSize -15, row * this.cellSize, 30, this.cellSize);
                }

                if (cell.building && images[cell.building]) {
                    const size = this.cellSize * 0.9;
                    const offset = (this.cellSize - size) / 2;
                    ctx.drawImage(images[cell.building], col * this.cellSize + offset, row * this.cellSize + offset, size, size);
                }
            }
        }
        const endSize = this.cellSize * 0.9;
        const endOffset = (this.cellSize - endSize) / 2;
        ctx.drawImage(images.mall,
            (this.cols - 1) * this.cellSize + endOffset,
            (this.rows - 1) * this.cellSize + endOffset,
            endSize, endSize);

        const playerSize = this.cellSize * 0.8;
        const playerOffset = (this.cellSize - playerSize) / 2;
        const centerX = player.col * this.cellSize + this.cellSize / 2;
        const centerY = player.row * this.cellSize + this.cellSize / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        switch(playerDirection) {
            case 'up':
                ctx.rotate(-Math.PI/2);
                break;
            case 'down':
                ctx.rotate(Math.PI/2);
                break;
            case 'left':
                ctx.rotate(Math.PI);
                break;
            
        }

        ctx.drawImage(images.player,
            -playerSize/2,
            -playerSize/2,
            playerSize, playerSize);
        ctx.restore();

        if (player.col === this.cols - 1 && player.row === this.rows - 1 && gameActive && !messageShown) {
            gameActive = false;
            clearInterval(timerInterval);
            showMessage("Congratulations! You delivered all packages in " + formatTime(gameTime), "win");
            messageShown = true;  
        }

        const currentCell = this.cells[player.col][player.row];
        if (currentCell.building && gameActive) {
            deliveries++;
            document.getElementById('deliveries').textContent = deliveries;
            currentCell.building = null;
            playDeliverySound();
        }
    }
}

function updateGameTime() {
    if (gameActive) {
        gameTime++;
        updateTimer();

        if (gameTime >= 200 && !messageShown) {
            gameActive = false;
            clearInterval(timerInterval);
            playLoseSound();
            showMessage("Time's up! You didn't deliver all packages in time.", "lose");
            messageShown = true;  
        }
    }
}

function updateTimer() {
    const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
    const seconds = (gameTime % 60).toString().padStart(2, '0');
    document.getElementById('time').textContent = `${minutes}:${seconds}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}


function showMessage(text, type) {
    const message = document.getElementById('message');
    const content = document.getElementById('messageContent');
    content.textContent = text;
    content.className = type;
    message.classList.remove('hidden');
    message.classList.add('show');
    
    if (type === "win") {
        const button = document.createElement('button');
        button.textContent = 'Claim Your Free Delivery!';
        button.onclick = function() {
            sessionStorage.setItem('deliveryReward', 'true');
           
            window.location.href = 'coupon.html';
        };
        content.appendChild(document.createElement('br'));
        content.appendChild(button);
    }
}


function hideMessage() {
    document.getElementById('message').classList.add('hidden');
}

function onClick(event) {
    player.reset();
    const levelSelect = document.getElementById('level');
    const level = levelSelect ? parseInt(levelSelect.value) : 10; 
    maze = new Maze(level, level, 35); 
}

function onControlClick(event) {
    if (!gameActive) return;

    switch (event.target.id) {
        case 'left':
            if (!maze.cells[player.col][player.row].westWall) {
                player.col -= 1;
                playerDirection = 'left';
                playMoveSound();
            }
            break;
        case 'right':
            if (!maze.cells[player.col][player.row].eastWall) {
                player.col += 1;
                playerDirection = 'right';
                playMoveSound();
            }
            break;
        case 'down':
            if (!maze.cells[player.col][player.row].southWall) {
                player.row += 1;
                playerDirection = 'down';
                playMoveSound();
            }
            break;
        case 'up':
            if (!maze.cells[player.col][player.row].northWall) {
                player.row -= 1;
                playerDirection = 'up';
                playMoveSound();
            }
            break;
        default:
            break;
    }
    maze.redraw();
}

function onKeyDown(event) {
    if (!gameActive) return;

    switch (event.keyCode) {
        case 37: 
        case 65: 
            if (!maze.cells[player.col][player.row].westWall) {
                player.col -= 1;
                playerDirection = 'left';
                playMoveSound();
            }
            break;
        case 39: 
        case 68: 
            if (!maze.cells[player.col][player.row].eastWall) {
                player.col += 1;
                playerDirection = 'right';
                playMoveSound();
            }
            break;
        case 40: 
        case 83:
            if (!maze.cells[player.col][player.row].southWall) {
                player.row += 1;
                playerDirection = 'down';
                playMoveSound();
            }
            break;
        case 38: 
        case 87:
            if (!maze.cells[player.col][player.row].northWall) {
                player.row -= 1;
                playerDirection = 'up';
                playMoveSound();
            }
            break;
        default:
            break;
    }
    maze.redraw();
}

function playMoveSound() {
    audio.move.play();
}

function playDeliverySound() {
    audio.delivery.play();
}


function playLoseSound() {
    audio.lose.play();
}

function onLoad() {
    canvas = document.getElementById('mainCanvas');
    ctx = canvas.getContext('2d');

    loadImages();

    let imagesLoaded = 0;
    const totalImages = Object.keys(images).length;

    for (const key in images) {
        images[key].onload = function() {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                startGame();
            }
        };
        images[key].onerror = function() {
            console.error("Failed to load image:", key);
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                startGame();
            }
        };
    }

    if (totalImages === 0) {
        startGame();
    }
}

function startGame() {
    player = new Player();
    maze = new Maze(10, 10, 60); 

    document.addEventListener('keydown', onKeyDown);
    document.getElementById('generate').addEventListener('click', onClick);
    document.getElementById('up').addEventListener('click', onControlClick);
    document.getElementById('right').addEventListener('click', onControlClick);
    document.getElementById('down').addEventListener('click', onControlClick);
    document.getElementById('left').addEventListener('click', onControlClick);
}
