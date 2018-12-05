import { Constants } from './constants';

export default class Grid {
	constructor(width, height) {
		this.width  = width;
		this.height = height;

		this.reset();
	}

	reset() {
		this.setupCells();
		this.addOuterWalls();
	}

	setupCells() {
		this.cells          = [];
		this.cellVelocities = [];

		for (let row = 0; row < this.height; row++) {
			const cols = new Array(this.width).fill(Constants.EMPTY_CELL_VALUE);
			this.cells.push(cols);
		}
	}

	addOuterWalls() {
		this.cells[0].fill(Constants.WALL_CELL_VALUE); // north wall

		for (let row = 1; row < this.height - 1; row++) {
			this.cells[row][0]              = Constants.WALL_CELL_VALUE; // west wall
			this.cells[row][this.width - 1] = Constants.WALL_CELL_VALUE; // east wall
		}

		this.cells[this.height - 1].fill(Constants.WALL_CELL_VALUE); // south wall
	}

	getCellValue(col, row) {
		return this.cells[row][col];
	}

	setCellValue(col, row, value) {
		this.cells[row][col] = value;
	}

	getCellVelocity(col, row) {
		return this.cellVelocities.find(data => {
			return (data.col === col && data.row === row);
		});
	}

	setCellVelocity(data = { col, row, velocityX, velocityY }) {
		const cellVelocity = this.getCellVelocity(data.col, data.row);

		if (cellVelocity) {
			cellVelocity.velocityX = data.velocityX;
			cellVelocity.velocityY = data.velocityY;
		} else {
			this.cellVelocities.push(data);
		}
	}

	removeCellVelocity(col, row) {
		this.cellVelocities = this.cellVelocities.filter(data => {
			return (data.col !== col || data.row !== row);
		});
	}

	forEachCell(callback) {
		for (let row = 0; row < this.height; row++) {
			for (let col = 0; col < this.width; col++) {
				callback.call(this, col, row, this.cells[row][col]);
			}
		}
	}
}
