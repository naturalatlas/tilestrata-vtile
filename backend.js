var fs = require('fs');
var path = require('path');
var mapnik = require('mapnik');
var sm = new (require('sphericalmercator'))();
var MapnikPool = require('mapnik-pool')(mapnik);
var AsyncCache = require('async-cache');

module.exports = Backend;

function Backend(options) {
	var self = this;
	this.pool = null;
	this.xml = options.xml;
	this.metatile = options.metatile || 1;
	this.bufferSize = options.bufferSize;
	this.maxzoom = options.maxzoom;

	if ((this.metatile & (this.metatile - 1)) !== 0) {
		throw new Error("Metatile must be a power of 2");
	}

	this.tilecache = new AsyncCache({
		max: 64,
		maxAge: 1000*30,
		load: function(key, callback) {
			var coord = key.split(',');
			self.getMetatile(+coord[0], +coord[1], +coord[2], callback);
		}
	});
}

Backend.prototype.initialize = function(server, callback) {
	mapnik.register_default_input_plugins();

	var mapOptions = {
		base: path.dirname(this.xml) + '/'
	};

	var self = this;
	fs.readFile(this.xml, {encoding: 'utf8'}, function(err, data) {
		if (err) return callback(err);
		self.pool = MapnikPool.fromString(data, null, mapOptions);
		callback();
	});
};

Backend.prototype.getTile = function(z, x, y, callback){
	var meta = this.getVectorTileInfo(z, x, y);
	this.tilecache.get(meta.z+","+meta.x+","+meta.y, callback);
};

/**
 * Returns tile coordinates of a tile that would have
 * same extent as the metatile for the given tile coordinates
 *
 * @param  {int} z
 * @param  {int} x
 * @param  {int} y
 * @return {Object}
 */
Backend.prototype.getVectorTileInfo = function(z, x, y){
	var dz;
	if (this.metatile === 1) dz = 0;
	else if (this.metatile === 2) dz = 1;
	else if (this.metatile === 4) dz = 2;
	else if (this.metatile === 8) dz = 3;
	else throw new Error("Unsupported metatile setting: "+this.metatile);

	return {
		x: Math.floor(x / this.metatile),
		y: Math.floor(y / this.metatile),
		z: z - dz
	};
};

Backend.prototype.getMetatile = function(z, x, y, callback) {
	var self = this;

    this.pool.acquire(function(err, map) {
    	if (err) return callback(err);

		if (self.maxzoom === undefined) {
			self.maxzoom = map.parameters.maxzoom ? parseInt(map.parameters.maxzoom) : 14;
		} else if (self.bufferSize === undefined) {
			self.bufferSize = map.bufferSize ? parseInt(map.bufferSize) : 0;
		}

		var real_z;
		if (self.metatile === 1) real_z = z;
		else if (self.metatile === 2) real_z = z+1;
		else if (self.metatile === 4) real_z = z+2;
		else if (self.metatile === 8) real_z = z+3;
		
		var dim = self.metatile*256;
		var options = {
			simplify_distance: real_z < self.maxzoom ? 8 : 1, //fgsdfreioywj
			path_multiplier: 16 * self.metatile,
			buffer_size: self.bufferSize,
			scale_denominator: 559082264.028 / (1 << real_z)
		};

		map.resize(256, 256);
		map.extent = sm.bbox(x, y, z, false, '900913');

		map.render(new mapnik.VectorTile(z, x, y), options, function(err, image) {
			self.pool.release(map);
			if (err) return callback(err);

			var buffer = image.getData();
			buffer.metatile = self.metatile;

			image.clear(function(err) {
				callback(err, buffer);
			});
		});
	});
};
