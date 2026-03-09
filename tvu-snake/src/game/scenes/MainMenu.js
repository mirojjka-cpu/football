import { Scene } from 'phaser';
import { drawField } from '../utils/field';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        drawField(this, width, height, 60, 50);

        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, height / 2 - 120, 'TVU SNAKE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#1a1a2e',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 70, 'Интервью после матча', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 12,
            color: '#cccccc',
            stroke: '#1a1a2e',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Instructions
        const lines = [
            '↑←↓→ / WASD — управление',
            'свайп на мобильных',
            '',
            'Лови игроков для интервью!',
            'Не наступай на кабель!',
            'Успей за 5 минут!',
        ];

        lines.forEach((text, i) => {
            this.add.text(width / 2, height / 2 - 10 + i * 24, text, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                color: '#aaaaaa',
            }).setOrigin(0.5);
        });

        // Start button
        const btn = this.add.text(width / 2, height / 2 + 160, '▶  НАЧАТЬ СЪЁМКУ', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 14,
            color: '#ffffff',
            backgroundColor: '#cc3333',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#aa2222' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#cc3333' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
