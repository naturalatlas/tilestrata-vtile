var _ = require('lodash');
var vtile = require('../index.js');
var vtileraster = require('tilestrata-vtile-raster');
var tilestrata = require('tilestrata');
var TileServer = tilestrata.TileServer;
var TileRequest = tilestrata.TileRequest;
var assert = require('chai').assert;
var fs = require('fs');

describe('"tilestrata-vtile-raster"', function() {
	it('should be able to rasterize output', function(done) {
		var server = new TileServer();

		var opts = {
			xml: __dirname + '/data/test.xml',
			metatile: 1,
			bufferSize: 128
		};

		var req = TileRequest.parse('/layer/5/5/12/tile.png');
		server.layer('layer').route('tile.pbf').use(vtile(opts));
		server.layer('layer').route('tile.png').use(vtileraster(opts, {
			tilesource: ['layer','tile.pbf']
		}));

		server.initialize(function(err) {
			assert.isFalse(!!err, err);
			server.serve(req, false, function(status, buffer, headers) {
				assert.equal(status, 200);
				assert.equal(headers['Content-Type'], 'image/png');
				assert.instanceOf(buffer, Buffer);

				var im_actual = buffer.toString('base64');
				var im_expected = fs.readFileSync(__dirname + '/fixtures/world.png').toString('base64');
				assert.equal(im_actual, im_expected);

				done();
			});
		});
	});
});
