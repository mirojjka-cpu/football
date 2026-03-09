/**
 * Generate detailed character sprites using Phaser Graphics
 * Matching the original game's pixel-art style
 */

// Skin tone palette
const SKIN = [0xf5c6a0, 0xc68642, 0x8d5524, 0xffdbac, 0xe0ac69];

/**
 * Draw a football player sprite (front-facing, ~40x56)
 */
function drawPlayer(g, shirtColor, shortsColor, number, skinTone, hairStyle) {
    const cx = 20; // center x

    // Legs
    g.fillStyle(skinTone);
    g.fillRect(cx - 8, 42, 5, 10);
    g.fillRect(cx + 3, 42, 5, 10);

    // Boots
    g.fillStyle(0x222222);
    g.fillRect(cx - 9, 50, 7, 4);
    g.fillRect(cx + 2, 50, 7, 4);

    // Shorts
    g.fillStyle(shortsColor);
    g.fillRoundedRect(cx - 10, 36, 20, 8, 2);

    // Shirt body
    g.fillStyle(shirtColor);
    g.fillRoundedRect(cx - 12, 20, 24, 18, 3);

    // Shirt sleeves
    g.fillRect(cx - 16, 22, 6, 10);
    g.fillRect(cx + 10, 22, 6, 10);

    // Arms (skin)
    g.fillStyle(skinTone);
    g.fillRect(cx - 16, 30, 5, 6);
    g.fillRect(cx + 11, 30, 5, 6);

    // Shirt number
    if (number !== undefined) {
        // number will be drawn as text separately
    }

    // Neck
    g.fillStyle(skinTone);
    g.fillRect(cx - 3, 16, 6, 5);

    // Head
    g.fillStyle(skinTone);
    g.fillRoundedRect(cx - 9, 4, 18, 16, 6);

    // Eyes
    g.fillStyle(0x222222);
    g.fillCircle(cx - 4, 11, 1.5);
    g.fillCircle(cx + 4, 11, 1.5);

    // Mouth
    g.fillStyle(0x222222);
    g.fillRect(cx - 2, 15, 4, 1);

    // Hair
    g.fillStyle(hairStyle);
    switch (Math.floor(Math.random() * 4)) {
        case 0: // short
            g.fillRoundedRect(cx - 9, 2, 18, 8, 4);
            break;
        case 1: // buzz
            g.fillRoundedRect(cx - 9, 2, 18, 6, 4);
            break;
        case 2: // mohawk
            g.fillRoundedRect(cx - 3, 0, 6, 8, 2);
            g.fillRoundedRect(cx - 9, 3, 18, 5, 4);
            break;
        case 3: // afro
            g.fillRoundedRect(cx - 11, 0, 22, 14, 8);
            g.fillStyle(skinTone);
            g.fillRoundedRect(cx - 9, 4, 18, 16, 6);
            g.fillStyle(0x222222);
            g.fillCircle(cx - 4, 11, 1.5);
            g.fillCircle(cx + 4, 11, 1.5);
            g.fillRect(cx - 2, 15, 4, 1);
            break;
    }
}

/**
 * Draw the camera operator
 */
function drawOperator(g) {
    const cx = 24;

    // Legs
    g.fillStyle(0x333355);
    g.fillRect(cx - 6, 42, 5, 10);
    g.fillRect(cx + 1, 42, 5, 10);

    // Boots
    g.fillStyle(0x222222);
    g.fillRect(cx - 7, 50, 7, 4);
    g.fillRect(cx, 50, 7, 4);

    // Pants (dark)
    g.fillStyle(0x2a2a4a);
    g.fillRoundedRect(cx - 8, 36, 16, 8, 2);

    // Body (dark vest)
    g.fillStyle(0x1a1a3e);
    g.fillRoundedRect(cx - 10, 18, 20, 20, 3);

    // Press badge
    g.fillStyle(0xffcc00);
    g.fillRect(cx - 4, 24, 8, 5);
    g.fillStyle(0x222222);
    g.fillRect(cx - 3, 25, 6, 3);

    // Arms holding camera
    g.fillStyle(0xf5c6a0);
    g.fillRect(cx + 8, 20, 5, 8);
    g.fillRect(cx - 14, 20, 5, 8);

    // Camera body
    g.fillStyle(0x444444);
    g.fillRoundedRect(cx + 10, 14, 16, 12, 2);

    // Lens
    g.fillStyle(0x222222);
    g.fillCircle(cx + 20, 20, 5);
    g.fillStyle(0x3366aa);
    g.fillCircle(cx + 20, 20, 3);

    // Red REC light
    g.fillStyle(0xff0000);
    g.fillCircle(cx + 24, 14, 2);

    // Neck
    g.fillStyle(0xf5c6a0);
    g.fillRect(cx - 3, 14, 6, 5);

    // Head
    g.fillStyle(0xf5c6a0);
    g.fillRoundedRect(cx - 8, 2, 16, 14, 5);

    // Headphones
    g.lineStyle(3, 0x444444);
    g.beginPath();
    g.arc(cx, 4, 9, -Math.PI * 0.85, -Math.PI * 0.15);
    g.strokePath();
    g.fillStyle(0x444444);
    g.fillRect(cx - 10, 6, 4, 6);
    g.fillRect(cx + 6, 6, 4, 6);

    // Eyes
    g.fillStyle(0x222222);
    g.fillCircle(cx - 3, 9, 1.5);
    g.fillCircle(cx + 3, 9, 1.5);

    // Hair
    g.fillStyle(0x333333);
    g.fillRoundedRect(cx - 8, 0, 16, 6, 4);
}

/**
 * Draw the correspondent with microphone
 */
function drawCorrespondent(g) {
    const cx = 20;

    // Legs
    g.fillStyle(0x333355);
    g.fillRect(cx - 6, 42, 5, 10);
    g.fillRect(cx + 1, 42, 5, 10);

    // Boots
    g.fillStyle(0x222222);
    g.fillRect(cx - 7, 50, 7, 4);
    g.fillRect(cx, 50, 7, 4);

    // Pants
    g.fillStyle(0x2a2a4a);
    g.fillRoundedRect(cx - 8, 36, 16, 8, 2);

    // Body (red jacket — press)
    g.fillStyle(0xcc3333);
    g.fillRoundedRect(cx - 10, 18, 20, 20, 3);

    // Press badge
    g.fillStyle(0xffcc00);
    g.fillRect(cx - 4, 22, 8, 5);

    // Arm with mic
    g.fillStyle(0xf5c6a0);
    g.fillRect(cx + 8, 22, 5, 10);

    // Microphone
    g.fillStyle(0x333333);
    g.fillRect(cx + 14, 16, 3, 14);
    g.fillStyle(0x888888);
    g.fillRoundedRect(cx + 12, 12, 7, 6, 3);

    // Other arm
    g.fillStyle(0xf5c6a0);
    g.fillRect(cx - 14, 24, 5, 8);

    // Neck
    g.fillStyle(0xf5c6a0);
    g.fillRect(cx - 3, 14, 6, 5);

    // Head
    g.fillStyle(0xf5c6a0);
    g.fillRoundedRect(cx - 8, 2, 16, 14, 5);

    // Eyes
    g.fillStyle(0x222222);
    g.fillCircle(cx - 3, 9, 1.5);
    g.fillCircle(cx + 3, 9, 1.5);

    // Mouth (talking)
    g.fillStyle(0xcc6666);
    g.fillCircle(cx, 14, 2);

    // Hair
    g.fillStyle(0xaa6633);
    g.fillRoundedRect(cx - 8, 0, 16, 7, 4);
}

// Team shirt + shorts combos
export const TEAM_A = { shirt: 0xe8833a, shorts: 0x222222, name: 'home' };  // orange/black
export const TEAM_B = { shirt: 0x2a8a6a, shorts: 0x222222, name: 'away' };  // teal/black

// Hair colors
const HAIR_COLORS = [0x222222, 0x333333, 0x8B4513, 0xDAA520, 0xcc6633, 0x111111];

/**
 * Create all game textures
 */
export function createTextures(scene) {
    // --- Operator ---
    const op = scene.add.graphics();
    drawOperator(op);
    op.generateTexture('operator', 48, 56);
    op.destroy();

    // --- Correspondent ---
    const corr = scene.add.graphics();
    drawCorrespondent(corr);
    corr.generateTexture('correspondent', 44, 56);
    corr.destroy();

    // --- Football players (pre-generate a pool) ---
    for (let i = 0; i < 24; i++) {
        const team = i % 2 === 0 ? TEAM_A : TEAM_B;
        const skin = SKIN[i % SKIN.length];
        const hair = HAIR_COLORS[i % HAIR_COLORS.length];
        const pg = scene.add.graphics();
        drawPlayer(pg, team.shirt, team.shorts, undefined, skin, hair);
        pg.generateTexture(`player_${i}`, 40, 56);
        pg.destroy();
    }

    // --- Cable segment ---
    const cable = scene.add.graphics();
    cable.fillStyle(0x111111);
    cable.fillCircle(6, 6, 6);
    cable.fillStyle(0x333333);
    cable.fillCircle(6, 6, 4);
    cable.generateTexture('cable_dot', 12, 12);
    cable.destroy();

    // --- TVU transmitter backpack ---
    const tvu = scene.add.graphics();
    tvu.fillStyle(0x444444);
    tvu.fillRoundedRect(2, 8, 28, 20, 4);
    tvu.fillStyle(0x333333);
    tvu.fillRoundedRect(4, 10, 24, 16, 3);
    // LEDs
    tvu.fillStyle(0x00ff00);
    tvu.fillCircle(10, 16, 2);
    tvu.fillStyle(0xff6600);
    tvu.fillCircle(16, 16, 2);
    tvu.fillStyle(0xff0000);
    tvu.fillCircle(22, 16, 2);
    // Antenna
    tvu.lineStyle(2, 0x888888);
    tvu.lineBetween(26, 8, 30, 0);
    tvu.fillStyle(0xff0000);
    tvu.fillCircle(30, 0, 3);
    tvu.generateTexture('tvu_pack', 34, 30);
    tvu.destroy();

    // --- Speech bubble backgrounds ---
    const bubble = scene.add.graphics();
    bubble.fillStyle(0xffffff);
    bubble.fillRoundedRect(0, 0, 200, 40, 8);
    // Tail
    bubble.fillTriangle(20, 40, 30, 40, 15, 50);
    bubble.generateTexture('bubble', 200, 52);
    bubble.destroy();

    // Question bubble (red tint)
    const qbubble = scene.add.graphics();
    qbubble.fillStyle(0xffeeee);
    qbubble.fillRoundedRect(0, 0, 200, 40, 8);
    qbubble.lineStyle(2, 0xcc3333);
    qbubble.strokeRoundedRect(0, 0, 200, 40, 8);
    qbubble.fillStyle(0xffeeee);
    qbubble.fillTriangle(20, 40, 30, 40, 15, 50);
    qbubble.generateTexture('bubble_question', 200, 52);
    qbubble.destroy();

    // --- Smoke puff ---
    const smoke = scene.add.graphics();
    smoke.fillStyle(0xcccccc, 0.5);
    smoke.fillCircle(6, 6, 6);
    smoke.generateTexture('smoke', 12, 12);
    smoke.destroy();
}

/**
 * Interview questions from the correspondent
 */
export const QUESTIONS = [
    'кому посвящаете победу?',
    'это был решающий гол?',
    'расскажите о голе подробнее',
    'как оцените игру команды?',
    'что скажете болельщикам?',
    'довольны результатом?',
    'тяжёлый был матч?',
    'кто был лучшим на поле?',
    'ожидали такой счёт?',
    'что помогло победить?',
    'какой план на следующий матч?',
    'как настроение в раздевалке?',
];

/**
 * Player responses
 */
export const ANSWERS = [
    'мяч круглый, поле длинное',
    'главное — три очка',
    'спасибо болельщикам!',
    'тренер — лучший',
    'бились до конца',
    'подвели немного',
    'ровный, это факт',
    'команда — это семья',
    'работаем дальше',
    'всё по плану',
    'мы старались на все 100',
    'будем готовиться',
    'эмоции зашкаливают',
    'каждый выложился',
    'на характере вытащили',
    'нужно прибавлять',
];
