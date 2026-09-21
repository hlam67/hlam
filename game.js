const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Параметры карты
const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const TILE_SIZE = 64;

// Карта: 1 - стена (деревья/скалы), 2 - куст ягод, 3 - источник воды, 0 - пусто
let map = [,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
 ,
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Игрок
const player = {
    x: 3.5 * TILE_SIZE,
    y: 3.5 * TILE_SIZE,
    angle: 0,
    fov: Math.PI / 3, // 60 градусов
    speed: 3,
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

// Отслеживание нажатия клавиш
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Цвета для псевдо-3D стен (с эффектом бокового затенения)
const colors = {
    1: { top: "#2e5c1e", side: "#1e3d13" }, // Лес/Стена
    2: { top: "#9c27b0", side: "#7b1fa2" }, // Кусты ягод
    3: { top: "#2196f3", side: "#1976d2" }  // Вода
};

function update() {
    if (player.hp <= 0) return;

    // Движение вперед/назад и повороты камеры
    let moveStep = 0;
    if (keys["KeyW"]) moveStep = player.speed;
    if (keys["KeyS"]) moveStep = -player.speed;
    
    if (keys["KeyA"]) player.angle -= player.rotSpeed;
    if (keys["KeyD"]) player.angle += player.rotSpeed;

    // Расчет новой позиции игрока с проверкой столкновений
    let newX = player.x + Math.cos(player.angle) * moveStep;
    let newY = player.y + Math.sin(player.angle) * moveStep;

    let checkMapX = Math.floor(newX / TILE_SIZE);
    let checkMapY = Math.floor(newY / TILE_SIZE);

    if (map[Math.floor(player.y / TILE_SIZE)][checkMapX] === 0) player.x = newX;
    if (map[checkMapY][Math.floor(player.x / TILE_SIZE)] === 0) player.y = newY;

    // Таймер голода, жажды и прожитых дней
    player.ticks++;
    if (player.ticks % 20 === 0) {
        player.food = Math.max(0, player.food - 0.3);
        player.water = Math.max(0, player.water - 0.5);
        player.days += 0.001;

        // Если показатели на нуле — тратится здоровье
        if (player.food <= 0 || player.water <= 0) {
            player.hp = Math.max(0, player.hp - 1);
        } else if (player.hp < 100) {
            player.hp = Math.min(100, player.hp + 0.2); // Регенерация
        }
    }

    // Сбор ресурсов при нажатии E
    if (keys["KeyE"]) {
        keys["KeyE"] = false; // Предотвращаем спам от зажатия кнопки
        let targetX = Math.floor((player.x + Math.cos(player.angle) * 40) / TILE_SIZE);
        let targetY = Math.floor((player.y + Math.sin(player.angle) * 40) / TILE_SIZE);
        
        let targetCell = map[targetY][targetX];
        if (targetCell === 2) {
            map[targetY][targetX] = 0; // убираем куст с карты
            player.berryInv += 3;
            showStatus("Собраны лесные ягоды!");
        } else if (targetCell === 3) {
            player.water = Math.min(100, player.water + 30);
            showStatus("Вы попили чистой воды");
        } else if (targetCell === 1) {
            player.woodInv += 1;
            showStatus("Подобрана сухая ветка");
        }
    }

    // Использование ягод для еды при нажатии F
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
    document.getElementById("hpBar").style.width = player.hp + "%";
    document.getElementById("foodBar").style.width = player.food + "%";
    document.getElementById("waterBar").style.width = player.water + "%";
    document.getElementById("score").innerText = "Дней прожито: " + Math.floor(player.days);
    document.getElementById("inventory").innerText = `Дрова: ${player.woodInv} | Ягоды: ${player.berryInv}`;
}

function render() {
    // Отрисовка неба и земли
    ctx.fillStyle = "#2c3e50"; // Верхняя половина (небо)
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#112211"; // Нижня половина (земля)
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Псевдо-3D Рендеринг (Алгоритм Raycasting)
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

        while (distance < 500) {
            distance += 1;
            let checkX = Math.floor((player.x + cos * distance) / TILE_SIZE);
            let checkY = Math.floor((player.y + sin * distance) / TILE_SIZE);

            if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) {
                hitWall = 1;
                distance = 500;
                break;
            }

            if (map[checkY][checkX] > 0) {
                hitWall = map[checkY][checkX];
                let hitX = player.x + cos * distance;
                let blockLeft = checkX * TILE_SIZE;
                if (Math.abs(hitX - blockLeft) < 1 || Math.abs(hitX - (blockLeft + TILE_SIZE)) < 1) side = 1;
                break;
            }
        }

        // Исправление эффекта рыбьего глаза (Lens distortion)
        let correctedDist = distance * Math.cos(rayAngle - player.angle);
        if (correctedDist < 1) correctedDist = 1;

        // Расчет высоты стены
        let wallHeight = Math.min(canvas.height, (TILE_SIZE * canvas.height) / correctedDist);

        // Отрисовка вертикальной полосы стены
        if (colors[hitWall]) {
            ctx.fillStyle = side === 1 ? colors[hitWall].side : colors[hitWall].top;
        } else {
            ctx.fillStyle = "#333";
        }
        
        ctx.fillRect(i, (canvas.height - wallHeight) / 2, 1, wallHeight);
    }

    // Проверка экрана смерти
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

// Запуск игрового цикла
gameLoop();
