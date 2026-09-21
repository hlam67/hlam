// Главный файл-сборщик игрового движка

function gameLoop() {
    // Вызываем функции из подключенных скриптов logic.js и render.js
    updateGame();
    renderGame();
    
    // Запрашиваем следующий кадр анимации
    requestAnimationFrame(gameLoop);
}

// Запускаем бесконечный игровой цикл
gameLoop();
