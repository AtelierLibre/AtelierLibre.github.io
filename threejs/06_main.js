import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Graph } from './06_libs/graph.js';

// Scene, camera, renderer
//////////////////////////
const canvasRef = document.querySelector('canvas.webgl');
let scene, camera, renderer, controls;
let sphereInter, raycaster, pointer, plane;
let rayPlaneIntersection = new THREE.Vector3();
let vID1, vID2;
let rayIntersectedGeometries = [];
let rayIntersectedGeometry = null;
let pointerDown = false;
let pointerMoved = false;
const bfsSettings = {
    steps:5,
};

const vertexOriginalMaterial = new THREE.MeshBasicMaterial({color: 0x655967});
const vertexHoverMaterial = new THREE.MeshBasicMaterial({color: 0xFFFF00});

let graphObjectsGroup = new THREE.Group(); // ThreeJS Group for vertices and edges, gets added to scene

let graph; // The graph object

function init() {
    // initial setup - everything you want to run once, before the animation starts.

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x232023 );

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

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas:canvasRef, antialiasing:true });
    renderer.setPixelRatio( window.devicePixelRatio * 1.5 );
    renderer.setSize( window.innerWidth, window.innerHeight );

    // Controls
    controls = new OrbitControls( camera, renderer.domElement )

    // GUI
    const gui = new GUI();
    gui.add(bfsSettings, 'steps');

    // Raycaster and pointer
    // Create a Plane object
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Adjust the normal and constant as needed
    pointer = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.3;
    raycaster.linePrecision = 0.01;

    // Sphere to show where pointer intersects with object
    const sphereInterGeometry = new THREE.SphereGeometry( 0.1 );
    const sphereInterMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    sphereInter = new THREE.Mesh( sphereInterGeometry, sphereInterMaterial );
    sphereInter.visible = false;
    scene.add( sphereInter );

    // Create a Graph and add its geometries to the scene
    graph = new Graph( graphObjectsGroup );
    scene.add( graph.vertexGroup );
    scene.add( graph.edgeGroup);

    window.addEventListener( 'resize', onWindowResize );
    canvasRef.addEventListener( 'pointerdown', onPointerDown, { passive: false } );
    canvasRef.addEventListener( 'pointermove', onPointerMove, { passive: false } );
    canvasRef.addEventListener( 'pointerup', onPointerUp, false );
    canvasRef.style.touchAction = 'none';

    render();
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
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
};

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