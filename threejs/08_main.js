"use strict"

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Topogeometry } from './topogeometry.js';
import { Lut } from 'three/addons/math/Lut.js';
import { g_bfs_depth_limit } from './algorithms/g_bfs_depth_limit.js';
import { VertexGraph } from './graphVertex.js';
import { EdgeGraph } from './graphEdge.js';
import { FaceGraph } from './graphFace.js';
import { TopogeometryVis } from './topogeometryVisualiser.js';

// Scene, camera, renderer
//////////////////////////
const stats = new Stats();
const canvasRef = document.querySelector('canvas.webgl');
let scene, camera, renderer, labelRenderer, controls;
let raycaster, pointer, plane;
let rayPlaneIntersection = new THREE.Vector3();
let vID1;
let v1id, v2id;
let rayIntersectedMeshes = [];
let rayIntersectedMesh = null;
let pointerDown = false;
let pointerMoved = false;
const traversalSettings = {
    algorithm: 'Breadth First Search',
    limit: 5,
    maxStep: 1
};

// Create the topogeometryVis object
let topogeometryVis;
// Create the topogeometry - this is the new approach
const topogeometry = new Topogeometry();
// Create some graphs
const vertexGraph = new VertexGraph();
const edgeGraph = new EdgeGraph();
const faceGraph = new FaceGraph();

let lut = new Lut('rainbow', 512); // colors
lut.lut.reverse();

const resultGroup = new THREE.Group();
resultGroup.translateY(0.02);

// GUI functions
const buttons = {
    'Clear results': function () {
        resultGroup.children.length = 0;
    },
    'Console log topogeometry': function () {
        console.log(topogeometry)
    }
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

/**
 * init function
 * 
 * Runs once, before the animation starts
 */
function init() {

    // Scene - black background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    // Camera (Field of view, Aspect ratio, Near clipping plane, Far clipping plane)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 5;
    scene.add(camera);

    // GridHelper ( size, divisions, colorCenterLine, colorGrid )
    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Renderers
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialiasing: true });
    renderer.setPixelRatio(window.devicePixelRatio * 1.5);
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.touchAction = 'none';
    document.body.appendChild(labelRenderer.domElement);

    document.body.appendChild(stats.dom);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);

    // GUI
    const gui = new GUI();
    gui.add(traversalSettings, 'algorithm', [
        'Breadth First Search',
    ]);
    gui.add(traversalSettings, 'limit').onChange(value => generateResultMaterials(value));
    //gui.add(traversalSettings, 'maxStep');
    gui.add(buttons, 'Clear results');
    gui.add(buttons, 'Console log topogeometry');
    // nested controllers
    const layerVisibilityFolder = gui.addFolder('Layer visibility');
    layerVisibilityFolder.close();
    layerVisibilityFolder.add(layerControls, 'Show/hide vertex graph');
    layerVisibilityFolder.add(layerControls, 'Show/hide edge graph');
    layerVisibilityFolder.add(layerControls, 'Show/hide face graph');

    generateResultMaterials(traversalSettings.limit); // initialise

    // Raycaster and pointer
    // Create a Plane object - adjust normal and constant as needed
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    pointer = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.3;
    raycaster.linePrecision = 0.01;

    // Add the graph visualisers to the scene
    scene.add(vertexGraph.group);
    scene.add(edgeGraph.group);
    scene.add(faceGraph.group);

    topogeometryVis = new TopogeometryVis(scene);
    // Subscribe the topogeometryVis to the topogeometry
    topogeometry.subscribe(topogeometryVis.observer);
    // Subscribe the graphs to the topogeometry
    topogeometry.subscribe(vertexGraph.observer);
    topogeometry.subscribe(edgeGraph.observer);
    topogeometry.subscribe(faceGraph.observer);

    // Add the resultGroup to the scene
    scene.add(resultGroup);

    window.addEventListener('resize', onWindowResize);
    canvasRef.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvasRef.addEventListener('pointermove', onPointerMove, { passive: false });
    canvasRef.addEventListener('pointerup', onPointerUp, false);
    canvasRef.addEventListener("pointercancel", (event) => { console.log('pointercancel') });
    canvasRef.style.touchAction = 'none';

    render();
};

////////////////////////////////////////////////////
// Traverse the graph & add the results to the scene
////////////////////////////////////////////////////
function addResultMesh(combinedLookup, ID, distance) {
    const resultMesh = combinedLookup[ID].mesh.clone();
    //resultMesh.scale.set(1.1, 1.1, 1.1);
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

function traverseGraph(graph, start_id, traversalSettings) {
    console.log(traversalSettings)

    const combinedLookup = { ...topogeometry.vertices, ...topogeometry.edges, ...topogeometry.faces };
    // Empty the resultGroup of any previous results
    resultGroup.children.length = 0;

    switch (traversalSettings.algorithm) {

        case 'Breadth First Search':
            let result_generator = g_bfs_depth_limit(graph, start_id, traversalSettings.limit);

            for (let result of result_generator) {
                let ID = result[0];
                const distance = Object.values(result[1])[0]['depth'];
                addResultMesh(combinedLookup, ID, distance);
            }
            break;

        default:
            console.log(`Sorry, there is no algorithm ${expr}.`);
    };
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

let initialPointerPosition = { x: null, y: null };

function onPointerDown(event) {

    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    // Set flags
    pointerDown = true;
    pointerMoved = false;

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = (event.clientX / canvasRef.clientWidth) * 2 - 1;
    pointer.y = - (event.clientY / canvasRef.clientHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, rayPlaneIntersection);

    // Intersect raycaster with geometries
    rayIntersectedMeshes = raycaster.intersectObjects([
        ...topogeometryVis.tgVertexGroup.children,
        ...topogeometryVis.tgEdgeGroup.children,
        ...topogeometryVis.tgFaceGroup.children,
    ]);

    if (rayIntersectedMeshes.length > 0) {
        controls.enabled = false;
        v1id = rayIntersectedMeshes[0].object.userData['id'];
        console.log("Pointer down on:", v1id)
    } else {
        controls.enabled = true;
    }
    controls.update()

    // Store initial pointer position to check for significant movement
    initialPointerPosition.x = event.clientX;
    initialPointerPosition.y = event.clientY;
};

function onPointerMove(event) {
    // Set minimum movement threshold
    const moveThreshold = 10;

    // Ignore minor movements
    if (Math.abs(event.clientX - initialPointerPosition.x) < moveThreshold &&
        Math.abs(event.clientY - initialPointerPosition.y) < moveThreshold) {
        return;
    }

    // If movement beyond threshold, set flag
    pointerMoved = true;

    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = (event.clientX / canvasRef.clientWidth) * 2 - 1;
    pointer.y = - (event.clientY / canvasRef.clientHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, rayPlaneIntersection);

    // When dragging from one point to another you only want to find points
    if (pointerDown) {
        rayIntersectedMeshes = raycaster.intersectObjects(
            topogeometryVis.tgVertexGroup.children
        )
        // When just mousing around you want to find all geometries
    } else {
        rayIntersectedMeshes = raycaster.intersectObjects([
            ...topogeometryVis.tgVertexGroup.children,
            ...topogeometryVis.tgEdgeGroup.children,
            ...topogeometryVis.tgEdgeGroup.children
        ]);
    };

    if (pointerDown && (vID1 !== null)) {
        //console.log('show a temporary edge...') // future update
    }
};

function onPointerUp(event) {
    // Click/tap and release without moving
    if (pointerDown && !pointerMoved) {

        // If not on a line or point
        if (!rayIntersectedMeshes.length > 0) {

            topogeometry.createVertex(rayPlaneIntersection);

            // If on a line or point
        } else {
            const object_id = rayIntersectedMeshes[0].object.userData['id']

            console.log("Pointer up on:", object_id)

            let graph
            if (object_id[0] === 'v') {
                graph = vertexGraph;
            } else if (object_id[0] === 'e') {
                graph = edgeGraph;
            } else if (object_id[0] === 'f') {
                graph = faceGraph;
            } else {
                console.warn("Could not identify graph to use")
            }

            traverseGraph(
                graph,
                object_id,
                traversalSettings)
        }
        // Click/tap, move and release
    } else if (pointerDown && pointerMoved) {
        // If releasing on a geometry
        if (rayIntersectedMeshes.length > 0) {

            v2id = rayIntersectedMeshes[0].object.userData['id'];

            topogeometry.createEdge(v1id, v2id);
        };
    };

    // Reset the flags
    pointerDown = false;
    pointerMoved = false;
    controls.enabled = true;
    v1id = null;
    v2id = null;
};

/////////
// Render
/////////
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

    controls.update()

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(render);
};

init();