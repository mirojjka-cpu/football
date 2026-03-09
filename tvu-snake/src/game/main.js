import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';

const config = {
    type: AUTO,
    width: 540,
    height: 960,
    parent: 'game-container',
    backgroundColor: '#16213e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;
