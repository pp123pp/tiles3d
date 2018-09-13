function requestNewTile(view, scheduler, geometryLayer, metadata, parent) {

    const command = {
        /* mandatory */
        view,
        requester: parent,
        layer: geometryLayer,
        priority: 10000,
        /* specific params */
        metadata,
        redraw: false,
    };
    

    return scheduler.execute(command);
}

function subdivideNode(context, layer, node) {
    if (!node.pendingSubdivision && node.children.filter(n => n.layer == layer.id).length == 0) {

        node.pendingSubdivision = true;

        //获取当前节点的子节点
        const childrenTiles = layer.tileIndex.index[node.tileId].children;
        if (childrenTiles === undefined) {
            return;
        }

        const promises = [];
        for (let i = 0; i < childrenTiles.length; i++) {
            promises.push(
                requestNewTile(context.view, context.scheduler, layer, childrenTiles[i], node).then((tile) => {
                    node.add(tile);
                    tile.updateMatrixWorld();
                    if (node.additiveRefinement) {
                        context.view.notifyChange(true);
                    }
                }));
        }

        //Promise.all():用于将多个Promise对象包装成一个Promise对象，只有数组中的状态都成功或者有一个失败，就会调用all后面的回调函数
        Promise.all(promises).then(() => {
            node.pendingSubdivision = false;
            context.view.notifyChange(true);
        });
    }
}

/**
 * 3dtiles节点视锥相交测试（根据不同的包围体类型）
 * @param node
 * @param camera
 * @returns {boolean}
 */
export function $3dTilesCulling(node, camera) {
    // For viewer Request Volume https://github.com/AnalyticalGraphicsInc/3d-tiles-samples/tree/master/tilesets/TilesetWithRequestVolume
    if (node.viewerRequestVolume) {
        const nodeViewer = node.viewerRequestVolume;
        if (nodeViewer.region) {
            // TODO
            return true;
        }
        if (nodeViewer.box) {
            // TODO
            return true;
        }
        if (nodeViewer.sphere) {
            const worldCoordinateCenter = nodeViewer.sphere.center.clone();
            worldCoordinateCenter.applyMatrix4(node.matrixWorld);
            // To check the distance between the center sphere and the camera
            if (!(camera.camera3D.position.distanceTo(worldCoordinateCenter) <= nodeViewer.sphere.radius)) {
                return true;
            }
        }
    }

    // For bounding volume
    if (node.boundingVolume) {
        const boundingVolume = node.boundingVolume;
        if (boundingVolume.region) {
            return !camera.isBox3Visible(boundingVolume.region.box3D, boundingVolume.region.matrixWorld);
        }
        if (boundingVolume.box) {
            return !camera.isBox3Visible(boundingVolume.box, node.matrixWorld);
        }
        if (boundingVolume.sphere) {
            return !camera.isSphereVisible(boundingVolume.sphere, node.matrixWorld);
        }
    }
    return false;
}

//计算当前3dtiles的屏幕空间误差
/*
采用视点距离作为多细节层次自适应控制参数，不同级别节点对应不同的距离阈值。阈值采用使用广泛的屏幕空间误差(SSE)阈值进行计算，来判定是节点合适的细节层次。
d(i) = hk/(2 * r(i) * tan(f/2))
d(i): 为层次i对应的视点距离阈值
f: 视点的视场角度（即相机的可视角度：fov）
h: 屏幕像素的高
r(i): 节点包围球投影在屏幕上的像素阈值
k: 控制系数
 */
export function pre3dTilesUpdate(context, layer) {
    // pre-sse
    //勾股定理，求屏幕对角线的长度
    const hypotenuse = Math.sqrt(context.camera.width * context.camera.width + context.camera.height * context.camera.height);
    //相机的观察角度
    const radAngle = context.camera.camera3D.fov * Math.PI / 180;

    //SSE用来判定HLOD细化，即，一个瓦片在当前视图是否足够精细，它的子瓦片是否需要考虑。
    //SSE：屏幕空间误差，计算公式：http://www.cjig.cn/html/jig/2018/7/20180714.htm
     // TODO: not correct -> see new preSSE
    // const HFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) / context.camera.ratio);
    const HYFOV = 2.0 * Math.atan(Math.tan(radAngle * 0.5) * hypotenuse / context.camera.width);
    context.camera.preSSE = hypotenuse * (2.0 * Math.tan(HYFOV * 0.5));
    
    //console.log(context.camera.preSSE)
    
    
    return [layer.root];
}

// Improved zoom geometry

//（根据不同的边界体）计算当前节点的屏幕空间误差
function computeNodeSSE(camera, node) {
    //console.log(node)
    if (node.boundingVolume.region) {
        const cameraLocalPosition = camera.camera3D.position.clone();
        cameraLocalPosition.x -= node.boundingVolume.region.matrixWorld.elements[12];
        cameraLocalPosition.y -= node.boundingVolume.region.matrixWorld.elements[13];
        cameraLocalPosition.z -= node.boundingVolume.region.matrixWorld.elements[14];
        const distance = node.boundingVolume.region.box3D.distanceToPoint(cameraLocalPosition);
        return camera.preSSE * (node.geometricError / distance);
    }
    if (node.boundingVolume.box) {
        const cameraLocalPosition = camera.camera3D.position.clone();
        cameraLocalPosition.x -= node.matrixWorld.elements[12];
        cameraLocalPosition.y -= node.matrixWorld.elements[13];
        cameraLocalPosition.z -= node.matrixWorld.elements[14];
        const distance = node.boundingVolume.box.distanceToPoint(cameraLocalPosition);
        return camera.preSSE * (node.geometricError / distance);
    }
    if (node.boundingVolume.sphere) {
        const cameraLocalPosition = camera.camera3D.position.clone();
        cameraLocalPosition.x -= node.matrixWorld.elements[12];
        cameraLocalPosition.y -= node.matrixWorld.elements[13];
        cameraLocalPosition.z -= node.matrixWorld.elements[14];
        const distance = node.boundingVolume.sphere.distanceToPoint(cameraLocalPosition);
        return camera.preSSE * (node.geometricError / distance);
    }
    return Infinity;
}

export function init3dTilesLayer(view, scheduler, layer) {
    debugger
    return requestNewTile(view, scheduler, layer, layer.tileset.root).then(
            (tile) => {
                layer.object3d.add(tile);
                tile.updateMatrixWorld();
                layer.root = tile;
            });
}

function setDisplayed(node, display) {
    // The geometry of the tile is not in node, but in node.content
    // To change the display state, we change node.content.visible instead of
    // node.material.visible
    if (node.content) {
        node.content.visible = display;
    }
}

/**
 *
 * @param cullingTest
 * @param subdivisionTest
 * @returns {_process3dTilesNodes}
 */
export function process3dTilesNode(cullingTest, subdivisionTest) {
    return function _process3dTilesNodes(context, layer, node) {
        // early exit if parent's subdivision is in progress

        //debugger
        if (node.parent.pendingSubdivision && !node.parent.additiveRefinement) {
            node.visible = false;
            return undefined;
        }

        // do proper culling
        
        //判断当前包围体，是否在视椎体内，如果相交或者在视椎体内，则结果为true
        const isVisible = cullingTest ? (!cullingTest(node, context.camera)) : true;
        
        //console.log(node)
        
        node.visible = isVisible;

        let returnValue;

        if (isVisible) {
            if (node.pendingSubdivision || subdivisionTest(context, layer, node)) {
                subdivideNode(context, layer, node);
                // display iff children aren't ready
                setDisplayed(node, node.pendingSubdivision || node.additiveRefinement);
                returnValue = node.children.filter(n => n.layer == layer.id);
            } else {
                setDisplayed(node, true);
            }

            if ((node.material === undefined || node.material.visible)) {
                for (const n of node.children.filter(n => n.layer == layer.id)) {
                    n.visible = false;
                }
            }

            return returnValue;
        }

        // TODO: cleanup tree
        return undefined;
    };
}

export function $3dTilesSubdivisionControl(context, layer, node) {
    //计算当前节点的屏幕空间误差
    const sse = computeNodeSSE(context.camera, node);
    
    //console.log(sse)
    
    //大小比较
    if(sse > layer.sseThreshold){
        //debugger
    }
    
    //console.log("aaa")
    return sse > layer.sseThreshold;
}
