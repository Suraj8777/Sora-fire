const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerCountDisplay = document.getElementById('playerCount');
const stormRadiusDisplay = document.getElementById('stormRadius');
const playerWeaponDisplay = document.getElementById('playerWeapon');
const playerHealthDisplay = document.getElementById('playerHealth');
const minimap = document.getElementById('minimap');
const lobby = document.getElementById('lobby');
const gameContainer = document.getElementById('game-container');
const creatorControls = document.getElementById('creator-controls');

canvas.width = 800;
canvas.height = 600;

let players = [];
let weapons = [];
let bullets = [];
let stormRadius = 500;
let stormShrinkRate = 0.5;
let gameActive = false;
const maxPlayers = 10;

class Player {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = 10;
        this.speed = 4;
        this.color = '#fff';
        this.alive = true;
        this.weapon = null;
        this.health = 100;
        this.angle = 0;
    }

    draw() {
        if (this.alive) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.fill();
            ctx.closePath();
            ctx.fillStyle = this.health > 50 ? '#0f0' : '#f00';
            ctx.fillRect(-15, -20, this.health / 3.33, 5);
            ctx.restore();
            this.angle += 0.05;
        }
    }

    move(direction) {
        if (!this.alive) return;
        switch (direction) {
            case 'up': this.y -= this.speed; break;
            case 'down': this.y += this.speed; break;
            case 'left': this.x -= this.speed; this.angle -= 0.1; break;
            case 'right': this.x += this.speed; this.angle += 0.1; break;
        }
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        const distFromCenter = Math.sqrt((this.x - canvas.width / 2) ** 2 + (this.y - canvas.height / 2) ** 2);
        if (distFromCenter > stormRadius) {
            this.health -= 1;
            if (this.health <= 0) this.alive = false;
        }
    }

    shoot() {
        if (this.weapon && this.alive) {
            bullets.push({
                x: this.x,
                y: this.y,
                angle: this.angle,
                speed: 10,
                owner: this.id
            });
        }
    }
}

class Weapon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.type = 'Rifle';
        this.pickedUp = false;
    }

    draw() {
        if (!this.pickedUp) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0';
            ctx.fill();
            ctx.closePath();
        }
    }
}

class Bullet {
    constructor(x, y, angle, speed, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.owner = owner;
        this.radius = 3;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f00';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

function initializeGame() {
    players = [];
    weapons = [];
    bullets = [];
    stormRadius = 500;
    for (let i = 0; i < maxPlayers; i++) {
        const x = Math.random() * (canvas.width - 40) + 20;
        const y = Math.random() * (canvas.height - 40) + 20;
        players.push(new Player(x, y, i));
    }
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * (canvas.width - 40) + 20;
        const y = Math.random() * (canvas.height - 40) + 20;
        weapons.push(new Weapon(x, y));
    }
    userPlayer = players[0];
}

let userPlayer = null;

function startGame() {
    lobby.style.display = 'none';
    gameContainer.style.display = 'block';
    creatorControls.style.display = 'block';
    canvas.style.display = 'block';
    initializeGame();
    gameActive = true;
    gameLoop();
}

function resetGame() {
    initializeGame();
    stormRadius = 500;
    gameActive = true;
}

function toggleStorm() {
    stormShrinkRate = stormShrinkRate === 0 ? 0.5 : 0;
}

function spawnWeapon() {
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    weapons.push(new Weapon(x, y));
}

function movePlayer(direction) {
    if (gameActive && userPlayer.alive) {
        userPlayer.move(direction);
    }
}

function drawMinimap() {
    const ctxMinimap = minimap.getContext('2d');
    ctxMinimap.clearRect(0, 0, 100, 100);
    ctxMinimap.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctxMinimap.fillRect(0, 0, 100, 100);
    const scale = 100 / Math.max(canvas.width, canvas.height);
    players.forEach(player => {
        if (player.alive) {
            ctxMinimap.beginPath();
            ctxMinimap.arc((player.x - canvas.width / 2) * scale + 50, (player.y - canvas.height / 2) * scale + 50, 2, 0, Math.PI * 2);
            ctxMinimap.fillStyle = player.id === 0 ? '#0f0' : '#fff';
            ctxMinimap.fill();
            ctxMinimap.closePath();
        }
    });
    ctxMinimap.beginPath();
    ctxMinimap.arc(50, 50, stormRadius * scale, 0, Math.PI * 2);
    ctxMinimap.strokeStyle = '#fff';
    ctxMinimap.stroke();
    ctxMinimap.closePath();
}

function checkCollisions() {
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            if (players[i].alive && players[j].alive) {
                const dx = players[i].x - players[j].x;
                const dy = players[i].y - players[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < players[i].radius + players[j].radius) {
                    players[j].health -= 10;
                    if (players[j].health <= 0) players[j].alive = false;
                }
            }
        }
    }

    weapons.forEach(weapon => {
        if (!weapon.pickedUp) {
            const dx = userPlayer.x - weapon.x;
            const dy = userPlayer.y - weapon.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < userPlayer.radius + weapon.radius) {
                userPlayer.weapon = weapon.type;
                weapon.pickedUp = true;
                playerWeaponDisplay.textContent = weapon.type;
            }
        }
    });

    bullets.forEach((bullet, bIndex) => {
        players.forEach(player => {
            if (player.alive && player.id !== bullet.owner) {
                const dx = player.x - bullet.x;
                const dy = player.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < player.radius + bullet.radius) {
                    player.health -= 20;
                    if (player.health <= 0) player.alive = false;
                    bullets.splice(bIndex, 1);
                }
            }
        });
    });
}

function gameLoop() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, stormRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.001) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    stormRadius -= stormShrinkRate;
    if (stormRadius < 50) stormRadius = 50;
    stormRadiusDisplay.textContent = Math.floor(stormRadius);

    players.forEach(player => {
        if (player.id !== 0 && player.alive) {
            const angle = Math.random() * Math.PI * 2;
            player.x += Math.cos(angle) * player.speed * 0.5;
            player.y += Math.sin(angle) * player.speed * 0.5;
            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
            if (Math.random() < 0.01 && player.weapon) player.shoot();
        }
        player.draw();
    });

    weapons.forEach(weapon => weapon.draw());
    bullets.forEach((bullet, index) => {
        bullet.move();
        bullet.draw();
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    checkCollisions();

    const alivePlayers = players.filter(p => p.alive).length;
    playerCountDisplay.textContent = alivePlayers;
    playerHealthDisplay.textContent = userPlayer ? userPlayer.health : 100;

    if (alivePlayers <= 1) {
        const winner = players.find(p => p.alive);
        if (winner) {
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Player ${winner.id} Wins!`, canvas.width / 2, canvas.height / 2);
            gameActive = false;
            return;
        }
    }

    drawMinimap();
    requestAnimationFrame(gameLoop);
}
