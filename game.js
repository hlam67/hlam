// ==========================================
// ЧАСТЬ 1 ИЗ 2 (ВСТАВИТЬ В НАЧАЛО GAME.JS)
// ==========================================

// --- Настройки игры и переменные состояния ---
let scene, camera, renderer, clock;
let controls = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false };
let isLocked = false;

// Характеристики игрока
let stats = { hp: 100, food: 100, water: 100, wood: 0, apples: 0 };
const MOVE_SPEED = 12.0;
let playerVelocity = new THREE.Vector3();

// Объекты окружения
let interactableObjects = [];
let activeInteractable = null;

// Элементы интерфейса (DOM)
const blocker = document.getElementById('blocker');
const promptEl = document.getElementById('interaction-prompt');
const hpFill = document.getElementById('hp-fill');
const foodFill = document.getElementById('food-fill');
const waterFill = document.getElementById('water-fill');
const invWood = document.getElementById('inv-wood');
const invApples = document.getElementById('inv-apples');
const gameOverScreen = document.getElementById('game-over');

init();
animate();

function init() {
    // 1. Создание сцены и тумана
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.015);

    // 2. Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Высота глаз игрока

    // 3. Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // 4. Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 5. Земля (Поляна)
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x557a46, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 6. Генерация деревьев
    generateForest();

    // 7. Обработчики управления мышью (Pointer Lock API)
    blocker.addEventListener('click', () => {
        blocker.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === blocker) {
            blocker.style.display = 'none';
            isLocked = true;
        } else {
            blocker.style.display = 'flex';
            isLocked = false;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        // Поворот камеры мышью
        camera.rotation.y -= e.movementX * 0.0025;
        camera.rotation.x -= e.movementY * 0.0025;
        // Ограничение наклона вверх/вниз
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x));
    });

    // Настройка вращения камеры
    camera.rotation.order = "YZX";

    // 8. Обработчики клавиатуры
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 9. Жизненный цикл выживания (потеря сил)
    setInterval(survivalTick, 2000);

    window.addEventListener('resize', onWindowResize);
}

// Генерация леса со случайными деревьями
function generateForest() {
    for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 150;

        if (Math.sqrt(x*x + z*z) < 10) continue;

        const isAppleTree = Math.random() > 0.6;
        const tree = createTree(x, z, isAppleTree);
        scene.add(tree);
        interactableObjects.push(tree);
    }
}
// ==========================================
// ЧАСТЬ 2 ИЗ 2 (ВСТАВИТЬ СРАЗУ ПОСЛЕ ЧАСТИ 1)
// ==========================================

// Создание 3D модели дерева
function createTree(x, z, isAppleTree) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Ствол
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Листва
    const leavesGeo = new THREE.SphereGeometry(1.5, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: isAppleTree ? 0x2e5a1c : 0x3a5f0b, roughness: 0.6 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3.5;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    // Если это яблоня, добавим красные сферы (яблоки)
    if (isAppleTree) {
        for (let i = 0; i < 4; i++) {
            const appleGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const appleMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            apple.position.set(
                (Math.random() - 0.5) * 1.5,
                3.0 + Math.random(),
                (Math.random() - 0.5) * 1.5
            );
            treeGroup.add(apple);
        }
        treeGroup.userData = { type: 'apple_tree', resources: 3 };
    } else {
        treeGroup.userData = { type: 'tree', resources: 4 };
    }

    return treeGroup;
}

function onKeyDown(e) {
    switch (e.code) {
        case 'KeyW': controls.moveForward = true; break;
        case 'KeyS': controls.moveBackward = true; break;
        case 'KeyA': controls.moveLeft = true; break;
        case 'KeyD': controls.moveRight = true; break;
        case 'KeyE': interact(); break;
    }
}

function onKeyUp(e) {
    switch (e.code) {
        case 'KeyW': controls.moveForward = false; break;
        case 'KeyS': controls.moveBackward = false; break;
        case 'KeyA': controls.moveLeft = false; break;
        case 'KeyD': controls.moveRight = false; break;
    }
}

// Логика взаимодействия с объектами (сбор ресурсов)
function interact() {
    if (!activeInteractable || activeInteractable.userData.resources <= 0) return;

    const type = activeInteractable.userData.type;
    activeInteractable.userData.resources--;

    if (type === 'apple_tree') {
        stats.apples += 2;
        stats.wood += 1;
    } else {
        stats.wood += 2;
    }

    // Эффект разрушения / сборки ресурса
    if (activeInteractable.userData.resources <= 0) {
        let target = activeInteractable;
        let interval = setInterval(() => {
            target.position.y -= 0.1;
            if (target.position.y < -5) {
                clearInterval(interval);
                scene.remove(target);
            }
        }, 30);
        promptEl.style.display = 'none';
        activeInteractable = null;
    }

    updateUI();
}

// Каждую секунду падают показатели голода и жажды
function survivalTick() {
    if (!isLocked || stats.hp <= 0) return;

    stats.food = Math.max(0, stats.food - 1.5);
    stats.water = Math.max(0, stats.water - 2);

    if (stats.food === 0 || stats.water === 0) {
        stats.hp = Math.max(0, stats.hp - 5);
    } else {
        // Автоматическое поедание яблок при голоде
        if (stats.food < 40 && stats.apples > 0) {
            stats.apples--;
            stats.food = Math.min(100, stats.food + 20);
            stats.water = Math.min(100, stats.water + 5);
        }
    }

    if (stats.hp <= 0) {
        document.exitPointerLock();
        gameOverScreen.style.display = 'flex';
    }

    updateUI();
}

function updateUI() {
    hpFill.style.width = stats.hp + '%';
    foodFill.style.width = stats.food + '%';
    waterFill.style.width = stats.water + '%';
    invWood.innerText = stats.wood;
    invApples.innerText = stats.apples;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Основной игровой цикл отрисовки и механики движения
function animate() {
    requestAnimationFrame(animate);

    if (isLocked && stats.hp > 0) {
        const delta = clock.getDelta();
        
        let forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0; 
        forward.normalize();

        let right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).negate().normalize(); 

        let moveDirection = new THREE.Vector3();

        if (controls.moveForward) moveDirection.add(forward);
        if (controls.moveBackward) moveDirection.sub(forward);
        if (controls.moveRight) moveDirection.add(right);
        if (controls.moveLeft) moveDirection.sub(right);

        moveDirection.normalize(); 

        playerVelocity.x = moveDirection.x * MOVE_SPEED * delta;
        playerVelocity.z = moveDirection.z * MOVE_SPEED * delta;

        camera.position.x += playerVelocity.x;
        camera.position.z += playerVelocity.z;

        camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
        camera.position.z = Math.max(-95, Math.min(95, camera.position.z));

        // Проверка дистанции до деревьев
        let closeObject = null;
        for (let obj of interactableObjects) {
            if (obj.userData.resources <= 0) continue;
            
            let dist = camera.position.distanceTo(obj.position);
            if (dist < 3.5) { 
                closeObject = obj;
                break;
            }
        }

        if (closeObject) {
            activeInteractable = closeObject;
            if (closeObject.userData.type === 'apple_tree') {
                promptEl.innerText = "Нажмите [E], чтобы собрать яблоки и ветки";
            } else {
                promptEl.innerText = "Нажмите [E], чтобы срубить дерево";
            }
            promptEl.style.display = 'block';
        } else {
            activeInteractable = null;
            promptEl.style.display = 'none';
        }
    }

    renderer.render(scene, camera);
}
