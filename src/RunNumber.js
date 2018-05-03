/* eslint-disable no-unused-vars */
const Cloudy = require("./Cloudy");
const uuid = require("uuid/v4");
const reemit = require("re-emitter");
const EventEmitter = require("events");
/* eslint-disable no-unused-vars */

/**
 * Map a bill's time into JS Date instance
 * Helper function, so that it can be optimized
 */
function mapDates(bill) {
	bill.time = new Date(bill.time);
	return bill;
}

/** @typedef {*} DocumentStore */
/** @typedef {*} OrbitDBAddress */

/**
 * A bill
 * @typedef {Object} Bill
 * @property {string} amount - Amount, in decimals (e.g. HK$100.23 is 10023)
 * @property {string} currency - ISO 4217 currency code (e.g. CNY for Renmibi)
 * @property {Date} time - The time
 * @property {string} name - user who paid (e.g. Isaac)
 * @property {string} _id - unique ID for the bill
 */

/**
 * DAO for calendar objects (events, etc.)
 * See {@link http://tutorials.jenkov.com/java-persistence/dao-design-pattern.html}
 */
class RunNumber extends EventEmitter {
	constructor(cloudy, db) {
		super();
		/** @type {Cloudy} */
		this.cloudy = cloudy;
		/** @type {DocumentStore} */
		this.db = db;

		reemit(this.db.events, this, ["replicated", "replicate", "replicate.progress", "load", "load.progress", "ready", "write"]);
	}

	/**
	 * @param {Object} cloudyOptions
	 * @param {Object} storeOptions
	 * @returns {Promise<RunNumber>} Ready'd RunNumber instance
	 */
	static async create(cloudyOptions, storeOptions) {
		const cloudy = await Cloudy.create(cloudyOptions);
		const db = await cloudy.store("runNumber", storeOptions);
		await db.load();
		const runNumber = new RunNumber(cloudy, db);
		return runNumber;
	}

	/**
	 * Interface to create / edit existing bill.
	 * @param {Bill} bill - bill to be saved. note that it might be mutated -- new events without ID attribute will be populated automatically
	 * @returns {Promise<Bill>} - the original bill reference. Might be mutated.
	 */
	async addBill(bill) {
		if (!bill._id) {
			bill._id = uuid();
		}
		await this.db.put(bill);
		return bill;
	}

	/**
	 * Gets the events in an unspecified order
	 * @param {Function} filter - pick/reject unwanted bills
	 * @returns {Event[]} - array of events
	 */
	query(filter = (() => true)) {
		return this.db.query(filter).map(mapDates);
	}

	get address() {
		return this.db.address;
	}

	get namespace() {
		return this.cloudy.namespace;
	}
}

module.exports = RunNumber;