/**
 * Draw a top-down football field with dark frame and crowd
 */
export function drawField(scene, w, h, topOffset, bottomOffset) {
    const g = scene.add.graphics();

    const top = topOffset || 0;
    const bottom = bottomOffset || 0;
    const fieldTop = top;
    const fieldBottom = h - bottom;
    const fieldH = fieldBottom - fieldTop;

    // Dark background (crowd area)
    g.fillStyle(0x16213e);
    g.fillRect(0, 0, w, h);

    // Crowd dots / lights along the border
    const crowdColors = [0xff6644, 0x44aaff, 0xffcc00, 0x66ff66, 0xff66aa, 0xffffff];
    for (let i = 0; i < 120; i++) {
        const side = Math.floor(Math.random() * 4);
        let cx, cy;
        if (side === 0) { // top
            cx = Math.random() * w;
            cy = top - 8 + Math.random() * 6;
        } else if (side === 1) { // bottom
            cx = Math.random() * w;
            cy = fieldBottom + 2 + Math.random() * (bottom - 4);
        } else if (side === 2) { // left
            cx = Math.random() * 16;
            cy = top + Math.random() * fieldH;
        } else { // right
            cx = w - Math.random() * 16;
            cy = top + Math.random() * fieldH;
        }
        const color = crowdColors[Math.floor(Math.random() * crowdColors.length)];
        g.fillStyle(color, 0.3 + Math.random() * 0.5);
        g.fillCircle(cx, cy, 1.5 + Math.random() * 2);
    }

    // Field margins inside the play area
    const margin = 20;
    const fx = margin;
    const fy = fieldTop + margin;
    const fw = w - margin * 2;
    const fh = fieldH - margin * 2;

    // Grass base
    g.fillStyle(0x2d8c3c);
    g.fillRect(0, fieldTop, w, fieldH);

    // Grass stripes
    const stripeCount = 10;
    const stripeH = fieldH / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
            g.fillStyle(0x339944, 0.15);
            g.fillRect(0, fieldTop + i * stripeH, w, stripeH);
        }
    }

    g.lineStyle(2, 0xffffff, 0.8);

    // Outer boundary
    g.strokeRect(fx, fy, fw, fh);

    // Center line (horizontal)
    const centerY = fy + fh / 2;
    g.lineBetween(fx, centerY, fx + fw, centerY);

    // Center circle
    g.strokeCircle(w / 2, centerY, 40);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(w / 2, centerY, 3);

    // Penalty areas (top and bottom for vertical field)
    const paW = 200;
    const paH = 80;
    const paX = w / 2 - paW / 2;
    // Top
    g.strokeRect(paX, fy, paW, paH);
    // Bottom
    g.strokeRect(paX, fy + fh - paH, paW, paH);

    // Goal areas
    const gaW = 100;
    const gaH = 30;
    const gaX = w / 2 - gaW / 2;
    g.strokeRect(gaX, fy, gaW, gaH);
    g.strokeRect(gaX, fy + fh - gaH, gaW, gaH);

    // Goals (nets)
    const goalW = 60;
    const goalH = 10;
    const goalX = w / 2 - goalW / 2;
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(goalX, fy - goalH, goalW, goalH);
    g.fillRect(goalX, fy + fh, goalW, goalH);
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeRect(goalX, fy - goalH, goalW, goalH);
    g.strokeRect(goalX, fy + fh, goalW, goalH);

    // Penalty dots
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(w / 2, fy + 60, 3);
    g.fillCircle(w / 2, fy + fh - 60, 3);

    // Corner arcs
    g.lineStyle(2, 0xffffff, 0.8);
    const cr = 10;
    g.beginPath(); g.arc(fx, fy, cr, 0, Math.PI / 2); g.strokePath();
    g.beginPath(); g.arc(fx + fw, fy, cr, Math.PI / 2, Math.PI); g.strokePath();
    g.beginPath(); g.arc(fx, fy + fh, cr, -Math.PI / 2, 0); g.strokePath();
    g.beginPath(); g.arc(fx + fw, fy + fh, cr, Math.PI, Math.PI * 1.5); g.strokePath();

    g.setDepth(-1);
    return g;
}
