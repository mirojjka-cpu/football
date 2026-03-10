/**
 * Generate character sprites using Phaser Graphics
 * HD cartoon style with proper bounding boxes
 */

const OL = 0x1a1a2e; // outline color

// Skin/hair palettes
export const SKINS = [0xf2c496, 0xe8a87c, 0xd4845a, 0xbe6a38, 0x8B5A2B, 0xf5deb3];
export const HAIRS = [0x0d0500, 0x3d1c00, 0x777777, 0x050505, 0x4a2a10, 0xc8a030];

// Team kit combos (pairs)
export const TEAM_COMBOS = [
    { a: { k: 0xc0392b, kd: 0x922b21, t: '#fff', s: 0x7b241c }, b: { k: 0x2471a3, kd: 0x1a5276, t: '#fff', s: 0x154360 } },
    { a: { k: 0xe67e22, kd: 0xca6f1e, t: '#1a1a1a', s: 0x935116 }, b: { k: 0x1e8449, kd: 0x145a32, t: '#fff', s: 0x0e4d29 } },
    { a: { k: 0x7d3c98, kd: 0x5b2c6f, t: '#fff', s: 0x4a235a }, b: { k: 0xf5f5f5, kd: 0xdddddd, t: '#333', s: 0xbbbbbb } },
    { a: { k: 0x17202a, kd: 0x0a1119, t: '#fff', s: 0x0d1421 }, b: { k: 0xe74c3c, kd: 0xc0392b, t: '#fff', s: 0x922b21 } },
    { a: { k: 0x117a65, kd: 0x0e6655, t: '#fff', s: 0x0a4d3e }, b: { k: 0xe59866, kd: 0xca7c3a, t: '#111', s: 0xc47a3a } },
];

// Helper: darken a color by factor
function darken(color, factor) {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
}

// Helper: lighten a color
function lighten(color, factor) {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
    const b = Math.min(255, Math.floor((color & 0xff) * factor));
    return (r << 16) | (g << 8) | b;
}

/**
 * Draw player (cartoon footballer) — texture 48x110
 * All coords shifted +42 Y so head fits; cx=24
 */
function drawPlayer(g, kitColor, kitDark, sockColor, skinColor, hairColor) {
    const cx = 24;
    const Y = 42; // Y offset to keep head in bounds

    // === Drop shadow ===
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, Y + 64, 28, 8);

    // === Boots ===
    // Boot shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(cx - 10, Y + 57, 10, 7, 3);
    g.fillRoundedRect(cx, Y + 57, 10, 7, 3);
    // Boot body
    g.fillStyle(0x1a1a1a);
    g.fillRoundedRect(cx - 10, Y + 55, 10, 7, 3);
    g.fillRoundedRect(cx, Y + 55, 10, 7, 3);
    // Boot highlight
    g.fillStyle(0x333333, 0.5);
    g.fillRoundedRect(cx - 9, Y + 55, 4, 3, 1);
    g.fillRoundedRect(cx + 1, Y + 55, 4, 3, 1);
    // Shoe laces — V pattern on boot tops
    g.lineStyle(0.7, 0x555555, 0.7);
    g.lineBetween(cx - 8, Y + 55, cx - 5, Y + 57);
    g.lineBetween(cx - 5, Y + 57, cx - 8, Y + 59);
    g.lineBetween(cx + 2, Y + 55, cx + 5, Y + 57);
    g.lineBetween(cx + 5, Y + 57, cx + 2, Y + 59);
    // Studs
    g.fillStyle(0x888888);
    g.fillRect(cx - 8, Y + 61, 2, 2);
    g.fillRect(cx - 4, Y + 61, 2, 2);
    g.fillRect(cx + 2, Y + 61, 2, 2);
    g.fillRect(cx + 6, Y + 61, 2, 2);

    // === Socks ===
    g.fillStyle(sockColor);
    g.fillRoundedRect(cx - 9, Y + 43, 8, 14, 3);
    g.fillRoundedRect(cx + 1, Y + 43, 8, 14, 3);
    // Sock stripe
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(cx - 8, Y + 47, 6, 2);
    g.fillRect(cx + 2, Y + 47, 6, 2);
    // Shin guard bulge
    g.fillStyle(sockColor);
    g.fillRoundedRect(cx - 8, Y + 43, 6, 8, 2);
    g.fillRoundedRect(cx + 2, Y + 43, 6, 8, 2);
    g.fillStyle(lighten(sockColor, 1.15), 0.35);
    g.fillRoundedRect(cx - 7, Y + 44, 3, 6, 1);
    g.fillRoundedRect(cx + 3, Y + 44, 3, 6, 1);

    // === Shorts ===
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx - 11, Y + 30, 22, 16, 4);
    // Shorts stripe
    g.fillStyle(kitDark);
    g.fillRoundedRect(cx - 11, Y + 30, 22, 6, 3);
    // Shorts highlight
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(cx - 9, Y + 31, 8, 4, 2);
    // Shorts wrinkle/fold lines
    g.lineStyle(0.8, 0x000000, 0.12);
    g.lineBetween(cx - 1, Y + 32, cx - 3, Y + 44);
    g.lineBetween(cx + 4, Y + 33, cx + 6, Y + 43);

    // === Jersey ===
    // Jersey shadow
    g.fillStyle(darken(kitColor, 0.7), 0.3);
    g.fillRoundedRect(cx - 12, Y + 11, 24, 22, 5);
    // Jersey body — gradient simulation (4 horizontal bands, darker at bottom)
    g.fillStyle(lighten(kitColor, 1.08), 0.95);
    g.fillRoundedRect(cx - 12, Y + 9, 24, 6, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(kitColor);
    g.fillRoundedRect(cx - 12, Y + 15, 24, 6, 0);
    g.fillStyle(darken(kitColor, 0.92), 0.95);
    g.fillRoundedRect(cx - 12, Y + 21, 24, 5, 0);
    g.fillStyle(darken(kitColor, 0.82), 0.9);
    g.fillRoundedRect(cx - 12, Y + 26, 24, 6, { tl: 0, tr: 0, bl: 5, br: 5 });
    // Side panel
    g.fillStyle(kitDark);
    g.fillRoundedRect(cx - 12, Y + 9, 6, 23, 4);
    // Jersey highlight (sheen)
    g.fillStyle(lighten(kitColor, 1.25), 0.18);
    g.fillRoundedRect(cx - 4, Y + 10, 8, 12, 3);
    // Wrinkle/fold lines on jersey
    g.lineStyle(0.8, darken(kitColor, 0.6), 0.15);
    g.lineBetween(cx - 6, Y + 14, cx - 2, Y + 20);
    g.lineBetween(cx + 3, Y + 12, cx + 6, Y + 18);
    g.lineBetween(cx - 8, Y + 24, cx - 3, Y + 29);
    g.lineBetween(cx + 2, Y + 25, cx + 7, Y + 30);
    // Collar — V-neck style
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx - 5, Y + 7, 10, 5, 2);
    g.fillStyle(kitDark);
    // V-neck notch
    g.fillTriangle(cx - 2, Y + 8, cx + 2, Y + 8, cx, Y + 12);
    // Number circle on chest
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(cx, Y + 19, 6);

    // === Arms ===
    // Left arm (sleeve + skin)
    g.fillStyle(kitColor);
    g.fillRoundedRect(cx - 16, Y + 10, 7, 12, 3);
    g.fillStyle(skinColor);
    g.fillRoundedRect(cx - 15, Y + 20, 5, 8, 2);
    // Left wristband
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx - 15, Y + 25, 5, 3, 1);
    g.fillStyle(kitColor, 0.5);
    g.fillRoundedRect(cx - 15, Y + 26, 5, 1, 0);
    // Left finger detail
    g.lineStyle(0.6, darken(skinColor, 0.7), 0.35);
    g.lineBetween(cx - 14, Y + 27, cx - 14, Y + 28);
    g.lineBetween(cx - 12, Y + 27, cx - 12, Y + 28);
    // Right arm
    g.fillStyle(kitColor);
    g.fillRoundedRect(cx + 9, Y + 10, 7, 12, 3);
    g.fillStyle(skinColor);
    g.fillRoundedRect(cx + 10, Y + 20, 5, 8, 2);
    // Right wristband
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx + 10, Y + 25, 5, 3, 1);
    g.fillStyle(kitColor, 0.5);
    g.fillRoundedRect(cx + 10, Y + 26, 5, 1, 0);
    // Right finger detail
    g.lineStyle(0.6, darken(skinColor, 0.7), 0.35);
    g.lineBetween(cx + 12, Y + 27, cx + 12, Y + 28);
    g.lineBetween(cx + 14, Y + 27, cx + 14, Y + 28);

    // === Neck ===
    g.fillStyle(skinColor);
    g.fillRoundedRect(cx - 3, Y + 3, 6, 8, 2);
    // Neck shadow
    g.fillStyle(darken(skinColor, 0.85), 0.3);
    g.fillRect(cx - 3, Y + 6, 6, 3);

    // === Head ===
    // Head outline
    g.fillStyle(OL);
    g.fillCircle(cx, Y - 8, 15);
    // Head fill
    g.fillStyle(skinColor);
    g.fillCircle(cx, Y - 8, 14);
    // Head highlight
    g.fillStyle(lighten(skinColor, 1.12), 0.3);
    g.fillCircle(cx - 3, Y - 12, 7);

    // === Ears ===
    g.fillStyle(darken(skinColor, 0.92));
    g.fillCircle(cx - 14, Y - 7, 4);
    g.fillCircle(cx + 14, Y - 7, 4);
    g.fillStyle(skinColor);
    g.fillCircle(cx - 13, Y - 7, 3);
    g.fillCircle(cx + 13, Y - 7, 3);

    // === Hair ===
    // Base hair shape
    g.fillStyle(hairColor);
    g.beginPath();
    g.arc(cx, Y - 16, 13, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair volume — second layer (slightly offset for volume)
    g.fillStyle(darken(hairColor, 0.85), 0.4);
    g.beginPath();
    g.arc(cx + 2, Y - 17, 11, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair volume — top highlight layer
    g.fillStyle(lighten(hairColor, 1.35), 0.25);
    g.beginPath();
    g.arc(cx - 2, Y - 19, 8, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Individual hair strand shapes
    g.fillStyle(lighten(hairColor, 1.2), 0.15);
    g.fillRoundedRect(cx - 8, Y - 28, 3, 8, 1);
    g.fillRoundedRect(cx - 3, Y - 30, 3, 10, 1);
    g.fillRoundedRect(cx + 2, Y - 29, 3, 9, 1);
    g.fillRoundedRect(cx + 6, Y - 27, 3, 7, 1);
    // Dark strand accents
    g.fillStyle(darken(hairColor, 0.7), 0.12);
    g.fillRoundedRect(cx - 6, Y - 26, 2, 6, 1);
    g.fillRoundedRect(cx + 1, Y - 27, 2, 7, 1);
    g.fillRoundedRect(cx + 5, Y - 25, 2, 5, 1);
    // Sideburns
    g.fillStyle(hairColor);
    g.fillRoundedRect(cx - 15, Y - 16, 5, 10, 2);
    g.fillRoundedRect(cx + 10, Y - 16, 5, 8, 2);
    // Sideburn highlights
    g.fillStyle(lighten(hairColor, 1.15), 0.2);
    g.fillRoundedRect(cx - 14, Y - 14, 2, 6, 1);
    g.fillRoundedRect(cx + 11, Y - 14, 2, 5, 1);

    // === Chin definition ===
    // Subtle shadow under head circle
    g.fillStyle(darken(skinColor, 0.78), 0.2);
    g.beginPath();
    g.arc(cx, Y + 2, 10, 0, Math.PI, false);
    g.closePath();
    g.fillPath();

    // === Eyebrows ===
    g.fillStyle(darken(hairColor, 0.7));
    g.fillRoundedRect(cx - 8, Y - 15, 6, 2, 1);
    g.fillRoundedRect(cx + 2, Y - 15, 6, 2, 1);

    // === Eyes ===
    // White
    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 5, Y - 10, 7, 6);
    g.fillEllipse(cx + 5, Y - 10, 7, 6);
    // Eyelids — thin dark arc above eyes
    g.lineStyle(1, darken(skinColor, 0.55), 0.45);
    g.beginPath();
    g.arc(cx - 5, Y - 10, 3.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 5, Y - 10, 3.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    // Iris
    g.fillStyle(0x4a3520);
    g.fillCircle(cx - 5, Y - 10, 2.2);
    g.fillCircle(cx + 5, Y - 10, 2.2);
    // Iris ring detail
    g.lineStyle(0.5, 0x3a2510, 0.3);
    g.strokeCircle(cx - 5, Y - 10, 2.2);
    g.strokeCircle(cx + 5, Y - 10, 2.2);
    // Pupil
    g.fillStyle(0x111111);
    g.fillCircle(cx - 5, Y - 10, 1.2);
    g.fillCircle(cx + 5, Y - 10, 1.2);
    // Eye shine
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 4, Y - 11, 1);
    g.fillCircle(cx + 6, Y - 11, 1);

    // === Nose ===
    g.fillStyle(darken(skinColor, 0.88), 0.5);
    g.fillCircle(cx, Y - 6, 2);
    // Nose bridge highlight
    g.fillStyle(lighten(skinColor, 1.1), 0.2);
    g.fillCircle(cx - 0.5, Y - 7, 1);

    // === Mouth ===
    g.lineStyle(2, darken(skinColor, 0.6));
    g.beginPath();
    g.arc(cx, Y - 3, 4, 0.15, Math.PI - 0.15, false);
    g.strokePath();

    // === Outline strokes for body ===
    g.lineStyle(1.5, OL, 0.3);
    g.strokeRoundedRect(cx - 12, Y + 9, 24, 23, 5);
    g.strokeRoundedRect(cx - 11, Y + 30, 22, 16, 4);
}

/**
 * Draw camera operator — texture 72x106
 * Shifted +38 Y; cx=28
 */
function drawOperator(g) {
    const cx = 28;
    const Y = 38;

    // Drop shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, Y + 66, 30, 8);

    // === Shoes ===
    g.fillStyle(0x1a1a1a);
    g.fillRoundedRect(cx - 12, Y + 58, 11, 7, 3);
    g.fillRoundedRect(cx, Y + 58, 11, 7, 3);
    g.fillStyle(0x333333, 0.4);
    g.fillRoundedRect(cx - 11, Y + 58, 4, 3, 1);
    g.fillRoundedRect(cx + 1, Y + 58, 4, 3, 1);
    // Shoe laces — V pattern
    g.lineStyle(0.7, 0x555555, 0.7);
    g.lineBetween(cx - 9, Y + 58, cx - 6, Y + 60);
    g.lineBetween(cx - 6, Y + 60, cx - 9, Y + 62);
    g.lineBetween(cx + 2, Y + 58, cx + 5, Y + 60);
    g.lineBetween(cx + 5, Y + 60, cx + 2, Y + 62);

    // === Legs (dark jeans) ===
    g.fillStyle(0x1c3a5c);
    g.fillRoundedRect(cx - 10, Y + 42, 9, 18, 3);
    g.fillRoundedRect(cx + 1, Y + 42, 9, 18, 3);
    // Jean seam
    g.fillStyle(0x15305a, 0.5);
    g.fillRect(cx - 6, Y + 43, 1, 16);
    g.fillRect(cx + 5, Y + 43, 1, 16);
    // Jean wrinkle at knees
    g.lineStyle(0.8, 0x0d2040, 0.18);
    g.lineBetween(cx - 9, Y + 48, cx - 4, Y + 50);
    g.lineBetween(cx + 2, Y + 48, cx + 7, Y + 50);

    // === Body (dark blue jacket) ===
    // Jacket gradient simulation (4 bands, darker at bottom)
    g.fillStyle(lighten(0x1c4a6e, 1.1), 0.95);
    g.fillRoundedRect(cx - 14, Y + 12, 28, 8, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(0x1c4a6e);
    g.fillRoundedRect(cx - 14, Y + 20, 28, 8, 0);
    g.fillStyle(darken(0x1c4a6e, 0.9), 0.95);
    g.fillRoundedRect(cx - 14, Y + 28, 28, 8, 0);
    g.fillStyle(darken(0x1c4a6e, 0.8), 0.9);
    g.fillRoundedRect(cx - 14, Y + 36, 28, 8, { tl: 0, tr: 0, bl: 5, br: 5 });
    // Jacket highlight
    g.fillStyle(0x2a6090, 0.35);
    g.fillRoundedRect(cx - 13, Y + 13, 8, 30, 4);
    // Wrinkle/fold lines on jacket
    g.lineStyle(0.8, 0x0d2a44, 0.15);
    g.lineBetween(cx - 8, Y + 18, cx - 5, Y + 26);
    g.lineBetween(cx + 5, Y + 16, cx + 8, Y + 24);
    g.lineBetween(cx - 10, Y + 30, cx - 6, Y + 38);
    // Zipper line
    g.fillStyle(0x888888, 0.5);
    g.fillRect(cx - 1, Y + 14, 2, 28);
    // Zipper teeth detail
    g.lineStyle(0.5, 0xaaaaaa, 0.3);
    for (let zy = Y + 16; zy < Y + 40; zy += 3) {
        g.lineBetween(cx - 1, zy, cx + 1, zy);
    }
    // Pockets
    g.fillStyle(0x154060);
    g.fillRoundedRect(cx - 12, Y + 30, 10, 8, 2);
    g.fillRoundedRect(cx + 2, Y + 30, 10, 8, 2);
    g.lineStyle(1, 0x1a3550, 0.5);
    g.strokeRoundedRect(cx - 12, Y + 30, 10, 8, 2);
    g.strokeRoundedRect(cx + 2, Y + 30, 10, 8, 2);

    // === Press vest (safety-style over jacket) ===
    g.fillStyle(0xcccc00, 0.2);
    g.fillRoundedRect(cx - 13, Y + 13, 26, 28, 4);
    // Reflective stripes on vest
    g.fillStyle(0xdddd22, 0.3);
    g.fillRect(cx - 12, Y + 22, 24, 2);
    g.fillRect(cx - 12, Y + 34, 24, 2);
    // "PRESS" label area on vest back
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(cx - 8, Y + 25, 16, 6, 2);

    // Collar
    g.fillStyle(0xf0f0f0);
    g.fillRoundedRect(cx - 6, Y + 11, 12, 7, 3);

    // === Neck ===
    g.fillStyle(0xf5c97a);
    g.fillRoundedRect(cx - 3, Y + 5, 6, 8, 2);

    // === Head ===
    g.fillStyle(OL);
    g.fillCircle(cx, Y - 4, 15);
    g.fillStyle(0xf5c97a);
    g.fillCircle(cx, Y - 4, 14);
    g.fillStyle(0xfce0a0, 0.25);
    g.fillCircle(cx - 3, Y - 8, 7);

    // Ears
    g.fillStyle(0xe8b860);
    g.fillCircle(cx - 14, Y - 3, 4);
    g.fillCircle(cx + 14, Y - 3, 4);
    g.fillStyle(0xf5c97a);
    g.fillCircle(cx - 13, Y - 3, 3);
    g.fillCircle(cx + 13, Y - 3, 3);

    // === Headphones ===
    g.lineStyle(3, 0x333333);
    g.beginPath();
    g.arc(cx, Y - 14, 15, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    // Ear cups
    g.fillStyle(0x222222);
    g.fillRoundedRect(cx - 18, Y - 8, 6, 10, 3);
    g.fillRoundedRect(cx + 12, Y - 8, 6, 10, 3);
    g.fillStyle(0x444444, 0.5);
    g.fillRoundedRect(cx - 17, Y - 7, 3, 6, 1);
    g.fillRoundedRect(cx + 13, Y - 7, 3, 6, 1);

    // === Hair ===
    // Base hair
    g.fillStyle(0x2a1a00);
    g.beginPath();
    g.arc(cx, Y - 13, 12, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair volume layer
    g.fillStyle(0x1a1000, 0.4);
    g.beginPath();
    g.arc(cx + 2, Y - 14, 10, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair highlight
    g.fillStyle(0x3a2a10, 0.3);
    g.beginPath();
    g.arc(cx - 2, Y - 16, 7, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair strand shapes
    g.fillStyle(0x3a2a10, 0.15);
    g.fillRoundedRect(cx - 7, Y - 24, 3, 7, 1);
    g.fillRoundedRect(cx - 2, Y - 25, 3, 8, 1);
    g.fillRoundedRect(cx + 3, Y - 24, 3, 7, 1);
    // Dark strand accents
    g.fillStyle(0x150a00, 0.12);
    g.fillRoundedRect(cx - 4, Y - 22, 2, 5, 1);
    g.fillRoundedRect(cx + 1, Y - 23, 2, 6, 1);

    // === Chin definition ===
    g.fillStyle(darken(0xf5c97a, 0.78), 0.2);
    g.beginPath();
    g.arc(cx, Y + 4, 9, 0, Math.PI, false);
    g.closePath();
    g.fillPath();

    // === Eyes ===
    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 5, Y - 6, 6, 5);
    g.fillEllipse(cx + 5, Y - 6, 6, 5);
    // Eyelids
    g.lineStyle(1, 0x8a6030, 0.45);
    g.beginPath();
    g.arc(cx - 5, Y - 6, 3.2, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 5, Y - 6, 3.2, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.fillStyle(0x333333);
    g.fillCircle(cx - 5, Y - 6, 1.8);
    g.fillCircle(cx + 5, Y - 6, 1.8);
    // Iris ring
    g.lineStyle(0.5, 0x222222, 0.3);
    g.strokeCircle(cx - 5, Y - 6, 1.8);
    g.strokeCircle(cx + 5, Y - 6, 1.8);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 4, Y - 7, 0.8);
    g.fillCircle(cx + 6, Y - 7, 0.8);
    // Eyebrows
    g.fillStyle(0x1a1000);
    g.fillRoundedRect(cx - 8, Y - 11, 6, 2, 1);
    g.fillRoundedRect(cx + 2, Y - 11, 6, 2, 1);

    // Nose
    g.fillStyle(0xe0b060, 0.5);
    g.fillCircle(cx, Y - 2, 2);
    // Nose bridge highlight
    g.fillStyle(0xfce0a0, 0.2);
    g.fillCircle(cx - 0.5, Y - 3, 0.8);

    // Mouth
    g.lineStyle(2, 0xc07a40);
    g.beginPath();
    g.arc(cx, Y + 1, 4, 0.1, Math.PI - 0.1, false);
    g.strokePath();

    // === Arm holding camera ===
    g.fillStyle(0x1c4a6e);
    g.fillRoundedRect(cx + 10, Y + 12, 8, 10, 3);
    g.fillStyle(0xf5c97a);
    g.fillRoundedRect(cx + 10, Y + 18, 8, 14, 3);
    // Finger detail on camera hand
    g.lineStyle(0.6, darken(0xf5c97a, 0.7), 0.35);
    g.lineBetween(cx + 12, Y + 30, cx + 12, Y + 32);
    g.lineBetween(cx + 14, Y + 30, cx + 14, Y + 32);
    g.lineBetween(cx + 16, Y + 30, cx + 16, Y + 32);

    // === Camera body ===
    // Camera shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(cx + 14, Y + 5, 28, 18, 4);
    // Body
    g.fillStyle(0x2a2a2a);
    g.fillRoundedRect(cx + 12, Y + 2, 28, 18, 4);
    // Camera top detail
    g.fillStyle(0x3a3a3a);
    g.fillRoundedRect(cx + 14, Y + 3, 24, 5, 2);
    // Handle
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx + 16, Y - 6, 16, 9, 3);
    g.fillStyle(0x333333, 0.4);
    g.fillRoundedRect(cx + 18, Y - 5, 6, 4, 1);
    // Viewfinder
    g.fillStyle(0x222222);
    g.fillRoundedRect(cx + 32, Y + 4, 8, 7, 2);
    g.fillStyle(0x336699, 0.5);
    g.fillRoundedRect(cx + 33, Y + 5, 6, 5, 1);
    // Viewfinder eyepiece (rubber cup)
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx + 39, Y + 4, 4, 7, 2);
    g.fillStyle(0x2a2a2a, 0.6);
    g.fillRoundedRect(cx + 40, Y + 5, 2, 5, 1);
    // Eyepiece rubber ridges
    g.lineStyle(0.6, 0x333333, 0.5);
    g.lineBetween(cx + 39, Y + 6, cx + 43, Y + 6);
    g.lineBetween(cx + 39, Y + 8, cx + 43, Y + 8);
    g.lineBetween(cx + 39, Y + 10, cx + 43, Y + 10);
    // Buttons
    g.fillStyle(0xff2200);
    g.fillCircle(cx + 36, Y + 2, 2.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx + 35.5, Y + 1.5, 0.8);
    // Lens
    g.fillStyle(OL);
    g.fillCircle(cx + 14, Y + 12, 8);
    g.fillStyle(0x1a1a88);
    g.fillCircle(cx + 14, Y + 12, 7);
    g.fillStyle(0x4466dd);
    g.fillCircle(cx + 14, Y + 12, 5);
    g.fillStyle(0x6688ee, 0.5);
    g.fillCircle(cx + 14, Y + 12, 3);
    g.fillStyle(0xb4dcff, 0.7);
    g.fillCircle(cx + 12, Y + 10, 2.5);
    // Lens ring
    g.lineStyle(1.5, 0x555555);
    g.strokeCircle(cx + 14, Y + 12, 7.5);

    // === Cable from camera trailing down ===
    g.lineStyle(2.5, 0x222222);
    g.beginPath();
    g.moveTo(cx + 18, Y + 18);
    g.lineTo(cx + 20, Y + 28);
    g.lineTo(cx + 16, Y + 40);
    g.lineTo(cx + 12, Y + 52);
    g.strokePath();
    // Cable highlight
    g.lineStyle(0.8, 0x444444, 0.3);
    g.beginPath();
    g.moveTo(cx + 17, Y + 18);
    g.lineTo(cx + 19, Y + 28);
    g.strokePath();
    // Cable connector at camera end
    g.fillStyle(0x444444);
    g.fillRoundedRect(cx + 16, Y + 17, 5, 3, 1);

    // Jacket outline
    g.lineStyle(1.5, OL, 0.25);
    g.strokeRoundedRect(cx - 14, Y + 12, 28, 32, 5);
}

/**
 * Draw correspondent (cartoon woman with microphone) — texture 52x102
 * Shifted +38 Y; cx=26
 */
function drawCorrespondent(g) {
    const cx = 26;
    const Y = 38;

    // Drop shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, Y + 62, 26, 8);

    // === Heels ===
    g.fillStyle(0xc0392b);
    g.fillRoundedRect(cx - 9, Y + 56, 8, 6, 2);
    g.fillRoundedRect(cx + 1, Y + 56, 8, 6, 2);
    // Heel highlight
    g.fillStyle(0xdd5544, 0.25);
    g.fillRoundedRect(cx - 8, Y + 56, 3, 3, 1);
    g.fillRoundedRect(cx + 2, Y + 56, 3, 3, 1);
    // Stiletto heel — thin tapered shape
    g.fillStyle(0x8B0000);
    g.fillRect(cx - 3, Y + 61, 2, 4);
    g.fillRect(cx + 5, Y + 61, 2, 4);
    // Stiletto tip (thinner at bottom)
    g.fillStyle(0x660000);
    g.fillRect(cx - 3, Y + 64, 1, 2);
    g.fillRect(cx + 6, Y + 64, 1, 2);
    // Sole edge
    g.fillStyle(0x550000, 0.6);
    g.fillRect(cx - 9, Y + 61, 8, 1);
    g.fillRect(cx + 1, Y + 61, 8, 1);

    // === Skirt ===
    // Skirt gradient simulation (3 bands)
    g.fillStyle(lighten(0x8B0000, 1.1));
    g.fillRoundedRect(cx - 9, Y + 42, 18, 6, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(0x8B0000);
    g.fillRoundedRect(cx - 9, Y + 48, 18, 5, 0);
    g.fillStyle(darken(0x8B0000, 0.85));
    g.fillRoundedRect(cx - 9, Y + 53, 18, 5, { tl: 0, tr: 0, bl: 4, br: 4 });
    // Skirt highlight
    g.fillStyle(0xaa1111, 0.25);
    g.fillRoundedRect(cx - 6, Y + 43, 6, 14, 3);
    // Skirt wrinkle/fold lines
    g.lineStyle(0.8, 0x550000, 0.15);
    g.lineBetween(cx - 3, Y + 43, cx - 5, Y + 56);
    g.lineBetween(cx + 2, Y + 44, cx + 4, Y + 55);

    // === Body (red blazer) ===
    // Blazer gradient simulation (4 bands, darker at bottom)
    g.fillStyle(lighten(0xc0392b, 1.1), 0.95);
    g.fillRoundedRect(cx - 13, Y + 12, 26, 8, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(0xc0392b);
    g.fillRoundedRect(cx - 13, Y + 20, 26, 8, 0);
    g.fillStyle(darken(0xc0392b, 0.92), 0.95);
    g.fillRoundedRect(cx - 13, Y + 28, 26, 8, 0);
    g.fillStyle(darken(0xc0392b, 0.82), 0.9);
    g.fillRoundedRect(cx - 13, Y + 36, 26, 8, { tl: 0, tr: 0, bl: 5, br: 5 });
    // Blazer lapel
    g.fillStyle(0xa03020);
    g.fillTriangle(cx - 4, Y + 12, cx, Y + 22, cx - 10, Y + 22);
    g.fillTriangle(cx + 4, Y + 12, cx, Y + 22, cx + 10, Y + 22);
    // Lapel edge highlight
    g.lineStyle(0.6, 0xdd5544, 0.25);
    g.lineBetween(cx - 4, Y + 12, cx - 10, Y + 22);
    g.lineBetween(cx + 4, Y + 12, cx + 10, Y + 22);
    // White blouse
    g.fillStyle(0xf8f8f8);
    g.fillRoundedRect(cx - 4, Y + 12, 8, 12, 3);
    // Button
    g.fillStyle(0xcccccc);
    g.fillCircle(cx, Y + 18, 1.5);
    g.fillCircle(cx, Y + 22, 1.5);
    // Button shine
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 0.5, Y + 17.5, 0.5);
    g.fillCircle(cx - 0.5, Y + 21.5, 0.5);
    // Blazer highlight
    g.fillStyle(0xdd4444, 0.2);
    g.fillRoundedRect(cx + 4, Y + 14, 6, 18, 3);
    // Wrinkle/fold lines on blazer
    g.lineStyle(0.8, 0x6a1510, 0.15);
    g.lineBetween(cx - 10, Y + 18, cx - 7, Y + 28);
    g.lineBetween(cx + 8, Y + 16, cx + 10, Y + 26);
    g.lineBetween(cx - 9, Y + 32, cx - 5, Y + 40);

    // === Press badge / lanyard ===
    g.lineStyle(1.5, 0xe74c3c, 0.6);
    g.lineBetween(cx - 2, Y + 10, cx - 4, Y + 26);
    g.fillStyle(0xffffff);
    g.fillRoundedRect(cx - 7, Y + 26, 7, 9, 2);
    g.fillStyle(0xe74c3c);
    g.fillRect(cx - 6, Y + 27, 5, 3);
    g.fillStyle(0x333333);
    g.fillRect(cx - 6, Y + 31, 5, 2);

    // === Neck ===
    g.fillStyle(0xf5c090);
    g.fillRoundedRect(cx - 3, Y + 5, 6, 8, 2);

    // === Head ===
    g.fillStyle(OL);
    g.fillCircle(cx, Y - 4, 14);
    g.fillStyle(0xf5c090);
    g.fillCircle(cx, Y - 4, 13);
    g.fillStyle(0xfcd8b0, 0.25);
    g.fillCircle(cx - 3, Y - 8, 6);

    // Ears
    g.fillStyle(0xe8a870);
    g.fillCircle(cx - 13, Y - 3, 3.5);
    g.fillCircle(cx + 13, Y - 3, 3.5);
    g.fillStyle(0xf5c090);
    g.fillCircle(cx - 12, Y - 3, 2.5);
    g.fillCircle(cx + 12, Y - 3, 2.5);
    // Earrings
    g.fillStyle(0xffd700);
    g.fillCircle(cx - 13, Y, 2);
    g.fillCircle(cx + 13, Y, 2);
    g.fillStyle(0xffee66, 0.6);
    g.fillCircle(cx - 13.5, Y - 0.5, 0.8);
    g.fillCircle(cx + 12.5, Y - 0.5, 0.8);

    // === Long hair ===
    // Base hair arc
    g.fillStyle(0x7B3F20);
    g.beginPath();
    g.arc(cx, Y - 10, 13, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair volume — second layer
    g.fillStyle(0x6B2F10, 0.4);
    g.beginPath();
    g.arc(cx + 2, Y - 12, 11, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair volume — top highlight
    g.fillStyle(0x9B5F40, 0.3);
    g.beginPath();
    g.arc(cx - 2, Y - 14, 8, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Hair sides (long)
    g.fillStyle(0x7B3F20);
    g.fillRoundedRect(cx - 15, Y - 10, 6, 30, 3);
    g.fillRoundedRect(cx + 9, Y - 10, 6, 26, 3);
    // Hair flip/curl at ends — rounded bumps
    g.fillStyle(0x7B3F20);
    g.fillCircle(cx - 13, Y + 22, 4);
    g.fillCircle(cx + 13, Y + 18, 3.5);
    // Curl highlights
    g.fillStyle(0x9B5F40, 0.25);
    g.fillCircle(cx - 14, Y + 21, 2);
    g.fillCircle(cx + 12, Y + 17, 1.8);
    // Hair strand shapes for volume
    g.fillStyle(0x8B4F30, 0.15);
    g.fillRoundedRect(cx - 7, Y - 22, 3, 8, 1);
    g.fillRoundedRect(cx - 2, Y - 24, 3, 10, 1);
    g.fillRoundedRect(cx + 3, Y - 22, 3, 8, 1);
    // Dark strand accents
    g.fillStyle(0x5B1F00, 0.12);
    g.fillRoundedRect(cx - 4, Y - 20, 2, 6, 1);
    g.fillRoundedRect(cx + 1, Y - 21, 2, 7, 1);
    // Hair highlights on sides
    g.fillStyle(0x9B5F40, 0.3);
    g.fillRoundedRect(cx - 14, Y - 8, 3, 20, 1);
    g.fillRoundedRect(cx + 10, Y - 8, 3, 18, 1);

    // === Chin definition ===
    g.fillStyle(darken(0xf5c090, 0.78), 0.2);
    g.beginPath();
    g.arc(cx, Y + 4, 9, 0, Math.PI, false);
    g.closePath();
    g.fillPath();

    // === Rosy cheeks ===
    g.fillStyle(0xff9696, 0.3);
    g.fillCircle(cx - 7, Y - 1, 3.5);
    g.fillCircle(cx + 7, Y - 1, 3.5);

    // === Eyes ===
    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 5, Y - 6, 7, 6);
    g.fillEllipse(cx + 5, Y - 6, 7, 6);
    // Eyelids — thin dark arc above eyes
    g.lineStyle(1, 0x7a4020, 0.45);
    g.beginPath();
    g.arc(cx - 5, Y - 6, 3.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 5, Y - 6, 3.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    // Iris
    g.fillStyle(0x2a6040);
    g.fillCircle(cx - 5, Y - 6, 2);
    g.fillCircle(cx + 5, Y - 6, 2);
    // Iris ring detail
    g.lineStyle(0.5, 0x1a4030, 0.3);
    g.strokeCircle(cx - 5, Y - 6, 2);
    g.strokeCircle(cx + 5, Y - 6, 2);
    // Pupil
    g.fillStyle(0x111111);
    g.fillCircle(cx - 5, Y - 6, 1);
    g.fillCircle(cx + 5, Y - 6, 1);
    // Shine
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 4, Y - 7, 1);
    g.fillCircle(cx + 6, Y - 7, 1);
    // Eyelashes — multiple lash strands
    g.lineStyle(1.2, 0x3a2010);
    g.lineBetween(cx - 9, Y - 8, cx - 8, Y - 10);
    g.lineBetween(cx - 8, Y - 9, cx - 7.5, Y - 11);
    g.lineBetween(cx + 9, Y - 8, cx + 8, Y - 10);
    g.lineBetween(cx + 8, Y - 9, cx + 7.5, Y - 11);
    // Eyebrows (thin, arched)
    g.lineStyle(1.5, 0x5a3018);
    g.beginPath();
    g.arc(cx - 5, Y - 14, 5, 0.3, Math.PI - 0.3, true);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 5, Y - 14, 5, 0.3, Math.PI - 0.3, true);
    g.strokePath();

    // === Nose ===
    g.fillStyle(0xe0a878, 0.5);
    g.fillCircle(cx, Y - 2, 1.5);
    // Nose bridge highlight
    g.fillStyle(0xfcd8b0, 0.2);
    g.fillCircle(cx - 0.5, Y - 3, 0.8);

    // === Lipstick mouth ===
    g.fillStyle(0xcc2244);
    g.beginPath();
    g.arc(cx, Y + 1, 4, 0.1, Math.PI - 0.1, false);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xff4466, 0.4);
    g.fillCircle(cx, Y + 2, 2);
    // Lipstick highlight — small white gloss dot
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(cx - 1.5, Y + 1, 1);
    // Upper lip definition
    g.lineStyle(0.6, 0x991133, 0.3);
    g.beginPath();
    g.arc(cx, Y + 0.5, 3.5, Math.PI + 0.2, -0.2, false);
    g.strokePath();

    // === Arm with mic ===
    g.fillStyle(0xc0392b);
    g.fillRoundedRect(cx - 17, Y + 12, 7, 10, 3);
    g.fillStyle(0xf5c090);
    g.fillRoundedRect(cx - 16, Y + 20, 6, 14, 3);
    // Finger detail on mic hand
    g.lineStyle(0.6, darken(0xf5c090, 0.7), 0.35);
    g.lineBetween(cx - 15, Y + 32, cx - 15, Y + 34);
    g.lineBetween(cx - 13, Y + 32, cx - 13, Y + 34);

    // === Microphone ===
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx - 19, Y + 28, 8, 20, 3);
    // Gold stripe
    g.fillStyle(0xffd700);
    g.fillRect(cx - 19, Y + 34, 8, 3);
    g.fillRect(cx - 19, Y + 40, 8, 2);
    // Foam ball
    g.fillStyle(OL);
    g.fillCircle(cx - 15, Y + 22, 9.5);
    g.fillStyle(0xcc0000);
    g.fillCircle(cx - 15, Y + 22, 9);
    // Foam texture dots
    g.fillStyle(0xdd3333, 0.5);
    g.fillCircle(cx - 18, Y + 20, 2);
    g.fillCircle(cx - 13, Y + 18, 2.5);
    g.fillCircle(cx - 11, Y + 24, 2);
    g.fillCircle(cx - 17, Y + 25, 1.5);
    // Foam highlight
    g.fillStyle(0xff5555, 0.35);
    g.fillCircle(cx - 17, Y + 19, 4);

    // Body outline
    g.lineStyle(1.5, OL, 0.2);
    g.strokeRoundedRect(cx - 13, Y + 12, 26, 32, 5);
}

/**
 * Draw assistant (techie with TVU backpack) — texture 58x100
 * Shifted +36 Y; cx=28
 */
function drawAssistant(g) {
    const cx = 28;
    const Y = 36;

    // Drop shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, Y + 66, 28, 8);

    // === Shoes ===
    g.fillStyle(0x1a1a1a);
    g.fillRoundedRect(cx - 10, Y + 58, 10, 7, 3);
    g.fillRoundedRect(cx + 1, Y + 58, 10, 7, 3);
    g.fillStyle(0x333333, 0.4);
    g.fillRoundedRect(cx - 9, Y + 58, 4, 3, 1);
    g.fillRoundedRect(cx + 2, Y + 58, 4, 3, 1);
    // Shoe laces — V pattern
    g.lineStyle(0.7, 0x555555, 0.7);
    g.lineBetween(cx - 8, Y + 58, cx - 5, Y + 60);
    g.lineBetween(cx - 5, Y + 60, cx - 8, Y + 62);
    g.lineBetween(cx + 3, Y + 58, cx + 6, Y + 60);
    g.lineBetween(cx + 6, Y + 60, cx + 3, Y + 62);

    // === Legs (dark cargo pants) ===
    g.fillStyle(0x2a2a2a);
    g.fillRoundedRect(cx - 9, Y + 42, 8, 18, 3);
    g.fillRoundedRect(cx + 1, Y + 42, 8, 18, 3);
    // Cargo pockets
    g.fillStyle(0x333333);
    g.fillRoundedRect(cx - 8, Y + 49, 6, 5, 1);
    g.fillRoundedRect(cx + 2, Y + 49, 6, 5, 1);
    g.lineStyle(0.8, 0x222222, 0.5);
    g.strokeRoundedRect(cx - 8, Y + 49, 6, 5, 1);
    g.strokeRoundedRect(cx + 2, Y + 49, 6, 5, 1);
    // Pants wrinkle at knees
    g.lineStyle(0.8, 0x1a1a1a, 0.18);
    g.lineBetween(cx - 8, Y + 46, cx - 4, Y + 48);
    g.lineBetween(cx + 2, Y + 46, cx + 6, Y + 48);

    // === Body (dark tech vest) ===
    // Vest gradient simulation (4 bands, darker at bottom)
    g.fillStyle(lighten(0x383838, 1.12), 0.95);
    g.fillRoundedRect(cx - 12, Y + 12, 24, 8, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(0x383838);
    g.fillRoundedRect(cx - 12, Y + 20, 24, 8, 0);
    g.fillStyle(darken(0x383838, 0.9), 0.95);
    g.fillRoundedRect(cx - 12, Y + 28, 24, 8, 0);
    g.fillStyle(darken(0x383838, 0.8), 0.9);
    g.fillRoundedRect(cx - 12, Y + 36, 24, 8, { tl: 0, tr: 0, bl: 5, br: 5 });
    // Vest highlights
    g.fillStyle(0x4a4a4a, 0.3);
    g.fillRoundedRect(cx - 10, Y + 13, 6, 28, 3);
    // Wrinkle/fold lines on vest
    g.lineStyle(0.8, 0x1a1a1a, 0.15);
    g.lineBetween(cx - 6, Y + 16, cx - 3, Y + 24);
    g.lineBetween(cx + 5, Y + 14, cx + 8, Y + 22);
    g.lineBetween(cx - 8, Y + 28, cx - 4, Y + 36);
    // Zipper
    g.fillStyle(0x777777, 0.5);
    g.fillRect(cx - 1, Y + 14, 2, 28);
    // Zipper teeth detail
    g.lineStyle(0.5, 0x999999, 0.3);
    for (let zy = Y + 16; zy < Y + 40; zy += 3) {
        g.lineBetween(cx - 1, zy, cx + 1, zy);
    }
    // Chest pocket
    g.fillStyle(0x444444);
    g.fillRoundedRect(cx + 3, Y + 15, 7, 6, 2);
    g.lineStyle(0.8, 0x333333, 0.5);
    g.strokeRoundedRect(cx + 3, Y + 15, 7, 6, 2);
    // Pen in chest pocket
    g.fillStyle(0x2244cc);
    g.fillRect(cx + 8, Y + 13, 1.5, 6);
    g.fillStyle(0xdddddd);
    g.fillRect(cx + 8, Y + 13, 1.5, 1.5);

    // === Tool belt ===
    g.fillStyle(0x5a4020);
    g.fillRoundedRect(cx - 12, Y + 38, 24, 5, 2);
    // Belt buckle
    g.fillStyle(0xaaaaaa);
    g.fillRoundedRect(cx - 3, Y + 38, 6, 5, 1);
    // Belt buckle prong
    g.fillStyle(0x888888);
    g.fillRect(cx, Y + 39, 1, 3);
    // Tool pouch
    g.fillStyle(0x4a3518);
    g.fillRoundedRect(cx + 8, Y + 37, 6, 7, 2);

    // === Walkie-talkie clipped to belt ===
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx - 11, Y + 36, 5, 10, 2);
    // Walkie antenna
    g.fillStyle(0x333333);
    g.fillRect(cx - 10, Y + 32, 2, 5);
    // Walkie screen
    g.fillStyle(0x225522, 0.6);
    g.fillRect(cx - 10, Y + 37, 3, 3);
    // Walkie buttons
    g.fillStyle(0x444444);
    g.fillRect(cx - 10, Y + 41, 3, 1);
    g.fillRect(cx - 10, Y + 43, 3, 1);

    // === Neck ===
    g.fillStyle(0xd4956a);
    g.fillRoundedRect(cx - 3, Y + 5, 6, 8, 2);

    // === Head ===
    g.fillStyle(OL);
    g.fillCircle(cx, Y - 2, 13);
    g.fillStyle(0xd4956a);
    g.fillCircle(cx, Y - 2, 12);
    g.fillStyle(0xe0a87a, 0.25);
    g.fillCircle(cx - 2, Y - 6, 5);

    // Ears
    g.fillStyle(0xc08050);
    g.fillCircle(cx - 12, Y - 1, 3.5);
    g.fillCircle(cx + 12, Y - 1, 3.5);
    g.fillStyle(0xd4956a);
    g.fillCircle(cx - 11, Y - 1, 2.5);
    g.fillCircle(cx + 11, Y - 1, 2.5);

    // === Chin definition ===
    g.fillStyle(darken(0xd4956a, 0.78), 0.2);
    g.beginPath();
    g.arc(cx, Y + 6, 8, 0, Math.PI, false);
    g.closePath();
    g.fillPath();

    // === Hair peeking under cap ===
    g.fillStyle(0x1a0a00);
    g.fillRoundedRect(cx - 12, Y - 6, 24, 4, 1);
    // Hair strand accents under cap
    g.fillStyle(0x2a1a00, 0.4);
    g.fillRoundedRect(cx - 10, Y - 7, 3, 5, 1);
    g.fillRoundedRect(cx + 7, Y - 7, 3, 5, 1);

    // === Cap ===
    g.fillStyle(0x222222);
    g.beginPath();
    g.arc(cx, Y - 10, 13, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Cap volume highlight
    g.fillStyle(0x333333, 0.3);
    g.beginPath();
    g.arc(cx - 2, Y - 14, 8, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    // Cap seam line
    g.lineStyle(0.6, 0x333333, 0.3);
    g.beginPath();
    g.arc(cx, Y - 12, 11, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    // Cap brim
    g.fillStyle(0x1a1a1a);
    g.fillRoundedRect(cx - 16, Y - 10, 32, 5, 2);
    // Cap brim edge highlight
    g.fillStyle(0x333333, 0.2);
    g.fillRect(cx - 14, Y - 10, 28, 1);
    // Cap logo
    g.fillStyle(0xe74c3c);
    g.fillRoundedRect(cx - 5, Y - 18, 10, 5, 2);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(cx - 3, Y - 17, 2, 3);
    g.fillRect(cx + 1, Y - 17, 2, 3);

    // === Headset ===
    g.lineStyle(2, 0x444444);
    g.beginPath();
    g.arc(cx, Y - 8, 14, Math.PI * 0.6, Math.PI * 0.85, false);
    g.strokePath();
    // Mic boom
    g.lineStyle(1.5, 0x555555);
    g.lineBetween(cx - 13, Y - 2, cx - 16, Y + 4);
    g.fillStyle(0x333333);
    g.fillCircle(cx - 16, Y + 5, 3);
    g.fillStyle(0x111111);
    g.fillCircle(cx - 16, Y + 5, 2);

    // === Sunglasses ===
    // Lens frames (dark rectangular)
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx - 8, Y - 7, 8, 6, 2);
    g.fillRoundedRect(cx, Y - 7, 8, 6, 2);
    // Bridge
    g.fillStyle(0x111111);
    g.fillRect(cx - 1, Y - 6, 2, 2);
    // Temple arms (going to ears)
    g.lineStyle(1.5, 0x111111);
    g.lineBetween(cx - 8, Y - 5, cx - 12, Y - 3);
    g.lineBetween(cx + 8, Y - 5, cx + 12, Y - 3);
    // Lens tint
    g.fillStyle(0x1a1a44, 0.7);
    g.fillRoundedRect(cx - 7, Y - 6, 6, 4, 1);
    g.fillRoundedRect(cx + 1, Y - 6, 6, 4, 1);
    // Lens reflection
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(cx - 6, Y - 6, 3, 2, 1);
    g.fillRoundedRect(cx + 2, Y - 6, 3, 2, 1);
    // Frame highlight
    g.fillStyle(0x333333, 0.3);
    g.fillRect(cx - 7, Y - 7, 6, 1);
    g.fillRect(cx + 1, Y - 7, 6, 1);

    // === Eyes behind glasses (subtle) ===
    g.fillStyle(0xffffff, 0.3);
    g.fillEllipse(cx - 4, Y - 4, 5, 4);
    g.fillEllipse(cx + 4, Y - 4, 5, 4);
    // Eyelids
    g.lineStyle(0.8, 0x8a5a30, 0.3);
    g.beginPath();
    g.arc(cx - 4, Y - 4, 2.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 4, Y - 4, 2.8, Math.PI + 0.3, -0.3, false);
    g.strokePath();
    g.fillStyle(0x333333, 0.5);
    g.fillCircle(cx - 4, Y - 4, 1.2);
    g.fillCircle(cx + 4, Y - 4, 1.2);

    // Eyebrows
    g.fillStyle(0x111111);
    g.fillRoundedRect(cx - 7, Y - 8, 5, 2, 1);
    g.fillRoundedRect(cx + 2, Y - 8, 5, 2, 1);

    // Nose
    g.fillStyle(darken(0xd4956a, 0.88), 0.4);
    g.fillCircle(cx, Y + 1, 1.5);

    // Mouth
    g.lineStyle(2, 0xb07040);
    g.beginPath();
    g.arc(cx, Y + 3, 4, 0.15, Math.PI - 0.15, false);
    g.strokePath();

    // === TVU backpack (left side) ===
    // Backpack shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRoundedRect(cx - 34, Y + 4, 22, 32, 5);
    // Backpack body
    g.fillStyle(0x0d0d0d);
    g.fillRoundedRect(cx - 36, Y + 2, 22, 32, 5);
    // Metal frame
    g.lineStyle(1.5, 0x444444, 0.5);
    g.strokeRoundedRect(cx - 36, Y + 2, 22, 32, 5);

    // Screen
    g.fillStyle(0x001800);
    g.fillRoundedRect(cx - 34, Y + 5, 14, 12, 2);
    // Screen glow
    g.fillStyle(0x003300, 0.3);
    g.fillRoundedRect(cx - 33, Y + 6, 12, 10, 1);

    // LIVE badge
    g.fillStyle(0xdd1100);
    g.fillRoundedRect(cx - 34, Y + 5, 7, 5, 1);
    g.fillStyle(0xff4444, 0.5);
    g.fillCircle(cx - 33, Y + 7, 1);

    // Signal bars
    g.fillStyle(0x00cc44);
    g.fillRect(cx - 24, Y + 9, 2, 8);
    g.fillStyle(0x00cc44);
    g.fillRect(cx - 21, Y + 11, 2, 6);
    g.fillStyle(0x00aa33);
    g.fillRect(cx - 18, Y + 13, 2, 4);

    // Antenna
    g.lineStyle(2, 0x888888);
    g.lineBetween(cx - 28, Y + 2, cx - 28, Y - 8);
    g.fillStyle(0xff0000);
    g.fillCircle(cx - 28, Y - 9, 2.5);
    g.fillStyle(0xff6666, 0.5);
    g.fillCircle(cx - 29, Y - 10, 1);

    // Power button
    g.fillStyle(0x00cc44);
    g.fillCircle(cx - 28, Y + 26, 4);
    g.fillStyle(0x00ff55, 0.3);
    g.fillCircle(cx - 29, Y + 25, 2);
    // Power icon
    g.lineStyle(1.5, 0x003300);
    g.beginPath();
    g.arc(cx - 28, Y + 26, 2.5, -Math.PI * 0.7, Math.PI * 0.7, false);
    g.strokePath();

    // LEDs
    g.fillStyle(0x00aaff);
    g.fillCircle(cx - 34, Y + 22, 1.5);
    g.fillStyle(0xffaa00);
    g.fillCircle(cx - 34, Y + 26, 1.5);
    g.fillStyle(0x00ff00);
    g.fillCircle(cx - 34, Y + 30, 1.5);

    // Cable from backpack
    g.lineStyle(2.5, 0x222222);
    g.beginPath();
    g.moveTo(cx - 25, Y + 34);
    g.lineTo(cx - 20, Y + 40);
    g.lineTo(cx - 12, Y + 42);
    g.strokePath();

    // Body outline
    g.lineStyle(1.5, OL, 0.2);
    g.strokeRoundedRect(cx - 12, Y + 12, 24, 32, 5);
}

/**
 * Create all game textures
 */
export function createTextures(scene) {
    // Skip if textures already exist (scene restart)
    if (scene.textures.exists('operator')) return;

    // Operator (72x106)
    const op = scene.add.graphics();
    drawOperator(op);
    op.generateTexture('operator', 72, 106);
    op.destroy();

    // Correspondent (52x102)
    const corr = scene.add.graphics();
    drawCorrespondent(corr);
    corr.generateTexture('correspondent', 52, 102);
    corr.destroy();

    // Assistant (58x100)
    const asst = scene.add.graphics();
    drawAssistant(asst);
    asst.generateTexture('assistant', 58, 100);
    asst.destroy();

    // Football players (pool of 24 variants — 48x110)
    const combo = TEAM_COMBOS[0];
    for (let i = 0; i < 24; i++) {
        const team = i < 12 ? 'a' : 'b';
        const c = combo[team];
        const skin = SKINS[(i * 5 + 1) % SKINS.length];
        const hair = HAIRS[(i * 7 + 3) % HAIRS.length];
        const pg = scene.add.graphics();
        drawPlayer(pg, c.k, c.kd, c.s, skin, hair);
        pg.generateTexture(`player_${i}`, 48, 110);
        pg.destroy();
    }

    // Smoke puff
    const smoke = scene.add.graphics();
    smoke.fillStyle(0xd2d2c3, 0.5);
    smoke.fillCircle(6, 6, 6);
    smoke.generateTexture('smoke', 12, 12);
    smoke.destroy();
}

/**
 * Correspondent questions
 */
export const QUESTIONS = [
    'как вы оцениваете игру?',
    'что скажете болельщикам?',
    'ваши ожидания оправдались?',
    'расскажите о голе подробнее',
    'когда следующий матч?',
    'как настрой на плей-офф?',
    'что думаете о сопернике?',
    'ваш лучший момент сегодня?',
    'тренер доволен результатом?',
    'что было труднее всего?',
    'вы лучший игрок матча!',
    'это был решающий гол?',
    'как здоровье после матча?',
    'кому посвящаете победу?',
    'что изменили во втором тайме?',
];

/**
 * Player answers
 */
export const ANSWERS = [
    'мяч круглый, поле длинное',
    'ворота маленькие, не попал',
    'судей на мыло!',
    'главное — не результат',
    'мы работали как одна семья',
    'я выложился на все 200%',
    'газон был неровный, это факт',
    'солнце в глаза светило',
    'в следующем туре покажем',
    'у нас было много моментов',
    'мяч не шёл в ворота сегодня',
    'вратарь у них — просто стена',
    'мне надо смотреть видео',
    'команда дала мне кредит доверия',
    'я сыграл для болельщиков',
    'пенальти? какой пенальти?!',
    'тренер сказал — я сделал',
    'мы голодны до побед!',
    'обе команды старались',
    'дубль — это двойная радость',
    'штанга виновата, не я',
    'физика сегодня подвела немного',
];
