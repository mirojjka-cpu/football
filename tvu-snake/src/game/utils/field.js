/**
 * Premium 2D football field and crowd rendering (2026 HD edition)
 * Uses CanvasTexture (native Canvas 2D API) for gradients, glow, shadows
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
/*  drawField — returns a CanvasTexture key '_field'                  */
/* ================================================================== */
export function drawField(scene, w, h, topOffset, bottomOffset, crowdTop, crowdBottom) {
    const top = topOffset || 0;
    const bottom = bottomOffset || 0;
    const cTop = crowdTop || 0;
    const cBot = crowdBottom || 0;

    const fieldTop = top + cTop;
    const fieldBottom = h - bottom - cBot;
    const fieldH = fieldBottom - fieldTop;

    const margin = 16;
    const fx = margin, fy = fieldTop + margin;
    const fw = w - margin * 2, fh = fieldH - margin * 2;
    const cx = fx + fw / 2, cy = fy + fh / 2;

    const tex = scene.textures.createCanvas('_field', w, h);
    const ctx = tex.getContext();

    // --- Dark background ---
    ctx.fillStyle = '#0e1726';
    ctx.fillRect(0, 0, w, h);

    // --- Rich grass gradient ---
    const grassGrad = ctx.createLinearGradient(0, fieldTop, 0, fieldBottom);
    grassGrad.addColorStop(0, '#34993f');
    grassGrad.addColorStop(0.5, '#2a8a38');
    grassGrad.addColorStop(1, '#1e7530');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, fieldTop, w, fieldH);

    // --- Mow stripes ---
    const stripeCount = 14;
    const stripeH = fh / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        const dark = i % 2 === 0;
        ctx.fillStyle = dark ? 'rgba(27,107,40,0.2)' : 'rgba(58,173,74,0.15)';
        ctx.fillRect(fx, fy + i * stripeH, fw, stripeH);
    }

    // --- Grass texture dots ---
    const rng = mulberry32(42);
    for (let i = 0; i < 2400; i++) {
        const dx = fx + rng() * fw;
        const dy = fy + rng() * fh;
        const bright = rng() > 0.5;
        ctx.fillStyle = bright
            ? `rgba(74,204,94,${0.1 + rng() * 0.12})`
            : `rgba(24,104,40,${0.1 + rng() * 0.12})`;
        const sz = 1 + rng() * 1.5;
        ctx.fillRect(dx, dy, sz, sz);
    }
    // Lighter clumps
    for (let i = 0; i < 180; i++) {
        const dx = fx + rng() * fw;
        const dy = fy + rng() * fh;
        ctx.fillStyle = `rgba(109,221,122,${0.06 + rng() * 0.06})`;
        ctx.fillRect(dx, dy, 2, 2);
    }

    // --- Inner edge shadows (vignette) ---
    const shadowDepth = 18;
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.14 * (1 - i / shadowDepth);
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(fx, fy + i, fw, 1);
        ctx.fillRect(fx, fy + fh - i, fw, 1);
    }
    for (let i = 0; i < shadowDepth; i++) {
        const a = 0.10 * (1 - i / shadowDepth);
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(fx + i, fy, 1, fh);
        ctx.fillRect(fx + fw - i, fy, 1, fh);
    }

    // --- Dark margins ---
    ctx.fillStyle = 'rgba(26,110,44,0.55)';
    ctx.fillRect(0, fieldTop, w, margin);
    ctx.fillRect(0, fieldBottom - margin, w, margin);
    ctx.fillRect(0, fieldTop + margin, margin, fieldH - margin * 2);
    ctx.fillRect(w - margin, fieldTop + margin, margin, fieldH - margin * 2);

    // === FIELD LINES with real glow (shadowBlur) ===
    function glowLine(x1, y1, x2, y2) {
        // Glow pass
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.35)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function glowRect(rx, ry, rw, rh) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
    }

    function glowCircle(ccx, ccy, r) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ccx, ccy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function glowArc(ax, ay, r, start, end) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ax, ay, r, start, end);
        ctx.stroke();
        ctx.restore();
    }

    function glowDot(dx, dy, r) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Outer boundary
    glowRect(fx, fy, fw, fh);
    // Center line
    glowLine(fx, cy, fx + fw, cy);
    // Center circle
    glowCircle(cx, cy, 42);
    // Center dot
    glowDot(cx, cy, 3.5);

    // Penalty areas
    const paW = 200, paH = 82, paX = cx - paW / 2;
    glowRect(paX, fy, paW, paH);
    glowRect(paX, fy + fh - paH, paW, paH);

    // Goal areas (6-yard box)
    const gaW = 100, gaH = 32, gaX = cx - gaW / 2;
    glowRect(gaX, fy, gaW, gaH);
    glowRect(gaX, fy + fh - gaH, gaW, gaH);

    // Penalty dots
    const penDotY = 62;
    glowDot(cx, fy + penDotY, 3);
    glowDot(cx, fy + fh - penDotY, 3);

    // Penalty arcs (the D)
    glowArc(cx, fy + penDotY, 34, Math.PI * 0.12, Math.PI * 0.88);
    glowArc(cx, fy + fh - penDotY, 34, -Math.PI * 0.88, -Math.PI * 0.12);

    // Corner arcs
    const cr = 12;
    glowArc(fx, fy, cr, 0, Math.PI / 2);
    glowArc(fx + fw, fy, cr, Math.PI / 2, Math.PI);
    glowArc(fx, fy + fh, cr, -Math.PI / 2, 0);
    glowArc(fx + fw, fy + fh, cr, Math.PI, Math.PI * 1.5);

    // Technical areas (dashed)
    const techY1 = cy - 60, techY2 = cy + 60;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fx - 6, techY1); ctx.lineTo(fx - 6, techY2);
    ctx.moveTo(fx - 6, techY1); ctx.lineTo(fx - 2, techY1);
    ctx.moveTo(fx - 6, techY2); ctx.lineTo(fx - 2, techY2);
    ctx.moveTo(fx + fw + 6, techY1); ctx.lineTo(fx + fw + 6, techY2);
    ctx.moveTo(fx + fw + 6, techY1); ctx.lineTo(fx + fw + 2, techY1);
    ctx.moveTo(fx + fw + 6, techY2); ctx.lineTo(fx + fw + 2, techY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // === GOALS ===
    const goalW = 64, goalDepth = 16, postW = 4, goalX = cx - goalW / 2;

    // Top goal
    {
        const gy = fy - goalDepth;
        // Net bg
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(goalX, gy, goalW, goalDepth);
        // Net grid
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.7;
        for (let nx = goalX; nx <= goalX + goalW; nx += 6) {
            ctx.beginPath(); ctx.moveTo(nx, gy); ctx.lineTo(nx, fy); ctx.stroke();
        }
        for (let ny = gy; ny <= fy; ny += 5) {
            ctx.beginPath(); ctx.moveTo(goalX, ny); ctx.lineTo(goalX + goalW, ny); ctx.stroke();
        }
        // Goal shadow on grass
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(goalX + 2, fy, goalW - 4, 6);
        // Posts with gradient
        const postGrad = ctx.createLinearGradient(goalX, 0, goalX + postW, 0);
        postGrad.addColorStop(0, 'rgba(200,200,200,0.7)');
        postGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        postGrad.addColorStop(1, 'rgba(200,200,200,0.7)');
        ctx.fillStyle = postGrad;
        ctx.fillRect(goalX, gy, postW, goalDepth + 2);
        ctx.fillRect(goalX + goalW - postW, gy, postW, goalDepth + 2);
        // Crossbar
        const barGrad = ctx.createLinearGradient(0, gy, 0, gy + postW);
        barGrad.addColorStop(0, 'rgba(200,200,200,0.6)');
        barGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        barGrad.addColorStop(1, 'rgba(200,200,200,0.6)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(goalX, gy, goalW, postW);
    }

    // Bottom goal
    {
        const gy = fy + fh;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(goalX, gy, goalW, goalDepth);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.7;
        for (let nx = goalX; nx <= goalX + goalW; nx += 6) {
            ctx.beginPath(); ctx.moveTo(nx, gy); ctx.lineTo(nx, gy + goalDepth); ctx.stroke();
        }
        for (let ny = gy; ny <= gy + goalDepth; ny += 5) {
            ctx.beginPath(); ctx.moveTo(goalX, ny); ctx.lineTo(goalX + goalW, ny); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(goalX + 2, gy - 6, goalW - 4, 6);
        const postGrad = ctx.createLinearGradient(goalX, 0, goalX + postW, 0);
        postGrad.addColorStop(0, 'rgba(200,200,200,0.7)');
        postGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        postGrad.addColorStop(1, 'rgba(200,200,200,0.7)');
        ctx.fillStyle = postGrad;
        ctx.fillRect(goalX, gy - 2, postW, goalDepth + 2);
        ctx.fillRect(goalX + goalW - postW, gy - 2, postW, goalDepth + 2);
        const barGrad = ctx.createLinearGradient(0, gy + goalDepth - postW, 0, gy + goalDepth);
        barGrad.addColorStop(0, 'rgba(200,200,200,0.6)');
        barGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        barGrad.addColorStop(1, 'rgba(200,200,200,0.6)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(goalX, gy + goalDepth - postW, goalW, postW);
    }

    // === Corner flags ===
    function drawFlag(bx, by, flipX) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(bx - 0.75, by - 10, 1.5, 10);
        ctx.fillStyle = 'rgba(255,68,85,0.85)';
        ctx.beginPath();
        if (!flipX) {
            ctx.moveTo(bx, by - 10);
            ctx.lineTo(bx + 6, by - 8);
            ctx.lineTo(bx, by - 5);
        } else {
            ctx.moveTo(bx, by - 10);
            ctx.lineTo(bx - 6, by - 8);
            ctx.lineTo(bx, by - 5);
        }
        ctx.closePath();
        ctx.fill();
    }
    drawFlag(fx, fy, false);
    drawFlag(fx + fw, fy, true);
    drawFlag(fx, fy + fh, false);
    drawFlag(fx + fw, fy + fh, true);

    tex.refresh();
    // Return a dummy object with destroy() for compatibility with Game.js
    return { destroy() {} };
}

/* ================================================================== */
/*  drawCrowd — returns a CanvasTexture key (passed in)               */
/* ================================================================== */
export function drawCrowd(scene, x, y, w, h, texKey) {
    const tex = scene.textures.createCanvas(texKey || '_crowd_tmp', w, h);
    const ctx = tex.getContext();

    // Stadium stand background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1220');
    bgGrad.addColorStop(1, '#1c2840');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Team color palettes
    const teamA = ['#ff3344', '#ee2233', '#cc1122', '#ff5566'];
    const teamB = ['#3388ff', '#2277ee', '#1166dd', '#55aaff'];
    const neutrals = ['#ffcc00', '#ff9900', '#66ff66', '#ff66aa',
        '#ffffff', '#44ffcc', '#cc66ff', '#ffdd88', '#88ccff'];

    const rng = mulberry32(137);

    // Build cluster map
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

    // Draw rows of figures
    const figW = 4, figGap = 1, colStep = figW + figGap;
    const cols = Math.floor(w / colStep);
    const rows = Math.max(2, Math.floor(h / 10));
    const rowH = h / rows;
    const skinTones = ['#f5c6a0', '#e8b896', '#d4a574', '#c48b5c', '#8d5e3c'];

    for (let row = 0; row < rows; row++) {
        const ry = row * rowH;
        const offsetX = (row % 2) * (colStep / 2);
        const rowDepth = row / rows;
        const baseAlpha = 0.35 + rowDepth * 0.55;
        const figScale = 0.75 + rowDepth * 0.25;

        for (let col = 0; col < cols; col++) {
            const figX = 2 + offsetX + col * colStep;
            if (figX + figW > w - 1) continue;

            const palette = clusterPalettes[Math.min(col, clusterPalettes.length - 1)];
            const color = palette[Math.floor(rng() * palette.length)];
            const alpha = Math.min(1, Math.max(0, baseAlpha + (rng() - 0.5) * 0.15));

            const standing = rng() < 0.2;
            const bodyH = standing ? (5 * figScale) : (3.5 * figScale);
            const headR = 1.4 * figScale;
            const bodyW = figW * figScale;
            const bodyTop = ry + rowH - bodyH - 1;
            const headY = bodyTop - headR;

            // Head
            const skin = skinTones[Math.floor(rng() * skinTones.length)];
            ctx.globalAlpha = alpha;
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(figX + figW / 2, headY, headR, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = color;
            ctx.fillRect(figX + (figW - bodyW) / 2, bodyTop, bodyW, bodyH);

            // Scarf/flag
            const scarfChance = rng();
            if (scarfChance < 0.12 && standing) {
                const scarfColor = palette[Math.floor(rng() * palette.length)];
                ctx.fillStyle = scarfColor;
                ctx.fillRect(figX - 1, headY - headR - 4, figW + 2, 2.5);
            } else if (scarfChance < 0.18) {
                ctx.fillStyle = color;
                ctx.fillRect(figX + figW / 2, headY - headR - 3, 3, 2);
            }
        }
    }
    ctx.globalAlpha = 1;

    // Banners
    const bannerCount = Math.floor(w / 80);
    for (let i = 0; i < bannerCount; i++) {
        const bx = 10 + rng() * (w - 40);
        const bRow = Math.floor(rng() * Math.max(1, rows - 1));
        const by = bRow * rowH + 2;
        const bw = 14 + rng() * 22;
        const bh = 3 + rng() * 2;
        const bannerPalette = rng() < 0.5 ? teamA : teamB;
        const bColor = bannerPalette[Math.floor(rng() * bannerPalette.length)];
        ctx.globalAlpha = 0.55 + rng() * 0.25;
        ctx.fillStyle = bColor;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, bw, bh);
    }
    ctx.globalAlpha = 1;

    // Bottom highlight strip
    ctx.fillStyle = 'rgba(51,68,102,0.8)';
    ctx.fillRect(0, h - 2, w, 2);
    ctx.fillStyle = 'rgba(85,102,136,0.4)';
    ctx.fillRect(0, h - 3, w, 1);

    tex.refresh();
    return { destroy() {} };
}
