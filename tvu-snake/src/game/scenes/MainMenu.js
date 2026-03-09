import { Scene } from 'phaser';
import { drawField } from '../utils/field';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Football field background
        drawField(this, width, height);

        // Title
        this.add.text(width / 2, height / 2 - 80, 'TVU SNAKE', {
            fontFamily: 'Arial Black',
            fontSize: 52,
            color: '#ffffff',
            stroke: '#1a1a2e',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 2 - 20, 'Интервью после матча', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#e0e0e0',
            stroke: '#1a1a2e',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'Стрелки / WASD / свайп — управление',
            'Лови игроков для интервью',
            'Не наступай на кабель!'
        ];

        instructions.forEach((text, i) => {
            this.add.text(width / 2, height / 2 + 40 + i * 30, text, {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#cccccc',
                stroke: '#1a1a2e',
                strokeThickness: 3
            }).setOrigin(0.5);
        });

        // Start button
        const btn = this.add.text(width / 2, height / 2 + 160, '▶  НАЧАТЬ СЪЁМКУ', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#c0392b' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#e74c3c' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Also start on any key
        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
