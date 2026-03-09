/**
 * Generate textures for game objects using Phaser Graphics
 */

export function createTextures(scene) {
    const size = 24;

    // --- Camera crew head (operator + correspondent) ---
    const crew = scene.add.graphics();
    // Body (dark blue jacket)
    crew.fillStyle(0x1a1a5e);
    crew.fillRoundedRect(2, 4, 20, 16, 3);
    // Camera
    crew.fillStyle(0x333333);
    crew.fillRect(16, 2, 8, 10);
    crew.fillStyle(0xff0000);
    crew.fillCircle(22, 4, 2); // red rec light
    // Head
    crew.fillStyle(0xf5c6a0);
    crew.fillCircle(10, 6, 5);
    // Headphones
    crew.lineStyle(2, 0x444444);
    crew.beginPath();
    crew.arc(10, 5, 6, -Math.PI * 0.8, -Math.PI * 0.2);
    crew.strokePath();
    crew.generateTexture('crew', size, size);
    crew.destroy();

    // --- Cable segment ---
    const cable = scene.add.graphics();
    cable.fillStyle(0x222222);
    cable.fillCircle(size / 2, size / 2, 5);
    cable.fillStyle(0x444444);
    cable.fillCircle(size / 2, size / 2, 3);
    cable.generateTexture('cable', size, size);
    cable.destroy();

    // --- TVU transmitter (at the tail) ---
    const tvu = scene.add.graphics();
    tvu.fillStyle(0x555555);
    tvu.fillRoundedRect(2, 4, 20, 16, 3);
    tvu.fillStyle(0x00cc00);
    tvu.fillCircle(8, 10, 2); // green LED
    tvu.fillStyle(0xff6600);
    tvu.fillCircle(14, 10, 2); // orange LED
    // Antenna
    tvu.lineStyle(2, 0x999999);
    tvu.lineBetween(18, 4, 22, 0);
    tvu.fillStyle(0xcc0000);
    tvu.fillCircle(22, 0, 2);
    tvu.generateTexture('tvu', size, size);
    tvu.destroy();

    // --- Football player ---
    const player = scene.add.graphics();
    // Shirt
    player.fillStyle(0xffffff);
    player.fillRoundedRect(4, 6, 16, 12, 3);
    // Number on shirt
    player.fillStyle(0x333333);
    player.fillRect(9, 8, 6, 8);
    // Head
    player.fillStyle(0xf5c6a0);
    player.fillCircle(12, 5, 5);
    // Shorts
    player.fillStyle(0x222266);
    player.fillRect(6, 17, 12, 5);
    player.generateTexture('player', size, size);
    player.destroy();

    // --- Smoke particle ---
    const smoke = scene.add.graphics();
    smoke.fillStyle(0xcccccc, 0.6);
    smoke.fillCircle(4, 4, 4);
    smoke.generateTexture('smoke', 8, 8);
    smoke.destroy();

    // --- Microphone icon (for interview effect) ---
    const mic = scene.add.graphics();
    mic.fillStyle(0x333333);
    mic.fillRoundedRect(9, 0, 6, 14, 3);
    mic.lineStyle(2, 0x333333);
    mic.beginPath();
    mic.arc(12, 10, 8, 0, Math.PI);
    mic.strokePath();
    mic.lineBetween(12, 18, 12, 24);
    mic.lineBetween(8, 24, 16, 24);
    mic.generateTexture('mic', size, size);
    mic.destroy();
}

/**
 * Color palettes for football player shirts
 */
export const SHIRT_COLORS = [
    0xe74c3c, // red
    0x3498db, // blue
    0xf39c12, // orange
    0x9b59b6, // purple
    0x1abc9c, // teal
    0xe67e22, // dark orange
    0x2ecc71, // green
    0xf1c40f, // yellow
];
