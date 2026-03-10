import { Scene } from 'phaser';
import { drawField, drawCrowd } from '../utils/field';
import { createTextures, QUESTIONS, ANSWERS, TEAM_COMBOS, SKINS, HAIRS } from '../utils/sprites';

// Layout (matching original 480x780, scaled up)
const W = 540;
const H = 960;
const TOP_UI = 62;
const BOTTOM_UI = 54;
const CROWD_H = 28;
const F = { x: 30, y: TOP_UI + CROWD_H + 4, w: W - 60, h: H - TOP_UI - BOTTOM_UI - CROWD_H * 2 - 8 };

// Snake / Crew
const INIT_LEN = 30;
const CABLE_GROW = 12; // how much cable grows per interview
const CREW_SPEED = 2.3;
const PERSONAL_SPACE = 72;
const INT_DIST = 32;
const SELF_HIT_R = 7;

// Game
const TOTAL_PLAYERS = 22;
const GAME_DURATION = 300; // seconds

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        // Background + field + crowd — CanvasTexture (native Canvas 2D with gradients/glow)
        if (!this.textures.exists('_field')) {
            drawField(this, W, H, TOP_UI, BOTTOM_UI, CROWD_H, CROWD_H);
        }
        this.add.image(W / 2, H / 2, '_field').setDepth(-1);

        if (!this.textures.exists('_crowdTop')) {
            drawCrowd(this, 0, 0, W, CROWD_H, '_crowdTop');
        }
        this.add.image(W / 2, TOP_UI + CROWD_H / 2, '_crowdTop').setDepth(0);

        if (!this.textures.exists('_crowdBot')) {
            drawCrowd(this, 0, 0, W, CROWD_H, '_crowdBot');
        }
        this.add.image(W / 2, H - BOTTOM_UI - CROWD_H / 2, '_crowdBot').setDepth(0);
        createTextures(this);

        // State
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('tvu_best') || '0');
        this.gameTimer = 0; // frames elapsed
        this.gst = 'playing'; // playing, smoke, dead, timeup
        this.smokeT = 0;
        this.smokingAssistant = false;
        this.frames = 0;
        this.intTarget = null;
        this.intTimer = 0;

        // --- Snake / Crew ---
        this.snakeTrail = [];
        this.snakeMaxLen = INIT_LEN;
        this.snakeTx = F.x + F.w / 2;
        this.snakeTy = F.y + F.h / 2;
        this.snakeAngle = 0;
        this.snakeMoving = false;
        this.snakeStopped = false;
        this.snakeFrame = 0;
        this.stepT = 0;
        this.growGrace = 0;

        // Init trail
        const sx = F.x + F.w / 2, sy = F.y + F.h / 2;
        for (let i = 0; i < this.snakeMaxLen + 20; i++) {
            this.snakeTrail.push({ x: sx - i * 1.5, y: sy });
        }

        // Cable graphics (drawn each frame)
        this.cableGfx = this.add.graphics().setDepth(2);

        // Crew sprites (2x textures, displayed at half scale for crisp rendering)
        this.operatorSprite = this.add.image(0, 0, 'operator').setDepth(5).setScale(0.22);
        this.correspondentSprite = this.add.image(0, 0, 'correspondent').setDepth(5).setScale(0.22);
        this.assistantSprite = this.add.image(0, 0, 'assistant').setDepth(3).setScale(0.215);

        // --- Players ---
        this.combo = TEAM_COMBOS[Phaser.Math.Between(0, TEAM_COMBOS.length - 1)];
        this.players = [];
        for (let i = 0; i < TOTAL_PLAYERS; i++) {
            this.spawnPlayer(i);
        }

        // Bubbles
        this.bubbles = [];

        // Smoke particles
        this.smokes = [];

        // Dust particles (from running)
        this.dustParticles = [];
        // Cable sparks
        this.cableSparks = [];
        // Separate graphics for particles (avoids bloating cable graphics)
        this.particleGfx = this.add.graphics().setDepth(3);

        // Pre-rendered shadow texture (GPU-batched sprites instead of per-frame graphics)
        if (!this.textures.exists('_shadow')) {
            const sg = this.make.graphics({ add: false });
            sg.fillStyle(0x000000, 1);
            sg.fillEllipse(16, 6, 32, 12);
            sg.generateTexture('_shadow', 32, 12);
            sg.destroy();
        }
        // Crew shadows
        this.opShadow = this.add.image(0, 0, '_shadow').setDepth(1).setAlpha(0.18).setScale(0.7, 1);
        this.corrShadow = this.add.image(0, 0, '_shadow').setDepth(1).setAlpha(0.18).setScale(0.56, 0.83);
        this.asstShadow = this.add.image(0, 0, '_shadow').setDepth(1).setAlpha(0.18).setScale(0.63, 1);
        // Player shadows
        this.playerShadows = this.players.map(() =>
            this.add.image(0, 0, '_shadow').setDepth(1).setAlpha(0.14).setScale(0.5, 0.83)
        );

        // --- UI ---
        this.createTopUI();
        this.createBottomUI();
        this.createTVOverlay();

        // --- Input: tap to move ---
        this.input.on('pointerdown', (pointer) => {
            this.handleTap(pointer.x, pointer.y);
        });
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.handleTap(pointer.x, pointer.y);
            }
        });

        // Keyboard (arrow keys set target)
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    handleTap(px, py) {
        if (this.gst === 'playing' && !this.snakeStopped) {
            this.snakeTx = Phaser.Math.Clamp(px, F.x + 14, F.x + F.w - 14);
            this.snakeTy = Phaser.Math.Clamp(py, F.y + 14, F.y + F.h - 14);
        }
        if (this.gst === 'smoke') {
            this.snakeTx = Phaser.Math.Clamp(px, F.x + 14, F.x + F.w - 14);
            this.snakeTy = Phaser.Math.Clamp(py, F.y + 14, F.y + F.h - 14);
        }
    }

    // --- Snake ---

    get hx() { return this.snakeTrail.length ? this.snakeTrail[0].x : F.x + F.w / 2; }
    get hy() { return this.snakeTrail.length ? this.snakeTrail[0].y : F.y + F.h / 2; }

    snakeTail() {
        return this.snakeTrail[Math.min(this.snakeTrail.length - 1, this.snakeMaxLen - 1)];
    }

    snakeGrow(n) {
        this.snakeMaxLen += n;
        this.growGrace = 90;
    }

    snakeSelfCollide() {
        if (this.growGrace > 0) { this.growGrace--; return false; }
        const hx = this.hx, hy = this.hy;
        const skip = Math.max(36, Math.floor(this.snakeMaxLen * 0.18));
        const limit = Math.min(this.snakeTrail.length, this.snakeMaxLen) - 22;
        for (let i = skip; i < limit; i++) {
            const s = this.snakeTrail[i];
            if ((hx - s.x) ** 2 + (hy - s.y) ** 2 < SELF_HIT_R * SELF_HIT_R) return true;
        }
        return false;
    }

    updateSnake() {
        if (this.snakeStopped) return;
        const dx = this.snakeTx - this.hx;
        const dy = this.snakeTy - this.hy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            this.snakeMoving = true;
            this.snakeAngle = Math.atan2(dy, dx);
            const spd = Math.min(CREW_SPEED, dist);
            const nx = Phaser.Math.Clamp(this.hx + Math.cos(this.snakeAngle) * spd, F.x + 14, F.x + F.w - 14);
            const ny = Phaser.Math.Clamp(this.hy + Math.sin(this.snakeAngle) * spd, F.y + 14, F.y + F.h - 14);
            this.snakeTrail.unshift({ x: nx, y: ny });
            while (this.snakeTrail.length > this.snakeMaxLen + 16) this.snakeTrail.pop();
            this.stepT--;
            if (this.stepT <= 0) { this.stepT = 18; this.snakeFrame ^= 1; }
            // Spawn dust while moving (throttled for mobile perf)
            if (this.frames % 8 === 0) this.spawnDust(nx, ny);
        } else {
            this.snakeMoving = false;
        }
    }

    drawCable() {
        this.cableGfx.clear();
        if (this.snakeTrail.length < 2) return;

        const trail = this.snakeTrail;
        const len = Math.min(trail.length, this.snakeMaxLen);
        const g = this.cableGfx;

        // Sample trail — skip every 2nd point, keeps shape but halves geometry
        const pts = [trail[0]];
        for (let i = 2; i < len - 1; i += 2) pts.push(trail[i]);
        pts.push(trail[len - 1]);

        // Cable shadow
        g.lineStyle(6, 0x000000, 0.25);
        g.beginPath(); g.moveTo(pts[0].x + 1, pts[0].y + 3);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x + 1, pts[i].y + 3);
        g.strokePath();

        // Cable outer (dark)
        g.lineStyle(5, 0x111111, 1);
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();

        // Cable inner (grey stripe)
        g.lineStyle(2.5, 0x2a2a2a, 1);
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.strokePath();

        // Spawn cable sparks every 20 frames
        if (this.frames % 20 === 0 && this.snakeMoving && pts.length > 4) {
            for (let s = 0; s < 3; s++) {
                const idx = Math.floor(Math.random() * (pts.length - 1));
                const sp = pts[idx];
                this.cableSparks.push({
                    x: sp.x + (Math.random() - 0.5) * 4,
                    y: sp.y + (Math.random() - 0.5) * 4,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -1 - Math.random() * 1.5,
                    life: 1,
                    sz: 1.5 + Math.random() * 2,
                });
            }
        }
        // Draw sparks
        this.cableSparks = this.cableSparks.filter(p => p.life > 0);
        for (const p of this.cableSparks) {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.08; // gravity
            p.life -= 0.04;
            p.sz *= 0.97;
            const bright = p.life > 0.5 ? 0xffee66 : 0xffaa22;
            g.fillStyle(bright, p.life * 0.8);
            g.fillCircle(p.x | 0, p.y | 0, p.sz);
        }
    }

    drawCrewSprites() {
        const faceRight = this.snakeAngle > -Math.PI / 2 && this.snakeAngle <= Math.PI / 2;
        const offset = faceRight ? 12 : -12;

        // Walking bob + squash-stretch
        const t = this.frames * 0.18;
        const bob = this.snakeMoving ? Math.sin(t) * 2.5 : 0;
        const bobAlt = this.snakeMoving ? Math.sin(t + 1.2) * 2.5 : 0;
        const squashX = this.snakeMoving ? 1 + Math.sin(t * 2) * 0.025 : 1;
        const squashY = this.snakeMoving ? 1 - Math.sin(t * 2) * 0.02 : 1;

        // Operator behind
        this.operatorSprite.setPosition(this.hx - offset * 1.4, this.hy + bob);
        this.operatorSprite.setFlipX(!faceRight);
        this.operatorSprite.setScale(0.22 * squashX, 0.22 * squashY);

        // Correspondent in front
        this.correspondentSprite.setPosition(this.hx + offset, this.hy + bob);
        this.correspondentSprite.setFlipX(!faceRight);
        this.correspondentSprite.setScale(0.22 * squashX, 0.22 * squashY);

        // Assistant at tail
        const tail = this.snakeTail();
        if (tail) {
            this.assistantSprite.setPosition(tail.x, tail.y + bobAlt);
            this.assistantSprite.setFlipX(!faceRight);
            this.assistantSprite.setScale(0.215 * squashX, 0.215 * squashY);
            this.assistantSprite.setVisible(true);
        }
    }

    // --- Keyboard arrows: set target in that direction ---
    handleKeyboard() {
        const spd = 200;
        if (this.cursors.left.isDown) this.snakeTx = this.hx - spd;
        else if (this.cursors.right.isDown) this.snakeTx = this.hx + spd;
        if (this.cursors.up.isDown) this.snakeTy = this.hy - spd;
        else if (this.cursors.down.isDown) this.snakeTy = this.hy + spd;

        this.snakeTx = Phaser.Math.Clamp(this.snakeTx, F.x + 14, F.x + F.w - 14);
        this.snakeTy = Phaser.Math.Clamp(this.snakeTy, F.y + 14, F.y + F.h - 14);
    }

    // --- Players ---

    spawnPlayer(index) {
        const team = index < 11 ? 'a' : 'b';
        const pos = this.randomFieldPos(65);
        const texIdx = index % 24;

        const container = this.add.container(pos.x, pos.y).setDepth(4);
        const img = this.add.image(0, 0, `player_${texIdx}`).setScale(0.21);
        container.add(img);

        const num = index < 11 ? index + 1 : index - 10;
        const numText = this.add.text(0, 2, `${num}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);
        container.add(numText);

        // Breathing phase offset (animated cheaply in updatePlayers)
        container.breathPhase = Math.random() * Math.PI * 2;

        this.players.push({
            x: pos.x, y: pos.y,
            tx: pos.x, ty: pos.y,
            team, num, texIdx,
            st: 'idle',          // idle, flee, interview, done, leaving
            noCnt: 0,            // number of times refused
            ft: 0,               // flee timer
            wt: 50 + Math.random() * 120,  // wander timer
            locked: false,
            faceRight: Math.random() > 0.5,
            sprite: container,
            leaveAt: 220 + Math.random() * 80,
        });
    }

    randomFieldPos(margin = 65) {
        // Keep spawning until position is far enough from crew start (center)
        const cx = F.x + F.w / 2, cy = F.y + F.h / 2;
        for (let attempt = 0; attempt < 20; attempt++) {
            const x = F.x + margin + Math.random() * (F.w - margin * 2);
            const y = F.y + margin + Math.random() * (F.h - margin * 2);
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy > 90 * 90) return { x, y };
        }
        // Fallback: top-left quadrant, guaranteed far from center
        return {
            x: F.x + margin + Math.random() * (F.w / 3),
            y: F.y + margin + Math.random() * (F.h / 3),
        };
    }

    updatePlayers() {
        const timeLeft = Math.max(0, GAME_DURATION - this.gameTimer / 60);

        this.players.forEach(p => {
            if (p.locked) return;

            if (p.st === 'done') {
                const tx = p.x < F.x + F.w / 2 ? F.x - 80 : F.x + F.w + 80;
                const dx = tx - p.x;
                if (Math.abs(dx) > 3) {
                    p.x += (dx / Math.abs(dx)) * 4.5;
                    p.faceRight = dx > 0;
                }
                p.sprite.setPosition(p.x, p.y);
                if (p.x < F.x - 90 || p.x > F.x + F.w + 90) p.sprite.setVisible(false);
                return;
            }

            // Timer pressure
            if (p.st !== 'leaving' && timeLeft < p.leaveAt && timeLeft < 60) {
                p.st = 'leaving';
                this.addBubble(p.x, p.y, 'ухожу!', 60, 0xf4a261, '#111');
            }
            if (p.st === 'leaving') {
                const tx = p.x < F.x + F.w / 2 ? F.x - 80 : F.x + F.w + 80;
                const dx = tx - p.x;
                if (Math.abs(dx) > 3) { p.x += (dx / Math.abs(dx)) * 3.5; p.faceRight = dx > 0; }
                p.sprite.setPosition(p.x, p.y);
                if (p.x < F.x - 90 || p.x > F.x + F.w + 90) p.sprite.setVisible(false);
                return;
            }

            if (p.st === 'flee') {
                p.ft--;
                if (p.ft <= 0) { p.st = 'idle'; p.tx = p.x; p.ty = p.y; }
                else {
                    const ang = Math.atan2(p.y - this.hy, p.x - this.hx);
                    p.x = Phaser.Math.Clamp(p.x + Math.cos(ang) * 3.8, F.x + 22, F.x + F.w - 22);
                    p.y = Phaser.Math.Clamp(p.y + Math.sin(ang) * 3.8, F.y + 22, F.y + F.h - 22);
                    p.faceRight = Math.cos(ang) > 0;
                    // Dust from fleeing player
                    if (this.frames % 5 === 0) this.spawnDust(p.x, p.y);
                }
                p.sprite.setPosition(p.x, p.y);
                return;
            }

            if (p.st === 'idle') {
                // Personal space — dodge crew
                const dxC = p.x - this.hx, dyC = p.y - this.hy;
                const distC = Math.sqrt(dxC * dxC + dyC * dyC);
                if (distC < PERSONAL_SPACE && !this.snakeStopped) {
                    const ang = Math.atan2(dyC, dxC);
                    p.x = Phaser.Math.Clamp(p.x + Math.cos(ang) * 2.2, F.x + 22, F.x + F.w - 22);
                    p.y = Phaser.Math.Clamp(p.y + Math.sin(ang) * 2.2, F.y + 22, F.y + F.h - 22);
                    p.faceRight = Math.cos(ang) > 0;
                    p.sprite.setPosition(p.x, p.y);
                    return;
                }
                // Wander
                p.wt--;
                if (p.wt <= 0) {
                    const np = this.randomFieldPos(45);
                    p.tx = np.x; p.ty = np.y;
                    p.wt = 75 + Math.random() * 130;
                }
                const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy);
                if (d > 2) { p.x += dx / d * 0.6; p.y += dy / d * 0.6; p.faceRight = dx > 0; }
            }

            p.sprite.setPosition(p.x, p.y);
            // Cheap breathing via sin — replaces 22 infinite tweens
            const breath = Math.sin(this.frames * 0.06 + p.sprite.breathPhase) * 0.025;
            p.sprite.setScale(p.faceRight ? 1 + breath : -(1 + breath), 1 - breath);
        });
    }

    // --- Interview ---

    tryInterview() {
        if (this.intTarget || this.snakeStopped || this.frames < 90) return;
        for (const p of this.players) {
            if (p.st !== 'idle') continue;
            const dx = this.hx - p.x, dy = this.hy - p.y;
            if (dx * dx + dy * dy < INT_DIST * INT_DIST) {
                // Chance of refusal
                const noChance = p.noCnt === 0 ? 0.38 : p.noCnt === 1 ? 0.2 : 0;
                if (Math.random() < noChance) {
                    p.noCnt++;
                    p.st = 'flee';
                    p.ft = 100 + Math.random() * 70;
                    this.addBubble(p.x, p.y, 'Нет!', 80, 0xe63946, '#fff');

                    // Red flash tint on flee
                    p.sprite.list[0].setTint(0xff4444);
                    this.time.delayedCall(200, () => { if (p.sprite.list[0]) p.sprite.list[0].clearTint(); });
                } else {
                    this.intTarget = p;
                    p.locked = true;
                    p.st = 'interview';
                    this.intTimer = 170;
                    this.snakeStopped = true;

                    // Excited bounce — player reacts to interview
                    this.tweens.add({
                        targets: p.sprite,
                        scaleY: { from: 0.85, to: 1.08 },
                        scaleX: { from: 1.1, to: 0.95 },
                        duration: 200,
                        yoyo: true,
                        repeat: 2,
                        ease: 'Bounce.easeOut'
                    });
                    // Correspondent leans forward
                    this.tweens.add({
                        targets: this.correspondentSprite,
                        scaleX: { from: 0.22, to: 0.25 },
                        scaleY: { from: 0.22, to: 0.20 },
                        duration: 300,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });

                    // Camera flash from operator
                    const opX = this.operatorSprite.x, opY = this.operatorSprite.y;
                    const flash = this.add.rectangle(opX, opY, W * 2, H * 2, 0xffffff)
                        .setAlpha(0.35).setDepth(18);
                    this.tweens.add({
                        targets: flash, alpha: 0, duration: 150,
                        onComplete: () => flash.destroy()
                    });
                    // Light rays from operator
                    for (let r = 0; r < 5; r++) {
                        const angle = (Math.random() - 0.5) * Math.PI;
                        const rayLen = 60 + Math.random() * 80;
                        const ray = this.add.rectangle(
                            opX + Math.cos(angle) * rayLen / 2,
                            opY - 20 + Math.sin(angle) * rayLen / 2,
                            rayLen, 1.5, 0xffffff
                        ).setAlpha(0.5).setDepth(18).setAngle(angle * 180 / Math.PI);
                        this.tweens.add({
                            targets: ray, alpha: 0, duration: 200 + Math.random() * 100,
                            onComplete: () => ray.destroy()
                        });
                    }

                    const playerPhrase = ANSWERS[Phaser.Math.Between(0, ANSWERS.length - 1)];
                    const corrPhrase = QUESTIONS[Phaser.Math.Between(0, QUESTIONS.length - 1)];

                    // Correspondent question first (gets top position)
                    const faceRight = this.snakeAngle > -Math.PI / 2 && this.snakeAngle <= Math.PI / 2;
                    const corrX = faceRight ? this.hx + 22 : this.hx - 22;
                    this.addBubble(corrX, Math.min(this.hy, p.y) - 10, corrPhrase, 200, 0xfff0f3, '#a00');
                    // Player answer below (collision avoidance shifts it down)
                    this.addBubble(p.x, p.y, playerPhrase, 250, 0xfffbe6, '#333');
                }
                break;
            }
        }
    }

    updateInterview() {
        if (!this.intTarget) return;
        this.intTimer--;
        if (this.intTimer <= 0) {
            this.intTarget.locked = false;
            this.intTarget.st = 'done';
            this.intTarget = null;
            this.snakeStopped = false;
            this.score++;
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.updateUI();

            // Mini confetti burst
            for (let i = 0; i < 15; i++) {
                const cx = this.hx + (Math.random() - 0.5) * 60;
                const cy = this.hy - 20;
                const conf = this.add.rectangle(
                    cx, cy, 3 + Math.random() * 3, 6 + Math.random() * 6,
                    [0xffd700, 0xff4444, 0x44aaff, 0x44ff44, 0xff66aa][Math.floor(Math.random() * 5)]
                ).setDepth(16).setAngle(Math.random() * 360);
                this.tweens.add({
                    targets: conf,
                    y: cy - 80 - Math.random() * 120,
                    x: cx + (Math.random() - 0.5) * 100,
                    angle: conf.angle + (Math.random() - 0.5) * 540,
                    alpha: 0,
                    duration: 800 + Math.random() * 600,
                    ease: 'Cubic.easeOut',
                    onComplete: () => conf.destroy()
                });
            }

            // Score popup — juicy pop + float
            const plus = this.add.text(this.hx, this.hy - 40, '+1', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 28, color: '#ffd700',
                stroke: '#000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(15).setScale(0.2);
            this.tweens.add({
                targets: plus, scaleX: 1.3, scaleY: 1.3,
                duration: 200, ease: 'Back.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: plus, y: plus.y - 60, alpha: 0,
                        scaleX: 0.8, scaleY: 0.8,
                        duration: 800, ease: 'Cubic.easeOut',
                        onComplete: () => plus.destroy()
                    });
                }
            });

            // Start smoke break after short delay
            this.time.delayedCall(300, () => {
                if (this.gst === 'playing') this.startSmoke();
            });
        }
    }

    // --- Smoke break ---

    startSmoke() {
        this.gst = 'smoke';
        this.smokeT = 200;
        this.smokingAssistant = true;

        const tail = this.snakeTail();
        if (tail) {
            this.addBubble(tail.x + 55, tail.y + 10, 'так, перекур! 🚬', 180, 0xe8e8d0, '#333');
        }
    }

    updateSmoke() {
        this.smokeT--;

        // Spawn smoke particles from assistant (capped for mobile)
        const tail = this.snakeTail();
        if (tail && Math.random() < 0.25 && this.smokes.length < 30) {
            const baseX = tail.x + (Math.random() - 0.5) * 6;
            const baseY = tail.y - 28;
            this.smokes.push({
                x: baseX, y: baseY,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.7 - Math.random() * 0.6,
                life: 1,
                sz: 3 + Math.random() * 6,
                tint: Math.random() < 0.3 ? 0x999988 : 0xd2d2c3,
            });
        }

        if (this.smokeT <= 0) {
            this.smokingAssistant = false;
            this.snakeGrow(CABLE_GROW);
            this.gst = 'playing';
        }
    }

    drawSmokes() {
        const gfx = this.particleGfx;
        this.smokes = this.smokes.filter(p => p.life > 0);
        for (let i = 0; i < this.smokes.length; i++) {
            const p = this.smokes[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.99; p.vy *= 0.995;
            p.life -= 0.012; p.sz += 0.3;
            gfx.fillStyle(p.tint || 0xd2d2c3, p.life * 0.15);
            gfx.fillCircle(p.x | 0, p.y | 0, p.sz / 2);
        }
    }

    // --- Dust particles ---

    spawnDust(x, y) {
        if (this.dustParticles.length > 20) return; // cap particles
        this.dustParticles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + 12 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -0.3 - Math.random() * 0.4,
            life: 1,
            sz: 2 + Math.random() * 3,
        });
    }

    drawDust() {
        const gfx = this.particleGfx;
        this.dustParticles = this.dustParticles.filter(p => p.life > 0);
        for (const p of this.dustParticles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            p.sz += 0.15;
            p.vx *= 0.97;
            gfx.fillStyle(0x8a7a5a, p.life * 0.25);
            gfx.fillCircle(p.x | 0, p.y | 0, p.sz / 2);
        }
    }

    // --- Shadows (sprite-based, GPU-batched) ---

    drawShadows() {
        // Crew shadows — just move pre-made sprites
        this.opShadow.setPosition(this.operatorSprite.x, this.operatorSprite.y + 18);
        this.corrShadow.setPosition(this.correspondentSprite.x, this.correspondentSprite.y + 18);
        this.asstShadow.setPosition(this.assistantSprite.x, this.assistantSprite.y + 18);
        this.asstShadow.setVisible(this.assistantSprite.visible);

        // Player shadows
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            const s = this.playerShadows[i];
            if (p.sprite.visible) {
                s.setPosition(p.x, p.y + 16);
                s.setVisible(true);
            } else {
                s.setVisible(false);
            }
        }
    }

    // --- Bubbles (gradient + shadow via Graphics, pop-in animation) ---

    addBubble(x, y, text, dur = 90, bgColor = 0xffffff, textColor = '#111') {
        const style = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            color: textColor,
            wordWrap: { width: 130 },
            align: 'center',
        };
        const txt = this.add.text(0, 0, text, style).setOrigin(0.5).setDepth(13);

        const bw = Math.max(txt.width + 18, 60);
        const bh = txt.height + 12;
        const safeTop = TOP_UI + CROWD_H + 8;
        const safeBottom = H - BOTTOM_UI - CROWD_H - 8;
        let bx = Phaser.Math.Clamp(x, bw / 2 + 8, W - bw / 2 - 8);
        let by = y - bh - 18;
        if (by < safeTop) by = y + 22;
        if (by + bh > safeBottom) by = safeBottom - bh;

        // Avoid overlapping with existing bubbles
        const PAD = 4;
        for (const ob of this.bubbles) {
            if (!ob.rect) continue;
            const r = ob.rect;
            if (bx + bw / 2 > r.x - r.w / 2 && bx - bw / 2 < r.x + r.w / 2) {
                if (by < r.y + r.h && by + bh > r.y) {
                    by = r.y + r.h + PAD;
                    if (by + bh > safeBottom) by = r.y - bh - PAD;
                }
            }
        }

        txt.setPosition(bx, by + bh / 2);

        // Background with gradient + shadow
        const bg = this.add.graphics().setDepth(12);
        const rc = (bgColor >> 16) & 0xff, gc = (bgColor >> 8) & 0xff, bc = bgColor & 0xff;
        const left = bx - bw / 2, top = by;

        // Shadow
        bg.fillStyle(0x000000, 0.18);
        bg.fillRoundedRect(left + 2, top + 3, bw, bh, 7);

        // Main fill (darker bottom half)
        const darkColor = Phaser.Display.Color.GetColor(
            Math.max(0, rc - 25), Math.max(0, gc - 25), Math.max(0, bc - 25)
        );
        bg.fillStyle(darkColor);
        bg.fillRoundedRect(left, top, bw, bh, 7);

        // Lighter top half (gradient effect via overlay)
        const lightColor = Phaser.Display.Color.GetColor(
            Math.min(255, rc + 20), Math.min(255, gc + 20), Math.min(255, bc + 20)
        );
        bg.fillStyle(lightColor);
        bg.fillRoundedRect(left, top, bw, Math.ceil(bh * 0.55), 7);

        // Gloss highlight
        bg.fillStyle(0xffffff, 0.15);
        bg.fillRoundedRect(left + 3, top + 2, bw - 6, Math.ceil(bh * 0.35), 5);

        // Border
        bg.lineStyle(1.5, Phaser.Display.Color.GetColor(
            Math.max(0, rc - 50), Math.max(0, gc - 50), Math.max(0, bc - 50)
        ), 0.5);
        bg.strokeRoundedRect(left, top, bw, bh, 7);

        // Tail
        const tailUp = by > y;
        if (tailUp) {
            bg.fillStyle(lightColor);
            bg.fillTriangle(bx - 5, top, bx + 5, top, bx, top - 9);
        } else {
            bg.fillStyle(darkColor);
            bg.fillTriangle(bx - 5, top + bh, bx + 5, top + bh, bx, top + bh + 9);
        }

        // Pop-in animation via container
        const container = this.add.container(bx, by + bh / 2, [bg, txt]).setDepth(12);
        // Offset children to be relative to container center
        bg.setPosition(-bx, -(by + bh / 2));
        txt.setPosition(0, 0);

        container.setScale(0.3);
        container.setAlpha(0.5);
        this.tweens.add({
            targets: container, scaleX: 1, scaleY: 1, alpha: 1,
            duration: 180, ease: 'Back.easeOut',
        });

        this.bubbles.push({ container, life: dur, rect: { x: bx, y: by, w: bw, h: bh } });
    }

    updateBubbles() {
        this.bubbles = this.bubbles.filter(b => {
            b.life--;
            if (b.life <= 0) {
                b.container.destroy();
                return false;
            }
            // Fade out last 15 frames with float-up
            if (b.life < 15) {
                const a = b.life / 15;
                b.container.setAlpha(a);
                b.container.y -= 0.3;
            }
            return true;
        });
    }

    // --- UI ---

    createTVOverlay() {
        // --- "В ЭФИРЕ" badge (top-left, pulsing) ---
        const badgeW = 90, badgeH = 24;
        const bKey = '_tvBadge';
        if (!this.textures.exists(bKey)) {
            const tex = this.textures.createCanvas(bKey, badgeW, badgeH);
            const ctx = tex.getContext();
            const r = 5;
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(badgeW - r, 0);
            ctx.quadraticCurveTo(badgeW, 0, badgeW, r);
            ctx.lineTo(badgeW, badgeH - r);
            ctx.quadraticCurveTo(badgeW, badgeH, badgeW - r, badgeH);
            ctx.lineTo(r, badgeH);
            ctx.quadraticCurveTo(0, badgeH, 0, badgeH - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(200,30,30,0.85)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,100,100,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            tex.refresh();
        }
        this.tvBadge = this.add.image(F.x + 50, F.y + 14, bKey).setDepth(15).setAlpha(0.9);
        this.tvBadgeDot = this.add.circle(F.x + 16, F.y + 14, 4, 0xff3333).setDepth(15);
        this.add.text(F.x + 25, F.y + 14, 'В ЭФИРЕ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ffffff',
        }).setOrigin(0, 0.5).setDepth(15);
        // Pulse the dot
        this.tweens.add({
            targets: this.tvBadgeDot, alpha: { from: 1, to: 0.2 },
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // --- REC icon (top-right) ---
        this.recDot = this.add.circle(F.x + F.w - 14, F.y + 14, 5, 0xff2222).setDepth(15);
        this.add.text(F.x + F.w - 24, F.y + 14, 'REC', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ff4444',
        }).setOrigin(1, 0.5).setDepth(15);
        this.tweens.add({
            targets: this.recDot, alpha: { from: 1, to: 0.15 },
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // --- Broadcast frame (thin border around field) ---
        const frameGfx = this.add.graphics().setDepth(6);
        frameGfx.lineStyle(1.5, 0xffffff, 0.12);
        frameGfx.strokeRoundedRect(F.x - 2, F.y - 2, F.w + 4, F.h + 4, 6);
        // Corner brackets for TV look
        const cb = 14;
        frameGfx.lineStyle(2, 0xffffff, 0.25);
        // top-left
        frameGfx.beginPath(); frameGfx.moveTo(F.x, F.y + cb); frameGfx.lineTo(F.x, F.y); frameGfx.lineTo(F.x + cb, F.y); frameGfx.strokePath();
        // top-right
        frameGfx.beginPath(); frameGfx.moveTo(F.x + F.w - cb, F.y); frameGfx.lineTo(F.x + F.w, F.y); frameGfx.lineTo(F.x + F.w, F.y + cb); frameGfx.strokePath();
        // bottom-left
        frameGfx.beginPath(); frameGfx.moveTo(F.x, F.y + F.h - cb); frameGfx.lineTo(F.x, F.y + F.h); frameGfx.lineTo(F.x + cb, F.y + F.h); frameGfx.strokePath();
        // bottom-right
        frameGfx.beginPath(); frameGfx.moveTo(F.x + F.w - cb, F.y + F.h); frameGfx.lineTo(F.x + F.w, F.y + F.h); frameGfx.lineTo(F.x + F.w, F.y + F.h - cb); frameGfx.strokePath();

        // --- Crawling ticker (news line at bottom of field) ---
        const tickerH = 20;
        const tickerY = F.y + F.h - tickerH / 2 - 4;
        const tickerBg = this.add.rectangle(W / 2, tickerY, F.w, tickerH, 0x0c1528, 0.8).setDepth(7);
        // Gold top line
        this.add.rectangle(W / 2, tickerY - tickerH / 2, F.w, 1, 0xffc864, 0.4).setDepth(7);

        const headlines = [
            'СРОЧНО: съёмочная группа ведёт репортаж прямо с поля',
            'ЭКСКЛЮЗИВ: корреспондент берёт интервью у игроков',
            'ВНИМАНИЕ: ассистент снова ушёл на перекур',
            'МАТЧ ДНЯ: полный стадион, зрители в восторге',
            'BREAKING: кабель запутался, оператор в шоке',
        ];
        const fullText = headlines.join('   ★   ');
        this.tickerText = this.add.text(F.x + F.w, tickerY, fullText, {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#cccccc',
        }).setOrigin(0, 0.5).setDepth(7);
        this._tickerFullW = this.tickerText.width;
        this._tickerOffset = 0;
    }

    createTopUI() {
        // Gradient top panel via CanvasTexture
        const topKey = '_uiTop';
        if (!this.textures.exists(topKey)) {
            const tex = this.textures.createCanvas(topKey, W, TOP_UI);
            const ctx = tex.getContext();
            const grad = ctx.createLinearGradient(0, 0, 0, TOP_UI);
            grad.addColorStop(0, '#0c1528');
            grad.addColorStop(0.7, '#16213e');
            grad.addColorStop(1, '#1c2a4a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, TOP_UI);
            // Subtle noise overlay
            for (let i = 0; i < 300; i++) {
                const nx = Math.random() * W, ny = Math.random() * TOP_UI;
                ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
                ctx.fillRect(nx, ny, 1, 1);
            }
            // Red accent line with glow
            ctx.save();
            ctx.shadowColor = 'rgba(231,76,60,0.6)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(0, TOP_UI - 3, W, 3);
            ctx.restore();
            // Gold trim
            ctx.fillStyle = 'rgba(243,156,18,0.3)';
            ctx.fillRect(0, TOP_UI - 4, W, 1);
            tex.refresh();
        }
        this.add.image(W / 2, TOP_UI / 2, topKey).setDepth(8);

        // МАТЧ ИНТЕРВЬЮ label via CanvasTexture
        const lblKey = '_uiLabel';
        if (!this.textures.exists(lblKey)) {
            const lw = 104, lh = 52;
            const tex = this.textures.createCanvas(lblKey, lw, lh);
            const ctx = tex.getContext();
            const r = 8;
            // Rounded rect path
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(lw - r, 0);
            ctx.quadraticCurveTo(lw, 0, lw, r);
            ctx.lineTo(lw, lh - r);
            ctx.quadraticCurveTo(lw, lh, lw - r, lh);
            ctx.lineTo(r, lh);
            ctx.quadraticCurveTo(0, lh, 0, lh - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            // Gradient fill
            const grad = ctx.createLinearGradient(0, 0, 0, lh);
            grad.addColorStop(0, '#ef5350');
            grad.addColorStop(1, '#b71c1c');
            ctx.fillStyle = grad;
            ctx.fill();
            // Inner glow
            ctx.save();
            ctx.clip();
            const hlGrad = ctx.createLinearGradient(0, 0, 0, lh * 0.4);
            hlGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
            hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hlGrad;
            ctx.fillRect(0, 0, lw, lh * 0.4);
            ctx.restore();
            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(lw - r, 0);
            ctx.quadraticCurveTo(lw, 0, lw, r);
            ctx.lineTo(lw, lh - r);
            ctx.quadraticCurveTo(lw, lh, lw - r, lh);
            ctx.lineTo(r, lh);
            ctx.quadraticCurveTo(0, lh, 0, lh - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            ctx.stroke();
            tex.refresh();
        }
        this.add.image(8 + 52, 6 + 26, lblKey).setDepth(9);

        this.add.text(60, 18, 'МАТЧ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 12, color: '#ffffff',
        }).setOrigin(0.5).setDepth(9);
        this.add.text(60, 38, 'ИНТЕРВЬЮ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffcccc',
        }).setOrigin(0.5).setDepth(9);

        // Score with glow effect
        this.scoreText = this.add.text(W / 2, 14, '0', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 30, color: '#ffffff',
            stroke: '#f39c12', strokeThickness: 1,
        }).setOrigin(0.5, 0).setDepth(9);
        this.add.text(W / 2, 50, 'взято', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffdc64',
        }).setOrigin(0.5, 0).setDepth(9);

        // Right
        this.remainText = this.add.text(W - 10, 14, `осталось:  ${TOTAL_PLAYERS}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#ffffff',
        }).setOrigin(1, 0).setDepth(9);
        this.bestText = this.add.text(W - 10, 34, `рекорд:  ${this.bestScore}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffdc64',
        }).setOrigin(1, 0).setDepth(9);
    }

    createBottomUI() {
        // Gradient bottom panel via CanvasTexture
        const botKey = '_uiBot';
        if (!this.textures.exists(botKey)) {
            const tex = this.textures.createCanvas(botKey, W, BOTTOM_UI);
            const ctx = tex.getContext();
            const grad = ctx.createLinearGradient(0, 0, 0, BOTTOM_UI);
            grad.addColorStop(0, '#1c2a4a');
            grad.addColorStop(0.3, '#16213e');
            grad.addColorStop(1, '#0c1528');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, BOTTOM_UI);
            // Top accent
            ctx.save();
            ctx.shadowColor = 'rgba(243,156,18,0.4)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = 'rgba(243,156,18,0.35)';
            ctx.fillRect(0, 0, W, 1);
            ctx.restore();
            // Noise
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
                ctx.fillRect(Math.random() * W, Math.random() * BOTTOM_UI, 1, 1);
            }
            tex.refresh();
        }
        this.add.image(W / 2, H - BOTTOM_UI + BOTTOM_UI / 2, botKey).setDepth(8);

        // Cable panel via CanvasTexture
        const cblKey = '_uiCable';
        if (!this.textures.exists(cblKey)) {
            const pw = 166, ph = 40;
            const tex = this.textures.createCanvas(cblKey, pw, ph);
            const ctx = tex.getContext();
            const r = 8;
            ctx.beginPath();
            ctx.moveTo(r, 0); ctx.lineTo(pw - r, 0);
            ctx.quadraticCurveTo(pw, 0, pw, r);
            ctx.lineTo(pw, ph - r);
            ctx.quadraticCurveTo(pw, ph, pw - r, ph);
            ctx.lineTo(r, ph);
            ctx.quadraticCurveTo(0, ph, 0, ph - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, 0, 0, ph);
            grad.addColorStop(0, 'rgba(22,33,62,0.95)');
            grad.addColorStop(1, 'rgba(12,21,40,0.95)');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,200,100,0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            tex.refresh();
        }
        this.add.image(8 + 83, H - BOTTOM_UI + 4 + 20, cblKey).setDepth(9);

        this.add.text(16, H - BOTTOM_UI + 12, '🔌 кабель:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#cccccc',
        }).setDepth(9);

        this.cableBarBgGfx = this.add.graphics().setDepth(9);
        this.cableBarBgGfx.fillStyle(0x1a1a2e);
        this.cableBarBgGfx.fillRoundedRect(16, H - BOTTOM_UI + 28, 140, 8, 4);

        this.cableBarFill = this.add.graphics().setDepth(9);

        // Timer box via CanvasTexture (redrawn when color changes)
        this._timerBoxW = 84;
        this._timerBoxH = 40;
        this._timerBoxX = W / 2 - this._timerBoxW / 2;
        this._timerBoxY = H - BOTTOM_UI + 7;
        this._timerColor = 0x2ecc71;

        this._makeTimerBox(0x2ecc71);
        this.timerBoxImg = this.add.image(
            this._timerBoxX + this._timerBoxW / 2,
            this._timerBoxY + this._timerBoxH / 2,
            '_uiTimer'
        ).setDepth(9);

        this.timerText = this.add.text(
            this._timerBoxX + this._timerBoxW / 2,
            this._timerBoxY + this._timerBoxH / 2,
            '5:00', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 18, color: '#2ecc71',
            }
        ).setOrigin(0.5).setDepth(10);

        // Smoke banner (hidden initially)
        this.smokeBannerGfx = this.add.graphics().setDepth(10);
        this.smokeBannerText = this.add.text(W / 2, H - BOTTOM_UI - 26, 'ассистент курит 🚬', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#e8e8d0',
        }).setOrigin(0.5).setDepth(11).setVisible(false);
        this.smokeBarGfx = this.add.graphics().setDepth(11);
    }

    _makeTimerBox(borderColor) {
        const key = '_uiTimer';
        if (this.textures.exists(key)) this.textures.remove(key);
        const tw = this._timerBoxW, th = this._timerBoxH, r = 10;
        const pad = 6;
        const tex = this.textures.createCanvas(key, tw + pad * 2, th + pad * 2);
        const ctx = tex.getContext();
        const ox = pad, oy = pad;
        const bR = (borderColor >> 16) & 0xff, bG = (borderColor >> 8) & 0xff, bB = borderColor & 0xff;

        // Shadow
        ctx.save();
        ctx.shadowColor = `rgba(${bR},${bG},${bB},0.4)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(ox + r, oy); ctx.lineTo(ox + tw - r, oy);
        ctx.quadraticCurveTo(ox + tw, oy, ox + tw, oy + r);
        ctx.lineTo(ox + tw, oy + th - r);
        ctx.quadraticCurveTo(ox + tw, oy + th, ox + tw - r, oy + th);
        ctx.lineTo(ox + r, oy + th);
        ctx.quadraticCurveTo(ox, oy + th, ox, oy + th - r);
        ctx.lineTo(ox, oy + r);
        ctx.quadraticCurveTo(ox, oy, ox + r, oy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fill();
        ctx.restore();

        // Gradient fill
        const grad = ctx.createLinearGradient(ox, oy, ox, oy + th);
        grad.addColorStop(0, 'rgba(20,20,30,0.9)');
        grad.addColorStop(1, 'rgba(5,5,15,0.95)');
        ctx.beginPath();
        ctx.moveTo(ox + r, oy); ctx.lineTo(ox + tw - r, oy);
        ctx.quadraticCurveTo(ox + tw, oy, ox + tw, oy + r);
        ctx.lineTo(ox + tw, oy + th - r);
        ctx.quadraticCurveTo(ox + tw, oy + th, ox + tw - r, oy + th);
        ctx.lineTo(ox + r, oy + th);
        ctx.quadraticCurveTo(ox, oy + th, ox, oy + th - r);
        ctx.lineTo(ox, oy + r);
        ctx.quadraticCurveTo(ox, oy, ox + r, oy);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Glowing border
        ctx.save();
        ctx.shadowColor = `rgba(${bR},${bG},${bB},0.5)`;
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `rgb(${bR},${bG},${bB})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ox + r, oy); ctx.lineTo(ox + tw - r, oy);
        ctx.quadraticCurveTo(ox + tw, oy, ox + tw, oy + r);
        ctx.lineTo(ox + tw, oy + th - r);
        ctx.quadraticCurveTo(ox + tw, oy + th, ox + tw - r, oy + th);
        ctx.lineTo(ox + r, oy + th);
        ctx.quadraticCurveTo(ox, oy + th, ox, oy + th - r);
        ctx.lineTo(ox, oy + r);
        ctx.quadraticCurveTo(ox, oy, ox + r, oy);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        tex.refresh();
    }

    updateUI() {
        this.scoreText.setText(`${this.score}`);
        const rem = this.players.filter(p => p.st === 'idle' || p.st === 'flee').length;
        this.remainText.setText(`осталось:  ${rem}`);
        if (this.score > 0) this.bestText.setText(`рекорд:  ${this.bestScore}`);
        this.updateCableBar();
    }

    updateCableBar() {
        const r = Math.min(1, (this.snakeMaxLen - INIT_LEN) / (TOTAL_PLAYERS * CABLE_GROW));
        this.cableBarFill.clear();
        const color = r > 0.65 ? 0xe74c3c : r > 0.35 ? 0xf39c12 : 0x2ecc71;
        this.cableBarFill.fillStyle(color);
        this.cableBarFill.fillRoundedRect(16, H - BOTTOM_UI + 28, Math.max(4, Math.round(140 * r)), 8, 4);
    }

    updateTimerDisplay() {
        // Only update once per second (60 frames)
        if (this.gameTimer % 60 !== 0 && this.gameTimer > 1) return;

        const secLeft = Math.max(0, GAME_DURATION - Math.floor(this.gameTimer / 60));
        const mm = Math.floor(secLeft / 60);
        const ss = secLeft % 60;
        this.timerText.setText(`${mm}:${ss < 10 ? '0' : ''}${ss}`);

        const borderColor = secLeft < 60 ? 0xe74c3c : secLeft < 120 ? 0xf39c12 : 0x2ecc71;
        const textCss = secLeft < 60 ? '#e74c3c' : secLeft < 120 ? '#f39c12' : '#2ecc71';
        this.timerText.setColor(textCss);

        // Rebuild timer box texture only when color changes
        if (borderColor !== this._timerColor) {
            this._timerColor = borderColor;
            this._makeTimerBox(borderColor);
            this.timerBoxImg.setTexture('_uiTimer');
        }
    }

    updateSmokeBanner() {
        if (this.gst === 'smoke') {
            if (this.frames % 4 !== 0) return;
            this.smokeBannerText.setVisible(true);

            // Banner background — subtle gradient panel
            this.smokeBannerGfx.clear();
            this.smokeBannerGfx.fillStyle(0x0c1528, 0.92);
            this.smokeBannerGfx.fillRoundedRect(W / 2 - 114, H - BOTTOM_UI - 44, 228, 42, 8);
            this.smokeBannerGfx.fillStyle(0x16213e, 0.6);
            this.smokeBannerGfx.fillRoundedRect(W / 2 - 114, H - BOTTOM_UI - 44, 228, 20, 8);
            this.smokeBannerGfx.lineStyle(1.5, 0xffc864, 0.3);
            this.smokeBannerGfx.strokeRoundedRect(W / 2 - 114, H - BOTTOM_UI - 44, 228, 42, 8);

            // Progress bar with color transition
            const progress = this.smokeT / 200;
            this.smokeBarGfx.clear();
            this.smokeBarGfx.fillStyle(0x1a1a2e);
            this.smokeBarGfx.fillRoundedRect(W / 2 - 90, H - BOTTOM_UI - 16, 180, 8, 4);
            const barColor = progress > 0.5 ? 0xaaaaaa : progress > 0.25 ? 0xd4a044 : 0xcc6644;
            this.smokeBarGfx.fillStyle(barColor);
            this.smokeBarGfx.fillRoundedRect(W / 2 - 90, H - BOTTOM_UI - 16, Math.max(4, Math.round(180 * progress)), 8, 4);
        } else if (this.smokeBannerText.visible) {
            this.smokeBannerText.setVisible(false);
            this.smokeBannerGfx.clear();
            this.smokeBarGfx.clear();
        }
    }

    // --- Game Over / Die ---

    die() {
        if (this.gst !== 'playing') return;
        this.gst = 'dead';
        this.snakeStopped = false;
        this.addBubble(this.hx, this.hy - 22, 'Я УВОЛЕН!!!', 250, 0xe63946, '#fff');
        this.cameras.main.shake(400, 0.025);

        if (this.score > this.bestScore) {
            localStorage.setItem('tvu_best', this.score.toString());
        }

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOver', {
                score: this.score,
                total: TOTAL_PLAYERS,
                best: Math.max(this.score, this.bestScore),
                won: false,
            });
        });
    }

    timeUp() {
        this.gst = 'timeup';
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('tvu_best', this.score.toString());
        }
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOver', {
                score: this.score,
                total: TOTAL_PLAYERS,
                best: Math.max(this.score, this.bestScore),
                won: false,
                timeup: true,
            });
        });
    }

    updateTicker() {
        if (!this.tickerText) return;
        this._tickerOffset -= 0.8;
        if (this._tickerOffset < -this._tickerFullW) this._tickerOffset = F.w;
        this.tickerText.x = F.x + this._tickerOffset;
    }

    checkWin() {
        if (this.gst !== 'playing') return;
        const allDone = this.players.every(p =>
            p.st === 'done' || Math.abs(p.x - (F.x + F.w / 2)) > F.w / 2 + 50
        );
        if (allDone) {
            // Confetti celebration
            for (let i = 0; i < 30; i++) {
                const confetti = this.add.rectangle(
                    W/2 + (Math.random()-0.5)*300, H/2,
                    4 + Math.random()*4, 8 + Math.random()*8,
                    [0xffd700, 0xff4444, 0x44aaff, 0x44ff44, 0xff66aa][Math.floor(Math.random()*5)]
                ).setDepth(20).setAngle(Math.random()*360);
                this.tweens.add({
                    targets: confetti,
                    y: confetti.y - 200 - Math.random()*300,
                    x: confetti.x + (Math.random()-0.5)*200,
                    angle: confetti.angle + (Math.random()-0.5)*720,
                    alpha: 0,
                    duration: 1500 + Math.random()*1000,
                    ease: 'Cubic.easeOut',
                    onComplete: () => confetti.destroy()
                });
            }

            this.addBubble(W / 2, H / 2, '🏆 ВСЕ ОПРОШЕНЫ!', 320, 0xffd700, '#111');
            this.time.delayedCall(2500, () => {
                this.gst = 'timeup';
                if (this.score > this.bestScore) this.bestScore = this.score;
                localStorage.setItem('tvu_best', this.bestScore.toString());
                this.scene.start('GameOver', {
                    score: this.score, total: TOTAL_PLAYERS,
                    best: this.bestScore, won: true,
                });
            });
        }
    }

    // --- Main loop ---

    update() {
        this.frames++;
        if (this.gst === 'timeup') return;

        // Keyboard
        if (this.gst === 'playing' && !this.snakeStopped) this.handleKeyboard();

        // Timer
        if (this.gst === 'playing' || this.gst === 'smoke') {
            this.gameTimer++;
            if (this.gameTimer >= GAME_DURATION * 60) {
                this.timeUp();
                return;
            }
        }

        if (this.gst === 'playing') {
            this.updateSnake();
            this.tryInterview();
            this.updateInterview();
            if (this.snakeSelfCollide()) { this.die(); return; }
            this.updatePlayers();
        } else if (this.gst === 'smoke') {
            this.updateSmoke();
            this.updatePlayers();
        } else if (this.gst === 'dead') {
            this.updatePlayers();
        }

        this.drawCable();
        this.particleGfx.clear();
        this.drawDust();
        this.drawSmokes();
        this.drawCrewSprites();
        this.drawShadows();
        this.updateBubbles();
        this.updateTimerDisplay();
        this.updateSmokeBanner();
        this.updateTicker();
        this.checkWin();
    }
}
