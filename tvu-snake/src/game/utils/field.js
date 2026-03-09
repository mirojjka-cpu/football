/**
 * Draw a top-down football field on the scene
 */
export function drawField(scene, w, h) {
    const g = scene.add.graphics();

    // Grass background
    g.fillStyle(0x2d8c3c);
    g.fillRect(0, 0, w, h);

    // Grass stripes (alternating shades)
    const stripeW = w / 12;
    for (let i = 0; i < 12; i++) {
        if (i % 2 === 0) {
            g.fillStyle(0x339944, 0.15);
            g.fillRect(i * stripeW, 0, stripeW, h);
        }
    }

    const margin = 40;
    const fw = w - margin * 2;
    const fh = h - margin * 2;
    const fx = margin;
    const fy = margin;

    g.lineStyle(2, 0xffffff, 0.7);

    // Outer boundary
    g.strokeRect(fx, fy, fw, fh);

    // Center line
    g.lineBetween(w / 2, fy, w / 2, fy + fh);

    // Center circle
    g.strokeCircle(w / 2, h / 2, 60);

    // Center dot
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(w / 2, h / 2, 4);

    // Penalty areas
    const paW = 120;
    const paH = 240;
    const paY = h / 2 - paH / 2;
    // Left
    g.strokeRect(fx, paY, paW, paH);
    // Right
    g.strokeRect(fx + fw - paW, paY, paW, paH);

    // Goal areas
    const gaW = 44;
    const gaH = 120;
    const gaY = h / 2 - gaH / 2;
    g.strokeRect(fx, gaY, gaW, gaH);
    g.strokeRect(fx + fw - gaW, gaY, gaW, gaH);

    // Penalty dots
    g.fillCircle(fx + 90, h / 2, 3);
    g.fillCircle(fx + fw - 90, h / 2, 3);

    // Corner arcs
    const cornerR = 16;
    g.beginPath();
    g.arc(fx, fy, cornerR, 0, Math.PI / 2);
    g.strokePath();
    g.beginPath();
    g.arc(fx + fw, fy, cornerR, Math.PI / 2, Math.PI);
    g.strokePath();
    g.beginPath();
    g.arc(fx, fy + fh, cornerR, -Math.PI / 2, 0);
    g.strokePath();
    g.beginPath();
    g.arc(fx + fw, fy + fh, cornerR, Math.PI, Math.PI * 1.5);
    g.strokePath();

    g.setDepth(-1);
    return g;
}
