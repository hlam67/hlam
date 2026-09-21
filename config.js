// Конфигурация и настройки графики
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const TILE_SIZE = 64;

// Загрузка текстуры
const berrySprite = new Image();
berrySprite.src = 'berries.png';

// Цвета для 3D блоков
const colors = {
    1: { top: "#2e5c1e", side: "#1e3d13" }, // Забор
    3: { top: "#2196f3", side: "#1976d2" }  // Вода
};

// Буфер для сортировки глубины отрисовки (стены перед спрайтами)
let depthBuffer = [];
