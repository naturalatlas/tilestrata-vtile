var fs = require('fs');
var mapnik = require('mapnik');
var jdiff = require('json-diff');
var assert = require('chai').assert;

function vtile(z, x, y, data) {
	if (typeof data === 'string') data = fs.readFileSync(data);
	var vtile = new mapnik.VectorTile(z, x, y);
	vtile.setData(data);
	vtile.parse();
	return vtile;
}

module.exports = function(z, x, y, expected, actual) {
	var vtile1 = vtile(z,x,y,expected);
	var vtile2 = vtile(z,x,y,actual);

	assert.equal(vtile1.width(),vtile2.width());
	assert.equal(vtile1.height(),vtile2.height());
	assert.deepEqual(vtile1.names(),vtile2.names());
	assert.deepEqual(vtile1.names(),vtile2.names());
	assert.equal(vtile1.isSolid(),vtile2.isSolid());
	assert.equal(vtile1.empty(),vtile2.empty());
	var v1 = vtile1.toJSON();
	var v2 = vtile2.toJSON();
	assert.equal(v1.length,v2.length);
	var l1 = v1[0];
	var l2 = v2[0];
	assert.equal(l1.name,l2.name);
	assert.equal(l1.version,l2.version);
	assert.equal(l1.extent,l2.extent);
	assert.equal(l1.features.length,l2.features.length);
	assert.deepEqual(l1.features[0],l2.features[0]);
	try { assert.deepEqual(v1,v2); }
	catch (e) {
		console.log(jdiff.diffString(v1,v2));
		throw e;
	}
};
