// ========================================================
// МОДУЛЬ ОТРИСОВКИ ТРЕХМЕРНОЙ ГРАФИКИ КАДРА (render.js)
// ========================================================

const NUM_RAYS = 400;

function blendColors(r1, g1, b1, r2, g2, b2, factor) {
    let r = Math.round(r1 + (r2 - r1) * factor);
    let g = Math.round(g1 + (g2 - g1) * factor);
    let b = Math.round(b1 + (b2 - b1) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

function getEnvironmentColors() {
    let illumination = (Math.sin(player.time * Math.PI * 2) + 1) / 2;

    let skyDayR = 52;  let skyDayG = 152; let skyDayB = 219;
    let skyNightR = 5;  let skyNightG = 10;  let skyNightB = 30;

    let groundDayR = 46; let groundDayG = 204; let groundDayB = 113;
    let groundNightR = 10; let groundNightG = 30; let groundNightB = 15;

    return {
        sky: blendColors(skyNightR, skyNightG, skyNightB, skyDayR, skyDayG, skyDayB, illumination),
        ground: blendColors(groundNightR, groundNightG, groundNightB, groundDayR, groundDayG, groundDayB, illumination),
        ambient: illumination
    };
}

function drawBackground() {
    const env = getEnvironmentColors();
    ctx.fillStyle = env.sky; 
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = env.ground; 
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

function draw3Dwalls() {
    const stripeWidth = canvas.width / NUM_RAYS;
    const halfFov = player.fov / 2;
    const startAngle = player.angle - halfFov;
    const angleStep = player.fov / NUM_RAYS;
    const env = getEnvironmentColors();

    depthBuffer = []; 

    for (let i = 0; i < NUM_RAYS; i++) {
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
            
            let r = parseInt(baseHex.slice(1, 3), 16);
            let g = parseInt(baseHex.slice(3, 5), 16);
            let b = parseInt(baseHex.slice(5, 7), 16);

            r = Math.round(r * (env.ambient * 0.8 + 0.2));
            g = Math.round(g * (env.ambient * 0.8 + 0.2));
            b = Math.round(b * (env.ambient * 0.8 + 0.2));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
            ctx.fillStyle = "#333";
        }
        
        ctx.fillRect(Math.floor(i * stripeWidth), (canvas.height - wallHeight) / 2, Math.ceil(stripeWidth), wallHeight);
    }
}

// 5. Отрисовка кустов ягод через плавное наложение двух текстур (МЕТОД 90-х)
function drawSprites() {
    sprites.sort((a, b) => {
        let distA = Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2);
        let distB = Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2);
        return distB - distA;
    });

    const env = getEnvironmentColors();
    const stripeWidth = canvas.width / NUM_RAYS;

    // Считаем прозрачность для дневной картинки (днем 1, ночью 0)
    let dayOpacity = env.ambient; 

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

            for (let stripeIndex = 0; stripeIndex < NUM_RAYS; stripeIndex++) {
                let stripeScreenPos = stripeIndex * stripeWidth;
                
                if (stripeScreenPos >= startX && stripeScreenPos < startX + spriteSize) {
                    if (depthBuffer[stripeIndex] > rotY) { 
                        
                        let textureX = Math.floor(((stripeScreenPos - startX) / spriteSize) * berrySprite.width);
                        
                        if (berrySprite.complete && berrySprite.width > 0 && textureX >= 0 && textureX < berrySprite.width) {
                            ctx.save();
                            
                            // Маска полосы луча
                            ctx.beginPath();
                            ctx.rect(Math.floor(stripeScreenPos), startY, Math.ceil(stripeWidth), spriteSize);
                            ctx.clip();

                            // Шаг А. Всегда рисуем нижним слоем ТЕМНЫЙ (ночной) куст со 100% видимостью
                            if (berryNightSprite.complete && berryNightSprite.width > 0) {
                                ctx.drawImage(berryNightSprite, textureX, 0, 1, berryNightSprite.height, Math.floor(stripeScreenPos), startY, Math.ceil(stripeWidth), spriteSize);
                            }

                            // Шаг Б. Поверх него плавно накладываем ДНЕВНОЙ куст с изменяемой прозрачностью
                            ctx.globalAlpha = dayOpacity;
                            ctx.drawImage(berrySprite, textureX, 0, 1, berrySprite.height, Math.floor(stripeScreenPos), startY, Math.ceil(stripeWidth), spriteSize);
                            
                            ctx.restore();
                        } else if (!berrySprite.complete || berrySprite.width === 0) {
                            ctx.fillStyle = "#9c27b0";
                            ctx.fillRect(Math.floor(stripeScreenPos), startY, Math.ceil(stripeWidth), spriteSize);
                        }
                    }
                }
            }
        }
    }
}

function drawMiniMap() {
    const scale = 10; 
    const mapOffset = 25; 
    const startX = canvas.width - (MAP_WIDTH * scale) - mapOffset;
    const startY = mapOffset;

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(startX, startY, MAP_WIDTH * scale, MAP_HEIGHT * scale);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, MAP_WIDTH * scale, MAP_HEIGHT * scale);

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
        ctx.fillRect(startX + sx * scale + 1, startY + sy * scale + 1, scale - 2, scale - 2);
    }

    let px = Math.floor(player.x / TILE_SIZE);
    let py = Math.floor(player.y / TILE_SIZE);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(startX + px * scale + 2, startY + py * scale + 2, scale - 2, scale - 2);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(startX + px * scale + 1, startY + py * scale + 1, scale - 2, scale - 2);
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

function renderGame() {
    ctx.imageSmoothingEnabled = false;
    drawBackground();
    draw3Dwalls();
    drawSprites();
    drawMiniMap();
    drawGameOver();
}
