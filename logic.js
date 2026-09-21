// Обработка игровой логики и физики

function handlePlayerMovement() {
    let moveStep = 0;
    if (keys["KeyW"]) moveStep = player.speed;
    if (keys["KeyS"]) moveStep = -player.speed;
    
    if (keys["KeyA"]) player.angle -= player.rotSpeed;
    if (keys["KeyD"]) player.angle += player.rotSpeed;

    let newX = player.x + Math.cos(player.angle) * moveStep;
    let newY = player.y + Math.sin(player.angle) * moveStep;

    if (getMapCell(Math.floor(newX / TILE_SIZE), Math.floor(player.y / TILE_SIZE)) === 0) player.x = newX;
    if (getMapCell(Math.floor(player.x / TILE_SIZE), Math.floor(newY / TILE_SIZE)) === 0) player.y = newY;
}

function handleSurvivalStats() {
    player.ticks++;
    if (player.ticks % 20 === 0) {
        player.food = Math.max(0, player.food - 0.3);
        player.water = Math.max(0, player.water - 0.5);
        player.days += 0.001;

        if (player.food <= 0 || player.water <= 0) {
            player.hp = Math.max(0, player.hp - 1);
        } else if (player.hp < 100) {
            player.hp = Math.min(100, player.hp + 0.2);
        }
    }
}

function handlePlayerActions() {
    if (keys["KeyE"]) {
        keys["KeyE"] = false;
        
        let targetGridX = Math.floor((player.x + Math.cos(player.angle) * 45) / TILE_SIZE);
        let targetGridY = Math.floor((player.y + Math.sin(player.angle) * 45) / TILE_SIZE);
        let targetCell = getMapCell(targetGridX, targetGridY);

        if (targetCell === 3) {
            player.water = Math.min(100, player.water + 30);
            showStatus("Вы попили чистой воды");
            return;
        } else if (targetCell === 1) {
            player.woodInv += 1;
            showStatus("Подобрана ветка у забора");
            return;
        }

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
            sprites.splice(collectedIndex, 1);
            player.berryInv += 3;
            showStatus("Собраны ягоды со спрайта!");
        }
    }

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

function showStatus(text) {
    const el = document.getElementById("statusMsg");
    if (el) {
        el.innerText = text;
        setTimeout(() => { if(el.innerText === text) el.innerText = ""; }, 2000);
    }
}

function updateUI() {
    if (document.getElementById("hpBar")) document.getElementById("hpBar").style.width = player.hp + "%";
    if (document.getElementById("foodBar")) document.getElementById("foodBar").style.width = player.food + "%";
    if (document.getElementById("waterBar")) document.getElementById("waterBar").style.width = player.water + "%";
    if (document.getElementById("score")) document.getElementById("score").innerText = "Дней прожито: " + Math.floor(player.days);
    if (document.getElementById("inventory")) document.getElementById("inventory").innerText = `Длова: ${player.woodInv} | Ягоды: ${player.berryInv}`;
}

// Главная функция апдейта для сборщика
function updateGame() {
    if (player.hp <= 0) return;
    handlePlayerMovement();
    handleSurvivalStats();
    handlePlayerActions();
    updateUI();
}
