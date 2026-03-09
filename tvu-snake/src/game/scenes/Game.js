import { Scene } from 'phaser';
import { drawField } from '../utils/field';
import { createTextures, TEAM_A, TEAM_B, QUESTIONS, ANSWERS } from '../utils/sprites';

// Layout
const W = 540;
const H = 960;
const TOP_UI = 60;        // top bar height
const BOTTOM_UI = 50;     // bottom bar height
const FIELD_TOP = TOP_UI;
const FIELD_BOTTOM = H - BOTTOM_UI;
const FIELD_H = FIELD_BOTTOM - FIELD_TOP;

// Grid
const GRID = 28;
const COLS = Math.floor(W / GRID);          // 19
const ROWS = Math.floor(FIELD_H / GRID);    // 30
const FIELD_OFFSET_X = (W - COLS * GRID) / 2;
const FIELD_OFFSET_Y = FIELD_TOP + (FIELD_H - ROWS * GRID) / 2;

// Gameplay
const INITIAL_SPEED = 160;
const MIN_SPEED = 70;
const SPEED_STEP = 3;
const TOTAL_PLAYERS = 21;
const PLAYERS_ON_FIELD = 6; // visible at once
const GAME_TIME = 300;      // 5 minutes in seconds

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        // Draw field with UI offsets
        drawField(this, W, H, TOP_UI, BOTTOM_UI);
        createTextures(this);

        // State
        this.score = 0;
        this.moveTimer = 0;
        this.speed = INITIAL_SPEED;
        this.direction = { x: 0, y: -1 }; // start moving up
        this.nextDirection = { x: 0, y: -1 };
        this.isPaused = false;
        this.isGameOver = false;
        this.interviewsLeft = TOTAL_PLAYERS;
        this.gameTime = GAME_TIME;
        this.bestScore = parseInt(localStorage.getItem('tvu_best') || '0');
        this.playerSpriteIndex = 0;

        // Snake
        const startX = Math.floor(COLS / 2);
        const startY = Math.floor(ROWS / 2) + 3;
        this.snake = [
            { x: startX, y: startY },
            { x: startX, y: startY + 1 },
            { x: startX, y: startY + 2 },
        ];

        // Visuals
        this.snakeSprites = [];
        this.cableGraphics = this.add.graphics().setDepth(2);

        // Create initial snake visuals
        this.createSnakeHead();
        this.rebuildSnakeSprites();

        // Football players
        this.footballPlayers = [];
        for (let i = 0; i < Math.min(PLAYERS_ON_FIELD, TOTAL_PLAYERS); i++) {
            this.spawnPlayer();
        }

        // --- TOP UI ---
        this.createTopUI();

        // --- BOTTOM UI ---
        this.createBottomUI();

        // --- Dialog system ---
        this.dialogContainer = this.add.container(0, 0).setDepth(15);
        this.dialogContainer.setVisible(false);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard.addKey('W'),
            A: this.input.keyboard.addKey('A'),
            S: this.input.keyboard.addKey('S'),
            D: this.input.keyboard.addKey('D'),
        };

        // Touch / swipe
        this.swipeStart = null;
        this.input.on('pointerdown', (pointer) => {
            this.swipeStart = { x: pointer.x, y: pointer.y };
        });
        this.input.on('pointerup', (pointer) => {
            if (!this.swipeStart) return;
            const dx = pointer.x - this.swipeStart.x;
            const dy = pointer.y - this.swipeStart.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.setDirection(dx > 0 ? 1 : -1, 0);
            } else {
                this.setDirection(0, dy > 0 ? 1 : -1);
            }
            this.swipeStart = null;
        });

        // Smoke particles
        this.smokeEmitter = this.add.particles(0, 0, 'smoke', {
            speed: { min: 10, max: 30 },
            angle: { min: 240, max: 300 },
            lifespan: 800,
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            frequency: -1,
        });
        this.smokeEmitter.setDepth(6);

        // Game timer
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true,
        });
    }

    // --- UI Creation ---

    createTopUI() {
        // Dark bar bg
        const topBg = this.add.graphics().setDepth(8);
        topBg.fillStyle(0x0f1629, 0.95);
        topBg.fillRect(0, 0, W, TOP_UI);

        // "МАТЧ ИНТЕРВЬЮ" label
        const label = this.add.graphics().setDepth(9);
        label.fillStyle(0xcc3333);
        label.fillRoundedRect(8, 8, 100, 44, 4);
        this.add.text(58, 18, 'МАТЧ', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 11,
            color: '#ffffff',
        }).setOrigin(0.5).setDepth(9);
        this.add.text(58, 36, 'ИНТЕРВЬЮ', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#ffcccc',
        }).setOrigin(0.5).setDepth(9);

        // Score (center)
        this.scoreText = this.add.text(W / 2, 16, '0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 32,
            color: '#ffffff',
        }).setOrigin(0.5, 0).setDepth(9);

        this.add.text(W / 2, 48, 'взято', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#888888',
        }).setOrigin(0.5, 0).setDepth(9);

        // Right side — remaining + record
        this.remainText = this.add.text(W - 12, 12, `осталось: ${this.interviewsLeft}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: '#cccccc',
        }).setOrigin(1, 0).setDepth(9);

        this.bestText = this.add.text(W - 12, 32, `рекорд: ${this.bestScore}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#888888',
        }).setOrigin(1, 0).setDepth(9);
    }

    createBottomUI() {
        // Dark bar bg
        const botBg = this.add.graphics().setDepth(8);
        botBg.fillStyle(0x0f1629, 0.95);
        botBg.fillRect(0, FIELD_BOTTOM, W, BOTTOM_UI);

        // Cable label
        this.add.text(12, FIELD_BOTTOM + 10, 'кабель:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            color: '#888888',
        }).setDepth(9);

        // Cable progress bar bg
        const barX = 12;
        const barY = FIELD_BOTTOM + 30;
        const barW = 120;
        const barH = 10;
        const barBg = this.add.graphics().setDepth(9);
        barBg.fillStyle(0x333333);
        barBg.fillRoundedRect(barX, barY, barW, barH, 3);
        this.cableBarBg = barBg;

        // Cable progress bar fill
        this.cableBar = this.add.graphics().setDepth(9);
        this.updateCableBar();

        // Timer (center bottom)
        this.timerText = this.add.text(W / 2, FIELD_BOTTOM + 20, '5:00', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 20,
            color: '#00ff66',
            stroke: '#003311',
            strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9);

        // Smoke status text
        this.smokeStatusText = this.add.text(W / 2, FIELD_BOTTOM + 40, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(9);
    }

    // --- Snake visuals ---

    createSnakeHead() {
        // Crew = operator + correspondent side by side
        const headPos = this.gridToPixel(this.snake[0].x, this.snake[0].y);
        this.operatorSprite = this.add.image(headPos.x - 8, headPos.y, 'operator')
            .setDepth(5).setScale(0.7);
        this.correspondentSprite = this.add.image(headPos.x + 14, headPos.y, 'correspondent')
            .setDepth(5).setScale(0.7);
    }

    rebuildSnakeSprites() {
        this.snakeSprites.forEach(s => s.destroy());
        this.snakeSprites = [];

        // Skip head (index 0), it's the operator+correspondent
        for (let i = 1; i < this.snake.length; i++) {
            const pos = this.gridToPixel(this.snake[i].x, this.snake[i].y);
            const sprite = this.add.image(pos.x, pos.y, 'cable_dot').setDepth(2);
            this.snakeSprites.push(sprite);
        }
    }

    drawSnake() {
        // Update head position
        const headPos = this.gridToPixel(this.snake[0].x, this.snake[0].y);

        // Position operator + correspondent based on direction
        const dir = this.direction;
        let opOff = { x: -10, y: 0 };
        let corrOff = { x: 10, y: 0 };
        if (dir.y === -1) { opOff = { x: -10, y: 0 }; corrOff = { x: 10, y: 0 }; }
        if (dir.y === 1) { opOff = { x: 10, y: 0 }; corrOff = { x: -10, y: 0 }; }
        if (dir.x === 1) { opOff = { x: 0, y: -10 }; corrOff = { x: 0, y: 10 }; }
        if (dir.x === -1) { opOff = { x: 0, y: 10 }; corrOff = { x: 0, y: -10 }; }

        this.operatorSprite.setPosition(headPos.x + opOff.x, headPos.y + opOff.y);
        this.correspondentSprite.setPosition(headPos.x + corrOff.x, headPos.y + corrOff.y);

        // Cable line
        this.cableGraphics.clear();
        this.cableGraphics.lineStyle(4, 0x111111, 0.9);
        this.cableGraphics.beginPath();

        const hp = this.gridToPixel(this.snake[0].x, this.snake[0].y);
        this.cableGraphics.moveTo(hp.x, hp.y);

        // Ensure correct number of body sprites
        const bodyCount = this.snake.length - 1;
        while (this.snakeSprites.length < bodyCount) {
            const sprite = this.add.image(0, 0, 'cable_dot').setDepth(2);
            this.snakeSprites.push(sprite);
        }
        while (this.snakeSprites.length > bodyCount) {
            this.snakeSprites.pop().destroy();
        }

        for (let i = 1; i < this.snake.length; i++) {
            const seg = this.snake[i];
            const pos = this.gridToPixel(seg.x, seg.y);
            const prev = this.snake[i - 1];
            const dist = Math.abs(prev.x - seg.x) + Math.abs(prev.y - seg.y);

            if (dist <= 1) {
                this.cableGraphics.lineTo(pos.x, pos.y);
            } else {
                this.cableGraphics.moveTo(pos.x, pos.y);
            }

            const sprite = this.snakeSprites[i - 1];
            sprite.setPosition(pos.x, pos.y);

            // Last segment = TVU pack
            if (i === this.snake.length - 1) {
                sprite.setTexture('tvu_pack');
                sprite.setScale(0.8);
                sprite.setDepth(3);
            } else {
                sprite.setTexture('cable_dot');
                sprite.setScale(1);
                sprite.setDepth(2);
            }
        }
        this.cableGraphics.strokePath();
    }

    // --- Grid helpers ---

    gridToPixel(gx, gy) {
        return {
            x: FIELD_OFFSET_X + gx * GRID + GRID / 2,
            y: FIELD_OFFSET_Y + gy * GRID + GRID / 2,
        };
    }

    setDirection(x, y) {
        if (this.direction.x === -x && this.direction.y === -y) return;
        this.nextDirection = { x, y };
    }

    // --- Main loop ---

    update(time, delta) {
        if (this.isGameOver) return;
        this.handleInput();
        if (this.isPaused) return;

        this.moveTimer += delta;
        if (this.moveTimer < this.speed) return;
        this.moveTimer = 0;

        this.direction = { ...this.nextDirection };

        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };

        // Wall wrap
        if (newHead.x < 0) newHead.x = COLS - 1;
        if (newHead.x >= COLS) newHead.x = 0;
        if (newHead.y < 0) newHead.y = ROWS - 1;
        if (newHead.y >= ROWS) newHead.y = 0;

        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
                this.gameOver();
                return;
            }
        }

        // Check food
        let ate = false;
        let ateIndex = -1;
        for (let i = 0; i < this.footballPlayers.length; i++) {
            const p = this.footballPlayers[i];
            if (p.x === newHead.x && p.y === newHead.y) {
                ate = true;
                ateIndex = i;
                break;
            }
        }

        this.snake.unshift(newHead);
        if (!ate) {
            this.snake.pop();
        } else {
            const eaten = this.footballPlayers.splice(ateIndex, 1)[0];
            if (eaten.sprite) {
                this.tweens.killTweensOf(eaten.sprite);
                eaten.sprite.destroy();
            }

            this.score++;
            this.interviewsLeft--;
            this.speed = Math.max(MIN_SPEED, INITIAL_SPEED - this.score * SPEED_STEP);

            this.updateUI();
            this.triggerInterview(eaten);
        }

        this.drawSnake();
    }

    handleInput() {
        const { cursors, wasd } = this;
        if (cursors.left.isDown || wasd.A.isDown) this.setDirection(-1, 0);
        else if (cursors.right.isDown || wasd.D.isDown) this.setDirection(1, 0);
        else if (cursors.up.isDown || wasd.W.isDown) this.setDirection(0, -1);
        else if (cursors.down.isDown || wasd.S.isDown) this.setDirection(0, 1);
    }

    // --- Player spawning ---

    spawnPlayer() {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Phaser.Math.Between(1, COLS - 2),
                y: Phaser.Math.Between(1, ROWS - 2),
            };
            attempts++;
        } while (this.isOccupied(pos.x, pos.y) && attempts < 100);
        if (attempts >= 100) return;

        const idx = this.playerSpriteIndex++ % 24;
        const number = Phaser.Math.Between(1, 99);
        const player = { x: pos.x, y: pos.y, number, spriteIdx: idx };

        const pixelPos = this.gridToPixel(pos.x, pos.y);
        const container = this.add.container(pixelPos.x, pixelPos.y).setDepth(4);

        const img = this.add.image(0, 0, `player_${idx}`).setScale(0.5);
        container.add(img);

        const numText = this.add.text(0, 2, `${number}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);
        container.add(numText);

        // Idle bobbing
        this.tweens.add({
            targets: container,
            y: pixelPos.y - 3,
            duration: 500 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        player.sprite = container;
        this.footballPlayers.push(player);
    }

    isOccupied(x, y) {
        for (const seg of this.snake) {
            if (seg.x === x && seg.y === y) return true;
        }
        for (const p of this.footballPlayers) {
            if (p.x === x && p.y === y) return true;
        }
        return false;
    }

    // --- Interview + Smoke ---

    triggerInterview(eaten) {
        this.isPaused = true;

        const headPos = this.gridToPixel(this.snake[0].x, this.snake[0].y);
        const question = QUESTIONS[Phaser.Math.Between(0, QUESTIONS.length - 1)];
        const answer = ANSWERS[Phaser.Math.Between(0, ANSWERS.length - 1)];

        // Show dialog
        this.showDialog(headPos.x, headPos.y, question, answer);

        // After dialog — smoke break
        this.time.delayedCall(2500, () => {
            this.hideDialog();

            if (this.interviewsLeft <= 0) {
                this.victory();
                return;
            }

            // Smoke break
            this.smokeStatusText.setText('ассистент курит 🚬');

            const tail = this.snake[this.snake.length - 1];
            const tailPos = this.gridToPixel(tail.x, tail.y);
            this.smokeEmitter.setPosition(tailPos.x, tailPos.y - 10);
            this.smokeEmitter.explode(8);

            this.time.delayedCall(500, () => {
                this.smokeEmitter.explode(6);
            });

            // Show "так, перекур!" near the crew
            const breakText = this.add.text(headPos.x, headPos.y - 30, 'так, перекур!  🚬', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8,
                color: '#cccccc',
                backgroundColor: '#333333aa',
                padding: { x: 6, y: 4 },
            }).setOrigin(0.5).setDepth(15);

            this.time.delayedCall(1500, () => {
                breakText.destroy();
                this.smokeStatusText.setText('');
                this.isPaused = false;

                // Spawn more players
                while (this.footballPlayers.length < Math.min(PLAYERS_ON_FIELD, this.interviewsLeft)) {
                    this.spawnPlayer();
                }
            });
        });
    }

    showDialog(x, y, question, answer) {
        this.dialogContainer.removeAll(true);
        this.dialogContainer.setVisible(true);

        // Clamp dialog position to screen
        const dx = Phaser.Math.Clamp(x, 110, W - 110);
        const dy = Phaser.Math.Clamp(y - 60, FIELD_TOP + 20, FIELD_BOTTOM - 100);

        // Question bubble
        const qBg = this.add.image(0, 0, 'bubble_question').setOrigin(0.5).setScale(0.8);
        const qText = this.add.text(0, -4, question, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#cc3333',
            wordWrap: { width: 140 },
            align: 'center',
        }).setOrigin(0.5);

        // Answer bubble (below)
        const aBg = this.add.image(0, 50, 'bubble').setOrigin(0.5).setScale(0.8);
        const aText = this.add.text(0, 46, answer, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#333333',
            wordWrap: { width: 140 },
            align: 'center',
        }).setOrigin(0.5);

        this.dialogContainer.add([qBg, qText, aBg, aText]);
        this.dialogContainer.setPosition(dx, dy);

        // Animate in
        this.dialogContainer.setScale(0);
        this.tweens.add({
            targets: this.dialogContainer,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
        });
    }

    hideDialog() {
        this.tweens.add({
            targets: this.dialogContainer,
            scale: 0,
            duration: 200,
            onComplete: () => {
                this.dialogContainer.setVisible(false);
            }
        });
    }

    // --- Timer ---

    tickTimer() {
        if (this.isPaused || this.isGameOver) return;
        this.gameTime--;
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.gameOver();
        }
        this.updateTimerText();
    }

    updateTimerText() {
        const m = Math.floor(this.gameTime / 60);
        const s = this.gameTime % 60;
        this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
        if (this.gameTime <= 30) {
            this.timerText.setColor('#ff4444');
        } else if (this.gameTime <= 60) {
            this.timerText.setColor('#ffcc00');
        }
    }

    // --- UI Updates ---

    updateUI() {
        this.scoreText.setText(`${this.score}`);
        this.remainText.setText(`осталось: ${this.interviewsLeft}`);
        this.updateCableBar();
    }

    updateCableBar() {
        const barX = 12;
        const barY = FIELD_BOTTOM + 30;
        const barW = 120;
        const barH = 10;
        const fill = Math.min(1, (this.snake.length - 3) / (TOTAL_PLAYERS));

        this.cableBar.clear();
        // Green → yellow → red gradient based on length
        let color = 0x00cc66;
        if (fill > 0.6) color = 0xcccc00;
        if (fill > 0.8) color = 0xcc3333;
        this.cableBar.fillStyle(color);
        this.cableBar.fillRoundedRect(barX, barY, Math.max(4, barW * fill), barH, 3);
    }

    // --- End states ---

    gameOver() {
        this.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove();

        // Save best
        if (this.score > this.bestScore) {
            localStorage.setItem('tvu_best', this.score.toString());
        }

        this.cameras.main.flash(500, 255, 0, 0);
        this.cameras.main.shake(300, 0.02);

        this.time.delayedCall(800, () => {
            this.scene.start('GameOver', {
                score: this.score,
                total: TOTAL_PLAYERS,
                best: Math.max(this.score, this.bestScore),
            });
        });
    }

    victory() {
        this.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove();

        localStorage.setItem('tvu_best', TOTAL_PLAYERS.toString());

        const winText = this.add.text(W / 2, H / 2, '🏆 ЭФИР ЗАКРЫТ!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 20,
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(20).setScale(0);

        this.tweens.add({
            targets: winText,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
        });

        this.time.delayedCall(2500, () => {
            this.scene.start('GameOver', {
                score: this.score,
                total: TOTAL_PLAYERS,
                won: true,
                best: TOTAL_PLAYERS,
            });
        });
    }
}
