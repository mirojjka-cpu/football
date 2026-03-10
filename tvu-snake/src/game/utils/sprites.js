/**
 * Generate character sprites using CanvasTexture (native Canvas 2D API)
 * HD cartoon style — gradients, shadows, bezier curves
 * All textures are 2x resolution, displayed at 0.5x scale for crisp rendering
 */

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

// --- Color helpers ---
function hex(c) {
    return '#' + (c & 0xffffff).toString(16).padStart(6, '0');
}
function hexA(c, a) {
    const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
    return `rgba(${r},${g},${b},${a})`;
}
function darken(color, factor) {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
}
function lighten(color, factor) {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
    const b = Math.min(255, Math.floor((color & 0xff) * factor));
    return (r << 16) | (g << 8) | b;
}

// --- Canvas drawing helpers ---
function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function ellipse(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
}

function circle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
}

// Gradient-filled rounded rect
function gradRect(ctx, x, y, w, h, r, topColor, botColor) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, hex(topColor));
    grad.addColorStop(1, hex(botColor));
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
}

// ========================
// PLAYER (footballer) — 96 x 220 canvas (displayed at ~0.22 scale)
// ========================
function drawPlayer(ctx, kitColor, kitDark, sockColor, skinColor, hairColor) {
    const cx = 48, Y = 84; // center X, Y offset

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    // --- Drop shadow ---
    ctx.fillStyle = hexA(0x000000, 0.15);
    ellipse(ctx, cx, Y + 128, 28, 8);
    ctx.fill();

    // --- Boots ---
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, cx - 20, Y + 110, 18, 14, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 110, 18, 14, 5);
    ctx.fill();
    // Boot highlight
    const bootGrad = ctx.createLinearGradient(0, Y + 110, 0, Y + 124);
    bootGrad.addColorStop(0, '#444');
    bootGrad.addColorStop(1, '#111');
    ctx.fillStyle = bootGrad;
    roundRect(ctx, cx - 18, Y + 111, 8, 6, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, Y + 111, 8, 6, 2);
    ctx.fill();
    // Studs
    ctx.fillStyle = '#999';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(cx - 16 + i * 6, Y + 123, 3, 3);
        ctx.fillRect(cx + 4 + i * 6, Y + 123, 3, 3);
    }

    // --- Socks ---
    const sockGrad = ctx.createLinearGradient(0, Y + 86, 0, Y + 112);
    sockGrad.addColorStop(0, hex(lighten(sockColor, 1.15)));
    sockGrad.addColorStop(1, hex(darken(sockColor, 0.8)));
    ctx.fillStyle = sockGrad;
    roundRect(ctx, cx - 18, Y + 86, 16, 28, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 86, 16, 28, 5);
    ctx.fill();
    // Sock stripe
    ctx.fillStyle = hexA(0xffffff, 0.25);
    ctx.fillRect(cx - 16, Y + 94, 12, 3);
    ctx.fillRect(cx + 4, Y + 94, 12, 3);
    // Shin guard highlight
    ctx.fillStyle = hexA(lighten(sockColor, 1.3), 0.2);
    roundRect(ctx, cx - 14, Y + 88, 6, 12, 2);
    ctx.fill();
    roundRect(ctx, cx + 6, Y + 88, 6, 12, 2);
    ctx.fill();

    // --- Shorts ---
    gradRect(ctx, cx - 22, Y + 60, 44, 30, 7, 0x222222, 0x111111);
    // Shorts stripe
    ctx.fillStyle = hex(kitDark);
    roundRect(ctx, cx - 22, Y + 60, 44, 10, 5);
    ctx.fill();
    // Wrinkle lines
    ctx.strokeStyle = hexA(0x000000, 0.1);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 2, Y + 64); ctx.lineTo(cx - 6, Y + 88);
    ctx.moveTo(cx + 8, Y + 66); ctx.lineTo(cx + 12, Y + 86);
    ctx.stroke();

    // --- Jersey ---
    const jerseyGrad = ctx.createLinearGradient(0, Y + 18, 0, Y + 64);
    jerseyGrad.addColorStop(0, hex(lighten(kitColor, 1.15)));
    jerseyGrad.addColorStop(0.4, hex(kitColor));
    jerseyGrad.addColorStop(1, hex(darken(kitColor, 0.75)));
    ctx.fillStyle = jerseyGrad;
    roundRect(ctx, cx - 24, Y + 18, 48, 46, 8);
    ctx.fill();

    // Side panel
    const sidePanelGrad = ctx.createLinearGradient(cx - 24, 0, cx - 12, 0);
    sidePanelGrad.addColorStop(0, hex(darken(kitColor, 0.7)));
    sidePanelGrad.addColorStop(1, hexA(kitDark, 0.3));
    ctx.fillStyle = sidePanelGrad;
    roundRect(ctx, cx - 24, Y + 18, 12, 46, 6);
    ctx.fill();

    // Jersey highlight/sheen
    ctx.fillStyle = hexA(lighten(kitColor, 1.4), 0.15);
    roundRect(ctx, cx - 6, Y + 22, 16, 24, 4);
    ctx.fill();

    // Collar — V-neck
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx - 10, Y + 14, 20, 10, 4);
    ctx.fill();
    ctx.fillStyle = hex(kitDark);
    ctx.beginPath();
    ctx.moveTo(cx - 4, Y + 16);
    ctx.lineTo(cx + 4, Y + 16);
    ctx.lineTo(cx, Y + 24);
    ctx.closePath();
    ctx.fill();

    // Number circle
    ctx.fillStyle = hexA(0xffffff, 0.18);
    circle(ctx, cx, Y + 38, 11);
    ctx.fill();

    // Jersey wrinkle lines
    ctx.strokeStyle = hexA(darken(kitColor, 0.5), 0.12);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, Y + 28); ctx.lineTo(cx - 4, Y + 40);
    ctx.moveTo(cx + 6, Y + 24); ctx.lineTo(cx + 12, Y + 36);
    ctx.stroke();

    // Jersey outline
    ctx.strokeStyle = hexA(0x1a1a2e, 0.2);
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 24, Y + 18, 48, 46, 8);
    ctx.stroke();

    // --- Arms ---
    // Left sleeve
    const sleeveGrad = ctx.createLinearGradient(cx - 32, 0, cx - 18, 0);
    sleeveGrad.addColorStop(0, hex(darken(kitColor, 0.85)));
    sleeveGrad.addColorStop(1, hex(kitColor));
    ctx.fillStyle = sleeveGrad;
    roundRect(ctx, cx - 32, Y + 20, 14, 22, 5);
    ctx.fill();
    // Right sleeve
    const sleeveGrad2 = ctx.createLinearGradient(cx + 18, 0, cx + 32, 0);
    sleeveGrad2.addColorStop(0, hex(kitColor));
    sleeveGrad2.addColorStop(1, hex(darken(kitColor, 0.85)));
    ctx.fillStyle = sleeveGrad2;
    roundRect(ctx, cx + 18, Y + 20, 14, 22, 5);
    ctx.fill();

    // Skin arms
    const skinGrad = ctx.createLinearGradient(0, Y + 40, 0, Y + 56);
    skinGrad.addColorStop(0, hex(skinColor));
    skinGrad.addColorStop(1, hex(darken(skinColor, 0.88)));
    ctx.fillStyle = skinGrad;
    roundRect(ctx, cx - 30, Y + 40, 10, 16, 4);
    ctx.fill();
    roundRect(ctx, cx + 20, Y + 40, 10, 16, 4);
    ctx.fill();

    // Wristbands
    ctx.fillStyle = '#fff';
    roundRect(ctx, cx - 30, Y + 50, 10, 5, 2);
    ctx.fill();
    roundRect(ctx, cx + 20, Y + 50, 10, 5, 2);
    ctx.fill();

    // --- Neck ---
    ctx.fillStyle = hex(skinColor);
    roundRect(ctx, cx - 6, Y + 6, 12, 16, 3);
    ctx.fill();
    ctx.fillStyle = hexA(darken(skinColor, 0.8), 0.25);
    ctx.fillRect(cx - 6, Y + 12, 12, 6);

    // --- Head ---
    // Head shadow
    ctx.save();
    ctx.shadowColor = hexA(0x000000, 0.15);
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = hex(skinColor);
    circle(ctx, cx, Y - 16, 28);
    ctx.fill();
    ctx.restore();

    // Head highlight
    const headGrad = ctx.createRadialGradient(cx - 6, Y - 24, 4, cx, Y - 16, 28);
    headGrad.addColorStop(0, hexA(lighten(skinColor, 1.2), 0.35));
    headGrad.addColorStop(1, hexA(skinColor, 0));
    ctx.fillStyle = headGrad;
    circle(ctx, cx, Y - 16, 28);
    ctx.fill();

    // --- Ears ---
    ctx.fillStyle = hex(darken(skinColor, 0.92));
    circle(ctx, cx - 28, Y - 14, 7);
    ctx.fill();
    circle(ctx, cx + 28, Y - 14, 7);
    ctx.fill();
    ctx.fillStyle = hex(skinColor);
    circle(ctx, cx - 26, Y - 14, 5.5);
    ctx.fill();
    circle(ctx, cx + 26, Y - 14, 5.5);
    ctx.fill();

    // --- Hair ---
    ctx.fillStyle = hex(hairColor);
    ctx.beginPath();
    ctx.arc(cx, Y - 32, 24, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Hair volume
    ctx.fillStyle = hexA(darken(hairColor, 0.8), 0.4);
    ctx.beginPath();
    ctx.arc(cx + 4, Y - 34, 20, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Top highlight
    ctx.fillStyle = hexA(lighten(hairColor, 1.4), 0.25);
    ctx.beginPath();
    ctx.arc(cx - 4, Y - 38, 14, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Hair strands
    ctx.fillStyle = hexA(lighten(hairColor, 1.2), 0.15);
    for (let i = -3; i <= 3; i++) {
        roundRect(ctx, cx + i * 5 - 3, Y - 56 + Math.abs(i) * 2, 5, 14 - Math.abs(i), 2);
        ctx.fill();
    }
    // Sideburns
    ctx.fillStyle = hex(hairColor);
    roundRect(ctx, cx - 30, Y - 32, 8, 18, 3);
    ctx.fill();
    roundRect(ctx, cx + 22, Y - 32, 8, 16, 3);
    ctx.fill();

    // --- Chin shadow ---
    ctx.fillStyle = hexA(darken(skinColor, 0.75), 0.15);
    ctx.beginPath();
    ctx.arc(cx, Y + 4, 18, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();

    // --- Eyebrows ---
    ctx.fillStyle = hex(darken(hairColor, 0.65));
    roundRect(ctx, cx - 16, Y - 30, 12, 4, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, Y - 30, 12, 4, 2);
    ctx.fill();

    // --- Eyes ---
    // White
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx - 10, Y - 20, 7, 5.5);
    ctx.fill();
    ellipse(ctx, cx + 10, Y - 20, 7, 5.5);
    ctx.fill();
    // Iris
    const irisGrad = ctx.createRadialGradient(cx - 10, Y - 20, 1, cx - 10, Y - 20, 4.5);
    irisGrad.addColorStop(0, '#2a1a00');
    irisGrad.addColorStop(0.7, '#4a3520');
    irisGrad.addColorStop(1, '#3a2510');
    ctx.fillStyle = irisGrad;
    circle(ctx, cx - 10, Y - 20, 4.5);
    ctx.fill();
    circle(ctx, cx + 10, Y - 20, 4.5);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#111';
    circle(ctx, cx - 10, Y - 20, 2.2);
    ctx.fill();
    circle(ctx, cx + 10, Y - 20, 2.2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, cx - 8, Y - 22, 2);
    ctx.fill();
    circle(ctx, cx + 12, Y - 22, 2);
    ctx.fill();
    // Eyelids
    ctx.strokeStyle = hexA(darken(skinColor, 0.5), 0.4);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx - 10, Y - 20, 7, Math.PI + 0.3, -0.3, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10, Y - 20, 7, Math.PI + 0.3, -0.3, false);
    ctx.stroke();

    // --- Nose ---
    ctx.fillStyle = hexA(darken(skinColor, 0.85), 0.45);
    circle(ctx, cx, Y - 12, 3.5);
    ctx.fill();
    ctx.fillStyle = hexA(lighten(skinColor, 1.15), 0.25);
    circle(ctx, cx - 1, Y - 13.5, 1.5);
    ctx.fill();

    // --- Mouth ---
    ctx.strokeStyle = hexA(darken(skinColor, 0.55), 0.8);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, Y - 6, 7, 0.2, Math.PI - 0.2, false);
    ctx.stroke();

    ctx.restore();
}

// ========================
// OPERATOR (camera operator) — 144 x 212 canvas
// ========================
function drawOperator(ctx) {
    const cx = 56, Y = 76;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    // Drop shadow
    ctx.fillStyle = hexA(0x000000, 0.15);
    ellipse(ctx, cx, Y + 132, 30, 8);
    ctx.fill();

    // --- Shoes ---
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, cx - 22, Y + 116, 20, 14, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 116, 20, 14, 5);
    ctx.fill();

    // --- Legs (dark jeans) ---
    const jeanGrad = ctx.createLinearGradient(0, Y + 84, 0, Y + 118);
    jeanGrad.addColorStop(0, '#1e3a5e');
    jeanGrad.addColorStop(1, '#122840');
    ctx.fillStyle = jeanGrad;
    roundRect(ctx, cx - 20, Y + 84, 18, 36, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 84, 18, 36, 5);
    ctx.fill();
    // Jean seams
    ctx.strokeStyle = 'rgba(10,30,60,0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, Y + 86); ctx.lineTo(cx - 12, Y + 118);
    ctx.moveTo(cx + 10, Y + 86); ctx.lineTo(cx + 10, Y + 118);
    ctx.stroke();

    // --- Body (dark blue jacket) ---
    const jacketGrad = ctx.createLinearGradient(0, Y + 24, 0, Y + 88);
    jacketGrad.addColorStop(0, '#2a6090');
    jacketGrad.addColorStop(0.5, '#1c4a6e');
    jacketGrad.addColorStop(1, '#0f2e4a');
    ctx.fillStyle = jacketGrad;
    roundRect(ctx, cx - 28, Y + 24, 56, 64, 8);
    ctx.fill();

    // Jacket highlight
    ctx.fillStyle = hexA(0x3a80b0, 0.2);
    roundRect(ctx, cx - 26, Y + 26, 16, 58, 5);
    ctx.fill();

    // Zipper
    ctx.fillStyle = 'rgba(150,150,150,0.4)';
    ctx.fillRect(cx - 2, Y + 28, 4, 56);
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 0.8;
    for (let zy = Y + 32; zy < Y + 82; zy += 5) {
        ctx.beginPath();
        ctx.moveTo(cx - 2, zy); ctx.lineTo(cx + 2, zy);
        ctx.stroke();
    }

    // Pockets
    ctx.fillStyle = '#154060';
    roundRect(ctx, cx - 24, Y + 60, 18, 14, 3);
    ctx.fill();
    roundRect(ctx, cx + 6, Y + 60, 18, 14, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(26,53,80,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - 24, Y + 60, 18, 14, 3);
    ctx.stroke();
    roundRect(ctx, cx + 6, Y + 60, 18, 14, 3);
    ctx.stroke();

    // --- Press vest (over jacket) ---
    ctx.fillStyle = hexA(0xcccc00, 0.18);
    roundRect(ctx, cx - 26, Y + 26, 52, 56, 6);
    ctx.fill();
    // Reflective stripes
    ctx.fillStyle = hexA(0xdddd22, 0.28);
    ctx.fillRect(cx - 24, Y + 44, 48, 4);
    ctx.fillRect(cx - 24, Y + 68, 48, 4);
    // PRESS label area
    ctx.fillStyle = hexA(0xffffff, 0.12);
    roundRect(ctx, cx - 16, Y + 50, 32, 10, 3);
    ctx.fill();

    // Collar
    ctx.fillStyle = '#f0f0f0';
    roundRect(ctx, cx - 12, Y + 22, 24, 12, 5);
    ctx.fill();

    // --- Neck ---
    ctx.fillStyle = '#f5c97a';
    roundRect(ctx, cx - 6, Y + 10, 12, 16, 3);
    ctx.fill();

    // --- Head ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#f5c97a';
    circle(ctx, cx, Y - 8, 28);
    ctx.fill();
    ctx.restore();

    // Head highlight
    const headGrad = ctx.createRadialGradient(cx - 6, Y - 18, 4, cx, Y - 8, 28);
    headGrad.addColorStop(0, 'rgba(252,224,160,0.3)');
    headGrad.addColorStop(1, 'rgba(245,201,122,0)');
    ctx.fillStyle = headGrad;
    circle(ctx, cx, Y - 8, 28);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#e8b860';
    circle(ctx, cx - 28, Y - 6, 7);
    ctx.fill();
    circle(ctx, cx + 28, Y - 6, 7);
    ctx.fill();
    ctx.fillStyle = '#f5c97a';
    circle(ctx, cx - 26, Y - 6, 5.5);
    ctx.fill();
    circle(ctx, cx + 26, Y - 6, 5.5);
    ctx.fill();

    // --- Headphones ---
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, Y - 28, 28, Math.PI + 0.3, -0.3, false);
    ctx.stroke();
    // Ear cups
    const cupGrad = ctx.createLinearGradient(0, Y - 16, 0, Y + 4);
    cupGrad.addColorStop(0, '#444');
    cupGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = cupGrad;
    roundRect(ctx, cx - 36, Y - 16, 12, 20, 5);
    ctx.fill();
    roundRect(ctx, cx + 24, Y - 16, 12, 20, 5);
    ctx.fill();
    // Cup highlights
    ctx.fillStyle = 'rgba(100,100,100,0.3)';
    roundRect(ctx, cx - 34, Y - 14, 5, 12, 2);
    ctx.fill();
    roundRect(ctx, cx + 26, Y - 14, 5, 12, 2);
    ctx.fill();

    // --- Hair ---
    ctx.fillStyle = '#2a1a00';
    ctx.beginPath();
    ctx.arc(cx, Y - 26, 22, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(58,42,16,0.3)';
    ctx.beginPath();
    ctx.arc(cx - 4, Y - 32, 14, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // --- Eyes ---
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx - 10, Y - 12, 6, 5);
    ctx.fill();
    ellipse(ctx, cx + 10, Y - 12, 6, 5);
    ctx.fill();
    ctx.fillStyle = '#333';
    circle(ctx, cx - 10, Y - 12, 3.5);
    ctx.fill();
    circle(ctx, cx + 10, Y - 12, 3.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    circle(ctx, cx - 8, Y - 14, 1.5);
    ctx.fill();
    circle(ctx, cx + 12, Y - 14, 1.5);
    ctx.fill();
    // Eyebrows
    ctx.fillStyle = '#1a1000';
    roundRect(ctx, cx - 16, Y - 22, 12, 3.5, 1.5);
    ctx.fill();
    roundRect(ctx, cx + 4, Y - 22, 12, 3.5, 1.5);
    ctx.fill();

    // Nose
    ctx.fillStyle = 'rgba(224,176,96,0.45)';
    circle(ctx, cx, Y - 4, 3.5);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#c07a40';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, Y + 2, 7, 0.15, Math.PI - 0.15, false);
    ctx.stroke();

    // --- Arm holding camera ---
    ctx.fillStyle = '#1c4a6e';
    roundRect(ctx, cx + 20, Y + 24, 14, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#f5c97a';
    roundRect(ctx, cx + 20, Y + 36, 14, 26, 5);
    ctx.fill();

    // --- Camera body ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    const camGrad = ctx.createLinearGradient(cx + 24, Y + 4, cx + 24, Y + 40);
    camGrad.addColorStop(0, '#4a4a4a');
    camGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = camGrad;
    roundRect(ctx, cx + 24, Y + 4, 56, 36, 6);
    ctx.fill();
    ctx.restore();

    // Camera top detail
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, cx + 28, Y + 6, 48, 10, 3);
    ctx.fill();
    // Handle
    ctx.fillStyle = '#111';
    roundRect(ctx, cx + 32, Y - 12, 32, 18, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,60,60,0.4)';
    roundRect(ctx, cx + 36, Y - 10, 12, 8, 2);
    ctx.fill();
    // Viewfinder
    ctx.fillStyle = '#222';
    roundRect(ctx, cx + 64, Y + 8, 16, 14, 3);
    ctx.fill();
    const vfGrad = ctx.createLinearGradient(cx + 66, Y + 10, cx + 78, Y + 20);
    vfGrad.addColorStop(0, '#336699');
    vfGrad.addColorStop(1, '#1a3355');
    ctx.fillStyle = vfGrad;
    roundRect(ctx, cx + 66, Y + 10, 12, 10, 2);
    ctx.fill();
    // Eyepiece
    ctx.fillStyle = '#111';
    roundRect(ctx, cx + 78, Y + 8, 8, 14, 3);
    ctx.fill();
    // Red REC button
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff2200';
    circle(ctx, cx + 72, Y + 4, 4.5);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    circle(ctx, cx + 71, Y + 3, 1.5);
    ctx.fill();

    // Lens
    const lensGrad = ctx.createRadialGradient(cx + 28, Y + 24, 2, cx + 28, Y + 24, 15);
    lensGrad.addColorStop(0, '#b4dcff');
    lensGrad.addColorStop(0.3, '#6688ee');
    lensGrad.addColorStop(0.6, '#4466dd');
    lensGrad.addColorStop(0.85, '#1a1a88');
    lensGrad.addColorStop(1, '#0a0a44');
    ctx.fillStyle = lensGrad;
    circle(ctx, cx + 28, Y + 24, 15);
    ctx.fill();
    // Lens ring
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2.5;
    circle(ctx, cx + 28, Y + 24, 15);
    ctx.stroke();
    // Lens flare
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    circle(ctx, cx + 24, Y + 20, 5);
    ctx.fill();

    // Cable from camera
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 36, Y + 36);
    ctx.bezierCurveTo(cx + 40, Y + 52, cx + 32, Y + 70, cx + 24, Y + 104);
    ctx.stroke();
    // Cable highlight
    ctx.strokeStyle = 'rgba(80,80,80,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 35, Y + 36);
    ctx.bezierCurveTo(cx + 39, Y + 52, cx + 31, Y + 70, cx + 23, Y + 104);
    ctx.stroke();

    // Jacket outline
    ctx.strokeStyle = hexA(0x1a1a2e, 0.18);
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 28, Y + 24, 56, 64, 8);
    ctx.stroke();

    ctx.restore();
}

// ========================
// CORRESPONDENT (woman with microphone) — 104 x 204 canvas
// ========================
function drawCorrespondent(ctx) {
    const cx = 52, Y = 76;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    // Drop shadow
    ctx.fillStyle = hexA(0x000000, 0.15);
    ellipse(ctx, cx, Y + 124, 26, 8);
    ctx.fill();

    // --- Heels ---
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, cx - 18, Y + 112, 16, 12, 4);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 112, 16, 12, 4);
    ctx.fill();
    // Heel highlight
    const heelGrad = ctx.createLinearGradient(0, Y + 112, 0, Y + 124);
    heelGrad.addColorStop(0, '#dd5544');
    heelGrad.addColorStop(1, '#8B0000');
    ctx.fillStyle = heelGrad;
    roundRect(ctx, cx - 16, Y + 112, 6, 6, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, Y + 112, 6, 6, 2);
    ctx.fill();
    // Stiletto
    ctx.fillStyle = '#660000';
    ctx.fillRect(cx - 6, Y + 123, 3, 6);
    ctx.fillRect(cx + 10, Y + 123, 3, 6);

    // --- Skirt ---
    const skirtGrad = ctx.createLinearGradient(0, Y + 84, 0, Y + 114);
    skirtGrad.addColorStop(0, '#aa1515');
    skirtGrad.addColorStop(1, '#5a0808');
    ctx.fillStyle = skirtGrad;
    roundRect(ctx, cx - 18, Y + 84, 36, 30, 6);
    ctx.fill();
    // Skirt highlight
    ctx.fillStyle = hexA(0xcc2222, 0.2);
    roundRect(ctx, cx - 12, Y + 86, 12, 26, 4);
    ctx.fill();

    // --- Body (red blazer) ---
    const blazerGrad = ctx.createLinearGradient(0, Y + 24, 0, Y + 88);
    blazerGrad.addColorStop(0, '#dd4444');
    blazerGrad.addColorStop(0.5, '#c0392b');
    blazerGrad.addColorStop(1, '#7a1a10');
    ctx.fillStyle = blazerGrad;
    roundRect(ctx, cx - 26, Y + 24, 52, 64, 8);
    ctx.fill();

    // Lapels
    ctx.fillStyle = '#a03020';
    ctx.beginPath();
    ctx.moveTo(cx - 8, Y + 24); ctx.lineTo(cx, Y + 44); ctx.lineTo(cx - 20, Y + 44);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 8, Y + 24); ctx.lineTo(cx, Y + 44); ctx.lineTo(cx + 20, Y + 44);
    ctx.closePath();
    ctx.fill();

    // White blouse
    ctx.fillStyle = '#f8f8f8';
    roundRect(ctx, cx - 8, Y + 24, 16, 24, 4);
    ctx.fill();
    // Buttons
    ctx.fillStyle = '#ccc';
    circle(ctx, cx, Y + 36, 2.5);
    ctx.fill();
    circle(ctx, cx, Y + 44, 2.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    circle(ctx, cx - 0.8, Y + 35, 0.8);
    ctx.fill();

    // Blazer highlight
    ctx.fillStyle = hexA(0xee5555, 0.18);
    roundRect(ctx, cx + 8, Y + 28, 12, 36, 4);
    ctx.fill();

    // --- Press badge / lanyard ---
    ctx.strokeStyle = hexA(0xe74c3c, 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, Y + 20);
    ctx.bezierCurveTo(cx - 6, Y + 32, cx - 8, Y + 42, cx - 8, Y + 52);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    roundRect(ctx, cx - 14, Y + 52, 14, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx - 12, Y + 54, 10, 6);
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - 12, Y + 62, 10, 4);

    // --- Neck ---
    ctx.fillStyle = '#f5c090';
    roundRect(ctx, cx - 6, Y + 10, 12, 16, 3);
    ctx.fill();

    // --- Head ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#f5c090';
    circle(ctx, cx, Y - 8, 26);
    ctx.fill();
    ctx.restore();

    // Head highlight
    const corrHeadGrad = ctx.createRadialGradient(cx - 6, Y - 18, 4, cx, Y - 8, 26);
    corrHeadGrad.addColorStop(0, 'rgba(252,216,176,0.3)');
    corrHeadGrad.addColorStop(1, 'rgba(245,192,144,0)');
    ctx.fillStyle = corrHeadGrad;
    circle(ctx, cx, Y - 8, 26);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#e8a870';
    circle(ctx, cx - 26, Y - 6, 6);
    ctx.fill();
    circle(ctx, cx + 26, Y - 6, 6);
    ctx.fill();
    ctx.fillStyle = '#f5c090';
    circle(ctx, cx - 24, Y - 6, 4.5);
    ctx.fill();
    circle(ctx, cx + 24, Y - 6, 4.5);
    ctx.fill();
    // Earrings
    ctx.save();
    ctx.shadowColor = 'rgba(255,215,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffd700';
    circle(ctx, cx - 26, Y, 3.5);
    ctx.fill();
    circle(ctx, cx + 26, Y, 3.5);
    ctx.fill();
    ctx.restore();

    // --- Long hair ---
    ctx.fillStyle = '#7B3F20';
    ctx.beginPath();
    ctx.arc(cx, Y - 20, 25, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Hair volume
    ctx.fillStyle = 'rgba(107,47,16,0.4)';
    ctx.beginPath();
    ctx.arc(cx + 4, Y - 24, 20, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Hair highlight
    ctx.fillStyle = 'rgba(155,95,64,0.3)';
    ctx.beginPath();
    ctx.arc(cx - 4, Y - 28, 14, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Hair sides (long flowing)
    const hairSideGrad = ctx.createLinearGradient(0, Y - 20, 0, Y + 44);
    hairSideGrad.addColorStop(0, '#7B3F20');
    hairSideGrad.addColorStop(1, '#5B2F10');
    ctx.fillStyle = hairSideGrad;
    roundRect(ctx, cx - 30, Y - 20, 10, 60, 5);
    ctx.fill();
    roundRect(ctx, cx + 20, Y - 20, 10, 52, 5);
    ctx.fill();
    // Hair curl at ends
    ctx.fillStyle = '#7B3F20';
    circle(ctx, cx - 26, Y + 44, 7);
    ctx.fill();
    circle(ctx, cx + 26, Y + 36, 6);
    ctx.fill();
    // Curl highlights
    ctx.fillStyle = 'rgba(155,95,64,0.25)';
    circle(ctx, cx - 28, Y + 42, 3.5);
    ctx.fill();
    circle(ctx, cx + 24, Y + 34, 3);
    ctx.fill();

    // --- Rosy cheeks ---
    ctx.fillStyle = 'rgba(255,150,150,0.25)';
    circle(ctx, cx - 14, Y - 2, 6);
    ctx.fill();
    circle(ctx, cx + 14, Y - 2, 6);
    ctx.fill();

    // --- Eyes ---
    ctx.fillStyle = '#fff';
    ellipse(ctx, cx - 10, Y - 12, 7, 5.5);
    ctx.fill();
    ellipse(ctx, cx + 10, Y - 12, 7, 5.5);
    ctx.fill();
    // Iris (green)
    const corrIris = ctx.createRadialGradient(cx - 10, Y - 12, 1, cx - 10, Y - 12, 4);
    corrIris.addColorStop(0, '#1a5030');
    corrIris.addColorStop(1, '#2a6040');
    ctx.fillStyle = corrIris;
    circle(ctx, cx - 10, Y - 12, 4);
    ctx.fill();
    circle(ctx, cx + 10, Y - 12, 4);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#111';
    circle(ctx, cx - 10, Y - 12, 2);
    ctx.fill();
    circle(ctx, cx + 10, Y - 12, 2);
    ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, cx - 8, Y - 14, 2);
    ctx.fill();
    circle(ctx, cx + 12, Y - 14, 2);
    ctx.fill();
    // Eyelashes
    ctx.strokeStyle = '#3a2010';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, Y - 16); ctx.lineTo(cx - 16, Y - 20);
    ctx.moveTo(cx - 16, Y - 18); ctx.lineTo(cx - 15, Y - 22);
    ctx.moveTo(cx + 18, Y - 16); ctx.lineTo(cx + 16, Y - 20);
    ctx.moveTo(cx + 16, Y - 18); ctx.lineTo(cx + 15, Y - 22);
    ctx.stroke();
    // Eyebrows (arched)
    ctx.strokeStyle = '#5a3018';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx - 10, Y - 28, 9, 0.3, Math.PI - 0.3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10, Y - 28, 9, 0.3, Math.PI - 0.3, true);
    ctx.stroke();

    // Nose
    ctx.fillStyle = 'rgba(224,168,120,0.45)';
    circle(ctx, cx, Y - 4, 2.5);
    ctx.fill();

    // --- Lipstick mouth ---
    const lipGrad = ctx.createRadialGradient(cx, Y + 2, 1, cx, Y + 2, 7);
    lipGrad.addColorStop(0, '#ff4466');
    lipGrad.addColorStop(1, '#cc2244');
    ctx.fillStyle = lipGrad;
    ctx.beginPath();
    ctx.arc(cx, Y + 2, 7, 0.1, Math.PI - 0.1, false);
    ctx.closePath();
    ctx.fill();
    // Lip gloss
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    circle(ctx, cx - 3, Y + 1, 2);
    ctx.fill();

    // --- Arm with mic ---
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, cx - 34, Y + 24, 14, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#f5c090';
    roundRect(ctx, cx - 32, Y + 40, 12, 28, 5);
    ctx.fill();

    // --- Microphone ---
    ctx.fillStyle = '#111';
    roundRect(ctx, cx - 38, Y + 56, 16, 40, 5);
    ctx.fill();
    // Gold stripes
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cx - 38, Y + 68, 16, 5);
    ctx.fillRect(cx - 38, Y + 80, 16, 3);
    // Foam ball
    const foamGrad = ctx.createRadialGradient(cx - 30, Y + 44, 3, cx - 30, Y + 44, 17);
    foamGrad.addColorStop(0, '#ff5555');
    foamGrad.addColorStop(0.6, '#cc0000');
    foamGrad.addColorStop(1, '#880000');
    ctx.fillStyle = foamGrad;
    circle(ctx, cx - 30, Y + 44, 17);
    ctx.fill();
    // Foam texture
    ctx.fillStyle = 'rgba(255,80,80,0.35)';
    circle(ctx, cx - 36, Y + 40, 4);
    ctx.fill();
    circle(ctx, cx - 26, Y + 36, 5);
    ctx.fill();
    circle(ctx, cx - 22, Y + 48, 4);
    ctx.fill();
    // Foam highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    circle(ctx, cx - 34, Y + 38, 7);
    ctx.fill();

    // Blazer outline
    ctx.strokeStyle = hexA(0x1a1a2e, 0.15);
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 26, Y + 24, 52, 64, 8);
    ctx.stroke();

    ctx.restore();
}

// ========================
// ASSISTANT (techie with TVU backpack) — 116 x 200 canvas
// ========================
function drawAssistant(ctx) {
    const cx = 56, Y = 72;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    // Drop shadow
    ctx.fillStyle = hexA(0x000000, 0.15);
    ellipse(ctx, cx, Y + 132, 28, 8);
    ctx.fill();

    // --- Shoes ---
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, cx - 20, Y + 116, 18, 14, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 116, 18, 14, 5);
    ctx.fill();

    // --- Legs (dark cargo pants) ---
    const cargoGrad = ctx.createLinearGradient(0, Y + 84, 0, Y + 118);
    cargoGrad.addColorStop(0, '#363636');
    cargoGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = cargoGrad;
    roundRect(ctx, cx - 18, Y + 84, 16, 36, 5);
    ctx.fill();
    roundRect(ctx, cx + 2, Y + 84, 16, 36, 5);
    ctx.fill();
    // Cargo pockets
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, cx - 16, Y + 98, 12, 10, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, Y + 98, 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,30,0.4)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, cx - 16, Y + 98, 12, 10, 2);
    ctx.stroke();
    roundRect(ctx, cx + 4, Y + 98, 12, 10, 2);
    ctx.stroke();

    // --- Body (dark tech vest) ---
    const vestGrad = ctx.createLinearGradient(0, Y + 24, 0, Y + 88);
    vestGrad.addColorStop(0, '#4a4a4a');
    vestGrad.addColorStop(0.5, '#383838');
    vestGrad.addColorStop(1, '#222222');
    ctx.fillStyle = vestGrad;
    roundRect(ctx, cx - 24, Y + 24, 48, 64, 8);
    ctx.fill();

    // Vest highlight
    ctx.fillStyle = 'rgba(80,80,80,0.2)';
    roundRect(ctx, cx - 20, Y + 26, 12, 56, 4);
    ctx.fill();

    // Zipper
    ctx.fillStyle = 'rgba(120,120,120,0.4)';
    ctx.fillRect(cx - 2, Y + 28, 4, 56);
    ctx.strokeStyle = 'rgba(170,170,170,0.2)';
    ctx.lineWidth = 0.8;
    for (let zy = Y + 32; zy < Y + 82; zy += 5) {
        ctx.beginPath();
        ctx.moveTo(cx - 2, zy); ctx.lineTo(cx + 2, zy);
        ctx.stroke();
    }

    // Chest pocket + pen
    ctx.fillStyle = '#444';
    roundRect(ctx, cx + 6, Y + 30, 14, 12, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,50,50,0.4)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, cx + 6, Y + 30, 14, 12, 3);
    ctx.stroke();
    ctx.fillStyle = '#2244cc';
    ctx.fillRect(cx + 16, Y + 26, 3, 12);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(cx + 16, Y + 26, 3, 3);

    // --- Tool belt ---
    const beltGrad = ctx.createLinearGradient(0, Y + 76, 0, Y + 86);
    beltGrad.addColorStop(0, '#6a5030');
    beltGrad.addColorStop(1, '#4a3518');
    ctx.fillStyle = beltGrad;
    roundRect(ctx, cx - 24, Y + 76, 48, 10, 3);
    ctx.fill();
    // Buckle
    ctx.fillStyle = '#bbb';
    roundRect(ctx, cx - 6, Y + 76, 12, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.fillRect(cx, Y + 78, 2, 6);

    // --- Walkie-talkie ---
    ctx.fillStyle = '#111';
    roundRect(ctx, cx - 22, Y + 72, 10, 20, 3);
    ctx.fill();
    // Antenna
    ctx.fillStyle = '#444';
    ctx.fillRect(cx - 20, Y + 64, 4, 10);
    // Screen
    ctx.fillStyle = 'rgba(34,85,34,0.5)';
    ctx.fillRect(cx - 20, Y + 74, 6, 6);
    // LEDs
    ctx.fillStyle = '#0f0';
    circle(ctx, cx - 17, Y + 84, 1.5);
    ctx.fill();

    // --- Neck ---
    ctx.fillStyle = '#d4956a';
    roundRect(ctx, cx - 6, Y + 10, 12, 16, 3);
    ctx.fill();

    // --- Head ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#d4956a';
    circle(ctx, cx, Y - 4, 24);
    ctx.fill();
    ctx.restore();

    // Head highlight
    const asstHeadGrad = ctx.createRadialGradient(cx - 4, Y - 12, 4, cx, Y - 4, 24);
    asstHeadGrad.addColorStop(0, 'rgba(224,168,122,0.3)');
    asstHeadGrad.addColorStop(1, 'rgba(212,149,106,0)');
    ctx.fillStyle = asstHeadGrad;
    circle(ctx, cx, Y - 4, 24);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#c08050';
    circle(ctx, cx - 24, Y - 2, 6);
    ctx.fill();
    circle(ctx, cx + 24, Y - 2, 6);
    ctx.fill();
    ctx.fillStyle = '#d4956a';
    circle(ctx, cx - 22, Y - 2, 4.5);
    ctx.fill();
    circle(ctx, cx + 22, Y - 2, 4.5);
    ctx.fill();

    // --- Hair peeking under cap ---
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(cx - 24, Y - 12, 48, 8);

    // --- Cap ---
    const capGrad = ctx.createLinearGradient(0, Y - 36, 0, Y - 16);
    capGrad.addColorStop(0, '#333');
    capGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(cx, Y - 20, 25, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    // Cap brim
    ctx.fillStyle = '#111';
    roundRect(ctx, cx - 32, Y - 20, 64, 10, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,60,60,0.2)';
    ctx.fillRect(cx - 28, Y - 20, 56, 2);
    // Cap logo
    ctx.fillStyle = '#e74c3c';
    roundRect(ctx, cx - 10, Y - 36, 20, 10, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(cx - 6, Y - 34, 4, 6);
    ctx.fillRect(cx + 2, Y - 34, 4, 6);

    // --- Headset ---
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, Y - 16, 27, Math.PI * 0.6, Math.PI * 0.85, false);
    ctx.stroke();
    // Mic boom
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 26, Y - 4);
    ctx.lineTo(cx - 32, Y + 8);
    ctx.stroke();
    ctx.fillStyle = '#333';
    circle(ctx, cx - 32, Y + 10, 5);
    ctx.fill();
    ctx.fillStyle = '#111';
    circle(ctx, cx - 32, Y + 10, 3.5);
    ctx.fill();

    // --- Sunglasses ---
    ctx.fillStyle = '#111';
    roundRect(ctx, cx - 16, Y - 14, 16, 12, 3);
    ctx.fill();
    roundRect(ctx, cx, Y - 14, 16, 12, 3);
    ctx.fill();
    // Bridge
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - 2, Y - 12, 4, 4);
    // Temple arms
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 16, Y - 10); ctx.lineTo(cx - 24, Y - 6);
    ctx.moveTo(cx + 16, Y - 10); ctx.lineTo(cx + 24, Y - 6);
    ctx.stroke();
    // Lens tint
    const lensGrad2 = ctx.createLinearGradient(0, Y - 14, 0, Y - 2);
    lensGrad2.addColorStop(0, 'rgba(30,30,80,0.6)');
    lensGrad2.addColorStop(1, 'rgba(20,20,60,0.8)');
    ctx.fillStyle = lensGrad2;
    roundRect(ctx, cx - 14, Y - 12, 12, 8, 2);
    ctx.fill();
    roundRect(ctx, cx + 2, Y - 12, 12, 8, 2);
    ctx.fill();
    // Lens reflection
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, cx - 12, Y - 12, 6, 4, 2);
    ctx.fill();
    roundRect(ctx, cx + 4, Y - 12, 6, 4, 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = 'rgba(170,100,60,0.35)';
    circle(ctx, cx, Y + 2, 2.5);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#b07040';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, Y + 6, 7, 0.15, Math.PI - 0.15, false);
    ctx.stroke();

    // --- TVU backpack (left side) ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = 3;
    const bpGrad = ctx.createLinearGradient(cx - 72, Y + 4, cx - 28, Y + 4);
    bpGrad.addColorStop(0, '#1a1a1a');
    bpGrad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = bpGrad;
    roundRect(ctx, cx - 72, Y + 4, 44, 64, 8);
    ctx.fill();
    ctx.restore();

    // Metal frame
    ctx.strokeStyle = 'rgba(80,80,80,0.4)';
    ctx.lineWidth = 2.5;
    roundRect(ctx, cx - 72, Y + 4, 44, 64, 8);
    ctx.stroke();

    // Screen
    ctx.fillStyle = '#001800';
    roundRect(ctx, cx - 68, Y + 10, 28, 24, 3);
    ctx.fill();
    // Screen glow
    const screenGlow = ctx.createRadialGradient(cx - 54, Y + 22, 2, cx - 54, Y + 22, 14);
    screenGlow.addColorStop(0, 'rgba(0,60,0,0.3)');
    screenGlow.addColorStop(1, 'rgba(0,30,0,0)');
    ctx.fillStyle = screenGlow;
    roundRect(ctx, cx - 66, Y + 12, 24, 20, 2);
    ctx.fill();

    // LIVE badge
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#dd1100';
    roundRect(ctx, cx - 68, Y + 10, 14, 10, 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,80,80,0.5)';
    circle(ctx, cx - 66, Y + 14, 2);
    ctx.fill();

    // Signal bars
    ctx.fillStyle = '#00cc44';
    ctx.fillRect(cx - 48, Y + 18, 4, 16);
    ctx.fillStyle = '#00aa33';
    ctx.fillRect(cx - 42, Y + 22, 4, 12);
    ctx.fillStyle = '#008822';
    ctx.fillRect(cx - 36, Y + 26, 4, 8);

    // Antenna
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 56, Y + 4);
    ctx.lineTo(cx - 56, Y - 16);
    ctx.stroke();
    // Antenna light
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff0000';
    circle(ctx, cx - 56, Y - 18, 4.5);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,100,100,0.4)';
    circle(ctx, cx - 58, Y - 20, 2);
    ctx.fill();

    // Power button
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00cc44';
    circle(ctx, cx - 56, Y + 52, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(0,255,80,0.25)';
    circle(ctx, cx - 58, Y + 50, 3.5);
    ctx.fill();

    // LEDs
    ctx.fillStyle = '#00aaff';
    circle(ctx, cx - 68, Y + 44, 2.5);
    ctx.fill();
    ctx.fillStyle = '#ffaa00';
    circle(ctx, cx - 68, Y + 52, 2.5);
    ctx.fill();
    ctx.fillStyle = '#00ff00';
    circle(ctx, cx - 68, Y + 60, 2.5);
    ctx.fill();

    // Cable from backpack
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 50, Y + 68);
    ctx.bezierCurveTo(cx - 40, Y + 78, cx - 30, Y + 82, cx - 24, Y + 84);
    ctx.stroke();

    // Body outline
    ctx.strokeStyle = hexA(0x1a1a2e, 0.15);
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 24, Y + 24, 48, 64, 8);
    ctx.stroke();

    ctx.restore();
}

// ========================
// Create all textures via CanvasTexture
// ========================
export function createTextures(scene) {
    if (scene.textures.exists('operator')) return;

    // --- Operator (144x212) ---
    const opTex = scene.textures.createCanvas('operator', 144, 212);
    drawOperator(opTex.getContext());
    opTex.refresh();

    // --- Correspondent (104x204) ---
    const corrTex = scene.textures.createCanvas('correspondent', 104, 204);
    drawCorrespondent(corrTex.getContext());
    corrTex.refresh();

    // --- Assistant (116x200) ---
    const asstTex = scene.textures.createCanvas('assistant', 116, 200);
    drawAssistant(asstTex.getContext());
    asstTex.refresh();

    // --- Football players (96x220 each, 24 variants) ---
    const combo = TEAM_COMBOS[0];
    for (let i = 0; i < 24; i++) {
        const team = i < 12 ? 'a' : 'b';
        const c = combo[team];
        const skin = SKINS[(i * 5 + 1) % SKINS.length];
        const hair = HAIRS[(i * 7 + 3) % HAIRS.length];
        const tex = scene.textures.createCanvas(`player_${i}`, 96, 220);
        drawPlayer(tex.getContext(), c.k, c.kd, c.s, skin, hair);
        tex.refresh();
    }

    // --- Smoke puff (24x24) ---
    const smokeTex = scene.textures.createCanvas('smoke', 24, 24);
    const sCtx = smokeTex.getContext();
    const smokeGrad = sCtx.createRadialGradient(12, 12, 2, 12, 12, 12);
    smokeGrad.addColorStop(0, 'rgba(210,210,195,0.6)');
    smokeGrad.addColorStop(1, 'rgba(210,210,195,0)');
    sCtx.fillStyle = smokeGrad;
    sCtx.beginPath();
    sCtx.arc(12, 12, 12, 0, Math.PI * 2);
    sCtx.fill();
    smokeTex.refresh();
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
