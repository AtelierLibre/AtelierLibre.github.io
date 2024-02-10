import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Graph } from './graph.js';
import { Lut } from 'three/addons/math/Lut.js';
import { bfs_depth_limit } from './algorithms/bfs_depth_limit.js';
import { edge_bfs_depth_limit } from './algorithms/edge_bfs_depth_limit.js';
import { dijkstra_single_source_limit } from './algorithms/dijkstra_single_source_limit.js';
import { edge_dijkstra_single_source_limit } from './algorithms/edge_dijkstra_single_source_limit.js';
import { edge_angular_dijkstra_single_source_limit } from './algorithms/edge_angular_dijkstra_single_source_limit.js';
import { edge_nou_angular_dijkstra_single_source_limit } from './algorithms/edge_nou_angular_dijkstra_single_source_limit.js';

// Scene, camera, renderer
//////////////////////////
const canvasRef = document.querySelector('canvas.webgl');
let scene, camera, renderer, labelRenderer, controls;
let raycaster, pointer, plane;
let rayPlaneIntersection = new THREE.Vector3();
let vID1, vID2;
let rayIntersectedGeometries = [];
let rayIntersectedGeometry = null;
let pointerDown = false;
let pointerMoved = false;
const traversalSettings = {
    algorithm:'Breadth First Search',
    limit:5,
};

const vertexOriginalMaterial = new THREE.MeshBasicMaterial({color: 0x655967});
const vertexHoverMaterial = new THREE.MeshBasicMaterial({color: 0xFFFF00});

let graph; // The graph object

let lut = new Lut( 'rainbow', 512 ); // colors
lut.lut.reverse();
const resultGroup = new THREE.Group();

const buttons = {
    'Toggle line weights': function () {
        camera.layers.toggle( 1 );
    },
    'Clear results': function () {
        resultGroup.children.length = 0;
    },
    'Enable All': function () {
        camera.layers.enableAll();
    },
    'Disable All': function () {
        camera.layers.disableAll();
    }
};

function init() {
    // initial setup - everything you want to run once, before the animation starts.

    // Scene - black background
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0, 0, 0 );

    // Camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.z = 5;
    camera.position.y = 5;
    scene.add( camera );

    // Grid helper
    const gridHelper = new THREE.GridHelper(
        100,
        100,
        0x888888,
        0x444444
        );
    scene.add( gridHelper );

    // Axes helper
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    // Renderers
    renderer = new THREE.WebGLRenderer({ canvas:canvasRef, antialiasing:true });
    renderer.setPixelRatio( window.devicePixelRatio * 1.5 );
    renderer.setSize( window.innerWidth, window.innerHeight );

    labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.touchAction = 'none';
	document.body.appendChild( labelRenderer.domElement );

    // Controls
    controls = new OrbitControls( camera, renderer.domElement );

    // GUI
    const gui = new GUI();
    gui.add( traversalSettings, 'algorithm', [
        'Breadth First Search',
        'Dijkstra Single Source',
        'Edge Breadth First Search',
        'Edge Dijkstra Single Source',
        'Edge Angular Dijkstra Single Source',
        'Edge NoU Angular Dijkstra Single Source'
    ] );
    gui.add( traversalSettings, 'limit' ).onChange( value => generateResultMaterials( value ) );
    gui.add( buttons, 'Toggle line weights' );
    gui.add( buttons, 'Clear results');
    generateResultMaterials( traversalSettings.limit ); // initialise

    // Raycaster and pointer
    // Create a Plane object - adjust normal and constant as needed
    plane = new THREE.Plane( new THREE.Vector3( 0,1,0 ), 0 );
    pointer = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.3;
    //raycaster.params.Points.threshold = 1.2;
    raycaster.linePrecision = 0.01;

    // Create a Graph and add its geometries to the scene
    graph = new Graph();
    scene.add( graph.vertexGroup );
    scene.add( graph.edgeGroup);

    // Add the resultGroup to the scene
    scene.add( resultGroup );

    window.addEventListener( 'resize', onWindowResize );
    canvasRef.addEventListener( 'pointerdown', onPointerDown, { passive: false } );
    canvasRef.addEventListener( 'pointermove', onPointerMove, { passive: false } );
    canvasRef.addEventListener( 'pointerup', onPointerUp, false );
    canvasRef.addEventListener("pointercancel", (event) => {console.log('pointercancel')});
    canvasRef.style.touchAction = 'none';
    //canvasRef.style.pointerEvents = 'none'; // Stops it working entirely

    render();
};

////////////////////
///
const resultSphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry( 0.125, 16, 16 ),
    new THREE.MeshBasicMaterial()
);

function addResultSphere( ID, distance ) {
    const resultMesh = resultSphereMesh.clone();
    resultMesh.position.copy( graph.vertices[ ID ].mesh.position );
    const c_ = lut.getColor( distance );
    // Do I need to destroy all of these Materials when they aren't used?
    resultMesh.material = new THREE.MeshBasicMaterial({ color:c_, transparent:false, opacity:1 })
    resultGroup.add( resultMesh );
};

function addResultLine( ID, distance ) {
    const resultLine = graph.edges[ ID ].mesh.clone();
    const c_ = lut.getColor( distance );
    // Do I need to destroy all of these Materials when they aren't used?
    resultLine.material = new THREE.LineBasicMaterial({ color:c_, linewidth:4 });
    resultGroup.add( resultLine );
};

function generateResultMaterials(value) {
    lut.setMax( value );
};

function traverseGraph( graph, start_id, traversalSettings ) {
    console.log(traversalSettings)
    // Reset result
    resultGroup.children.length = 0;
    let result;
    let predecessors;

    switch (traversalSettings.algorithm) {

        case 'Breadth First Search':
            result = bfs_depth_limit( graph, start_id, traversalSettings.limit );
            Object.keys(result).forEach(key => {
                addResultSphere( key, result[key] );
            });
            break;

        case 'Dijkstra Single Source':
            result = dijkstra_single_source_limit( graph, start_id, traversalSettings.limit );
            Object.keys(result).forEach(key => {
                addResultSphere( key, result[key] );
            });
            break;
            
        case 'Edge Breadth First Search':
            result = edge_bfs_depth_limit( graph, start_id, traversalSettings.limit );
            Object.keys(result).forEach(key => {
                addResultLine( key, result[key] );
            });
            break;
            
        case 'Edge Dijkstra Single Source':
            result = edge_dijkstra_single_source_limit( graph, start_id, traversalSettings.limit );
            Object.keys(result).forEach(key => {
                addResultLine( key, result[key] );
            });
            break;

        case 'Edge Angular Dijkstra Single Source':
            result = edge_angular_dijkstra_single_source_limit( graph, start_id, traversalSettings.limit );
            Object.keys(result).forEach(key => {
                addResultLine( key, result[key] );
            });
            break;

        case 'Edge NoU Angular Dijkstra Single Source':
            const combined_result = edge_nou_angular_dijkstra_single_source_limit( graph, start_id, traversalSettings.limit );
            result = combined_result['distances'];
            predecessors = combined_result['predecessors'];
            Object.keys(result).forEach(key => {
                addResultLine( key, result[key] );
            });
            break;

        default:
            console.log(`Sorry, there is no algorithm ${expr}.`);
    };
    console.log('result', result, 'predecessors', predecessors);

};
///
////////////////////
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
};

let initialPointerPosition = { x: null, y: null };

function onPointerDown( event ) {

    console.log('pointerDown!')
    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    pointerDown = true;
    pointerMoved = false;

    // calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = ( event.clientX / canvasRef.clientWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / canvasRef.clientHeight ) * 2 + 1;

    // update the raycaster
    raycaster.setFromCamera( pointer, camera );
    raycaster.ray.intersectPlane( plane, rayPlaneIntersection );

    // intersect the raycaster with the plane and the geometries
    rayIntersectedGeometries = raycaster.intersectObjects(
        [...graph.vertexGroup.children, ...graph.edgeGroup.children]
    );

    if ( rayIntersectedGeometries.length > 0 ) {
        controls.enabled = false;
        vID1 = rayIntersectedGeometries[0].object.userData['ID'];
    } else {
        controls.enabled = true;
    }
    controls.update()

    // Store the initial pointer position to check for significant movement
    initialPointerPosition.x = event.clientX;
    initialPointerPosition.y = event.clientY;
};

function onPointerMove( event ) {
    // Check if the pointer has moved significantly
    const moveThreshold = 10;  // Adjust this value as needed
    if (Math.abs(event.clientX - initialPointerPosition.x) < moveThreshold &&
        Math.abs(event.clientY - initialPointerPosition.y) < moveThreshold) {
        return;  // Ignore minor movements
    }

    pointerMoved = true;
    console.log('pointerMoved')
    event.preventDefault(); // Trying this
    event.stopPropagation(); // and this

    // calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = ( event.clientX / canvasRef.clientWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / canvasRef.clientHeight ) * 2 + 1;

    // update the raycaster
    raycaster.setFromCamera( pointer, camera );
    raycaster.ray.intersectPlane( plane, rayPlaneIntersection );

    // When dragging from one point to another you only want to find points
    if ( pointerDown ) {
        rayIntersectedGeometries = raycaster.intersectObjects(
            graph.vertexGroup.children
        )
    // When just mousing around you want to find all geometries
    } else {
        rayIntersectedGeometries = raycaster.intersectObjects(
            [...graph.vertexGroup.children, ...graph.edgeGroup.children]
        )
    };

    if (pointerDown && (vID1 !== null)) {
        console.log('show a temporary edge...') // future update
    }
};

function onPointerUp ( event ) {
    console.log('pointerUp!')

    if (pointerDown && !pointerMoved) {
        console.log('here')
        if ( !rayIntersectedGeometries.length > 0 ) {
            graph.addVertex( rayPlaneIntersection );
        } else {
            traverseGraph(
                graph,
                rayIntersectedGeometries[0].object.userData['ID'],
                traversalSettings )
        }
    } else if (pointerDown && pointerMoved) {
        if ( rayIntersectedGeometries.length > 0 ) {
            vID2 = rayIntersectedGeometries[0].object.userData['ID'];
            graph.addEdge( vID1,vID2 );
            console.log(graph)
        }
    };
    // Reset the flags
    pointerDown = false;
    pointerMoved = false;
    controls.enabled = true;
    vID1 = null;
    vID2 = null;
}

// Render
/////////
function render() {
    if ( rayIntersectedGeometries.length > 0 ) {
        // if rayIntersectedGeometry differs from the geometry intersected by the ray
        if ( rayIntersectedGeometry != rayIntersectedGeometries[0].object ) {
            // and isn't null
            if ( rayIntersectedGeometry ) {
                // reset its color
                rayIntersectedGeometry.material = vertexOriginalMaterial;
            }
            // Update rayIntersectedGeometry to the new geometry & change its color
            rayIntersectedGeometry = rayIntersectedGeometries[0].object;
            rayIntersectedGeometry.material = vertexHoverMaterial;
        }
    } else {
    // if the ray doesn't intersect any objects but rayIntersectedGeometry still references an object
        if ( rayIntersectedGeometry ) {
            // reset its color
            rayIntersectedGeometry.material = vertexOriginalMaterial;
        };
        rayIntersectedGeometry = null;
    };

    controls.update()

    renderer.render( scene, camera );
    labelRenderer.render(scene, camera);
    requestAnimationFrame(render);
};

init();