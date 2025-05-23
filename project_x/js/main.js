"use strict"

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Lut } from 'three/addons/math/Lut.js';

import { Topogeometry } from './topogeometry.js';
import { gBFSDepthLimit } from './algorithms/gBFSDepthLimit.js';
import { gDijkstraSingleSourceLimit } from './algorithms/gDijkstraSingleSourceLimitAll.js';
import { gBetweennessCentrality } from './algorithms/gBetweennessCentrality.js';
import { VertexGraph } from './graphVertex.js';
import { EdgeGraph } from './graphEdge.js';
import { FaceGraph } from './graphFace.js';

import { agGrid, agGridLinks } from './io/gridCreator.js';
import { sample1 } from './io/sampleData.js';

// Scene, camera, renderer
//////////////////////////
const stats = new Stats();
const canvasRef = document.querySelector('canvas.webgl');
let scene, camera, renderer, labelRenderer;
let orbitControls, transformControls;

const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = 0.3;
raycaster.linePrecision = 0.01;
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let rayPlaneIntersection = new THREE.Vector3();
let vID1;
let v1id, v2id;
let rayIntersectedMeshes = [];
let rayIntersectedMesh = null;

let pointerDown = false;
const pointerDownPosition = new THREE.Vector2();
let pointerMoved = false;
const pointerMovedPosition = new THREE.Vector2();
let holdTimeout;
let isHolding = false;

// Create the topogeometry and default graphs
let topogeometry = new Topogeometry();
const vertexGraph = new VertexGraph();
const edgeGraph = new EdgeGraph();
const faceGraph = new FaceGraph();

// Create colors look up table
let lut = new Lut('rainbow', 512);
lut.lut.reverse();

const resultGroup = new THREE.Group();
resultGroup.translateY(0.02);

// GUI controlled functions and settings
////////////////////////////////////////
const sampleDataControls = {
    'sample1': function() {
        topogeometry.startProcessing(sample1)
    }
};
const gridGeneratorControls = {
    'rows': 20,
    'columns': 20,
    'distance': 1,
    'delay': 0,
    'Generate grid': async function () {
        const vertexIDs = [];

        const gridGen = agGrid(this.rows, this.columns, this.distance, this.delay);
        for await (const v3 of gridGen) {
            const vertex = topogeometry.createVertex(v3);
            vertexIDs.push(vertex.id)
        }

        const gridLinkGen = agGridLinks(this.rows, this.columns, vertexIDs, this.delay);
        for await (const l of gridLinkGen) {
            console.log(l)
            topogeometry.createEdge( l[0], l[1] )
        }
    }
};
const traversalSettings = {
    algorithm: 'Breadth First Search',
    costName: 'step',
    costLimit: 5,
    stepLimit: 0,
    delay: 20,
    uTurnPenalty: false
};
const resultsControls = {
    'Auto-clear results': false,
    'Clear results': function () {
        resultGroup.children.length = 0;
    },

};
const layerControls = {
    'Show/hide vertex graph': function () {
        camera.layers.toggle(2);
        console.log('vertexGraph', vertexGraph);
    },
    'Show/hide edge graph': function () {
        camera.layers.toggle(3);
        console.log('edgeGraph', edgeGraph);
    },
    'Show/hide face graph': function () {
        camera.layers.toggle(4);
        console.log('faceGraph', faceGraph);
    }
};
const debuggingControls = {
    'Console log topogeometry': function () {
        console.log(topogeometry)
    }
}


/**
 * init function
 * 
 * Runs once, before the animation starts
 */
function init() {

    /////////////////////
    // Create the scene
    /////////////////////
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);
    // Camera (Field of view, Aspect ratio, Near clipping plane, Far clipping plane)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set( 0, 5, 5 );
    scene.add(camera);
    // Lights
    scene.add( new THREE.AmbientLight( 0xf0f0f0, 3 ) );
    // GridHelper ( size, divisions, colorCenterLine, colorGrid )
    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
    scene.add(gridHelper);
    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    //////////////
    // Renderers
    //////////////
    renderer = new THREE.WebGLRenderer({
        canvas: canvasRef,
        antialias: true,
        logarithmicDepthBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.touchAction = 'none';
    document.body.appendChild(labelRenderer.domElement);

    document.body.appendChild(stats.dom);

    /////////////
    // Controls
    /////////////
    // Orbit Controls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    // Transform Controls
    transformControls = new TransformControls( camera, renderer.domElement );
    transformControls.addEventListener('pointerDown', function(event) {
        orbitControls.enabled = false; // Disable orbit controls when dragging
        transformControlsFlag = true;
    });
    transformControls.addEventListener('pointerUp', function(event) {
        orbitControls.enabled = true; // Re-enable orbit controls after dragging
        transformControlsFlag = false;
    });
    transformControls.addEventListener( 'dragging-changed', function ( event ) {
        orbitControls.enabled = ! event.value;
    } );
    transformControls.addEventListener( 'objectChange', function () {
        const topogeometryID = transformControls.object.userData.id;
        topogeometry.elements[topogeometryID].modifyPosition();
    } );
    scene.add( transformControls );

    ////////
    // GUI
    ////////
    const gui = new GUI();
    // basic io
    const ioSampleDataFolder = gui.addFolder('Sample data');
    ioSampleDataFolder.add(sampleDataControls, 'sample1');
    const gridGeneratorFolder = ioSampleDataFolder.addFolder('Grid generator');
    gridGeneratorFolder.add(gridGeneratorControls, 'rows');
    gridGeneratorFolder.add(gridGeneratorControls, 'columns');
    gridGeneratorFolder.add(gridGeneratorControls, 'distance');
    gridGeneratorFolder.add(gridGeneratorControls, 'delay');
    gridGeneratorFolder.add(gridGeneratorControls, 'Generate grid');
    // graph analysis
    const graphAnalysisFolder = gui.addFolder('Graph analysis');
    graphAnalysisFolder.add(traversalSettings, 'algorithm', [
        'Breadth First Search', 'Dijkstra Single Source', 'Betweenness Centrality'
    ]);
    graphAnalysisFolder.add(traversalSettings, 'costName', ['step', 'distance', 'bearingChange']);
    graphAnalysisFolder.add(traversalSettings, 'costLimit').onChange(value => generateResultMaterials(value));
    graphAnalysisFolder.add(traversalSettings, 'stepLimit');
    graphAnalysisFolder.add(traversalSettings, 'uTurnPenalty');
    graphAnalysisFolder.add(traversalSettings, 'delay');
    graphAnalysisFolder.add(resultsControls, 'Auto-clear results');
    graphAnalysisFolder.add(resultsControls, 'Clear results');
    // graph visibility
    const layerVisibilityFolder = gui.addFolder('Layer visibility');
    layerVisibilityFolder.close();
    layerVisibilityFolder.add(layerControls, 'Show/hide vertex graph');
    layerVisibilityFolder.add(layerControls, 'Show/hide edge graph');
    layerVisibilityFolder.add(layerControls, 'Show/hide face graph');
    // debugging
    const debuggingFolder = gui.addFolder('Debugging');
    debuggingFolder.close();
    debuggingFolder.add(debuggingControls, 'Console log topogeometry');

    ////////////////////////////////////
    // Initialise the result materials
    ////////////////////////////////////
    generateResultMaterials(traversalSettings.costLimit);

    ///////////////////////////////////////////////////////////
    // Add topogeometry, graph and result groups to the scene
    ///////////////////////////////////////////////////////////
    scene.add(topogeometry.tgVertexGroup);
    scene.add(topogeometry.tgEdgeGroup);
    scene.add(topogeometry.tgFaceGroup);
    scene.add(vertexGraph.group);
    scene.add(edgeGraph.group);
    scene.add(faceGraph.group);
    scene.add(resultGroup);

    // Subscribe the graphs to the topogeometry
    topogeometry.subscribe(vertexGraph.observer);
    topogeometry.subscribe(edgeGraph.observer);
    topogeometry.subscribe(faceGraph.observer);

    //////////////////////////////////////
    // Add event listeners to the canvas
    //////////////////////////////////////
    window.addEventListener('resize', onWindowResize);
    canvasRef.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvasRef.addEventListener('pointermove', onPointerMove, { passive: false });
    canvasRef.addEventListener('pointerup', onPointerUp, false);
    canvasRef.addEventListener("pointercancel", (event) => { console.log('pointercancel') });
    canvasRef.style.touchAction = 'none';

    render();
};

///////////////////////////
// Visualisation of results
///////////////////////////

function addResultMesh(combinedLookup, ID, distance) {
    const resultMesh = combinedLookup[ID].mesh.clone();
    const c_ = lut.getColor(distance);
    const newMaterial = resultMesh.material.clone()
    newMaterial.color.set(c_)
    // Do I need to destroy all of these Materials when they aren't used?
    resultMesh.material = newMaterial;
    resultGroup.add(resultMesh);
};

function generateResultMaterials(value) {
    lut.setMax(value);
};

//////////////////
// Graph traversal
//////////////////
async function traverseGraph(graph, startID, traversalSettings) {
    console.log(traversalSettings)

    const combinedLookup = { ...topogeometry.vertices, ...topogeometry.edges, ...topogeometry.faces };
    // Empty the resultGroup of any previous results
    if (resultsControls['Auto-clear results']){
        resultGroup.children.length = 0;
    }

    let resultGenerator;
    switch (traversalSettings.algorithm) {
        case 'Breadth First Search':
            resultGenerator = gBFSDepthLimit(
                graph,
                startID,
                traversalSettings.costLimit,
                traversalSettings.delay,
            );
            break;
        case 'Dijkstra Single Source':
            resultGenerator = gDijkstraSingleSourceLimit(
                graph,
                startID,
                traversalSettings.costName,
                traversalSettings.costLimit,
                traversalSettings.uTurnPenalty,
                traversalSettings.stepLimit,
                traversalSettings.delay,
            );
            break;
        case 'Betweenness Centrality':
            resultGenerator = gBetweennessCentrality(
                graph,
                startID,
                traversalSettings.costName,
                traversalSettings.costLimit,
                traversalSettings.uTurnPenalty,
                traversalSettings.stepLimit,
                traversalSettings.delay,
            );
            break;
        default:
            console.log(`Sorry, there is no algorithm ${expr}.`);
            return; // Exit the function if no valid algorithm is found
    };

    // The async generator yields intermediate results
    // These need to be collected if a final combined result is needed.
    const resultLog = [];
    // Handle results using for await...of
    for await (const result of resultGenerator) {
        // Handle intermediate results
        if (result && traversalSettings.algorithm == 'Betweenness Centrality'){
            console.log('main, BC result', result)
        } else if (result) {
            resultLog.push(result);
            const { id, predecessor, value } = result;
            console.log("main, intermediate result", result);
            addResultMesh(combinedLookup, id, value);
        }
    }
    console.log('resultLog', resultLog)
};

///////////////////////////////
// Mouse events & window resize
///////////////////////////////
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

function onPointerDown(event) {
    console.log('onPointerDown')

    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    if (transformControls.dragging) {
        return
    }

    // Set flags
    pointerDown = true;
    pointerMoved = false;

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    pointerDownPosition.x = (event.clientX / canvasRef.clientWidth) * 2 - 1;
    pointerDownPosition.y = - (event.clientY / canvasRef.clientHeight) * 2 + 1;

    // Update raycaster & intersect with plane and meshes
    raycaster.setFromCamera(pointerDownPosition, camera);
    raycaster.ray.intersectPlane(plane, rayPlaneIntersection);
    rayIntersectedMeshes = raycaster.intersectObjects([
        ...topogeometry.tgVertexGroup.children,
        ...topogeometry.tgEdgeGroup.children,
        ...topogeometry.tgFaceGroup.children,
    ]);

    // If the raycaster intersects a mesh
    if (rayIntersectedMeshes.length > 0) {

        orbitControls.enabled = false;
        v1id = rayIntersectedMeshes[0].object.userData['id'];

        // Set a timeout to detect hold
        holdTimeout = setTimeout(() => {
            isHolding = true;
            transformControls.attach(rayIntersectedMeshes[0].object);
            //transformControls.enabled = true;
            console.log('Object held for more than 500ms');
            // Perform actions for long hold
        }, 500); // Adjust the duration as needed

    // If the raycaster doesn't intersect a mesh
    } else {
        transformControls.detach();
        orbitControls.enabled = true;
    }

    orbitControls.update()
};

function onPointerMove(event) {

    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    // Ignore minor movements smaller than the movement threshold
    const movementThreshold = 10;
    if (Math.abs(event.clientX - pointerDownPosition.x) < movementThreshold &&
        Math.abs(event.clientY - pointerDownPosition.y) < movementThreshold) {
        return;
    }

    // Do not process move events while TransformControls is dragging
    if (transformControls.dragging) {
        return; 
    }

    // If movement beyond threshold:
    clearTimeout(holdTimeout);

    // set flag and calculate pointer position in normalized device coordinates (-1 to +1)
    pointerMoved = true;
    pointerMovedPosition.x = (event.clientX / canvasRef.clientWidth) * 2 - 1;
    pointerMovedPosition.y = - (event.clientY / canvasRef.clientHeight) * 2 + 1;

    if (!isHolding) {
        // Perform actions for move
    } else {
        // If TransformControls are active, let them handle the pointer move
        return;
    }

    // Update raycaster
    raycaster.setFromCamera(pointerMovedPosition, camera);
    raycaster.ray.intersectPlane(plane, rayPlaneIntersection);

    // When dragging from one point to another you only want to find points
    if (pointerDown) {
        rayIntersectedMeshes = raycaster.intersectObjects(
            topogeometry.tgVertexGroup.children
        )
    // When just mousing around you want to find all geometries
    } else {
        rayIntersectedMeshes = raycaster.intersectObjects([
            ...topogeometry.tgVertexGroup.children,
            ...topogeometry.tgEdgeGroup.children,
            ...topogeometry.tgEdgeGroup.children
        ]);
    };

    if (pointerDown && (vID1 !== null)) {
        //console.log('show a temporary edge...') // future update
    }
};

function onPointerUp(event) {
    console.log('onPointerUp')

    clearTimeout(holdTimeout);

    // If the pointer is down, hasn't moved and is released
    if (pointerDown && !pointerMoved) {

        // If it is under the hold time
        if (!isHolding) {
            console.log('Pointer released before 500ms');
            if (!rayIntersectedMeshes.length > 0) {
                // If not on a line or point, create a vertex
                console.log(rayPlaneIntersection);
                topogeometry.createVertex(rayPlaneIntersection);
            } else {
                // If on a geometry, traverse its graph
                const objectID = rayIntersectedMeshes[0].object.userData['id']
                if (objectID[0] === 'v') {
                    traverseGraph(vertexGraph, objectID, traversalSettings)
                } else if (objectID[0] === 'e') {
                    traverseGraph(edgeGraph, objectID, traversalSettings)
                } else if (objectID[0] === 'f') {
                    traverseGraph(faceGraph, objectID, traversalSettings)
                } else {
                    console.warn("Could not identify graph to use")
                }
            }
        // If it is over the hold time
        } else {
            // If not on a line or point, detach the transformControl
            if (!rayIntersectedMeshes.length > 0) {
                //transformControls.detach();
            }
        }

    } else if (pointerDown && pointerMoved) {
        // If releasing on a geometry, create a new topogeometry edge
        if (rayIntersectedMeshes.length > 0) {
            v2id = rayIntersectedMeshes[0].object.userData['id'];
            topogeometry.createEdge(v1id, v2id);
        };
    };

    // Reset flags
    orbitControls.enabled = true;
    pointerDown = false;
    pointerMoved = false;
    isHolding = false;
    v1id = null;
    v2id = null;
};

///////////
// Render
///////////
function render() {

    // Check if the pointer is hovering over meshes
    if (rayIntersectedMeshes.length > 0) {
        // if rayIntersectedMesh differs from the geometry intersected by the ray
        if (rayIntersectedMesh != rayIntersectedMeshes[0].object) {
            // and isn't null
            if (rayIntersectedMesh) {
                // reset its material
                rayIntersectedMesh.material = rayIntersectedMesh.userData.baseMaterial;
                rayIntersectedMesh.material.needsUpdate = true;
            }
            // Update rayIntersectedMesh to the new geometry & change its color
            rayIntersectedMesh = rayIntersectedMeshes[0].object;
            rayIntersectedMesh.material = rayIntersectedMesh.userData.highlightMaterial;
            rayIntersectedMesh.material.needsUpdate = true;
        }
    } else {
        // if the ray doesn't intersect any objects but rayIntersectedMesh still references an object
        if (rayIntersectedMesh) {
            // reset its color
            rayIntersectedMesh.material = rayIntersectedMesh.userData.baseMaterial;
            rayIntersectedMesh.material.needsUpdate = true;
        };
        rayIntersectedMesh = null;
    };

    stats.update();

    orbitControls.update()

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(render);
};

init();