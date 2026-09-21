// Модуль отрисовки графики кадра

function drawBackground() {
    ctx.fillStyle = "#2c3e50"; // Небо
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "#112211"; // Земля
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

function draw3Dwalls() {
    const numRays = canvas.width;
    const halfFov = player.fov / 2;
    const startAngle = player.angle - halfFov;
    const angleStep = player.fov / numRays;

    depthBuffer = []; 

    for (let i = 0; i < numRays; i++) {
        let rayAngle = startAngle + i * angleStep;
        let distance = 0;
        let hitWall = 0;
        let side = 0;

        let cos = Math.cos(rayAngle);
        let sin = Math.sin(rayAngle);

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

        let correctedDist = distance * Math.cos(rayAngle - player.angle);
        if (correctedDist < 1) correctedDist = 1;
        depthBuffer[i] = correctedDist; 

        let wallHeight = Math.min(canvas.height, (TILE_SIZE * canvas.height) / correctedDist);

        if (colors[hitWall]) {
            ctx.fillStyle = side === 1 ? colors[hitWall].side : colors[hitWall].top;
        } else {
            ctx.fillStyle = "#333";
        }
        ctx.fillRect(i, (canvas.height - wallHeight) / 2, 1, wallHeight);
    }
}

function drawSprites() {
    for (let i = 0; i < sprites.length; i++) {
        let spriteX = sprites[i].x - player.x;
        let spriteY = sprites[i].y - player.y;

        let cosPlayer = Math.cos(-player.angle);
        let sinPlayer = Math.sin(-player.angle);
        let rotX = spriteX * cosPlayer - spriteY * sinPlayer;
        let rotY = spriteX * sinPlayer + spriteY * cosPlayer; 

        if (rotY > 5) {
            let spriteScreenX = Math.floor((canvas.width / 2) + (rotX / rotY) * (canvas.width / (2 * Math.tan(player.fov / 2))));
            let spriteSize = Math.floor((TILE_SIZE * canvas.height) / rotY);
            let startX = Math.floor(spriteScreenX - spriteSize / 2);
            let startY = Math.floor((canvas.height - spriteSize) / 2);

            for (let stripe = startX; stripe < startX + spriteSize; stripe++) {
                if (stripe >= 0 && stripe < canvas.width) {
                    if (depthBuffer[stripe] > rotY) { 
                        let textureX = Math.floor(((stripe - startX) / spriteSize) * berrySprite.width);
                        if (berrySprite.complete && berrySprite.width > 0) {
                            ctx.drawImage(berrySprite, textureX, 0, 1, berrySprite.height, stripe, startY, 1, spriteSize);
                        } else {
                            ctx.fillStyle = "#9c27b0";
                            ctx.fillRect(stripe, startY, 1, spriteSize);
                        }
                    }
                }
            }
        }
    }
}

function drawGameOver() {
    if (player.hp <= 0) {
        ctx.fillStyle = "rgba(139, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ВЫ ПОГИБЛИ", canvas.width / 2, canvas.height / 2);
    }
}

// Главная функция отрисовки для сборщика
function renderGame() {
    drawBackground();
    draw3Dwalls();
    drawSprites();
    drawGameOver();
}
