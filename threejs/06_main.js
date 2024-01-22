import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Graph } from './06_libs/graph.js';

// Scene, camera, renderer
//////////////////////////
const canvasRef = document.querySelector('canvas.webgl');
let scene, camera, renderer, controls;
let sphereInter, raycaster, pointer, cube, plane;
let rayPlaneIntersection = new THREE.Vector3();
let rayVertexIntersection;
let vID1, vID2;
let rayIntersectedObjects;
let intersectedObject = null;
let mouseDown = false;
let mouseMoved = false;
const bfsSettings = {
    steps:5,
};

const vertexGroup = new THREE.Group();
vertexGroup.name = "vertexGroup";
const edgeGroup = new THREE.Group();
edgeGroup.name = "edgeGroup";
let graphObjectsGroup = new THREE.Group(); // ThreeJS Group for vertices and edges, gets added to scene
graphObjectsGroup.add( vertexGroup );
graphObjectsGroup.add( edgeGroup );

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
    // Sphere to show where pointer intersects with object
    const sphereInterGeometry = new THREE.SphereGeometry( 0.1 );
    const sphereInterMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    sphereInter = new THREE.Mesh( sphereInterGeometry, sphereInterMaterial );
    sphereInter.visible = false;
    scene.add( sphereInter );

    // Graph
    graph = new Graph( graphObjectsGroup );
    scene.add( graphObjectsGroup );

    window.addEventListener( 'resize', onWindowResize );
    window.addEventListener( 'mousedown', onMouseDown );
    window.addEventListener( 'mousemove', onMouseMove );
    window.addEventListener( 'mouseup', onMouseUp );

    render();
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
};

function onMouseDown( event ) {
    mouseDown = true;
    mouseMoved = false;

    // try updating this here as well for touch device where
    // mouseMove may not have happened before the touch event
    // calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = ( event.clientX / canvasRef.clientWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / canvasRef.clientHeight ) * 2 + 1;

    if ( rayVertexIntersection ) {
        controls.enabled = false;//! event.value;
        vID1 = rayIntersectedObjects[0].object.userData['vID'];
    }
}

function onMouseMove( event ) {

    mouseMoved = true;

    // calculate pointer position in normalized device coordinates (-1 to +1)
    pointer.x = ( event.clientX / canvasRef.clientWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / canvasRef.clientHeight ) * 2 + 1;

    if (mouseDown && (vID1 !== null)) {
        //console.log('show a temporary edge...')
    }
};

function onMouseUp ( event ) {
    if (mouseDown && !mouseMoved) {
        if ( !rayVertexIntersection ) {
            graph.addVertex( rayPlaneIntersection );
        } else {
            //console.log(
                graph.traverseGraph( rayIntersectedObjects[0].object.userData['vID'], bfsSettings.steps )
            //)
        }
    } else if (mouseDown && mouseMoved) {
        if ( rayVertexIntersection ) {
            vID2 = rayIntersectedObjects[0].object.userData['vID'];
            graph.addEdge( vID1,vID2 );
        }
    }

    // Reset the flags
    mouseDown = false;
    mouseMoved = false;
    controls.enabled = true;
    vID1 = null;
    vID2 = null;
}

const vertexOriginalMaterial = new THREE.MeshBasicMaterial({color: 0x655967});
const vertexHoverMaterial = new THREE.MeshBasicMaterial({color: 0xFFFF00});

// Render
/////////
function render() {

    // update the raycaster
    raycaster.setFromCamera( pointer, camera );

    // intersect raycaster with plane
    raycaster.ray.intersectPlane( plane, rayPlaneIntersection );
    if ( rayPlaneIntersection !== null ) {
        sphereInter.visible = true;
        sphereInter.position.copy( rayPlaneIntersection );
    } else {
        sphereInter.visible = false;
    };

    // intersect raycaster with graph objects
    rayIntersectedObjects = raycaster.intersectObjects(
        vertexGroup.children
        );

    // if there are intersected objects
    if ( rayIntersectedObjects.length > 0 ) {
        rayVertexIntersection = true;
        // if intersectedObject is different from the current intersected object
        if ( intersectedObject != rayIntersectedObjects[0].object ) {
            // reset the current (old) intersectedObject's color
            if ( intersectedObject ) {
                intersectedObject.material = vertexOriginalMaterial;
            }

            // Update intersectedObject to the new object & change its color
            intersectedObject = rayIntersectedObjects[0].object;
            intersectedObject.material = vertexHoverMaterial;
        }

    // if the ray doesn't intersect any objects
    } else {
        rayVertexIntersection = false;
        // If intersectedObject still references an object, reset the selection map materials
        if ( intersectedObject ) {
            // reset the current (old) intersectedObject's color
            intersectedObject.material = vertexOriginalMaterial;//intersectedObject.userData['originalColor'];
        };
        // Set intersectedObject to reference null
        intersectedObject = null;

    };

    controls.update()

    renderer.render( scene, camera );
    requestAnimationFrame(render);
};

init();