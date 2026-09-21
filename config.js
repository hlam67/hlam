// Конфигурация и настройки графики (Полноэкранный режим)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Динамически задаем внутреннее разрешение холста под размер экрана браузера
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', () => {
    resizeCanvas();
});

const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const TILE_SIZE = 64;

// ЗАГРУЗКА ДВУХ ТЕКСТУР КУСТА
const berrySprite = new Image();
berrySprite.src = 'berries.png'; // Дневной (светлый) куст

const berryNightSprite = new Image();
berryNightSprite.src = 'berries_night.png'; // Ночной (темный) куст

// Цвета для 3D блоков забора и воды
const colors = {
    1: { top: "#2e5c1e", side: "#1e3d13" }, // Забор
    3: { top: "#2196f3", side: "#1976d2" }  // Вода
};

// Буфер глубины для корректной сортировки стен и спрайтов
let depthBuffer = [];
