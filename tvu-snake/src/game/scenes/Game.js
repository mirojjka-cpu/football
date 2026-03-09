import { Scene } from 'phaser';
import { drawField } from '../utils/field';
import { createTextures, SHIRT_COLORS } from '../utils/sprites';

const GRID = 24;          // cell size in px
const COLS = 33;           // 800 / 24 ≈ 33
const ROWS = 25;           // 600 / 24 = 25
const INITIAL_SPEED = 140; // ms per move
const MIN_SPEED = 60;
const SPEED_STEP = 3;      // ms faster per interview
const MARGIN = 2;          // field margin in grid cells
const TOTAL_PLAYERS = 11;  // players on field

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        const { width, height } = this.scale;

        // Draw field
        drawField(this, width, height);
        createTextures(this);

        // State
        this.score = 0;
        this.moveTimer = 0;
        this.speed = INITIAL_SPEED;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.isPaused = false;       // smoke break pause
        this.isGameOver = false;
        this.interviewsLeft = TOTAL_PLAYERS;

        // Snake body: array of {x, y} grid positions
        const startX = Math.floor(COLS / 2);
        const startY = Math.floor(ROWS / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
        ];

        // Visual containers
        this.snakeSprites = [];
        this.playerSprites = [];
        this.cableGraphics = this.add.graphics();
        this.cableGraphics.setDepth(1);

        // Create snake sprites
        this.rebuildSnakeSprites();

        // Spawn football players
        this.footballPlayers = [];
        for (let i = 0; i < Math.min(3, TOTAL_PLAYERS); i++) {
            this.spawnPlayer();
        }

        // Score text
        this.scoreText = this.add.text(16, 8, '', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);
        this.updateScoreText();

        // Interview popup
        this.interviewText = this.add.text(width / 2, height / 2, '', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Smoke break text
        this.smokeText = this.add.text(width / 2, height / 2 + 40, '', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

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
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (Math.max(absDx, absDy) < 30) return; // too short

            if (absDx > absDy) {
                this.setDirection(dx > 0 ? 1 : -1, 0);
            } else {
                this.setDirection(0, dy > 0 ? 1 : -1);
            }
            this.swipeStart = null;
        });

        // Smoke particles emitter
        this.smokeEmitter = this.add.particles(0, 0, 'smoke', {
            speed: { min: 10, max: 30 },
            angle: { min: 240, max: 300 },
            lifespan: 800,
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.7, end: 0 },
            frequency: -1, // manual emit
        });
        this.smokeEmitter.setDepth(5);
    }

    setDirection(x, y) {
        // Prevent 180° turn
        if (this.direction.x === -x && this.direction.y === -y) return;
        this.nextDirection = { x, y };
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Handle input
        this.handleInput();

        if (this.isPaused) return;

        // Move timer
        this.moveTimer += delta;
        if (this.moveTimer < this.speed) return;
        this.moveTimer = 0;

        // Apply direction
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };

        // Wall collision — wrap around
        if (newHead.x < 0) newHead.x = COLS - 1;
        if (newHead.x >= COLS) newHead.x = 0;
        if (newHead.y < 0) newHead.y = ROWS - 1;
        if (newHead.y >= ROWS) newHead.y = 0;

        // Self collision (skip head)
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

        // Move snake
        this.snake.unshift(newHead);
        if (!ate) {
            this.snake.pop();
        } else {
            // Remove eaten player
            const eaten = this.footballPlayers.splice(ateIndex, 1)[0];
            this.removePlayerSprite(eaten);

            this.score++;
            this.interviewsLeft--;
            this.speed = Math.max(MIN_SPEED, INITIAL_SPEED - this.score * SPEED_STEP);

            this.updateScoreText();

            // Trigger interview + smoke break
            this.triggerInterview(eaten);
        }

        // Redraw snake
        this.drawSnake();
    }

    handleInput() {
        const { cursors, wasd } = this;
        if (cursors.left.isDown || wasd.A.isDown) this.setDirection(-1, 0);
        else if (cursors.right.isDown || wasd.D.isDown) this.setDirection(1, 0);
        else if (cursors.up.isDown || wasd.W.isDown) this.setDirection(0, -1);
        else if (cursors.down.isDown || wasd.S.isDown) this.setDirection(0, 1);
    }

    gridToPixel(gx, gy) {
        return { x: gx * GRID + GRID / 2, y: gy * GRID + GRID / 2 };
    }

    rebuildSnakeSprites() {
        // Clear old
        this.snakeSprites.forEach(s => s.destroy());
        this.snakeSprites = [];

        this.snake.forEach((seg, i) => {
            const pos = this.gridToPixel(seg.x, seg.y);
            let sprite;
            if (i === 0) {
                sprite = this.add.image(pos.x, pos.y, 'crew').setDepth(4);
            } else if (i === this.snake.length - 1) {
                sprite = this.add.image(pos.x, pos.y, 'tvu').setDepth(3);
            } else {
                sprite = this.add.image(pos.x, pos.y, 'cable').setDepth(2);
            }
            this.snakeSprites.push(sprite);
        });
    }

    drawSnake() {
        // Ensure correct number of sprites
        while (this.snakeSprites.length < this.snake.length) {
            const sprite = this.add.image(0, 0, 'cable').setDepth(2);
            this.snakeSprites.push(sprite);
        }
        while (this.snakeSprites.length > this.snake.length) {
            this.snakeSprites.pop().destroy();
        }

        // Draw cable line
        this.cableGraphics.clear();
        this.cableGraphics.lineStyle(3, 0x111111, 0.8);
        this.cableGraphics.beginPath();

        this.snake.forEach((seg, i) => {
            const pos = this.gridToPixel(seg.x, seg.y);
            const sprite = this.snakeSprites[i];

            // Set texture
            if (i === 0) {
                sprite.setTexture('crew');
                sprite.setDepth(4);
                // Rotate head based on direction
                sprite.setAngle(this.getAngle());
            } else if (i === this.snake.length - 1) {
                sprite.setTexture('tvu');
                sprite.setDepth(3);
            } else {
                sprite.setTexture('cable');
                sprite.setDepth(2);
            }

            sprite.setPosition(pos.x, pos.y);

            // Cable line
            if (i === 0) {
                this.cableGraphics.moveTo(pos.x, pos.y);
            } else {
                // Only draw line if not wrapping around
                const prev = this.snake[i - 1];
                const dist = Math.abs(prev.x - seg.x) + Math.abs(prev.y - seg.y);
                if (dist <= 1) {
                    this.cableGraphics.lineTo(pos.x, pos.y);
                } else {
                    this.cableGraphics.moveTo(pos.x, pos.y);
                }
            }
        });
        this.cableGraphics.strokePath();
    }

    getAngle() {
        const { x, y } = this.direction;
        if (x === 1) return 0;
        if (x === -1) return 180;
        if (y === -1) return -90;
        if (y === 1) return 90;
        return 0;
    }

    spawnPlayer() {
        let pos;
        let attempts = 0;
        do {
            pos = {
                x: Phaser.Math.Between(MARGIN, COLS - MARGIN - 1),
                y: Phaser.Math.Between(MARGIN, ROWS - MARGIN - 1),
            };
            attempts++;
        } while (this.isOccupied(pos.x, pos.y) && attempts < 100);

        if (attempts >= 100) return;

        const player = { x: pos.x, y: pos.y, number: Phaser.Math.Between(1, 99) };
        this.footballPlayers.push(player);

        const pixelPos = this.gridToPixel(pos.x, pos.y);
        const color = SHIRT_COLORS[this.footballPlayers.length % SHIRT_COLORS.length];

        // Player sprite group
        const container = this.add.container(pixelPos.x, pixelPos.y);
        container.setDepth(3);

        // Colored shirt circle
        const circle = this.add.graphics();
        circle.fillStyle(color);
        circle.fillCircle(0, 0, 10);
        circle.fillStyle(0xf5c6a0);
        circle.fillCircle(0, -6, 5); // head
        container.add(circle);

        // Number
        const numText = this.add.text(0, 2, `${player.number}`, {
            fontFamily: 'Arial Black',
            fontSize: 9,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);
        container.add(numText);

        // Idle animation — slight bobbing
        this.tweens.add({
            targets: container,
            y: pixelPos.y - 3,
            duration: 600 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        player.sprite = container;
    }

    removePlayerSprite(player) {
        if (player.sprite) {
            this.tweens.killTweensOf(player.sprite);
            player.sprite.destroy();
        }
    }

    isOccupied(x, y) {
        // Check snake
        for (const seg of this.snake) {
            if (seg.x === x && seg.y === y) return true;
        }
        // Check other players
        for (const p of this.footballPlayers) {
            if (p.x === x && p.y === y) return true;
        }
        return false;
    }

    triggerInterview(eaten) {
        this.isPaused = true;

        const headPos = this.gridToPixel(this.snake[0].x, this.snake[0].y);

        // Show interview text
        const phrases = [
            `Интервью с #${eaten.number}!`,
            `#${eaten.number}: "Отличная игра!"`,
            `#${eaten.number}: "Мы старались!"`,
            `#${eaten.number}: "Спасибо болельщикам!"`,
            `#${eaten.number}: "Тренер — лучший!"`,
            `#${eaten.number}: "Главное — команда!"`,
        ];
        const phrase = phrases[Phaser.Math.Between(0, phrases.length - 1)];

        // Mic icon near head
        const mic = this.add.image(headPos.x + 20, headPos.y - 20, 'mic')
            .setDepth(10).setScale(0);
        this.tweens.add({
            targets: mic,
            scale: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
        });

        this.interviewText.setText(phrase);
        this.tweens.add({
            targets: this.interviewText,
            alpha: 1,
            duration: 300,
        });

        // After 1.5s — smoke break
        this.time.delayedCall(1500, () => {
            this.interviewText.setAlpha(0);
            mic.destroy();

            if (this.interviewsLeft <= 0) {
                this.victory();
                return;
            }

            // Smoke break
            this.smokeText.setText('🚬 Перекур ассистента...');
            this.tweens.add({
                targets: this.smokeText,
                alpha: 1,
                duration: 300,
            });

            // Smoke particles from TVU (tail)
            const tail = this.snake[this.snake.length - 1];
            const tailPos = this.gridToPixel(tail.x, tail.y);
            this.smokeEmitter.setPosition(tailPos.x, tailPos.y - 8);
            this.smokeEmitter.explode(8);

            this.time.delayedCall(600, () => {
                this.smokeEmitter.explode(6);
            });

            // After smoke — resume
            this.time.delayedCall(1200, () => {
                this.smokeText.setAlpha(0);
                this.isPaused = false;

                // Spawn new player if needed
                if (this.footballPlayers.length < Math.min(3, this.interviewsLeft)) {
                    this.spawnPlayer();
                }
            });
        });
    }

    updateScoreText() {
        this.scoreText.setText(
            `🎤 Интервью: ${this.score}/${TOTAL_PLAYERS}  |  📏 Кабель: ${this.snake.length}м`
        );
    }

    gameOver() {
        this.isGameOver = true;

        // Flash red
        this.cameras.main.flash(500, 255, 0, 0);
        this.cameras.main.shake(300, 0.02);

        this.time.delayedCall(800, () => {
            this.scene.start('GameOver', { score: this.score, total: TOTAL_PLAYERS });
        });
    }

    victory() {
        this.isGameOver = true;
        const { width, height } = this.scale;

        const winText = this.add.text(width / 2, height / 2, '🏆 ВСЕ ИНТЕРВЬЮ ЗАПИСАНЫ!', {
            fontFamily: 'Arial Black',
            fontSize: 28,
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
            this.scene.start('GameOver', { score: this.score, total: TOTAL_PLAYERS, won: true });
        });
    }
}
