var tilestrata = require('tilestrata');
var vtileraster = require('tilestrata-vtile-raster');
var assertVTile = require('./utils/assertVTile.js');
var TileServer = tilestrata.TileServer;
var TileRequest = tilestrata.TileRequest;
var vtile = require('../index.js');
var assert = require('chai').assert;
var fs = require('fs');

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
				assert.isFalse(!!err, err);
				provider.serve(server, req, function(err, buffer, headers) {
					assert.isFalse(!!err, err);
					assert.deepEqual(headers, {'Content-Type': 'application/x-protobuf'});
					assert.instanceOf(buffer, Buffer);
					assertVTile(5,5,12,buffer,__dirname + '/fixtures/world.pbf');
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
				assert.isFalse(!!err, err);
				provider.serve(server, req, function(err, buffer, headers) {
					assert.isFalse(!!err, err);
					assert.deepEqual(headers, {'Content-Type': 'application/x-protobuf'});
					assert.instanceOf(buffer, Buffer);
					assertVTile(5,5,12,buffer,__dirname + '/fixtures/world_metatile.pbf');
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
				assert.isFalse(!!err, err);
				provider.serve(server, req, function(err, buffer, headers) {
					assert.instanceOf(err, Error);
					assert.equal(err.statusCode, 204);
					assert.equal(err.message, 'No data');
					done();
				});
			});
		});
	});
});
