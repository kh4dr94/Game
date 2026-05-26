// ============================================
// STELLAR VANGUARD - Space Shooter Game Engine
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution
canvas.width = 800;
canvas.height = 600;

// Game State
const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };
let state = GameState.MENU;
let score = 0;
let wave = 1;
let lives = 3;
let screenShake = 0;
let waveTimer = 0;
let waveDelay = 180; // frames between waves
let enemiesRemaining = 0;
let combo = 0;
let comboTimer = 0;

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// Arrays
let bullets = [];
let enemies = [];
let particles = [];
let powerUps = [];
let stars = [];
let enemyBullets = [];

// ============================================
// STAR FIELD (Background)
// ============================================
class Star {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -5;
        this.speed = Math.random() * 3 + 1;
        this.size = Math.random() * 2 + 0.5;
        this.brightness = Math.random() * 0.5 + 0.5;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) this.reset();
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// Initialize stars
for (let i = 0; i < 100; i++) stars.push(new Star());

// ============================================
// PLAYER
// ============================================
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 40,
    height: 40,
    speed: 5,
    shootCooldown: 0,
    shootRate: 12,
    powerLevel: 1,
    invincible: 0,
    thrusterPhase: 0,

    update() {
        // Movement
        if (keys['arrowleft'] || keys['a']) this.x -= this.speed;
        if (keys['arrowright'] || keys['d']) this.x += this.speed;
        if (keys['arrowup'] || keys['w']) this.y -= this.speed;
        if (keys['arrowdown'] || keys['s']) this.y += this.speed;

        // Bounds
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (keys[' '] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootRate;
        }

        // Invincibility timer
        if (this.invincible > 0) this.invincible--;

        // Thruster animation
        this.thrusterPhase += 0.2;
    },

    shoot() {
        const bulletSpeed = -8;
        if (this.powerLevel === 1) {
            bullets.push(new Bullet(this.x, this.y - 20, 0, bulletSpeed));
        } else if (this.powerLevel === 2) {
            bullets.push(new Bullet(this.x - 8, this.y - 15, 0, bulletSpeed));
            bullets.push(new Bullet(this.x + 8, this.y - 15, 0, bulletSpeed));
        } else if (this.powerLevel >= 3) {
            bullets.push(new Bullet(this.x, this.y - 20, 0, bulletSpeed));
            bullets.push(new Bullet(this.x - 12, this.y - 10, -1, bulletSpeed));
            bullets.push(new Bullet(this.x + 12, this.y - 10, 1, bulletSpeed));
        }
    },

    draw() {
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Thruster glow
        const thrusterSize = 8 + Math.sin(this.thrusterPhase) * 4;
        const gradient = ctx.createRadialGradient(0, 20, 0, 0, 20, thrusterSize);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#0ff');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-thrusterSize / 2, 15, thrusterSize, thrusterSize * 1.5);

        // Ship body
        ctx.fillStyle = '#0cf';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 15);
        ctx.lineTo(5, 10);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();

        // Ship highlight
        ctx.fillStyle = '#aef';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(-6, 8);
        ctx.lineTo(0, 12);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shield effect when invincible
        if (this.invincible > 0) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    },

    hit() {
        if (this.invincible > 0) return;
        lives--;
        this.invincible = 90; // 1.5 seconds
        screenShake = 15;
        this.powerLevel = Math.max(1, this.powerLevel - 1);
        combo = 0;

        // Explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x, this.y, '#0ff', true));
        }

        updateUI();
        if (lives <= 0) gameOver();
    }
};

// ============================================
// BULLET
// ============================================
class Bullet {
    constructor(x, y, vx, vy, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.width = isEnemy ? 6 : 4;
        this.height = isEnemy ? 6 : 12;
        this.life = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -10 || this.y > canvas.height + 10 ||
            this.x < -10 || this.x > canvas.width + 10) {
            this.life = 0;
        }
    }

    draw() {
        if (this.isEnemy) {
            ctx.fillStyle = '#f55';
            ctx.shadowColor = '#f55';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y - 12);
            gradient.addColorStop(0, '#0ff');
            gradient.addColorStop(1, '#fff');
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(this.x - 2, this.y - 6, 4, 12);
            ctx.shadowBlur = 0;
        }
    }
}

// ============================================
// ENEMIES
// ============================================
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.phase = Math.random() * Math.PI * 2;
        this.shootTimer = Math.random() * 60 + 60;

        switch (type) {
            case 'basic':
                this.width = 30;
                this.height = 30;
                this.hp = 1;
                this.speed = 1.5;
                this.points = 100;
                this.color = '#f55';
                break;
            case 'zigzag':
                this.width = 28;
                this.height = 28;
                this.hp = 2;
                this.speed = 2;
                this.points = 200;
                this.color = '#fa0';
                this.amplitude = 60;
                this.startX = x;
                break;
            case 'tank':
                this.width = 40;
                this.height = 40;
                this.hp = 5;
                this.speed = 0.8;
                this.points = 500;
                this.color = '#f0f';
                break;
            case 'shooter':
                this.width = 32;
                this.height = 32;
                this.hp = 3;
                this.speed = 1;
                this.points = 300;
                this.color = '#ff0';
                this.shootInterval = 90;
                break;
        }
        this.maxHp = this.hp;
    }

    update() {
        this.phase += 0.03;

        switch (this.type) {
            case 'basic':
                this.y += this.speed;
                break;
            case 'zigzag':
                this.y += this.speed;
                this.x = this.startX + Math.sin(this.phase) * this.amplitude;
                break;
            case 'tank':
                this.y += this.speed;
                break;
            case 'shooter':
                this.y += this.speed;
                this.shootTimer--;
                if (this.shootTimer <= 0 && this.y > 50 && this.y < canvas.height - 100) {
                    this.shootTimer = this.shootInterval;
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    enemyBullets.push(new Bullet(
                        this.x, this.y + 15,
                        Math.cos(angle) * 3,
                        Math.sin(angle) * 3,
                        true
                    ));
                }
                break;
        }

        // Enemy escaped off screen - count as gone but no points
        if (this.y > canvas.height + 50) {
            this.hp = 0;
            enemiesRemaining--;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // Draw based on type
        switch (this.type) {
            case 'basic':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, 15);
                ctx.lineTo(-12, -10);
                ctx.lineTo(0, -5);
                ctx.lineTo(12, -10);
                ctx.closePath();
                ctx.fill();
                break;
            case 'zigzag':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, 14);
                ctx.lineTo(-14, 0);
                ctx.lineTo(0, -14);
                ctx.lineTo(14, 0);
                ctx.closePath();
                ctx.fill();
                break;
            case 'tank':
                ctx.fillStyle = this.color;
                ctx.fillRect(-18, -15, 36, 30);
                ctx.fillStyle = '#fff3';
                ctx.fillRect(-14, -11, 28, 22);
                // Health bar
                ctx.fillStyle = '#333';
                ctx.fillRect(-18, -22, 36, 4);
                ctx.fillStyle = this.color;
                ctx.fillRect(-18, -22, 36 * (this.hp / this.maxHp), 4);
                break;
            case 'shooter':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(0, 5, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    hit() {
        this.hp--;
        // Flash effect particles
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    destroy() {
        // Explosion
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(this.x, this.y, this.color, true));
        }
        // Score with combo
        combo++;
        comboTimer = 60;
        const comboMultiplier = Math.min(combo, 10);
        score += this.points * comboMultiplier;
        enemiesRemaining--;

        // Chance to drop power-up
        if (Math.random() < 0.15) {
            const types = ['power', 'shield', 'speed'];
            const type = types[Math.floor(Math.random() * types.length)];
            powerUps.push(new PowerUp(this.x, this.y, type));
        }

        updateUI();
    }
}

// ============================================
// PARTICLES
// ============================================
class Particle {
    constructor(x, y, color, explosive = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        if (explosive) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
        }
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ============================================
// POWER-UPS
// ============================================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.phase = 0;
        this.life = 1;

        switch (type) {
            case 'power': this.color = '#0f0'; this.symbol = 'P'; break;
            case 'shield': this.color = '#0ff'; this.symbol = 'S'; break;
            case 'speed': this.color = '#ff0'; this.symbol = 'F'; break;
        }
    }

    update() {
        this.y += this.speed;
        this.phase += 0.1;
        if (this.y > canvas.height + 20) this.life = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.phase);

        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);

        ctx.fillStyle = this.color;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    apply() {
        switch (this.type) {
            case 'power':
                player.powerLevel = Math.min(3, player.powerLevel + 1);
                break;
            case 'shield':
                player.invincible = 180; // 3 seconds
                break;
            case 'speed':
                player.shootRate = Math.max(6, player.shootRate - 2);
                setTimeout(() => { player.shootRate = 12; }, 5000);
                break;
        }
        // Pickup effect
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(this.x, this.y, this.color, true));
        }
    }
}

// ============================================
// WAVE SYSTEM
// ============================================
function spawnWave() {
    const enemyCount = Math.min(5 + wave * 2, 30);
    enemiesRemaining = enemyCount;

    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (state !== GameState.PLAYING) return;
            const x = Math.random() * (canvas.width - 80) + 40;
            const y = -30 - Math.random() * 200;
            let type;

            const rand = Math.random();
            if (wave < 3) {
                type = 'basic';
            } else if (wave < 5) {
                type = rand < 0.6 ? 'basic' : 'zigzag';
            } else if (wave < 8) {
                type = rand < 0.4 ? 'basic' : rand < 0.7 ? 'zigzag' : rand < 0.9 ? 'shooter' : 'tank';
            } else {
                type = rand < 0.25 ? 'basic' : rand < 0.5 ? 'zigzag' : rand < 0.75 ? 'shooter' : 'tank';
            }

            enemies.push(new Enemy(x, y, type));
        }, i * 300);
    }
}

// ============================================
// COLLISION DETECTION
// ============================================
function checkCollisions() {
    // Player bullets vs enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (rectCollision(bullets[i], enemies[j])) {
                bullets[i].life = 0;
                enemies[j].hit();
                if (enemies[j].hp <= 0) {
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemies vs player
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (rectCollision(
            { x: player.x, y: player.y, width: 20, height: 20 },
            enemies[i]
        )) {
            player.hit();
            enemies[i].hp = 0;
            enemies[i].destroy();
            enemies.splice(i, 1);
        }
    }

    // Enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (rectCollision(
            { x: player.x, y: player.y, width: 20, height: 20 },
            enemyBullets[i]
        )) {
            player.hit();
            enemyBullets.splice(i, 1);
        }
    }

    // Power-ups vs player
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (rectCollision(
            { x: player.x, y: player.y, width: 30, height: 30 },
            powerUps[i]
        )) {
            powerUps[i].apply();
            powerUps.splice(i, 1);
        }
    }
}

function rectCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('level').textContent = wave;
    let heartsStr = '';
    for (let i = 0; i < lives; i++) heartsStr += '\u2764';
    document.getElementById('lives').textContent = heartsStr;
}

// ============================================
// GAME LOOP
// ============================================
function update() {
    if (state !== GameState.PLAYING) return;

    // Update stars
    stars.forEach(s => s.update());

    // Update player
    player.update();

    // Update bullets
    bullets.forEach(b => b.update());
    bullets = bullets.filter(b => b.life > 0);

    // Update enemy bullets
    enemyBullets.forEach(b => b.update());
    enemyBullets = enemyBullets.filter(b => b.life > 0);

    // Update enemies
    enemies.forEach(e => e.update());
    enemies = enemies.filter(e => e.hp > 0);

    // Update particles
    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    // Update power-ups
    powerUps.forEach(p => p.update());
    powerUps = powerUps.filter(p => p.life > 0);

    // Collisions
    checkCollisions();

    // Combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) combo = 0;
    }

    // Wave management
    if (enemies.length === 0 && enemiesRemaining <= 0) {
        waveTimer++;
        if (waveTimer >= waveDelay) {
            wave++;
            updateUI();
            spawnWave();
            waveTimer = 0;
        }
    }

    // Screen shake decay
    if (screenShake > 0) screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
}

function draw() {
    ctx.save();

    // Screen shake
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
    }

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(s => s.draw());

    // Particles (behind)
    particles.forEach(p => p.draw());

    // Power-ups
    powerUps.forEach(p => p.draw());

    // Enemies
    enemies.forEach(e => e.draw());

    // Enemy bullets
    enemyBullets.forEach(b => b.draw());

    // Player bullets
    bullets.forEach(b => b.draw());

    // Player
    if (state === GameState.PLAYING || state === GameState.PAUSED) {
        player.draw();
    }

    // Combo display
    if (combo > 1 && comboTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 0, ${comboTimer / 60})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${combo}x COMBO!`, player.x, player.y - 40);
    }

    // Wave announcement
    if (waveTimer > 0 && waveTimer < 60) {
        const alpha = waveTimer < 30 ? waveTimer / 30 : (60 - waveTimer) / 30;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${wave}`, canvas.width / 2, canvas.height / 2);
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// GAME FLOW
// ============================================
function startGame() {
    state = GameState.PLAYING;
    score = 0;
    wave = 1;
    lives = 3;
    combo = 0;
    comboTimer = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    player.powerLevel = 1;
    player.invincible = 90;
    player.shootRate = 12;
    bullets = [];
    enemies = [];
    particles = [];
    powerUps = [];
    enemyBullets = [];
    enemiesRemaining = 0;
    waveTimer = 0;
    screenShake = 0;

    updateUI();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');

    spawnWave();
}

function gameOver() {
    state = GameState.GAME_OVER;
    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('final-wave').textContent = wave;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function togglePause() {
    if (state === GameState.PLAYING) {
        state = GameState.PAUSED;
        document.getElementById('pause-screen').classList.remove('hidden');
    } else if (state === GameState.PAUSED) {
        state = GameState.PLAYING;
        document.getElementById('pause-screen').classList.add('hidden');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'p') togglePause();
});

// Start the game loop (renders menu background)
gameLoop();
