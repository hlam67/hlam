const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Параметры карты
const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const TILE_SIZE = 64;

// Сверхпростая карта: только забор по периметру, внутри абсолютно пусто
let map = [];
for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        // Если это край карты — ставим забор (1), иначе — пустая земля (0)
        if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
            map[y][x] = 1;
        } else {
            map[y][x] = 0;
        }
    }
}

// Вручную точечно создаем пару зон для ресурсов, чтобы было что собирать
map[5][5] = 3;  // Небольшое озеро с водой
map[5][6] = 3;  
map[10][10] = 2; // Куст ягод
map[10][11] = 2;

// Игрок
const player = {
    x: 4 * TILE_SIZE, // Ставим игрока подальше от стен в центр поляны
    y: 4 * TILE_SIZE,
    angle: 0,
    fov: Math.PI / 3, // 60 градусов
    speed: 4,         // Чуть увеличили скорость бега по пустой карте
    rotSpeed: 0.05,
    // Параметры выживания
    hp: 100,
    food: 100,
    water: 100,
    woodInv: 0,
    berryInv: 0,
    days: 0,
    ticks: 0
};

// Отслеживание клавиш клавиатуры
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Цвета стен забора и ресурсов
const colors = {
    1: { top: "#2e5c1e", side: "#1e3d13" }, // Забор (Зеленый лес)
    2: { top: "#9c27b0", side: "#7b1fa2" }, // Кусты ягод (Фиолетовые)
    3: { top: "#2196f3", side: "#1976d2" }  // Вода (Синяя)
};

// Железобетонная функция проверки карты, которая никогда не вызовет ошибку
function getMapCell(x, y) {
    if (map[y] !== undefined && map[y][x] !== undefined) {
        return map[y][x];
    }
    return 1; // Если игрок каким-то чудом вылетел за карту — вокруг стена
}

function update() {
    if (player.hp <= 0) return;

    // Управление передвижением (WASD)
    let moveStep = 0;
    if (keys["KeyW"]) moveStep = player.speed;
    if (keys["KeyS"]) moveStep = -player.speed;
    
    if (keys["KeyA"]) player.angle -= player.rotSpeed;
    if (keys["KeyD"]) player.angle += player.rotSpeed;

    // Расчет перемещения
    let newX = player.x + Math.cos(player.angle) * moveStep;
    let newY = player.y + Math.sin(player.angle) * moveStep;

    let currentGridX = Math.floor(player.x / TILE_SIZE);
    let currentGridY = Math.floor(player.y / TILE_SIZE);
    let nextGridX = Math.floor(newX / TILE_SIZE);
    let nextGridY = Math.floor(newY / TILE_SIZE);

    // Простая и надежная проверка коллизий перед шагом
    if (getMapCell(nextGridX, currentGridY) === 0) player.x = newX;
    if (getMapCell(currentGridX, nextGridY) === 0) player.y = newY;

    // Система жизнедеятельности (Голод и жажда)
    player.ticks++;
    if (player.ticks % 20 === 0) {
        player.food = Math.max(0, player.food - 0.3);
        player.water = Math.max(0, player.water - 0.5);
        player.days += 0.001;

        if (player.food <= 0 || player.water <= 0) {
            player.hp = Math.max(0, player.hp - 1);
        } else if (player.hp < 100) {
            player.hp = Math.min(100, player.hp + 0.2); // Восстановление здоровья
        }
    }

    // Взаимодействие (Клавиша E)
    if (keys["KeyE"]) {
        keys["KeyE"] = false;
        let targetX = Math.floor((player.x + Math.cos(player.angle) * 45) / TILE_SIZE);
        let targetY = Math.floor((player.y + Math.sin(player.angle) * 45) / TILE_SIZE);
        
        let targetCell = getMapCell(targetX, targetY);
        if (targetCell === 2) {
            map[targetY][targetX] = 0; // Собираем ягоды и очищаем ячейку
            player.berryInv += 3;
            showStatus("Собраны лесные ягоды!");
        } else if (targetCell === 3) {
            player.water = Math.min(100, player.water + 30);
            showStatus("Вы попили чистой воды");
        } else if (targetCell === 1) {
            player.woodInv += 1;
            showStatus("Подобрана ветка у забора");
        }
    }

    // Использование ягод в пищу (Клавиша F)
    if (keys["KeyF"]) {
        keys["KeyF"] = false;
        if (player.berryInv > 0) {
            player.berryInv--;
            player.food = Math.min(100, player.food + 20);
            showStatus("Вы съели ягоды");
        } else {
            showStatus("Нет ягод для еды!");
        }
    }

    updateUI();
}

function showStatus(text) {
    const el = document.getElementById("statusMsg");
    if (el) {
        el.innerText = text;
        setTimeout(() => { if(el.innerText === text) el.innerText = ""; }, 2000);
    }
}

function updateUI() {
    const hpBar = document.getElementById("hpBar");
    const foodBar = document.getElementById("foodBar");
    const waterBar = document.getElementById("waterBar");
    const score = document.getElementById("score");
    const inventory = document.getElementById("inventory");

    if (hpBar) hpBar.style.width = player.hp + "%";
    if (foodBar) foodBar.style.width = player.food + "%";
    if (waterBar) waterBar.style.width = player.water + "%";
    if (score) score.innerText = "Дней прожито: " + Math.floor(player.days);
    if (inventory) inventory.innerText = `Дрова: ${player.woodInv} | Ягоды: ${player.berryInv}`;
}

function render() {
    // Отрисовка плоского горизонта (Небо / Земля)
    ctx.fillStyle = "#2c3e50"; // Небо
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#112211"; // Поляна
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Отрисовка забора методом Raycasting
    const numRays = canvas.width;
    const halfFov = player.fov / 2;
    const startAngle = player.angle - halfFov;
    const angleStep = player.fov / numRays;

    for (let i = 0; i < numRays; i++) {
        let rayAngle = startAngle + i * angleStep;
        let distance = 0;
        let hitWall = 0;
        let side = 0;

        let cos = Math.cos(rayAngle);
        let sin = Math.sin(rayAngle);

        // Луч летит вперед, пока не врежется в забор или объект
        while (distance < 800) {
            distance += 1.5;
            let checkX = Math.floor((player.x + cos * distance) / TILE_SIZE);
            let checkY = Math.floor((player.y + sin * distance) / TILE_SIZE);

            let cell = getMapCell(checkX, checkY);
            if (cell > 0) {
                hitWall = cell;
                let hitX = player.x + cos * distance;
                let blockLeft = checkX * TILE_SIZE;
                if (Math.abs(hitX - blockLeft) < 1.5 || Math.abs(hitX - (blockLeft + TILE_SIZE)) < 1.5) side = 1;
                break;
            }
        }

        // Убираем искажение камеры
        let correctedDist = distance * Math.cos(rayAngle - player.angle);
        if (correctedDist < 1) correctedDist = 1;

        // Высота забора
        let wallHeight = Math.min(canvas.height, (TILE_SIZE * canvas.height) / correctedDist);

        if (colors[hitWall]) {
            ctx.fillStyle = side === 1 ? colors[hitWall].side : colors[hitWall].top;
        } else {
            ctx.fillStyle = "#333";
        }
        
        ctx.fillRect(i, (canvas.height - wallHeight) / 2, 1, wallHeight);
    }

    // Экран смерти
    if (player.hp <= 0) {
        ctx.fillStyle = "rgba(139, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ВЫ ПОГИБЛИ", canvas.width / 2, canvas.height / 2);
        ctx.font = "18px sans-serif";
        ctx.fillText(`Вы выживали ${Math.floor(player.days)} дн.`, canvas.width / 2, canvas.height / 2 + 40);
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Старт игры
gameLoop();
