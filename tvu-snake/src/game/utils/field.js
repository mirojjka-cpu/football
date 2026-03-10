/**
 * Premium 2D football field and crowd rendering (2026 edition)
 * Uses only Phaser Graphics primitives.
 */

/* ---------- seeded pseudo-random for deterministic textures ---------- */
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ================================================================== */
/*  drawField                                                         */
/* ================================================================== */
export function drawField(scene, w, h, topOffset, bottomOffset, crowdTop, crowdBottom) {
    const g = scene.add.graphics();

    const top = topOffset || 0;
    const bottom = bottomOffset || 0;
    const cTop = crowdTop || 0;
    const cBot = crowdBottom || 0;

    const fieldTop = top + cTop;
    const fieldBottom = h - bottom - cBot;
    const fieldH = fieldBottom - fieldTop;

    /* ---- dark background behind everything ---- */
    g.fillStyle(0x0e1726);
    g.fillRect(0, 0, w, h);

    /* ---- field margins ---- */
    const margin = 16;
    const fx = margin;
    const fy = fieldTop + margin;
    const fw = w - margin * 2;
    const fh = fieldH - margin * 2;
    const cx = fx + fw / 2;
    const cy = fy + fh / 2;

    /* ============================================================= */
    /*  1. RICH GRASS — multi-layer gradient base                    */
    /* ============================================================= */

    // Base green fill
    g.fillStyle(0x2a8a38);
    g.fillRect(0, fieldTop, w, fieldH);

    // Warm-green underlay gradient (top = slightly yellow-green, bottom = deeper green)
    const gradSteps = 32;
    const stepH = fieldH / gradSteps;
    for (let i = 0; i < gradSteps; i++) {
        const t = i / (gradSteps - 1);
        // interpolate 0x34993f -> 0x1e7530
        const r = Math.round(0x34 + (0x1e - 0x34) * t);
        const gv = Math.round(0x99 + (0x75 - 0x99) * t);
        const b = Math.round(0x3f + (0x30 - 0x3f) * t);
        g.fillStyle((r << 16) | (gv << 8) | b, 0.45);
        g.fillRect(0, fieldTop + i * stepH, w, stepH + 1);
    }

    // Alternating mow stripes (realistic lawn pattern)
    const stripeCount = 14;
    const stripeH = fh / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        const dark = i % 2 === 0;
        g.fillStyle(dark ? 0x1b6b28 : 0x3aad4a, 0.18);
        g.fillRect(fx, fy + i * stripeH, fw, stripeH);
        // Subtle second pass — slightly different tint for richness
        g.fillStyle(dark ? 0x145020 : 0x44bb55, 0.06);
        g.fillRect(fx, fy + i * stripeH, fw, stripeH);
    }

    /* ============================================================= */
    /*  2. GRASS TEXTURE — tiny dots simulating grass blades         */
    /* ============================================================= */
    const rng = mulberry32(42);
    const dotCount = 2400;
    for (let i = 0; i < dotCount; i++) {
        const dx = fx + rng() * fw;
        const dy = fy + rng() * fh;
        const bright = rng() > 0.5;
        g.fillStyle(bright ? 0x4acc5e : 0x186828, 0.12 + rng() * 0.14);
        const sz = 1 + rng() * 1.5;
        g.fillRect(dx, dy, sz, sz);
    }
    // A few lighter clumps
    for (let i = 0; i < 180; i++) {
        const dx = fx + rng() * fw;
        const dy = fy + rng() * fh;
        g.fillStyle(0x6ddd7a, 0.08 + rng() * 0.07);
        g.fillRect(dx, dy, 2, 2);
    }

    /* ============================================================= */
    /*  6. SHADOW / DEPTH — inner shadow at field edges              */
    /* ============================================================= */
    const shadowDepth = 18;
    // Top edge shadow
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.14 * (1 - i / shadowDepth);
        g.fillStyle(0x000000, a);
        g.fillRect(fx, fy + i, fw, 1);
    }
    // Bottom edge shadow
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.14 * (1 - i / shadowDepth);
        g.fillStyle(0x000000, a);
        g.fillRect(fx, fy + fh - i, fw, 1);
    }
    // Left edge shadow
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.10 * (1 - i / shadowDepth);
        g.fillStyle(0x000000, a);
        g.fillRect(fx + i, fy, 1, fh);
    }
    // Right edge shadow
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.10 * (1 - i / shadowDepth);
        g.fillStyle(0x000000, a);
        g.fillRect(fx + fw - i, fy, 1, fh);
    }

    /* ============================================================= */
    /*  Dark surround outside the pitch (margins between edge and    */
    /*  pitch lines) to make the grass pop                           */
    /* ============================================================= */
    g.fillStyle(0x1a6e2c, 0.55);
    // top strip
    g.fillRect(0, fieldTop, w, margin);
    // bottom strip
    g.fillRect(0, fieldBottom - margin, w, margin);
    // left strip
    g.fillRect(0, fieldTop + margin, margin, fieldH - margin * 2);
    // right strip
    g.fillRect(w - margin, fieldTop + margin, margin, fieldH - margin * 2);

    /* ============================================================= */
    /*  3. FIELD LINES — glow pass + sharp pass                      */
    /* ============================================================= */

    // Helper: draw a glow line (wider, low alpha) then a sharp line on top
    function glowStrokeRect(gfx, rx, ry, rw, rh) {
        // Glow
        gfx.lineStyle(6, 0xffffff, 0.09);
        gfx.strokeRect(rx, ry, rw, rh);
        // Sharp
        gfx.lineStyle(2.5, 0xffffff, 0.92);
        gfx.strokeRect(rx, ry, rw, rh);
    }

    function glowLine(gfx, x1, y1, x2, y2) {
        gfx.lineStyle(6, 0xffffff, 0.09);
        gfx.lineBetween(x1, y1, x2, y2);
        gfx.lineStyle(2.5, 0xffffff, 0.92);
        gfx.lineBetween(x1, y1, x2, y2);
    }

    function glowCircle(gfx, ccx, ccy, r) {
        gfx.lineStyle(6, 0xffffff, 0.09);
        gfx.strokeCircle(ccx, ccy, r);
        gfx.lineStyle(2.5, 0xffffff, 0.92);
        gfx.strokeCircle(ccx, ccy, r);
    }

    function glowArc(gfx, ax, ay, r, startAngle, endAngle) {
        // Glow
        gfx.lineStyle(6, 0xffffff, 0.09);
        gfx.beginPath(); gfx.arc(ax, ay, r, startAngle, endAngle); gfx.strokePath();
        // Sharp
        gfx.lineStyle(2.5, 0xffffff, 0.92);
        gfx.beginPath(); gfx.arc(ax, ay, r, startAngle, endAngle); gfx.strokePath();
    }

    // Outer boundary
    glowStrokeRect(g, fx, fy, fw, fh);

    // Center line
    glowLine(g, fx, cy, fx + fw, cy);

    // Center circle
    glowCircle(g, cx, cy, 42);

    // Center dot (glow + solid)
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(cx, cy, 7);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx, cy, 3.5);

    /* ---- Penalty areas ---- */
    const paW = 200;
    const paH = 82;
    const paX = cx - paW / 2;
    glowStrokeRect(g, paX, fy, paW, paH);
    glowStrokeRect(g, paX, fy + fh - paH, paW, paH);

    /* ---- Goal areas (6-yard box) ---- */
    const gaW = 100;
    const gaH = 32;
    const gaX = cx - gaW / 2;
    glowStrokeRect(g, gaX, fy, gaW, gaH);
    glowStrokeRect(g, gaX, fy + fh - gaH, gaW, gaH);

    /* ---- Penalty dots ---- */
    const penDotY = 62;
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(cx, fy + penDotY, 6);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx, fy + penDotY, 3);
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(cx, fy + fh - penDotY, 6);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx, fy + fh - penDotY, 3);

    /* ---- Penalty arcs (the D) ---- */
    // Top: arc at penalty spot going downward into the box — show only outside-box portion
    glowArc(g, cx, fy + penDotY, 34, Math.PI * 0.12, Math.PI * 0.88);
    // Bottom: arc at penalty spot going upward
    glowArc(g, cx, fy + fh - penDotY, 34, -Math.PI * 0.88, -Math.PI * 0.12);

    /* ---- Corner arcs ---- */
    const cr = 12;
    glowArc(g, fx, fy, cr, 0, Math.PI / 2);
    glowArc(g, fx + fw, fy, cr, Math.PI / 2, Math.PI);
    glowArc(g, fx, fy + fh, cr, -Math.PI / 2, 0);
    glowArc(g, fx + fw, fy + fh, cr, Math.PI, Math.PI * 1.5);

    /* ============================================================= */
    /*  7. TECHNICAL AREAS — dashed lines near sidelines             */
    /* ============================================================= */
    const techY1 = cy - 60;
    const techY2 = cy + 60;
    // Left technical area
    g.lineStyle(1.5, 0xffffff, 0.35);
    for (let y = techY1; y < techY2; y += 8) {
        g.lineBetween(fx - 6, y, fx - 6, Math.min(y + 4, techY2));
    }
    g.lineBetween(fx - 6, techY1, fx - 2, techY1);
    g.lineBetween(fx - 6, techY2, fx - 2, techY2);
    // Right technical area
    for (let y = techY1; y < techY2; y += 8) {
        g.lineBetween(fx + fw + 6, y, fx + fw + 6, Math.min(y + 4, techY2));
    }
    g.lineBetween(fx + fw + 6, techY1, fx + fw + 2, techY1);
    g.lineBetween(fx + fw + 6, techY2, fx + fw + 2, techY2);

    /* ============================================================= */
    /*  4. GOALS — 3D-perspective goal posts + net                   */
    /* ============================================================= */
    const goalW = 64;
    const goalDepth = 16;
    const postW = 4;
    const goalX = cx - goalW / 2;

    // --- Top goal ---
    {
        const gy = fy - goalDepth;
        // Net background
        g.fillStyle(0xffffff, 0.06);
        g.fillRect(goalX, gy, goalW, goalDepth);
        // Net grid
        g.lineStyle(0.7, 0xffffff, 0.18);
        for (let nx = goalX; nx <= goalX + goalW; nx += 6) {
            g.lineBetween(nx, gy, nx, fy);
        }
        for (let ny = gy; ny <= fy; ny += 5) {
            g.lineBetween(goalX, ny, goalX + goalW, ny);
        }
        // Goal shadow on grass
        g.fillStyle(0x000000, 0.10);
        g.fillRect(goalX + 2, fy, goalW - 4, 6);
        // Left post (3D: two rectangles offset)
        g.fillStyle(0xcccccc, 0.7);
        g.fillRect(goalX - 1, gy, postW + 1, goalDepth + 2);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX, gy, postW, goalDepth + 2);
        // Right post
        g.fillStyle(0xcccccc, 0.7);
        g.fillRect(goalX + goalW - postW, gy, postW + 1, goalDepth + 2);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX + goalW - postW, gy, postW, goalDepth + 2);
        // Crossbar
        g.fillStyle(0xcccccc, 0.6);
        g.fillRect(goalX, gy, goalW, postW + 1);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX, gy + 1, goalW, postW - 1);
        // Crossbar highlight
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(goalX + 2, gy + 1, goalW - 4, 1);
    }

    // --- Bottom goal ---
    {
        const gy = fy + fh;
        // Net background
        g.fillStyle(0xffffff, 0.06);
        g.fillRect(goalX, gy, goalW, goalDepth);
        // Net grid
        g.lineStyle(0.7, 0xffffff, 0.18);
        for (let nx = goalX; nx <= goalX + goalW; nx += 6) {
            g.lineBetween(nx, gy, nx, gy + goalDepth);
        }
        for (let ny = gy; ny <= gy + goalDepth; ny += 5) {
            g.lineBetween(goalX, ny, goalX + goalW, ny);
        }
        // Goal shadow on grass
        g.fillStyle(0x000000, 0.10);
        g.fillRect(goalX + 2, gy - 6, goalW - 4, 6);
        // Left post
        g.fillStyle(0xcccccc, 0.7);
        g.fillRect(goalX - 1, gy - 2, postW + 1, goalDepth + 2);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX, gy - 2, postW, goalDepth + 2);
        // Right post
        g.fillStyle(0xcccccc, 0.7);
        g.fillRect(goalX + goalW - postW, gy - 2, postW + 1, goalDepth + 2);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX + goalW - postW, gy - 2, postW, goalDepth + 2);
        // Crossbar
        g.fillStyle(0xcccccc, 0.6);
        g.fillRect(goalX, gy + goalDepth - postW, goalW, postW + 1);
        g.fillStyle(0xffffff, 0.95);
        g.fillRect(goalX, gy + goalDepth - postW + 1, goalW, postW - 1);
        // Crossbar highlight
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(goalX + 2, gy + goalDepth - postW + 1, goalW - 4, 1);
    }

    /* ============================================================= */
    /*  5. CORNER FLAGS                                              */
    /* ============================================================= */
    const flagH = 10;
    const flagTW = 6;
    const flagPoleW = 1.5;

    function drawCornerFlag(gfx, bx, by, flipX) {
        // Pole
        gfx.fillStyle(0xffffff, 0.9);
        gfx.fillRect(bx - flagPoleW / 2, by - flagH, flagPoleW, flagH);
        // Flag triangle
        gfx.fillStyle(0xff4455, 0.85);
        if (!flipX) {
            gfx.fillTriangle(
                bx, by - flagH,
                bx + flagTW, by - flagH + 2,
                bx, by - flagH + 5
            );
        } else {
            gfx.fillTriangle(
                bx, by - flagH,
                bx - flagTW, by - flagH + 2,
                bx, by - flagH + 5
            );
        }
    }

    drawCornerFlag(g, fx, fy, false);
    drawCornerFlag(g, fx + fw, fy, true);
    drawCornerFlag(g, fx, fy + fh, false);
    drawCornerFlag(g, fx + fw, fy + fh, true);

    g.setDepth(-1);
    return g;
}

/* ================================================================== */
/*  drawCrowd                                                         */
/* ================================================================== */
export function drawCrowd(scene, x, y, w, h) {
    const g = scene.add.graphics();

    /* ---- Stadium stand background with depth gradient ---- */
    // Back rows darker, front rows brighter
    const bgSteps = 8;
    const bgStepH = h / bgSteps;
    for (let i = 0; i < bgSteps; i++) {
        const t = i / (bgSteps - 1);
        // interpolate dark (0x0c1220) -> slightly brighter (0x1c2840)
        const r = Math.round(0x0c + (0x1c - 0x0c) * t);
        const gv = Math.round(0x12 + (0x28 - 0x12) * t);
        const b = Math.round(0x20 + (0x40 - 0x20) * t);
        g.fillStyle((r << 16) | (gv << 8) | b, 1);
        g.fillRect(x, y + i * bgStepH, w, bgStepH + 1);
    }

    /* ---- Team color palettes for clusters ---- */
    const teamA = [0xff3344, 0xee2233, 0xcc1122, 0xff5566]; // reds
    const teamB = [0x3388ff, 0x2277ee, 0x1166dd, 0x55aaff]; // blues
    const neutrals = [0xffcc00, 0xff9900, 0x66ff66, 0xff66aa,
        0xffffff, 0x44ffcc, 0xcc66ff, 0xffdd88, 0x88ccff];

    const rng = mulberry32(137);

    /* Build cluster map — segments of 5-12 fans share a team palette */
    const totalCols = Math.floor(w / 5);
    const clusterPalettes = [];
    let ci = 0;
    while (ci < totalCols) {
        const clusterLen = 4 + Math.floor(rng() * 9);
        const roll = rng();
        let palette;
        if (roll < 0.35) palette = teamA;
        else if (roll < 0.7) palette = teamB;
        else palette = neutrals;
        for (let j = 0; j < clusterLen && ci < totalCols; j++, ci++) {
            clusterPalettes.push(palette);
        }
    }

    /* ---- Draw rows of figures ---- */
    const figW = 4;
    const figGap = 1;
    const colStep = figW + figGap;
    const cols = Math.floor(w / colStep);
    const rows = Math.max(2, Math.floor(h / 10));
    const rowH = h / rows;

    for (let row = 0; row < rows; row++) {
        const ry = y + row * rowH;
        const offsetX = (row % 2) * (colStep / 2); // stagger rows
        const rowDepth = row / rows; // 0 = back, 1 = front

        // Back rows dimmer, front rows brighter
        const baseAlpha = 0.35 + rowDepth * 0.55;
        const figScale = 0.75 + rowDepth * 0.25; // back rows slightly smaller

        for (let col = 0; col < cols; col++) {
            const figX = x + 2 + offsetX + col * colStep;
            if (figX + figW > x + w - 1) continue;

            const palette = clusterPalettes[Math.min(col, clusterPalettes.length - 1)];
            const color = palette[Math.floor(rng() * palette.length)];
            const alpha = baseAlpha + (rng() - 0.5) * 0.15;

            // Vary heights: most sitting, some standing
            const standing = rng() < 0.2;
            const bodyH = standing ? (5 * figScale) : (3.5 * figScale);
            const headR = 1.4 * figScale;
            const bodyW = figW * figScale;
            const bodyTop = ry + rowH - bodyH - 1;
            const headY = bodyTop - headR;

            // Head (skin tone variation)
            const skinTones = [0xf5c6a0, 0xe8b896, 0xd4a574, 0xc48b5c, 0x8d5e3c];
            const skin = skinTones[Math.floor(rng() * skinTones.length)];
            g.fillStyle(skin, alpha);
            g.fillCircle(figX + figW / 2, headY, headR);

            // Body (team shirt)
            g.fillStyle(color, alpha);
            g.fillRect(figX + (figW - bodyW) / 2, bodyTop, bodyW, bodyH);

            // Scarf or flag held up (some fans)
            const scarfChance = rng();
            if (scarfChance < 0.12 && standing) {
                // Scarf above head
                const scarfColor = palette[Math.floor(rng() * palette.length)];
                g.fillStyle(scarfColor, alpha * 0.9);
                g.fillRect(figX - 1, headY - headR - 4, figW + 2, 2.5);
            } else if (scarfChance < 0.18) {
                // Small flag
                g.fillStyle(color, alpha * 0.8);
                g.fillRect(figX + figW / 2, headY - headR - 3, 3, 2);
            }
        }
    }

    /* ---- Banner / flag elements spanning multiple figures ---- */
    const bannerCount = Math.floor(w / 80);
    for (let i = 0; i < bannerCount; i++) {
        const bx = x + 10 + rng() * (w - 40);
        const bRow = Math.floor(rng() * Math.max(1, rows - 1));
        const by = y + bRow * rowH + 2;
        const bw = 14 + rng() * 22;
        const bh = 3 + rng() * 2;
        const bannerPalette = rng() < 0.5 ? teamA : teamB;
        const bColor = bannerPalette[Math.floor(rng() * bannerPalette.length)];
        g.fillStyle(bColor, 0.55 + rng() * 0.25);
        g.fillRect(bx, by, bw, bh);
        // Banner outline
        g.lineStyle(0.5, 0xffffff, 0.15);
        g.strokeRect(bx, by, bw, bh);
    }

    /* ---- Subtle noise overlay for atmosphere ---- */
    for (let i = 0; i < 120; i++) {
        const nx = x + rng() * w;
        const ny = y + rng() * h;
        g.fillStyle(rng() > 0.5 ? 0xffffff : 0x000000, 0.04 + rng() * 0.04);
        g.fillRect(nx, ny, 1, 1);
    }

    /* ---- Bottom highlight strip (edge of stand meeting the pitch) ---- */
    g.fillStyle(0x334466, 0.8);
    g.fillRect(x, y + h - 2, w, 2);
    g.fillStyle(0x556688, 0.4);
    g.fillRect(x, y + h - 3, w, 1);

    g.setDepth(0);
    return g;
}
