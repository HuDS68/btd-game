const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let money = 100;
let lives = 10;
let frame = 0;
let placingTower = false;
let selectedTower = null;

const bloons = [];
const towers = [];
const bullets = [];

let currentWave = 1;
let bloonsThisWave = 0;
let bloonsToSpawn = 10;

const popSound = new Audio('pop.mp3');
const placeSound = new Audio('place.mp3');

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (placingTower && money >= 50) {
    towers.push({ x, y, cooldown: 0, range: 100, fireRate: 60 });
    money -= 50;
    placeSound.play();
    placingTower = false;
    return;
  }

  for (let tower of towers) {
    const dx = tower.x - x;
    const dy = tower.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < 15) {
      selectedTower = tower;
      return;
    }
  }

  selectedTower = null;
});

function selectTower() {
  placingTower = true;
}

function upgradeTower() {
  if (selectedTower && money >= 30) {
    selectedTower.range += 20;
    selectedTower.fireRate = Math.max(10, selectedTower.fireRate - 10);
    money -= 30;
  }
}

function spawnBloon() {
  if (bloonsThisWave < bloonsToSpawn) {
    const type = Math.random();
    if (type < 0.6) {
      bloons.push({ x: 0, y: 300, hp: 1, speed: 1, color: 'red' });
    } else if (type < 0.9) {
      bloons.push({ x: 0, y: 300, hp: 2, speed: 1.5, color: 'blue' });
    } else {
      bloons.push({ x: 0, y: 300, hp: 4, speed: 0.7, color: 'purple' });
    }
    bloonsThisWave++;
  }
}

function moveBloons() {
  for (let b of bloons) {
    b.x += b.speed;
    if (b.x > canvas.width) {
      lives--;
      bloons.splice(bloons.indexOf(b), 1);
    }
  }
}

function shootBullets() {
  for (let tower of towers) {
    tower.cooldown--;
    if (tower.cooldown <= 0) {
      let target = null;
      let minDist = Infinity;
      for (let b of bloons) {
        const dx = b.x - tower.x;
        const dy = b.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < tower.range && dist < minDist) {
          minDist = dist;
          target = b;
        }
      }
      if (target) {
        bullets.push({
          x: tower.x,
          y: tower.y,
          target: target,
          speed: 4
        });
        tower.cooldown = tower.fireRate;
      }
    }
  }
}

function moveBullets() {
  for (let bullet of bullets) {
    const dx = bullet.target.x - bullet.x;
    const dy = bullet.target.y - bullet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / dist) * bullet.speed;
    const vy = (dy / dist) * bullet.speed;

    bullet.x += vx;
    bullet.y += vy;

    if (dist < 5) {
      bullet.target.hp -= 1;
      if (bullet.target.hp <= 0) {
        popSound.currentTime = 0;
        popSound.play();
        money += 10;
        bloons.splice(bloons.indexOf(bullet.target), 1);
      }
      bullets.splice(bullets.indexOf(bullet), 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(canvas.width, 300);
  ctx.stroke();

  for (let t of towers) {
    ctx.fillStyle = (t === selectedTower) ? 'gold' : 'blue';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let b of bloons) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'black';
  for (let bullet of bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  document.getElementById('money').textContent = `💰 Money: ${money}`;
  document.getElementById('lives').textContent = `❤️ Lives: ${lives}`;
  document.getElementById('wave').textContent = `🌊 Wave: ${currentWave}`;
}

function gameLoop() {
  frame++;

  if (frame % 60 === 0) spawnBloon();
  if (bloons.length === 0 && bloonsThisWave >= bloonsToSpawn) {
    currentWave++;
    bloonsThisWave = 0;
    bloonsToSpawn += 5;
  }

  moveBloons();
  shootBullets();
  moveBullets();
  draw();

  if (lives > 0) requestAnimationFrame(gameLoop);
  else alert('Game Over!');
}

gameLoop();
