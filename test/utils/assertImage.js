var mapnik = require('mapnik');
var assert = require('chai').assert;

function im(image) {
	if (typeof image === 'string') return new mapnik.Image.open(image);
	return new mapnik.Image.fromBytesSync(image);
}

module.exports = function(expected, actual) {
	assert.equal(0, im(expected).compare(im(actual)), 'Images should be equal');
};
