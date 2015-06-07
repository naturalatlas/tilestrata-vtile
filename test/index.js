var tilestrata = require('tilestrata');
var vtileraster = require('tilestrata-vtile-raster');
var TileServer = tilestrata.TileServer;
var TileRequest = tilestrata.TileRequest;
var mapnik = require('../index.js');
var assert = require('chai').assert;
var fs = require('fs');

describe('Provider Implementation "mapnik"', function() {
	describe('serve()', function() {
		it('should render tile', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/5/5/12/tile.png');

			var provider = mapnik({
				xml: __dirname + '/data/test.xml',
				metatile: 1,
				bufferSize: 128
			});
			provider.init(server, function(err) {
				assert.isFalse(!!err, err);
				provider.serve(server, req, function(err, buffer, headers) {
					assert.isFalse(!!err, err);
					assert.deepEqual(headers, {'Content-Type': 'application/x-protobuf'});
					assert.instanceOf(buffer, Buffer);

					var im_actual = buffer.toString('base64');
					var im_expected = fs.readFileSync(__dirname + '/fixtures/world.pbf').toString('base64');
					assert.equal(im_actual, im_expected);

					done();
				});
			});
		});
		it('should render tile w/metatile set', function(done) {
			var server = new TileServer();
			var req = TileRequest.parse('/layer/5/5/12/tile.png');

			var provider = mapnik({
				xml: __dirname + '/data/test.xml',
				metatile: 4,
				bufferSize: 128
			});
			provider.init(server, function(err) {
				assert.isFalse(!!err, err);
				provider.serve(server, req, function(err, buffer, headers) {
					assert.isFalse(!!err, err);
					assert.deepEqual(headers, {'Content-Type': 'application/x-protobuf'});
					assert.instanceOf(buffer, Buffer);

					var im_actual = buffer.toString('base64');
					var im_expected = fs.readFileSync(__dirname + '/fixtures/world_metatile.pbf').toString('base64');
					assert.equal(im_actual, im_expected);

					done();
				});
			});
		});
	});
});
