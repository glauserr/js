const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");
const IPFSRepo = require("ipfs-repo");

/** @typedef {*} IPFS */
/** @typedef {*} DocumentStore */

/**
 * OrbitDB class {@link https://github.com/orbitdb/orbit-db}
 * @typedef {*} OrbitDB
 * @property {EventEmitter} events events: replicated, replicate, replicate.progress, load, load.progress, ready, write
 * 
 */

/**
 * Super-powered OrbitDB instance
 */
class Cloudy {

	/**
	 * @param {IPFS} ipfs
	 * @param {string} [directory]
	 * @param {*} [options]
	 */
	constructor(ipfs, directory = "./storage/orbitdb", options) {
		/** @type {OrbitDB} */
		// @ts-ignore
		this.orbitDb = new OrbitDB(ipfs, directory, options);
	}

	/**
	 * Preferred way of creating a Cloudy instance.
	 * @param {*} [ipfsOptions]
	 * @param {string} [directory]
	 * @param {*} [options]
	 * @return {Promise<Cloudy>} - Cloudy instance 
	 */
	static create(ipfsOptions = {}, directory, options) {
		if (typeof self === "undefined") {
			const wrtc = require("wrtc");
			const WStar = require("libp2p-webrtc-star");
			const wstar = new WStar({ wrtc: wrtc });
			ipfsOptions = Object.assign({
				repo: new IPFSRepo("./storage/ipfs-repo"),
				config: {
					Addresses: {
						Swarm: [
							// "/dns4/star-signal.cloud.ipfs.team/tcp/443/wss/p2p-webrtc-star",
							// "/ip4/0.0.0.0/tcp/" + (10000 + Math.floor(Math.random()*55535)),
							// "/dns4/nas1.isaac.pw/tcp/9090/ws/p2p-webrtc-star",
							"/dns6/rpi-ipv6.test/tcp/9090/ws/p2p-webrtc-star",
						],					  
					}
				}
			}, ipfsOptions, {
				libp2p: {
					modules: {
						transport: [wstar],
						discovery: [wstar.discovery],
					}
				}
			});
		}
		return new Promise(function(resolve, reject){
			const ipfs = new IPFS(Object.assign({EXPERIMENTAL: {
				pubsub: true,
			}}, ipfsOptions));

			ipfs.on("error", (e) => {
				console.error("error in ipfs", e);
				reject(e);
			});
			ipfs.on("ready", async function() {
				/*ipfs._libp2pNode.on('peer:discovery', (peer) => {
					console.log('Discovered:', peer.id.toB58String());
				});*/
				ipfs._libp2pNode.on("peer:connect", (peer) => {
					console.log("Connection established to:", peer.id.toB58String());
				});
				resolve(new Cloudy(ipfs, directory, options));
			});
		});
	}

	/**
	 * create a new docstore
	 * @param {*} nameOrAddress existing database address (can be JS object), otherwise give a random name to initiate a new database
	 * @param {*} options
	 * @returns {Promise<DocumentStore>}
	 */
	store(nameOrAddress, options) {
		options = Object.assign({admin: ["*"], write: ["*"]}, options);
		return this.orbitDb.docs(nameOrAddress, options);
	}
}

module.exports = Cloudy;