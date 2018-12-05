import { Constants } from './constants';

// The logic for the snake works as such:
//   1) the user controls the snake's head by pressing directional keys,
//   2) when a user eats an apple, a new body part is added to the end of the snake,
//   3) the new body part (the tail) sits static for 1 update so that it doesn't collide with the body part before it (the old tail),
//   4) after 1 update, the new tail begins moving in the same direction as the old tail,
//   5) each time the user changes directions, a velocity is stored in the grid cell the snake's head currently occupies,
//   6) when any body part moves through a cell that has a stored velocity, the velocity of that body part is updated to match it,
//      with the end result giving the appearance that the snake's head and all other body parts are connected as one
//
export default class Snake {
	constructor(game, grid) {
		this.game = game;
		this.grid = grid;

		this.reset();

		document.addEventListener('keydown', e => this.setVelocity(e));
	}

	reset() {
		this.setupBodyParts();
	}

	setupBodyParts() {
		this.bodyParts = [];

		this.addBodyPart({
			col:       Math.floor(this.grid.width  / 2),
			row:       Math.floor(this.grid.height / 2),
			velocityX: 0,
			velocityY: 0,
		});

		this.grid.setCellValue(this.head.col, this.head.row, Constants.SNAKE_CELL_VALUE);
	}

	addBodyPart(data = { col, row, velocityX, velocityY }) {
		this.bodyParts.push(data);
	}

	get head() {
		return this.bodyParts[0];
	}

	get tail() {
		return this.bodyParts[this.bodyParts.length - 1];
	}

	setVelocity(e) {
		if (this.game.isGameOver) {
			if (e.code === 'Space') {
				this.game.onRestart();
			}

			return;
		}

		const lastVelocityX = this.head.velocityX;
		const lastVelocityY = this.head.velocityY;

		switch (e.code) {
			case 'KeyW':
			case 'ArrowUp':
				this.head.velocityX = 0;
				this.head.velocityY = 1;
				break;

			case 'KeyA':
			case 'ArrowLeft':
				this.head.velocityX = -1;
				this.head.velocityY = 0;
				break;

			case 'KeyS':
			case 'ArrowDown':
				this.head.velocityX = 0;
				this.head.velocityY = -1;
				break;

			case 'KeyD':
			case 'ArrowRight':
				this.head.velocityX = 1;
				this.head.velocityY = 0;
				break;
		}

		if (this.head.velocityX === lastVelocityX && this.head.velocityY === lastVelocityY)
			return;

		if (!this.game.isPlaying) {
			this.game.onGameStart();
		}

		if (this.bodyParts.length > 1) {
			// Store the velocity of the snake's head (i.e. the new direction the user decided to move towards) in the grid cell it currently occupies,
			// to allow all other body parts that make up the snake to modify their velocities as they move through this cell during future updates,
			// giving the appearance that the snake is connected as one.
			//
			this.grid.setCellVelocity({...this.head}); // Clone the object to allow its values to be updated independently.
		}
	}

	update() {
		if (this.head.velocityX === 0 && this.head.velocityY === 0)
			return;

		const nextCellValue = this.grid.getCellValue(this.head.col + this.head.velocityX, this.head.row + this.head.velocityY);

		switch (nextCellValue) {
			case Constants.WALL_CELL_VALUE:
			case Constants.SNAKE_CELL_VALUE:
				this.game.onGameOver();
				return;

			case Constants.APPLE_CELL_VALUE:
				// Store the current tail's velocity in the grid cell that the current tail occupies,
				// to allow the new tail that is about to be added to modify its velocity from 0 to the stored velocity during the next update.
				//
				this.grid.setCellVelocity({...this.tail}); // Clone the object to allow its values to be updated independently.

				// Add a new tail to the snake with 0 velocity to prevent it from moving during the current update.
				this.addBodyPart({
					col:       this.tail.col,
					row:       this.tail.row,
					velocityX: 0,
					velocityY: 0,
				});

				this.game.onAppleEaten();
				break;
		}

		for (let bodyPart of this.bodyParts) {
			this.grid.setCellValue(bodyPart.col, bodyPart.row, Constants.EMPTY_CELL_VALUE);

			bodyPart.col += bodyPart.velocityX;
			bodyPart.row += bodyPart.velocityY;

			this.grid.setCellValue(bodyPart.col, bodyPart.row, Constants.SNAKE_CELL_VALUE);

			if (bodyPart !== this.head) {
				const cellVelocity = this.grid.getCellVelocity(bodyPart.col, bodyPart.row);

				if (cellVelocity) {
					// If a stored velocity was found in the grid cell the current body part occupies,
					// set the body part's velocity to the stored velocity so that it will move in that direction during future updates.
					//
					bodyPart.velocityX = cellVelocity.velocityX;
					bodyPart.velocityY = cellVelocity.velocityY;

					if (bodyPart === this.tail) {
						// If the current body part is the tail (i.e. the snake has now fully moved through this cell),
						// remove the velocity from the cell to prevent it from modifying the velocities of any body parts that may enter this cell again.
						//
						this.grid.removeCellVelocity(cellVelocity.col, cellVelocity.row);
					}
				}
			}
		}
	}
}
