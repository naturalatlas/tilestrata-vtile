var extend = require('lodash/extend');
var Backend = require('./backend.js');

module.exports = function() {
	var options = {
		xml: null,
		metatile: 1,
		bufferSize: 128,
		compression: 'gzip',
		compressionLevel: null,
		compressionStrategy: null,
		overrideRenderOptions: function(opts) {
			return opts;
		}
	};

	for (var i = 0, n = arguments.length; i < n; i++) {
		extend(options, arguments[i]);
	}

	var source = new Backend(options);

	/**
	 * Initializes the mapnik datasource.
	 *
	 * @param {TileServer} server
	 * @param {function} callback(err, fn)
	 * @return {void}
	 */
	function initialize(server, callback) {
		source.initialize(server, callback);
	}

	/**
	 * Renders a tile and returns the result as a buffer (PNG),
	 * plus the headers that should accompany it.
	 *
	 * @param {TileServer} server
	 * @param {TileRequest} req
	 * @param {function} callback(err, buffer, headers)
	 * @return {void}
	 */
	function serve(server, req, callback) {
		source.getTile(req.z, req.x, req.y, function(err, buffer) {
			if (err) return callback(err);
			var headers = {'Content-Type': 'application/x-protobuf'};
			if (options.compression === 'gzip') {
				headers['Content-Encoding'] = 'gzip';
			}
			callback(null, buffer, headers);
		});
	}

	return {
		name: 'vtile',
		init: initialize,
		serve: serve
	};
};
