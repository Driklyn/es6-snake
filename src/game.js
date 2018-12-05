import { Constants } from './constants';
import Random from './math/random';
import Grid from './grid';
import Snake from './snake';

export default class Game extends HTMLElement {
	connectedCallback() {
		const shadowRoot = this.attachShadow({ mode: 'open' });

		this.reset();
		this.setupShadowDom(shadowRoot);
		this.setupCanvas(shadowRoot);
		this.setupGrid();
		this.setupSnake();
		this.spawnApple();
		this.render();

		window.requestAnimationFrame(timestamp => this.update(timestamp));
	}

	reset() {
		this.shouldUpdate = true;
		this.updateDelay  = Constants.MAX_UPDATE_DELAY;
		this.applesEaten  = 0;
		this.lastUpdated  = undefined;
		this.lastLevelUp  = undefined;
		this.isMaxLevel   = undefined;
	}

	setupShadowDom(shadowRoot) {
		shadowRoot.innerHTML = `
			<style>
				:host,
				canvas {
					align-self: center;
					display: flex;
					height: 100%;
					justify-content: center;
					width: 100%;
				}
			</style>
			<canvas></canvas>
		`;
	}

	setupCanvas(shadowRoot) {
		this.canvas  = shadowRoot.querySelector('canvas');
		this.context = this.canvas.getContext('2d');

		this.canvas.width  = Constants.WORLD_WIDTH  * Constants.CELL_SIZE * window.devicePixelRatio;
		this.canvas.height = Constants.WORLD_HEIGHT * Constants.CELL_SIZE * window.devicePixelRatio;

		this.context.scale(window.devicePixelRatio, window.devicePixelRatio);

		this.canvasResizer = new ResizeObserver(() => this.resizeCanvas());

		this.canvasResizer.observe(document.body);
	}

	setupGrid() {
		this.grid = new Grid(Constants.WORLD_WIDTH, Constants.WORLD_HEIGHT);
	}

	setupSnake() {
		this.snake = new Snake(this, this.grid);
	}

	resizeCanvas() {
		this.canvas.style.width  = null;
		this.canvas.style.height = null;

		const widthRatio  = this.canvas.clientWidth  / this.canvas.clientHeight;
		const heightRatio = this.canvas.clientHeight / this.canvas.clientWidth;

		if (widthRatio <= heightRatio) {
			this.canvas.style.height = `${this.canvas.clientHeight * widthRatio}px`;
		} else {
			this.canvas.style.width = `${this.canvas.clientWidth * heightRatio}px`;
		}
	}

	clearCanvas() {
		this.context.fillStyle = Constants.CLEAR_COLOR;
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	update(timestamp) {
		window.requestAnimationFrame(timestamp => this.update(timestamp));

		if (!this.lastUpdated) {
			this.lastUpdated = timestamp;
		}

		if (timestamp - this.lastUpdated < this.updateDelay)
			return;

		if (!this.isGameOver) {
			this.snake.update();
		}

		this.lastUpdated = timestamp;

		this.render();
	}

	render() {
		this.clearCanvas();

		this.grid.forEachCell((col, row, cellValue) => {
			if (cellValue === Constants.EMPTY_CELL_VALUE)
				return;

			switch (cellValue) {
				case Constants.WALL_CELL_VALUE:
					this.context.fillStyle = Constants.WALL_COLOR;
					break;

				case Constants.SNAKE_CELL_VALUE:
					this.context.fillStyle = Constants.SNAKE_COLOR;
					break;

				case Constants.APPLE_CELL_VALUE:
					this.context.fillStyle = Constants.APPLE_COLOR;
					break;
			}

			const x = col * Constants.CELL_SIZE;
			const y = (this.grid.height - 1 - row) * Constants.CELL_SIZE;

			this.context.fillRect(x, y, Constants.CELL_SIZE, Constants.CELL_SIZE);
		});

		this.renderText();
	}

	renderText() {
		const centerX = this.canvas.width  / 2 / window.devicePixelRatio;
		const centerY = this.canvas.height / 2 / window.devicePixelRatio;

		if (this.isPlaying) {
			if (this.lastUpdated - this.lastLevelUp < Constants.LEVEL_UP_DURATION) {
				const levelText = (this.updateDelay > Constants.MIN_UPDATE_DELAY) ? 'LEVEL UP' : 'MAX LEVEL';
				this.fillText(levelText, centerX, centerY, Constants.LEVEL_UP_FONT, Constants.APPLE_COLOR);
			}

			return;
		}

		let pressText  = 'Press any direction';
		let actionText = 'to begin';

		if (this.isGameOver) {
			this.fillText('GAME OVER', centerX, centerY - Constants.CELL_SIZE * 3, Constants.GAME_OVER_FONT, Constants.TEXT_COLOR);

			pressText  = 'Press space';
			actionText = 'to restart';
		}

		this.fillText(pressText,  centerX, centerY + Constants.CELL_SIZE * 3, Constants.GAME_START_FONT, Constants.TEXT_COLOR);
		this.fillText(actionText, centerX, centerY + Constants.CELL_SIZE * 5, Constants.GAME_START_FONT, Constants.TEXT_COLOR);
	}

	fillText(text, x, y, font, fillStyle) {
		this.context.font         = font;
		this.context.fillStyle    = fillStyle;
		this.context.textAlign    = 'center';
		this.context.textBaseline = 'middle';
		this.context.lineWidth    = 5;
		this.context.strokeStyle  = Constants.CLEAR_COLOR;

		this.context.strokeText(text, x, y);
		this.context.fillText  (text, x, y);
	}

	spawnApple() {
		let col = 0;
		let row = 0;

		while (this.grid.getCellValue(col, row) !== Constants.EMPTY_CELL_VALUE) {
			col = Random.arrayIndex(0, Constants.WORLD_WIDTH);
			row = Random.arrayIndex(0, Constants.WORLD_HEIGHT);
		}

		this.grid.setCellValue(col, row, Constants.APPLE_CELL_VALUE);
	}

	onAppleEaten() {
		this.applesEaten++;

		if (this.applesEaten % Constants.APPLES_PER_LEVEL === 0 && !this.isMaxLevel) {
			this.updateDelay = Math.max(this.updateDelay - Constants.UPDATE_DELAY_DECREMENT, Constants.MIN_UPDATE_DELAY);
			this.lastLevelUp = this.lastUpdated;
			this.isMaxLevel  = this.updateDelay === Constants.MIN_UPDATE_DELAY;
		}

		this.spawnApple();
	}

	onGameStart() {
		this.isPlaying = true;
	}

	onGameOver() {
		this.isPlaying  = false;
		this.isGameOver = true;
	}

	onRestart() {
		this.grid .reset();
		this.snake.reset();
		this      .reset();

		this.isGameOver = false;

		this.spawnApple();
	}
}

customElements.define('snake-game', Object.freeze(Game));
