export default class Random {
	static arrayIndex(min, max) {
		return Math.floor(min + (max - min) * Math.random());
	}
}
