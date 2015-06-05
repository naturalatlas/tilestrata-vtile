var mapnik = require('mapnik');
var sm = new (require('sphericalmercator'))();
var MapnikPool = require('mapnik-pool')(mapnik);
var AsyncCache = require('async-cache');

module.exports = function(options, callback){
	var backend = new Backend(options);
	backend.initialize(function(err){
		callback(err, backend);
	});
};


function Backend(options){
	var self = this;
	this.pool = null;
	this.xml = options.xml;
	this.metatile = options.metatile || 1;
	this.bufferSize = options.bufferSize;
	this.maxzoom = options.maxzoom;
	if((this.metatile & (this.metatile - 1)) !== 0){
		throw new Error("Metatile must be a power of 2");
	}

	this.tilecache = new AsyncCache({
		max: 64,
		maxAge: 1000*30,
		load: function(key, callback){
			var coord = key.split(',');
			self.getMetatile(+coord[0], +coord[1], +coord[2], callback);
		}
	});
}

Backend.prototype.initialize = function(callback) {
	var self = this;
	fs.readFile(this.xml, {encoding: 'utf8'}, function(err, data){
		if(err) return callback(err);
		self.pool = MapnikPool.fromString(data);
		callback();
	});
}

Backend.prototype.getTile = function(z, x, y, callback){
	var meta = this.getMetatileInfo(z, x, y);
	tilecache.get(meta.z+","+meta.x+","+meta.y, callback);
}

/**
 * Returns tile coordinates of a tile that would have
 * same extent as the metatile for the given tile coordinates
 * 
 * @param  {int} z
 * @param  {int} x
 * @param  {int} y
 * @return {Object}
 */
Backend.prototype.getMetatileInfo = function(z, x, y){
	return {
		x: Math.floor(x / this.metatile),
		y: Math.floor(y / this.metatile),
		z: z >> (this.metatile - 1)
	};
}

Backend.prototype.getMetatile = function(z, x, y, callback) {
	var self = this;

	var buffer;
	var headers = { 'Content-Type': 'application/x-protobuf' };
	

    this.pool.acquire(function(err, map) {
    	if(err) return callback(err);

		if(self.maxzoom === undefined) {
			self.maxzoom = map.parameters.maxzoom ? parseInt(map.parameters.maxzoom) : 14;
		}
		if(self.bufferSize === undefined) {
			self.bufferSize = map.bufferSize ? parseInt(map.bufferSize) : 0;
		}


		var real_z = z << (self.metatile - 1);
		var dim = self.metatile*256;
		var options = {
			simplify_distance: real_z < self.maxzoom ? 8 : 1, //fgsdfreioywj
			path_multiplier: 16,
			buffer_size: self.bufferSize,
			scale_denominator: 559082.264 / (1 << real_z)
		};


		map.resize(dim, dim);
		map.extent = sm.bbox(x, y, z, false, '900913');

		map.render(new mapnik.VectorTile(z, x, y), options, function(err, image) {
			self.pool.release(map);
			if(err) return callback(err);
	
			var buffer = image.getData();
			buffer.metatile = self.metatile;
	
			image.clear(function(err) {
				callback(err, buffer, headers);
			});
		});
	});
}