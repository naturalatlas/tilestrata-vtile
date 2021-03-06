var mapnik = require('mapnik');
var tilestrata = require('tilestrata');
var assertVTile = require('./utils/assertVTile.js');
var TileServer = tilestrata.TileServer;
var TileRequest = tilestrata.TileRequest;
var vtile = require('../index.js');
var assert = require('chai').assert;

describe('Provider Implementation "vtile"', function() {
	describe('serve()', function() {
		it('should render tile', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/5/5/12/tile.png');

			var provider = vtile({
				xml: __dirname + '/data/test.xml',
				metatile: 1,
				bufferSize: 128
			});
			provider.init(server, function(err) {
				if (err) throw err;
				provider.serve(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.deepEqual(headers, {
						'Content-Type': 'application/x-protobuf',
						'Content-Encoding': 'gzip'
					});

					assert.instanceOf(buffer, Buffer);
					assert.instanceOf(buffer._vtile, mapnik.VectorTile, 'buffer._vtile');
					assert.equal(buffer._vx, 5, 'buffer._vx');
					assert.equal(buffer._vy, 12, 'buffer._vy');
					assert.equal(buffer._vz, 5, 'buffer._vz');
					assert.equal(buffer.metatile, 1, 'buffer.metatile');

					// fs.writeFileSync(__dirname + '/fixtures/world.pbf', buffer);
					assertVTile(5, 5, 12, buffer, __dirname + '/fixtures/world.pbf');
					done();
				});
			});
		});
		it('should render tile w/metatile set', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/5/5/12/tile.png');

			var provider = vtile({
				xml: __dirname + '/data/test.xml',
				metatile: 4,
				bufferSize: 128
			});
			provider.init(server, function(err) {
				if (err) throw err;
				provider.serve(server, req, function(err, buffer, headers) {
					if (err) throw err;
					assert.deepEqual(headers, {
						'Content-Type': 'application/x-protobuf',
						'Content-Encoding': 'gzip'
					});
					assert.instanceOf(buffer, Buffer);
					// fs.writeFileSync(__dirname + '/fixtures/world_metatile.pbf', buffer);
					assertVTile(5, 5, 12, buffer, __dirname + '/fixtures/world_metatile.pbf');
					done();
				});
			});
		});
		it('should send 204 error when tile is empty', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/12/2000/2000/tile.png');

			var provider = vtile({
				xml: __dirname + '/data/test.xml',
				metatile: 1,
				bufferSize: 0
			});
			provider.init(server, function(err) {
				if (err) throw err;
				provider.serve(server, req, function(err) {
					assert.instanceOf(err, Error);
					assert.equal(err.statusCode, 204);
					assert.equal(err.message, 'No data');
					done();
				});
			});
		});
	});

	it('should acknowledge "overrideRenderOptions" option', function(done) {
		var server = new TileServer();
		var req = TileRequest.parse('/layer/12/2000/2000/tile.pbf');
		var calledOverrides = false;

		var provider = vtile({
			xml: __dirname + '/data/test.xml',
			metatile: 1,
			bufferSize: 0,
			overrideRenderOptions: function(opts, z, maxz) {
				assert.equal(z, 12, 'z');
				assert.equal(maxz, 14, 'maxz');
				assert.isObject(opts);
				calledOverrides = true;
				return opts;
			}
		});
		provider.init(server, function(err) {
			if (err) throw err;
			provider.serve(server, req, function() {
				assert.isTrue(calledOverrides, 'Called overrideRenderOptions option');
				done();
			});
		});
	});
});
