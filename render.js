// ========================================================
// МОДУЛЬ ОТРИСОВКИ ТРЕХМЕРНОЙ ГРАФИКИ КАДРА (render.js)
// ========================================================

// 1. Функция для плавного смешивания двух цветов (в формате RGB)
function blendColors(color1, color2, factor) {
    let r = Math.round(color1[0] + (color2[0] - color1[0]) * factor);
    let g = Math.round(color1[1] + (color2[1] - color1[1]) * factor);
    let b = Math.round(color1[2] + (color2[2] - color1[2]) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

// 2. Функция расчета текущей освещенности мира
function getEnvironmentColors() {
    // Переводим время в цикл синусоиды: 1 в полдень, 0 в полночь
    let illumination = (Math.sin(player.time * Math.PI * 2) + 1) / 2;

    // Палитры цветов в формате массива [R, G, B]
    const skyDay =;     // Яркое голубое небо
    const skyNight =;      // Глубокая темная ночь
    
    const groundDay =;    // Зеленая сочная трава
    const groundNight =;     // Темная ночная поляна

    return {
        sky: blendColors(skyNight, skyDay, illumination),
        ground: blendColors(groundNight, groundDay, illumination),
        ambient: illumination // Коэффициент темноты для стен забора (от 0 до 1)
    };
}

// 3. Отрисовка плоского фона горизонта (Динамическое небо и земля)
function drawBackground() {
    const env = getEnvironmentColors();
    ctx.fillStyle = env.sky; 
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = env.ground; 
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

// 4. Алгоритм Raycasting для построения стен забора с ночным затенением
function draw3Dwalls() {
    const numRays = canvas.width;
    const halfFov = player.fov / 2;
    const startAngle = player.angle - halfFov;
    const angleStep = player.fov / numRays;
    const env = getEnvironmentColors();

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
            let baseHex = side === 1 ? colors[hitWall].side : colors[hitWall].top;
            
            // Конвертируем цвета HEX-блоков забора в RGB для наложения динамической ночной тени
            let r = parseInt(baseHex.slice(1, 3), 16);
            let g = parseInt(baseHex.slice(3, 5), 16);
            let b = parseInt(baseHex.slice(5, 7), 16);

            // Плавно глушим яркость забора ночью
            r = Math.round(r * (env.ambient * 0.8 + 0.2));
            g = Math.round(g * (env.ambient * 0.8 + 0.2));
            b = Math.round(b * (env.ambient * 0.8 + 0.2));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
            ctx.fillStyle = "#333";
        }
        ctx.fillRect(i, (canvas.height - wallHeight) / 2, 1, wallHeight);
    }
}

// 5. Отрисовка кустов ягод как биллборд-спрайтов с ночной полупрозрачной вуалью
function drawSprites() {
    sprites.sort((a, b) => {
        let distA = Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2);
        let distB = Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2);
        return distB - distA;
    });

    const env = getEnvironmentColors();

    for (let i = 0; i < sprites.length; i++) {
        let spriteX = sprites[i].x - player.x;
        let spriteY = sprites[i].y - player.y;

        let cosP = Math.cos(player.angle);
        let sinP = Math.sin(player.angle);

        let rotX = spriteY * cosP - spriteX * sinP;
        let rotY = spriteX * cosP + spriteY * sinP;

        if (rotY > 2) {
            let viewDist = (canvas.width / 2) / Math.tan(player.fov / 2);
            let spriteScreenX = Math.floor((canvas.width / 2) + (rotX / rotY) * viewDist);
            let spriteSize = Math.floor((TILE_SIZE * canvas.height) / rotY);
            
            let startX = Math.floor(spriteScreenX - spriteSize / 2);
            let startY = Math.floor((canvas.height - spriteSize) / 2);

            for (let stripe = startX; stripe < startX + spriteSize; stripe++) {
                if (stripe >= 0 && stripe < canvas.width) {
                    if (depthBuffer[stripe] > rotY) { 
                        let textureX = Math.floor(((stripe - startX) / spriteSize) * berrySprite.width);
                        
                        if (berrySprite.complete && berrySprite.width > 0) {
                            ctx.drawImage(berrySprite, textureX, 0, 1, berrySprite.height, stripe, startY, 1, spriteSize);
                            
                            // Затемняем кусты ночью в тон окружения
                            ctx.fillStyle = `rgba(0, 5, 15, ${1 - env.ambient})`;
                            ctx.fillRect(stripe, startY, 1, spriteSize);
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

// 6. Отрисовка полупрозрачной миникарты-радара в углу экрана
function drawMiniMap() {
    const scale = 4; 
    const mapOffset = 10; 
    const startX = canvas.width - (MAP_WIDTH * scale) - mapOffset;
    const startY = mapOffset;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(startX, startY, MAP_WIDTH * scale, MAP_HEIGHT * scale);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let cell = getMapCell(x, y);
            if (cell === 1) {
                ctx.fillStyle = "#2e5c1e"; 
                ctx.fillRect(startX + x * scale, startY + y * scale, scale, scale);
            } else if (cell === 3) {
                ctx.fillStyle = "#2196f3"; 
                ctx.fillRect(startX + x * scale, startY + y * scale, scale, scale);
            }
        }
    }

    ctx.fillStyle = "#9c27b0";
    for (let i = 0; i < sprites.length; i++) {
        let sx = Math.floor(sprites[i].x / TILE_SIZE);
        let sy = Math.floor(sprites[i].y / TILE_SIZE);
        ctx.fillRect(startX + sx * scale, startY + sy * scale, scale, scale);
    }

    let px = Math.floor(player.x / TILE_SIZE);
    let py = Math.floor(player.y / TILE_SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(startX + px * scale, startY + py * scale, scale, scale);
}

// 7. Экран завершения игры при гибели
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

// 8. Главная функция сборки рендеринга кадра
function renderGame() {
    drawBackground();
    draw3Dwalls();
    drawSprites();
    drawMiniMap();
    drawGameOver();
}
