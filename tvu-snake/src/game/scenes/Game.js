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
        // Background + field + crowd — bake to textures for mobile perf
        // Each drawField/drawCrowd creates a Graphics with hundreds of primitives;
        // converting to a static texture turns them into a single GPU sprite each.
        if (!this.textures.exists('_field')) {
            const fg = drawField(this, W, H, TOP_UI, BOTTOM_UI, CROWD_H, CROWD_H);
            fg.generateTexture('_field', W, H);
            fg.destroy();
        }
        this.add.image(W / 2, H / 2, '_field').setDepth(-1);

        if (!this.textures.exists('_crowdTop')) {
            const cg = drawCrowd(this, 0, 0, W, CROWD_H);
            cg.generateTexture('_crowdTop', W, CROWD_H);
            cg.destroy();
        }
        this.add.image(W / 2, TOP_UI + CROWD_H / 2, '_crowdTop').setDepth(0);

        if (!this.textures.exists('_crowdBot')) {
            const cb = drawCrowd(this, 0, 0, W, CROWD_H);
            cb.generateTexture('_crowdBot', W, CROWD_H);
            cb.destroy();
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

        // Crew sprites (scaled to match field proportions)
        this.operatorSprite = this.add.image(0, 0, 'operator').setDepth(5).setScale(0.44);
        this.correspondentSprite = this.add.image(0, 0, 'correspondent').setDepth(5).setScale(0.44);
        this.assistantSprite = this.add.image(0, 0, 'assistant').setDepth(3).setScale(0.43);

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
        this.operatorSprite.setScale(0.44 * squashX, 0.44 * squashY);

        // Correspondent in front
        this.correspondentSprite.setPosition(this.hx + offset, this.hy + bob);
        this.correspondentSprite.setFlipX(!faceRight);
        this.correspondentSprite.setScale(0.44 * squashX, 0.44 * squashY);

        // Assistant at tail
        const tail = this.snakeTail();
        if (tail) {
            this.assistantSprite.setPosition(tail.x, tail.y + bobAlt);
            this.assistantSprite.setFlipX(!faceRight);
            this.assistantSprite.setScale(0.43 * squashX, 0.43 * squashY);
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
        const img = this.add.image(0, 0, `player_${texIdx}`).setScale(0.42);
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

                    // Bounce the player being interviewed
                    this.tweens.add({
                        targets: p.sprite,
                        scaleY: { from: 0.9, to: 1.05 },
                        scaleX: { from: 1.05, to: 0.97 },
                        duration: 250,
                        yoyo: true,
                        repeat: 2,
                        ease: 'Bounce.easeOut'
                    });

                    const playerPhrase = ANSWERS[Phaser.Math.Between(0, ANSWERS.length - 1)];
                    const corrPhrase = QUESTIONS[Phaser.Math.Between(0, QUESTIONS.length - 1)];

                    // Correspondent question — above crew
                    const faceRight = this.snakeAngle > -Math.PI / 2 && this.snakeAngle <= Math.PI / 2;
                    const corrX = faceRight ? this.hx + 22 : this.hx - 22;
                    this.addBubble(corrX, Math.min(this.hy, p.y) - 10, corrPhrase, 165, 0xfff0f3, '#a00');
                    // Player phrase — collision avoidance in addBubble prevents overlap
                    this.addBubble(p.x, p.y, playerPhrase, 130, 0xfffbe6, '#333');
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

            // Score popup animation
            const plus = this.add.text(this.hx, this.hy - 40, '+1', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 22, color: '#ffd700',
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(15);
            this.tweens.add({
                targets: plus, y: plus.y - 50, alpha: 0,
                duration: 900, ease: 'Cubic.easeOut',
                onComplete: () => plus.destroy()
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
        this.dustParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            p.sz += 0.15;
            p.vx *= 0.97;
            gfx.fillStyle(0x8a7a5a, p.life * 0.25);
            gfx.fillCircle(Math.round(p.x), Math.round(p.y), p.sz / 2);
        });
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

    // --- Bubbles ---

    addBubble(x, y, text, dur = 90, bgColor = 0xffffff, textColor = '#111') {
        const bg = this.add.graphics().setDepth(12);
        const style = {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            color: textColor,
            wordWrap: { width: 130 },
            align: 'center',
        };
        const txt = this.add.text(0, 0, text, style).setOrigin(0.5).setDepth(13);

        // Position bubble above the point, clamped within safe area
        const bw = Math.max(txt.width + 16, 60);
        const bh = txt.height + 10;
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
            // Check horizontal overlap
            if (bx + bw / 2 > r.x - r.w / 2 && bx - bw / 2 < r.x + r.w / 2) {
                // Check vertical overlap
                if (by < r.y + r.h && by + bh > r.y) {
                    // Push this bubble below the existing one
                    by = r.y + r.h + PAD;
                    if (by + bh > safeBottom) {
                        // No room below — push above the existing one
                        by = r.y - bh - PAD;
                    }
                }
            }
        }

        txt.setPosition(bx, by + bh / 2);

        // Bubble background
        bg.fillStyle(bgColor);
        bg.fillRoundedRect(bx - bw / 2, by, bw, bh, 6);
        bg.lineStyle(2, 0x1a1a2e);
        bg.strokeRoundedRect(bx - bw / 2, by, bw, bh, 6);
        // Tail
        const tailUp = by > y;
        if (tailUp) {
            bg.fillTriangle(bx - 4, by, bx + 4, by, bx, by - 8);
        } else {
            bg.fillTriangle(bx - 4, by + bh, bx + 4, by + bh, bx, by + bh + 8);
        }

        this.bubbles.push({ bg, txt, life: dur, rect: { x: bx, y: by, w: bw, h: bh } });
    }

    updateBubbles() {
        this.bubbles = this.bubbles.filter(b => {
            b.life--;
            if (b.life <= 0) {
                b.bg.destroy();
                b.txt.destroy();
                return false;
            }
            // Fade out last 12 frames
            if (b.life < 12) {
                const a = b.life / 12;
                b.bg.setAlpha(a);
                b.txt.setAlpha(a);
            }
            return true;
        });
    }

    // --- UI ---

    createTopUI() {
        const topBg = this.add.graphics().setDepth(8);
        topBg.fillStyle(0x16213e, 0.95);
        topBg.fillRect(0, 0, W, TOP_UI);
        // Red accent line
        topBg.fillStyle(0xe74c3c);
        topBg.fillRect(0, TOP_UI - 3, W, 3);

        // МАТЧ ИНТЕРВЬЮ label
        const label = this.add.graphics().setDepth(9);
        label.fillStyle(0xe74c3c);
        label.fillRoundedRect(8, 6, 100, 50, 6);
        label.lineStyle(3, 0x1a1a2e);
        label.strokeRoundedRect(8, 6, 100, 50, 6);
        this.add.text(58, 18, 'МАТЧ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 12, color: '#ffffff',
        }).setOrigin(0.5).setDepth(9);
        this.add.text(58, 38, 'ИНТЕРВЬЮ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffcccc',
        }).setOrigin(0.5).setDepth(9);

        // Score
        this.scoreText = this.add.text(W / 2, 14, '0', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 30, color: '#ffffff',
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
        const botBg = this.add.graphics().setDepth(8);
        botBg.fillStyle(0x16213e, 0.95);
        botBg.fillRect(0, H - BOTTOM_UI, W, BOTTOM_UI);

        // Cable bar
        const cablePanel = this.add.graphics().setDepth(9);
        cablePanel.fillStyle(0x16213e, 0.9);
        cablePanel.fillRoundedRect(8, H - BOTTOM_UI + 4, 162, 38, 6);
        cablePanel.lineStyle(1.5, 0xffc864, 0.3);
        cablePanel.strokeRoundedRect(8, H - BOTTOM_UI + 4, 162, 38, 6);

        this.add.text(16, H - BOTTOM_UI + 12, '🔌 кабель:', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#cccccc',
        }).setDepth(9);

        this.cableBarBgGfx = this.add.graphics().setDepth(9);
        this.cableBarBgGfx.fillStyle(0x1a1a2e);
        this.cableBarBgGfx.fillRoundedRect(16, H - BOTTOM_UI + 28, 140, 8, 4);

        this.cableBarFill = this.add.graphics().setDepth(9);

        // Timer box (center-right bottom)
        const timerBoxW = 80;
        const timerBoxH = 36;
        const timerBoxX = W / 2 - timerBoxW / 2;
        const timerBoxY = H - BOTTOM_UI + 9;

        this.timerBox = this.add.graphics().setDepth(9);
        this.timerBox.fillStyle(0x000000, 0.6);
        this.timerBox.fillRoundedRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 8);
        this.timerBox.lineStyle(2.5, 0x2ecc71);
        this.timerBox.strokeRoundedRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 8);

        this.timerText = this.add.text(timerBoxX + timerBoxW / 2, timerBoxY + timerBoxH / 2, '5:00', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 18, color: '#2ecc71',
        }).setOrigin(0.5).setDepth(10);

        // Smoke banner (hidden initially)
        this.smokeBannerGfx = this.add.graphics().setDepth(10);
        this.smokeBannerText = this.add.text(W / 2, H - BOTTOM_UI - 26, 'ассистент курит 🚬', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#e8e8d0',
        }).setOrigin(0.5).setDepth(11).setVisible(false);
        this.smokeBarGfx = this.add.graphics().setDepth(11);
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
        // Only update once per second (60 frames) — was redrawing graphics every frame
        if (this.gameTimer % 60 !== 0 && this.gameTimer > 1) return;

        const secLeft = Math.max(0, GAME_DURATION - Math.floor(this.gameTimer / 60));
        const mm = Math.floor(secLeft / 60);
        const ss = secLeft % 60;
        this.timerText.setText(`${mm}:${ss < 10 ? '0' : ''}${ss}`);

        const borderColor = secLeft < 60 ? 0xe74c3c : secLeft < 120 ? 0xf39c12 : 0x2ecc71;
        this.timerText.setColor(secLeft < 60 ? '#e74c3c' : secLeft < 120 ? '#f39c12' : '#2ecc71');

        const timerBoxW = 80, timerBoxH = 36;
        const timerBoxX = W / 2 - timerBoxW / 2, timerBoxY = H - BOTTOM_UI + 9;
        this.timerBox.clear();
        this.timerBox.fillStyle(0x000000, 0.6);
        this.timerBox.fillRoundedRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 8);
        this.timerBox.lineStyle(2.5, borderColor);
        this.timerBox.strokeRoundedRect(timerBoxX, timerBoxY, timerBoxW, timerBoxH, 8);
    }

    updateSmokeBanner() {
        if (this.gst === 'smoke') {
            // Only redraw progress bar every 4th frame
            if (this.frames % 4 !== 0) return;
            this.smokeBannerText.setVisible(true);
            this.smokeBannerGfx.clear();
            this.smokeBannerGfx.fillStyle(0x16213e, 0.92);
            this.smokeBannerGfx.fillRoundedRect(W / 2 - 114, H - BOTTOM_UI - 44, 228, 42, 8);
            this.smokeBannerGfx.lineStyle(1.5, 0xffc864, 0.3);
            this.smokeBannerGfx.strokeRoundedRect(W / 2 - 114, H - BOTTOM_UI - 44, 228, 42, 8);

            this.smokeBarGfx.clear();
            this.smokeBarGfx.fillStyle(0x1a1a2e);
            this.smokeBarGfx.fillRoundedRect(W / 2 - 90, H - BOTTOM_UI - 16, 180, 8, 4);
            this.smokeBarGfx.fillStyle(0xaaaaaa);
            this.smokeBarGfx.fillRoundedRect(W / 2 - 90, H - BOTTOM_UI - 16, Math.round(180 * (this.smokeT / 200)), 8, 4);
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
        this.checkWin();
    }
}
