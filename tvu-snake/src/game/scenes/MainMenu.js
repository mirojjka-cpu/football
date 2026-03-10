import { Scene } from 'phaser';
import { drawField, drawCrowd } from '../utils/field';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const W = 540, H = 960;
        const TOP_UI = 62, BOTTOM_UI = 54, CROWD_H = 28;

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

        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.82);
        overlay.fillRect(0, 0, W, H);

        // Panel
        const PW = 340, PH = 380;
        const PX = W / 2 - PW / 2, PY = H / 2 - PH / 2 - 10;

        const panel = this.add.graphics();
        panel.fillStyle(0x16213e);
        panel.fillRoundedRect(PX, PY, PW, PH, 16);
        panel.lineStyle(4, 0x1a1a2e);
        panel.strokeRoundedRect(PX, PY, PW, PH, 16);

        // Title bar (red)
        panel.fillStyle(0xe74c3c);
        panel.fillRoundedRect(PX, PY, PW, 62, 16);
        panel.fillStyle(0xc0392b);
        panel.fillRect(PX, PY + 32, PW, 30);
        // Gold border
        panel.lineStyle(2, 0xf39c12);
        panel.strokeRect(PX + 4, PY + 4, PW - 8, PH - 8);

        this.add.text(W / 2, PY + 22, 'МАТЧ ТВ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 22, color: '#ffffff',
        }).setOrigin(0.5);
        this.add.text(W / 2, PY + 46, 'ИНТЕРВЬЮ', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: '#ffffff',
        }).setOrigin(0.5);

        // Rules
        const RY = PY + 82;
        this.add.text(W / 2, RY, '── КАК ИГРАТЬ ──', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#f39c12',
        }).setOrigin(0.5);

        const rules = [
            '🎙️  Подходи к игрокам',
            '     и бери интервью',
            '🚬  После каждого ассистент',
            '     курит — кабель удлиняется',
            '⚡  Не наступи на кабель!',
            '     Оператор упадёт 📷💥',
            '⏱️  Успей опросить всех',
            '     за 5 минут',
        ];

        rules.forEach((text, i) => {
            this.add.text(PX + 20, RY + 20 + i * 22, text, {
                fontFamily: '"Press Start 2P", monospace', fontSize: 9,
                color: i % 2 === 0 ? '#ecf0f1' : '#8899bb',
            });
        });

        // Tip
        this.add.text(W / 2, PY + 286, 'тап по полю — команда идёт туда', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ffffc8',
        }).setOrigin(0.5).setAlpha(0.35);

        // Start button
        const btn = this.add.text(W / 2, PY + 320, '►  В ЭФИР!  ◄', {
            fontFamily: '"Press Start 2P", monospace', fontSize: 14, color: '#ffffff',
            backgroundColor: '#e74c3c', padding: { x: 20, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: btn, alpha: 0.6, duration: 600,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#c0392b' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#e74c3c' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Best score
        const best = parseInt(localStorage.getItem('tvu_best') || '0');
        if (best > 0) {
            this.add.text(W / 2, PY + 360, `★ рекорд: ${best} ★`, {
                fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#ffd700',
            }).setOrigin(0.5);
        }

        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
