import { Scene } from 'phaser';
import { drawField } from '../utils/field';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.totalPlayers = data.total || 21;
        this.won = data.won || false;
        this.best = data.best || 0;
    }

    create() {
        const { width, height } = this.scale;

        drawField(this, width, height, 60, 50);

        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.65);
        overlay.fillRect(0, 0, width, height);

        if (this.won) {
            this.add.text(width / 2, height / 2 - 100, '🏆 ЭФИР ЗАКРЫТ!', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 22,
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 6,
            }).setOrigin(0.5);

            this.add.text(width / 2, height / 2 - 50, 'Все интервью записаны!', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 11,
                color: '#66ff66',
            }).setOrigin(0.5);
        } else {
            this.add.text(width / 2, height / 2 - 100, '💥 ОПЕРАТОР УПАЛ!', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 22,
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 6,
            }).setOrigin(0.5);

            this.add.text(width / 2, height / 2 - 50, 'Наступил на кабель...', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 11,
                color: '#cccccc',
            }).setOrigin(0.5);
        }

        // Score
        this.add.text(width / 2, height / 2, `${this.finalScore}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 40, `из ${this.totalPlayers} интервью`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: '#aaaaaa',
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 65, `рекорд: ${this.best}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: '#ffcc00',
        }).setOrigin(0.5);

        // Restart
        const btn = this.add.text(width / 2, height / 2 + 120, '🔄  ПЕРЕСЪЁМКА', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 14,
            color: '#ffffff',
            backgroundColor: '#2ecc71',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#27ae60' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2ecc71' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Menu
        const menuBtn = this.add.text(width / 2, height / 2 + 170, 'В МЕНЮ', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: '#888888',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
        menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));

        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
