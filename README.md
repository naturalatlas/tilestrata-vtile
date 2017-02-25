# tilestrata-vtile
[![NPM version](http://img.shields.io/npm/v/tilestrata-vtile.svg?style=flat)](https://www.npmjs.org/package/tilestrata-vtile)
[![Build Status](http://img.shields.io/travis/naturalatlas/tilestrata-vtile/master.svg?style=flat)](https://travis-ci.org/naturalatlas/tilestrata-vtile)
[![Coverage Status](http://img.shields.io/codecov/c/github/naturalatlas/tilestrata-vtile/master.svg?style=flat)](https://codecov.io/github/naturalatlas/tilestrata-vtile)

A [TileStrata](https://github.com/naturalatlas/tilestrata) plugin for generating [mapnik](http://mapnik.org/) vector tiles (pbf). Vector tiles are useful for times when you want to render multiple variations of a tile (1x, 2x, interactivity, etc) without having to do expensive data fetching for each. Use the [tilestrata-vtile-raster](https://github.com/naturalatlas/tilestrata-vtile-raster) plugin to render them into normal images. To use this plugin, you must have [node-mapnik](https://github.com/mapnik/node-mapnik) in your dependency tree.

### Sample Usage

```js
var vtile = require('tilestrata-vtile');
var vtileraster = require('tilestrata-vtile-raster');

var common = {
    xml: '/path/to/map.xml',
    tileSize: 256,
    metatile: 1,
    bufferSize: 128
};

server.layer('mylayer')
    .route('t.pbf').use(vtile(common))
    .route('t.png').use(vtileraster(common, {
        tilesource: ['mylayer', 't.pbf']
    }))
    .route('i.json').use(vtileraster(common, {
        tilesource: ['mylayer', 't.pbf'],
        interactivity: true
    }));
```

If you need fine control over the Mapnik vector tile creation options, use the `overrideRenderOptions` option:

```js
server.layer('mylayer')
    .route('t.pbf').use(vtile({
        xml: '/path/to/map.xml',
        tileSize: 256,
        metatile: 1,
        bufferSize: 128,
        overrideRenderOptions: function(opts, z, maxz) {
            opts.simplify_distance = z < maxz ? 8 : 1;
            return opts;
        }
    }))
```

## Contributing

Before submitting pull requests, please update the [tests](test) and make sure they all pass.

```sh
$ npm test
```

## License

Copyright &copy; 2015–2017 [Natural Atlas, Inc.](https://github.com/naturalatlas) & [Contributors](https://github.com/naturalatlas/tilestrata-vtile/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
