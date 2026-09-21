// Текущее состояние игровых объектов
const player = {
    x: 8 * TILE_SIZE,
    y: 8 * TILE_SIZE,
    angle: 0,
    fov: Math.PI / 3, // 60 градусов
    speed: 4,
    rotSpeed: 0.05,
    hp: 100,
    food: 100,
    water: 100,
    woodInv: 0,
    berryInv: 0,
    days: 0,
    ticks: 0
};

// Игровая карта (генерируется пустой с забором по краям)
let map = [];
for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        if (y === 0 || y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
            map[y][x] = 1;
        } else {
            map[y][x] = 0;
        }
    }
}

// Точечные озера
map[3][3] = 3;
map[12][12] = 3;

// Массив кустов с ягодами
let sprites = [
    { x: 5 * TILE_SIZE + 32, y: 5 * TILE_SIZE + 32, type: 2 },
    { x: 10 * TILE_SIZE + 32, y: 4 * TILE_SIZE + 32, type: 2 },
    { x: 4 * TILE_SIZE + 32, y: 11 * TILE_SIZE + 32, type: 2 },
    { x: 11 * TILE_SIZE + 32, y: 12 * TILE_SIZE + 32, type: 2 }
];

// Слушатель клавиатуры
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Безопасное чтение карты
function getMapCell(x, y) {
    if (map[y] !== undefined && map[y][x] !== undefined) {
        return map[y][x];
    }
    return 1; 
}
