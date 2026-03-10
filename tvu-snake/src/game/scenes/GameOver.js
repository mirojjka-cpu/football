import { Scene } from 'phaser';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.totalPlayers = data.total || 22;
        this.won = data.won || false;
        this.best = data.best || 0;
        this.timeup = data.timeup || false;
    }

    create() {
        const W = 540, H = 960;
        const TOP_UI = 62, BOTTOM_UI = 54, CROWD_H = 28;

        // Reuse baked textures from Game scene (already generated)
        if (this.textures.exists('_field')) {
            this.add.image(W / 2, H / 2, '_field').setDepth(-1);
        }
        if (this.textures.exists('_crowdTop')) {
            this.add.image(W / 2, TOP_UI + CROWD_H / 2, '_crowdTop').setDepth(0);
        }
        if (this.textures.exists('_crowdBot')) {
            this.add.image(W / 2, H - BOTTOM_UI - CROWD_H / 2, '_crowdBot').setDepth(0);
        }

        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.82);
        overlay.fillRect(0, 0, W, H);

        // Panel
        const PW = 300, PH = 260;
        const PX = W / 2 - PW / 2, PY = H / 2 - PH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x16213e);
        panel.fillRoundedRect(PX, PY, PW, PH, 14);
        panel.lineStyle(4, 0x1a1a2e);
        panel.strokeRoundedRect(PX, PY, PW, PH, 14);
        panel.lineStyle(2, 0xf39c12);
        panel.strokeRect(PX + 4, PY + 4, PW - 8, PH - 8);

        // Title bar
        if (this.won) {
            panel.fillStyle(0x2ecc71);
            panel.fillRoundedRect(PX, PY, PW, 48, 14);
            this.add.text(W / 2, PY + 18, '🏆 ВСЕ ОПРОШЕНЫ!', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: '#ffffff',
            }).setOrigin(0.5);
        } else if (this.timeup) {
            panel.fillStyle(0x1a5276);
            panel.fillRoundedRect(PX, PY, PW, 48, 14);
            this.add.text(W / 2, PY + 14, 'ТАЙМАУТ!', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 16, color: '#ffffff',
            }).setOrigin(0.5);
            this.add.text(W / 2, PY + 36, 'финальный свисток', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#ffdc64',
            }).setOrigin(0.5);
        } else {
            panel.fillStyle(0xe74c3c);
            panel.fillRoundedRect(PX, PY, PW, 48, 14);
            this.add.text(W / 2, PY + 14, 'ОПЕРАТОР УПАЛ!', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: '#ffffff',
            }).setOrigin(0.5);
            this.add.text(W / 2, PY + 36, 'камера вдребезги 📷💥', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#ecf0f1',
            }).setOrigin(0.5);
        }

        // Big score
        this.add.text(W / 2, PY + 100, `${this.finalScore}`, {
            fontFamily: '"Press Start 2P", monospace', fontSize: 48, color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(W / 2, PY + 136, 'интервью взято', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#ffdc64',
        }).setOrigin(0.5);

        if (this.timeup || this.won) {
            const pct = Math.round(this.finalScore / this.totalPlayers * 100);
            const pctColor = pct >= 80 ? '#2ecc71' : pct >= 50 ? '#f39c12' : '#e74c3c';
            this.add.text(W / 2, PY + 158, `${pct}% выполнено`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: 12, color: pctColor,
            }).setOrigin(0.5);
        }

        if (this.finalScore >= this.best && this.finalScore > 0) {
            this.add.text(W / 2, PY + 180, '★ НОВЫЙ РЕКОРД ★', {
                fontFamily: '"Press Start 2P", monospace', fontSize: 11, color: '#f39c12',
            }).setOrigin(0.5);
        }

        // Restart button
        const btn = this.add.text(W / 2, PY + 220, '►  СНОВА В ЭФИР  ◄', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 11, color: '#ffffff',
            backgroundColor: '#e74c3c', padding: { x: 16, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: btn, alpha: 0.55, duration: 600,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#c0392b' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#e74c3c' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
