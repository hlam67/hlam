// ========================================================
// МОДУЛЬ ОБРАБОТКИ ЛОГИКИ И ФИЗИКИ ВЫЖИВАНИЯ (logic.js)
// ========================================================

// 1. Физика передвижения персонажа (WASD) с проверкой коллизий
function handlePlayerMovement() {
    let moveStep = 0;
    if (keys["KeyW"]) moveStep = player.speed;
    if (keys["KeyS"]) moveStep = -player.speed;
    
    if (keys["KeyA"]) player.angle -= player.rotSpeed;
    if (keys["KeyD"]) player.angle += player.rotSpeed;

    // Рассчитываем новые координаты
    let newX = player.x + Math.cos(player.angle) * moveStep;
    let newY = player.y + Math.sin(player.angle) * moveStep;

    // Проверяем столкновения со стенами отдельно по осям X и Y, чтобы персонаж мог скользить вдоль забора
    if (getMapCell(Math.floor(newX / TILE_SIZE), Math.floor(player.y / TILE_SIZE)) === 0) player.x = newX;
    if (getMapCell(Math.floor(player.x / TILE_SIZE), Math.floor(newY / TILE_SIZE)) === 0) player.y = newY;
}

// 2. Жизнедеятельность: уменьшение сытости, воды, учет прожитых дней и плавная смена времени суток
function handleSurvivalStats() {
    // Плавно двигаем время суток вперед (0.0005 — оптимальная скорость для смены дня и ночи)
    player.time += 0.0005; 
    if (player.time >= 1) player.time = 0; // Сброс суток по кругу при достижении лимита

    player.ticks++;
    // Медленное уменьшение показателей каждые несколько игровых тиков
    if (player.ticks % 20 === 0) {
        player.food = Math.max(0, player.food - 0.3);
        player.water = Math.max(0, player.water - 0.5);
        player.days += 0.001;

        // Если один из критических показателей упал до нуля — начинает тратиться здоровье
        if (player.food <= 0 || player.water <= 0) {
            player.hp = Math.max(0, player.hp - 1);
        } else if (player.hp < 100) {
            player.hp = Math.min(100, player.hp + 0.2); // Регенерация, если персонаж сыт и напоен
        }
    }
}

// 3. Обработка взаимодействия (Сбор ресурсов на клавишу E, Поедание на клавишу F)
function handlePlayerActions() {
    // Взаимодействие и сбор на кнопку E
    if (keys["KeyE"]) {
        keys["KeyE"] = false; // Сбрасываем зажатие, чтобы избежать бесконечного спама
        
        let targetGridX = Math.floor((player.x + Math.cos(player.angle) * 45) / TILE_SIZE);
        let targetGridY = Math.floor((player.y + Math.sin(player.angle) * 45) / TILE_SIZE);
        let targetCell = getMapCell(targetGridX, targetGridY);

        // Проверяем сбор статических блоков на карте
        if (targetCell === 3) {
            player.water = Math.min(100, player.water + 30);
            showStatus("Вы попили чистой воды");
            return;
        } else if (targetCell === 1) {
            player.woodInv += 1;
            showStatus("Подобрана ветка у забора");
            return;
        }

        // Проверяем сбор ягод со спрайтов (ищем ближайший куст в радиусе вытянутой руки)
        let collectedIndex = -1;
        for (let i = 0; i < sprites.length; i++) {
            let dx = sprites[i].x - player.x;
            let dy = sprites[i].y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 55) {
                collectedIndex = i;
                break;
            }
        }
        if (collectedIndex !== -1) {
            sprites.splice(collectedIndex, 1); // Удаляем куст с карты
            player.berryInv += 3;              // Добавляем ягоды в инвентарь
            showStatus("Собраны ягоды со спрайта!");
        }
    }

    // Использование ягод в пищу на кнопку F
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
}

// 4. Автоматическое появление новых кустов ягод на поляне (Респавн)
function spawnNewResources() {
    // Если на карте осталось меньше 5 кустов, с небольшим шансом генерируем новый
    if (sprites.length < 5 && Math.random() < 0.005) { 
        // Выбираем случайные ячейки строго внутри границ забора
        let rx = Math.floor(1 + Math.random() * (MAP_WIDTH - 2));
        let ry = Math.floor(1 + Math.random() * (MAP_HEIGHT - 2));
        
        // Проверяем, чтобы ячейка была абсолютно пустой земляной поляной
        if (getMapCell(rx, ry) === 0) {
            let pixelX = rx * TILE_SIZE + 32;
            let pixelY = ry * TILE_SIZE + 32;
            
            // Проверяем, не занята ли эта точка уже другим кустом
            if (!sprites.some(s => s.x === pixelX && s.y === pixelY)) {
                sprites.push({ x: pixelX, y: pixelY, type: 2 });
            }
        }
    }
}

// 5. Вывод текстовых уведомлений по центру нижней части экрана
function showStatus(text) {
    const el = document.getElementById("statusMsg");
    if (el) {
        el.innerText = text;
        setTimeout(() => { if(el.innerText === text) el.innerText = ""; }, 2000);
    }
}

// 6. Синхронизация данных с HTML интерфейсом (Полоски ХП, Голода, Жажды)
function updateUI() {
    if (document.getElementById("hpBar")) document.getElementById("hpBar").style.width = player.hp + "%";
    if (document.getElementById("foodBar")) document.getElementById("foodBar").style.width = player.food + "%";
    if (document.getElementById("waterBar")) document.getElementById("waterBar").style.width = player.water + "%";
    if (document.getElementById("score")) document.getElementById("score").innerText = "Дней прожито: " + Math.floor(player.days);
    if (document.getElementById("inventory")) document.getElementById("inventory").innerText = `Дрова: ${player.woodInv} | Ягоды: ${player.berryInv}`;
}

// 7. Главная точка входа обновления логики для игрового цикла
function updateGame() {
    if (player.hp <= 0) return; // Если игрок погиб, логику больше не обрабатываем
    handlePlayerMovement();
    handleSurvivalStats();
    handlePlayerActions();
    spawnNewResources();
    updateUI();
}
