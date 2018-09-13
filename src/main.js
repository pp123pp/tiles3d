let ortho = {
        "type": "color",
        "protocol":   "wmts",
        "id":         "Ortho",
        "url":        "http://wxs.ign.fr/va5orxd0pgzvq3jxutqfuy0b/geoportail/wmts",
        "networkOptions": {
            "crossOrigin": "anonymous"
        },
        "updateStrategy": {
            "type": "0",
            "options": {}
        },
        "options": {
            "attribution" : {
                "name":"IGN",
                "url":"http://www.ign.fr/"
            },
            "name": "ORTHOIMAGERY.ORTHOPHOTOS",
            "mimetype": "image/jpeg",
            "tileMatrixSet": "PM",
            "tileMatrixSetLimits": {
                "2": {
                    "minTileRow": 0,
                    "maxTileRow": 4,
                    "minTileCol": 0,
                    "maxTileCol": 4
                },
                "3": {
                    "minTileRow": 0,
                    "maxTileRow": 8,
                    "minTileCol": 0,
                    "maxTileCol": 8
                },
                "4": {
                    "minTileRow": 0,
                    "maxTileRow": 16,
                    "minTileCol": 0,
                    "maxTileCol": 16
                },
                "5": {
                    "minTileRow": 0,
                    "maxTileRow": 32,
                    "minTileCol": 0,
                    "maxTileCol": 32
                },
                "6": {
                    "minTileRow": 1,
                    "maxTileRow": 64,
                    "minTileCol": 0,
                    "maxTileCol": 64
                },
                "7": {
                    "minTileRow": 3,
                    "maxTileRow": 128,
                    "minTileCol": 0,
                    "maxTileCol": 128
                },
                "8": {
                    "minTileRow": 7,
                    "maxTileRow": 256,
                    "minTileCol": 0,
                    "maxTileCol": 256
                },
                "9": {
                    "minTileRow": 15,
                    "maxTileRow": 512,
                    "minTileCol": 0,
                    "maxTileCol": 512
                },
                "10": {
                    "minTileRow": 31,
                    "maxTileRow": 1024,
                    "minTileCol": 0,
                    "maxTileCol": 1024
                },
                "11": {
                    "minTileRow": 62,
                    "maxTileRow": 2048,
                    "minTileCol": 0,
                    "maxTileCol": 2048
                },
                "12": {
                    "minTileRow": 125,
                    "maxTileRow": 4096,
                    "minTileCol": 0,
                    "maxTileCol": 4096
                },
                "13": {
                    "minTileRow": 2739,
                    "maxTileRow": 4628,
                    "minTileCol": 41,
                    "maxTileCol": 7917
                },
                "14": {
                    "minTileRow": 5478,
                    "maxTileRow": 9256,
                    "minTileCol": 82,
                    "maxTileCol": 15835
                },
                "15": {
                    "minTileRow": 10956,
                    "maxTileRow": 18513,
                    "minTileCol": 165,
                    "maxTileCol": 31670
                },
                "16": {
                    "minTileRow": 21912,
                    "maxTileRow": 37026,
                    "minTileCol": 330,
                    "maxTileCol": 63341
                },
                "17": {
                    "minTileRow": 43825,
                    "maxTileRow": 74052,
                    "minTileCol": 660,
                    "maxTileCol": 126683
                },
                "18": {
                    "minTileRow": 87651,
                    "maxTileRow": 148105,
                    "minTileCol": 1320,
                    "maxTileCol": 253366
                },
                "19": {
                    "minTileRow": 175302,
                    "maxTileRow": 294060,
                    "minTileCol": 170159,
                    "maxTileCol": 343473
                },
                "20": {
                    "minTileRow": 376733,
                    "maxTileRow": 384679,
                    "minTileCol": 530773,
                    "maxTileCol": 540914
                }
            }
        }
    }

import * as itowns from './../itowns/Main';

/* global itowns,document,GuiTools*/
var positionOnGlobe = { longitude: -75.61, latitude: 40.04, altitude: 50000 }
// iTowns namespace defined here
var viewerDiv = document.getElementById('viewerDiv');

var globe = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// itowns.Fetcher.json('layers/JSONLayers/Ortho.json').then(function (result) {
//     return globe.addLayer(result)
// });

//globe.addLayer(ortho)

// function use :
// For preupdate Layer geomtry :
var preUpdateGeo = itowns.pre3dTilesUpdate;

// Create a new Layer 3d-tiles For DiscreteLOD
// -------------------------------------------
//定义一个GeometryLayer对象，id为3d-tiles-discrete-lod
var $3dTilesLayerDiscreteLOD = new itowns.GeometryLayer('3d-tiles-discrete-lod', globe.scene);

//3dtiles图层预更新
$3dTilesLayerDiscreteLOD.preUpdate = preUpdateGeo;
$3dTilesLayerDiscreteLOD.update = itowns.process3dTilesNode(
    itowns.$3dTilesCulling,
    itowns.$3dTilesSubdivisionControl
);

//定义3dtiles组的名字
$3dTilesLayerDiscreteLOD.name = 'DiscreteLOD';
//json文件路径
$3dTilesLayerDiscreteLOD.url = 'https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles-samples/master/tilesets/TilesetWithDiscreteLOD/tileset.json';
//程序加载协议，使用3d-tiles方式加载
$3dTilesLayerDiscreteLOD.protocol = '3d-tiles';
//覆盖模型内部自定义shader
$3dTilesLayerDiscreteLOD.overrideMaterials = true;  // custom cesium shaders are not functional
$3dTilesLayerDiscreteLOD.type = 'geometry';
$3dTilesLayerDiscreteLOD.visible = true;

debugger
itowns.View.prototype.addLayer.call(globe, $3dTilesLayerDiscreteLOD);

globe._layers.splice(0, 1);

globe.atmosphere.visible = false;

//globe.wgs84TileLayer.visible = false

//console.log(globe)

