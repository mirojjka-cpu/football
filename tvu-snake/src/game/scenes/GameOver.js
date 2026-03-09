import { Scene } from 'phaser';
import { drawField } from '../utils/field';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.totalPlayers = data.total || 11;
        this.won = data.won || false;
    }

    create() {
        const { width, height } = this.scale;

        drawField(this, width, height);

        // Darken overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, width, height);

        if (this.won) {
            this.add.text(width / 2, height / 2 - 80, '🏆 ЭФИР ЗАКРЫТ!', {
                fontFamily: 'Arial Black',
                fontSize: 42,
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5);

            this.add.text(width / 2, height / 2 - 20, 'Все интервью записаны!', {
                fontFamily: 'Arial',
                fontSize: 22,
                color: '#66ff66',
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5);
        } else {
            this.add.text(width / 2, height / 2 - 80, '💥 ОПЕРАТОР УПАЛ!', {
                fontFamily: 'Arial Black',
                fontSize: 42,
                color: '#ff4444',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5);

            this.add.text(width / 2, height / 2 - 20, 'Наступил на кабель...', {
                fontFamily: 'Arial',
                fontSize: 22,
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5);
        }

        this.add.text(width / 2, height / 2 + 30, `Интервью: ${this.finalScore} / ${this.totalPlayers}`, {
            fontFamily: 'Arial Black',
            fontSize: 26,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Restart button
        const btn = this.add.text(width / 2, height / 2 + 100, '🔄  ПЕРЕСЪЁМКА', {
            fontFamily: 'Arial Black',
            fontSize: 26,
            color: '#ffffff',
            backgroundColor: '#2ecc71',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#27ae60' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2ecc71' }));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Menu button
        const menuBtn = this.add.text(width / 2, height / 2 + 160, 'В МЕНЮ', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#aaaaaa'));
        menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));

        // Any key to restart
        this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    }
}
