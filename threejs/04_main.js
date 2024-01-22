// IMPORTS
import * as JSTS from 'jsts';
import * as THREE from 'three';
import * as JSTS_3JS from 'nb_jsts_3js';
import * as IO from 'nb_io';
import * as LIGHTS from 'nb_lights';
import * as MATERIALS from 'nb_materials';
import * as SELECTION from 'nb_selection';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// Set up threejs
//////////////////////////////////////////////////////
const canvas = document.querySelector('canvas.webgl');
let camera, scene, renderer;

const parentGroup = new THREE.Group();
parentGroup.rotateX(-Math.PI/2);

// OBJECT SELECTION / RAYCASTING
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = 5;
raycaster.params.Points.threshold = 3;
let INTERSECTED;
let selectionMap = new Map();
let intersectedObject;
let intersectedStreetID;
// Sphere to show where pointer intersects with object
const sphereInterGeometry = new THREE.SphereGeometry( 3 );
const sphereInterMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
const sphereInter = new THREE.Mesh( sphereInterGeometry, sphereInterMaterial );
sphereInter.visible = false;

let rect;

// GUI variables
const gui_values = {
  primaryBufferDistance: 7.5,
  secondaryBufferDistance: 3.5,
  selectionSteps: 0, // Not zero indexed
};

function init() {
  
  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x232023 );

  // Add lights
	scene.add( LIGHTS.hemiLight );
	scene.add( LIGHTS.dirLight );

  // Add parent group
  scene.add(parentGroup);

  // Create a camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 400, 400, 300 );
	scene.add( camera );

  // Axes Helper
  const axesHelper = new THREE.AxesHelper( 50 );
  scene.add( axesHelper );

  // Create a renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  rect = renderer.domElement.getBoundingClientRect();

  // orbit controls - must come after declaration of camera and renderer
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;

  // GUI
  const gui = new GUI();
  const selectionFolder = gui.addFolder( 'Selection' );
  selectionFolder.add(
    gui_values, "selectionSteps", 0, 1, 1).name("Selection steps").onChange( value => {changeSelectionSteps(value)} );

  // Event Listeners
  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener( 'pointermove', onPointerMove );
  window.addEventListener( 'contextmenu', onContextMenu, false );
  window.addEventListener( 'mousedown', onMouseDown, false);
};

function onMouseDown( event ) {
  event.preventDefault();
  console.log(INTERSECTED);
};

let tempValue;
let colorForLevel = Array.from({ length: gui_values.selectionSteps }).map((_, i, arr) => new THREE.Color().setHSL(i / arr.length, 1, 0.5));
let selectionStepMaterials = [];
const baseMaterial = new THREE.MeshLambertMaterial();
function changeSelectionSteps( value ) {
  // The slider triggers a change even when the integer value hasn't changed
  // Only change the array if the integer value itself changes.
  if (tempValue != value) {
    tempValue = value;
    // Empty the arrays
    colorForLevel.length = 0;
    selectionStepMaterials.length = 0;
    // Repopulate the arrays
    colorForLevel = Array.from({ length: value }).map((_, i, arr) => new THREE.Color().setHSL(i / arr.length, 1, 0.5));
    selectionStepMaterials = colorForLevel.map(colorToMaterial);
  };
};

function colorToMaterial( color ) {
  const material = baseMaterial.clone()
  material.color.copy( color )
  return material
};

function onPointerMove( event ) {
  // calculate pointer position in normalized device coordinates (-1 to +1 for both components)
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
};

// https://stackoverflow.com/questions/4235426/how-can-i-capture-the-right-click-event-in-javascript
function onContextMenu( event ) {
  event.preventDefault();

  // calculate objects intersectedObjecting the picking ray
  const intersectedObjects = raycaster.intersectObjects( scene.children );

  if (intersectedObjects.length) {
    intersectedObject = intersectedObjects[0].object; // set global variable to 1st object
    intersectedStreetID = intersectedObject.userData.street_id // set ID global variable

    menu.style.left = (event.clientX - rect.left) + "px";
    menu.style.top = (event.clientY - rect.top) + "px";
    menu.style.display = "";
  };

  return false;
};

function animate() {
  requestAnimationFrame( animate );
  render();
};

// find intersections
function render() {

  raycaster.setFromCamera( pointer, camera );

  // get all intersected objects
  const intersects = raycaster.intersectObjects( parentGroup.children, false );
  
  // if there are intersected objects
  if ( intersects.length > 0 ) {
    // Show white intersection sphere
    sphereInter.visible = true;
    sphereInter.position.copy( intersects[ 0 ].point );

    // if INTERSECTED is different from the current intersected object
    if ( INTERSECTED != intersects[ 0 ].object ) {
      // and if the selectionMap is not empty
      if ( selectionMap.size != 0 ) {
        // reset the material of all objects in the selection map
        SELECTION.resetSelectionMapMaterials( selectionMap );
      };

      // Update INTERSECTED
      INTERSECTED = intersects[ 0 ].object;

      // Update the selectionMap
      SELECTION.updateSelectionMap( selectionMap, INTERSECTED, gui_values.selectionSteps );
    }

  // if there aren't any intersected objects
  } else {
    // Make the sphere invisible
    sphereInter.visible = false;

    // If INTERSECTED still references an object, reset the selection map materials
    if ( INTERSECTED ) {
        // reset the material of all objects in the selection map
        SELECTION.resetSelectionMapMaterials( selectionMap );
    };
    // Set INTERSECTED to reference null
    INTERSECTED = null;

  };

  renderer.render(scene, camera);
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
};

init();
animate();

// JSTS common functions and parameters
///////////////////////////////////////
const geometryFactory = new jsts.geom.GeometryFactory(); // Create a geometry factory
const bufferParams = new jsts.operation.buffer.BufferParameters();
bufferParams.setEndCapStyle(2);

// Generate an array of LineStrings
///////////////////////////////////

// Either by reading in a GeoJSON or by creating a grid of LineStrings from scratch
let array_LineStrings;
if (true) {
  array_LineStrings = await IO.readGeoJSON_LineStringArray('.\\04_data\\test.geojson');
} else {
  array_LineStrings = IO.generate_LineStringArray();
};

// Polygonize them
//////////////////

// Put the array of LineStrings into a GeometryCollection
const lineStringGC = geometryFactory.createGeometryCollection(array_LineStrings);
// Union the GeometryCollection to 'node' everything
const lineStringU =  jsts.operation.union.UnaryUnionOp.union(lineStringGC);
// Create the polygonizer
const polygonizer = new jsts.operation.polygonize.Polygonizer();
// Add the noded linestrings to the polygonizer
polygonizer.add(lineStringU);
// Polygonize
polygonizer.polygonize();

// Convert to threejs meshes and lines
//////////////////////////////////////

// Add the polygons
for (const jstsPolygon of polygonizer.getPolygons()) {
  const threeJSMesh = JSTS_3JS.polygonToShapeMesh (jstsPolygon, MATERIALS.darkGreyMaterial);
  // Set the user data of both 3js and jsts objects
  threeJSMesh.userData.jsts = jstsPolygon;
  jstsPolygon.setUserData({'threeJS':threeJSMesh});
  // Add the mesh to the parent group in the scene
  parentGroup.add(threeJSMesh);
}

// Add the edges
const edge_iterator = polygonizer._graph._edges.iterator()
while (edge_iterator.hasNext()) {
  const jstsEdge = edge_iterator.next();
  const threeJSLine = JSTS_3JS.linestringToLine (jstsEdge._line, MATERIALS.whiteLineDashedMaterial);
  // Set the user data of both 3js and jsts objects
  threeJSLine.userData.jsts = jstsEdge;
  jstsEdge._line.setUserData({'threeJS':threeJSLine});
  // Calculate Distances for dashes and add to scene
  threeJSLine.computeLineDistances();
  parentGroup.add(threeJSLine);
}

// Add the nodes
const node_iterator = polygonizer._graph._nodeMap.iterator();
while (node_iterator.hasNext()) {
  const jstsNode = node_iterator.next();
  const threeJSMesh = JSTS_3JS.nodeToSphereMesh(jstsNode, MATERIALS.redMaterial);
  // Set the user data of both 3js and jsts objects
  threeJSMesh.userData.jsts = jstsNode;
  jstsNode._userData = {'threeJS':threeJSMesh}; // !!! This is not standard !!!
  // Add the mesh to the parent group in the scene
  parentGroup.add(threeJSMesh);
}

scene.add( sphereInter );

// Hack - push _userData links from dirEdges to Polygons that don't exist in the graph
// Link directed edges to polygons
const dirEdgeToPolygon = new Map();
const polygonToDirEdge = new Map();

const graph_dirEdges = polygonizer._graph._dirEdges.toArray()//[53]._edgeRing.getPolygon()
const polygonizer_polygons = polygonizer.getPolygons().toArray()

for ( const gde of graph_dirEdges ) {
  if (gde._edgeRing) {
    const eRP = gde._edgeRing.getPolygon();
    for ( const pp of polygonizer_polygons ) {
      if (eRP.equals(pp)) {
        gde['_userData'] = {};
        gde._userData['Polygon'] = pp;
        if (!polygonToDirEdge.has(pp)) {
          polygonToDirEdge.set(pp, gde);
          pp._userData['dirEdge'] = gde;
        };
      };
    };
  };
};