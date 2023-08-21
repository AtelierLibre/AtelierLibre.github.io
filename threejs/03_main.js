// IMPORTS
import * as JSTS from 'jsts';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// Set up threejs
//////////////////////////////////////////////////////
const canvas = document.querySelector('canvas.webgl');
let camera, scene, renderer;

// OBJECT SELECTION / RAYCASTING
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let intersectedObject;
let intersectedStreetID;
let rect;

// GUI variables
const gui_values = {
  primaryBufferDistance: 7.5,
  secondaryBufferDistance: 3.5,
};
//const bufferDistance = gui_values.bufferDistance;
gui_values.primaryBufferDistance

// Create some materials
const secondaryStreetMaterial = new THREE.MeshStandardMaterial( { color: 0x7a7461, side: THREE.DoubleSide } );
const primaryStreetMaterial = new THREE.MeshStandardMaterial( { color: 0x474c55, side: THREE.DoubleSide } );
const streetCentreLineMaterial = new THREE.LineDashedMaterial( { color: 0xffffff, linewidth: 2, scale: 1, dashSize: 3, gapSize: 10 } );
const netBlockMaterial = new THREE.MeshStandardMaterial( { color: 0x556B2F, side: THREE.DoubleSide } );

function init() {
  // Create a scene
  scene = new THREE.Scene();

  // Create lights
  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
	hemiLight.position.set( 0, 20, 0 );
	scene.add( hemiLight );

	const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
	dirLight.position.set( - 3, 10, - 10 );
	scene.add( dirLight );

  // Create a camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 400, 400, 300 );
	scene.add( camera );

  // Axes Helper
  const axesHelper = new THREE.AxesHelper( 50 );
  scene.add( axesHelper );

  // Grid Helper
  const gridHelper = new THREE.GridHelper( 1000, 10 );
  //scene.add( gridHelper );

  // Create a renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  rect = renderer.domElement.getBoundingClientRect();

  // orbit controls - must come after declaration of camera and renderer
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.addEventListener('change', render);

  // GUI
  const gui = new GUI();
  const streetsFolder = gui.addFolder( 'Streets');
  streetsFolder.add(
    gui_values, "primaryBufferDistance", 2.5, 25, 0.1).name("Primary Buffer distance").onChange( value => {changeBuffer();});
  streetsFolder.add(
    gui_values, "secondaryBufferDistance", 2.5, 25, 0.1).name("Secondary Buffer distance").onChange( value => {changeBuffer();});
  
    // Event Listeners
  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener( 'pointermove', onPointerMove );
  window.addEventListener( 'contextmenu', onContextMenu, false );
};

function onPointerMove( event ) {
  // calculate pointer position in normalized device coordinates
  // -1 to +1 for both components
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
};

// https://stackoverflow.com/questions/4235426/how-can-i-capture-the-right-click-event-in-javascript
function onContextMenu( event ) {
  event.preventDefault();

  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera( pointer, camera );

  // calculate objects intersectedObjecting the picking ray
  const intersectedObjects = raycaster.intersectObjects( scene.children );

  if (intersectedObjects.length) {
    intersectedObject = intersectedObjects[0].object;
    intersectedStreetID = intersectedObject.userData.street_id

    menu.style.left = (event.clientX - rect.left) + "px";
    menu.style.top = (event.clientY - rect.top) + "px";
    menu.style.display = "";
  };

  render();

  return false;
};

streetTypeSelector.addEventListener("change", function(event) {
  // user selected street type
  const selectedStreetType = event.target.value;

  // change street type
  streets[intersectedStreetID]['streetType'] = selectedStreetType;

  // Reset the selector default value
  streetTypeSelector.selectedIndex = 0;

  menu.style.display = "none";

  changeBuffer();

  render();

}, false);

function render() {
  renderer.render(scene, camera);
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
};

init();
render();

// Helper functions
///////////////////

// Function to union an array of JSTS geometries (works for Linestrings and Polygons)
function unionGeometries (geometries) {
  const geometryCollection = geometryFactory.createGeometryCollection(geometries);
  const unionedGeometry = geometryCollection.union();
  return unionedGeometry;
};

// Function to convert JSTS polygon to THREE shape
function polygonToShape (polygon) {
    const coordinates = polygon.getCoordinates();
    const shape = new THREE.Shape();

    // Use the first coordinate as the offset
    shape.moveTo(coordinates[0].x, coordinates[0].y);

    // Use subsequent coordinates a LineTo destinations
    for (const coordinate of coordinates.slice(1)) {
        shape.lineTo(coordinate.x, coordinate.y);
    };

    return shape;
};

// Function to convert JSTS polygon to THREE shape geometry
function polygonToShapeGeometry (polygon) {
  const shape = polygonToShape(polygon);
  const geometry = new THREE.ShapeGeometry( shape );
  return geometry;
};

// Function to convert JSTS polygon to THREE mesh
function polygonToShapeMesh (polygon, material) {
    const geometry = polygonToShapeGeometry( polygon );
    const shapeMesh = new THREE.Mesh( geometry, material ) ;
    return shapeMesh;
};

// Function to convert JSTS LineString to THREE line geometry (buffer geometry)
function linestringToLineGeometry (linestring) {
  // Create a coordinate array
  const coordinates = linestring.getCoordinates();

  const coordinateArray = new Float32Array(
    coordinates.flatMap(
      (coordinate) => [coordinate.x, coordinate.y, 0]
    )
  );

  // Create the geometry
  const geometry = new THREE.BufferGeometry(); // Note: this isn't a spatial buffer!
  geometry.setAttribute('position', new THREE.BufferAttribute( coordinateArray, 3 ));

  return geometry;
};

// Function to convert JSTS Linestring to THREE line (includes geometry and material)
function linestringToLine (linestring, lineMaterial) {
  const geometry = linestringToLineGeometry( linestring );
  // Create a line
  const line = new THREE.Line( geometry, lineMaterial );
  return line;
};

///////////////////////////////////////////////////////

// JSTS common functions and parameters
const geometryFactory = new jsts.geom.GeometryFactory(); // Create a geometry factory
const bufferParams = new jsts.operation.buffer.BufferParameters();
bufferParams.setEndCapStyle(2);

// CREATE AN OBJECT TO HOLD EVERYTHING
// Note: strictly the index is a string
const streets = {};
const blocks = {};
const streetLinestrings = []; // this is just for the polygonization
const streetsBufferArray = [];

// Create pairs of coordinates for line ends
const coordinatePairs = [];

for (let i=0; i < 9; i++) {
  // Primary streets
  const h00 = new jsts.geom.Coordinate(-500, i*100-400);
  const h01 = new jsts.geom.Coordinate(500, i*100-400);
  coordinatePairs.push([h00, h01]);
  // Secondary streets
  const v00 = new jsts.geom.Coordinate(i*100-400, 0-500);
  const v01 = new jsts.geom.Coordinate(i*100-400, 1000-500);
  coordinatePairs.push([v00, v01]);
};

// Create initial JSTS street linestrings and buffers
const lengthCoordinatePairs = coordinatePairs.length;
for ( let i=0; i<lengthCoordinatePairs; i++) {

  // Create LineString
  const linestring = geometryFactory.createLineString(coordinatePairs[i]);
  linestring.setUserData({ street_id : i });
  streets[i] = {'linestring': linestring};

  let linestringBuffer;
  if ([2,3,14,15].includes(i)) {
    streets[i]['streetType'] = "Primary";
    linestringBuffer = linestring.buffer(gui_values.primaryBufferDistance, bufferParams);
    streets[i]['buffer'] = linestringBuffer;
  } else {
    streets[i]['streetType'] = "Secondary";
    linestringBuffer = linestring.buffer(gui_values.secondaryBufferDistance, bufferParams);
    streets[i]['buffer'] = linestringBuffer;
  };

  // Push to arrays
  streetLinestrings.push( linestring ); // duplicate it into an array
  streetsBufferArray.push( linestringBuffer );

};

// Create a union of the street buffers
const streetsBufferGeometryCollection = geometryFactory.createGeometryCollection(streetsBufferArray);
const streetsBufferUnion = streetsBufferGeometryCollection.union();

// Create the blocks (Polygonize the street Linestring array)
///////////////////////////////////////////////////////////////
// Node & polygonize the linestrings
const unionedStreetLinestrings = unionGeometries(streetLinestrings);
const polygonizer = new jsts.operation.polygonize.Polygonizer();
polygonizer.add(unionedStreetLinestrings);
const grossBlockPolygons = polygonizer.getPolygons();

// Add gross polygons to the blocks object
const grossBlockPolygonsArrayLength = grossBlockPolygons['array'].length;
for (let id=0; id<grossBlockPolygonsArrayLength; id++) {
  blocks[id] = {
    'grossBlockPolygon': grossBlockPolygons['array'][id],
  };
};

// Create net polygons and net shape meshes
for (const id in blocks) {
  const netPolygon = blocks[id]['grossBlockPolygon'].difference(streetsBufferUnion);
  const netShapeMesh = polygonToShapeMesh(netPolygon, netBlockMaterial);
  blocks[id]['netBlockPolygon'] = netPolygon;
  blocks[id]['netShapeMesh'] = netShapeMesh;
};

// Create threejs meshes
////////////////////////

// Create initial threejs Lines and shapeMeshes
for (const id in streets) {
  // Create lines
  streets[id]['Line'] = linestringToLine( streets[id]['linestring'], streetCentreLineMaterial );
  streets[id]['Line'].computeLineDistances(); // Needed for dash spacing
  streets[id]['Line'].userData.street_id = id;
  streets[id]['Line'].rotateX(-Math.PI/2);
  // Create buffer shape meshes
  if (streets[id]['streetType'] ==='Primary') {
    streets[id]['shapeMesh'] = polygonToShapeMesh( streets[id]['buffer'], primaryStreetMaterial )
  } else {
    streets[id]['shapeMesh'] = polygonToShapeMesh( streets[id]['buffer'], secondaryStreetMaterial )
  };
  streets[id]['shapeMesh'].userData.street_id = id;
  streets[id]['shapeMesh'].rotateX(-Math.PI/2);
};

// Add the lines and their buffers to the scene
for (const id in streets) {
  scene.add(streets[id]['Line']);
  scene.add(streets[id]['shapeMesh'])
};

// Either add the holes in the buffer union as polygons
///////////////////////////////////////////////////////
//const polygonHoles = [];
//for (const hole of bufferUnion._holes) {
//  const holeShapeMesh = polygonToShapeMesh(hole);
//  polygonHoles.push(holeShapeMesh)
//  scene.add(holeShapeMesh)
//};

// Or subtract the buffer union from the gross block polygons
/////////////////////////////////////////////////////////////
for (const id in blocks) {
  blocks[id]['netShapeMesh'].rotateX(-Math.PI/2);
  scene.add(blocks[id]['netShapeMesh']);
}

//////////////////////////////////////////////////////////

function changeBuffer() {

  const newBuffers = []; // Array to hold buffers

  // Recreate all street buffers, shape meshes and materials from scratch
  for (const id in streets) {
    if (streets[id]["streetType"] === "Primary") {

      const newBuffer = streets[id]["linestring"].buffer(gui_values.primaryBufferDistance, bufferParams);
      newBuffers.push(newBuffer);
      streets[id]["shapeMesh"].geometry.dispose();
      streets[id]["shapeMesh"].geometry = polygonToShapeGeometry(newBuffer);
      streets[id]["shapeMesh"].material = primaryStreetMaterial;

    } else if (streets[id]["streetType"] === "Secondary") {

      const newBuffer = streets[id]["linestring"].buffer(gui_values.secondaryBufferDistance, bufferParams);
      newBuffers.push(newBuffer);
      streets[id]["shapeMesh"].geometry.dispose();
      streets[id]["shapeMesh"].geometry = polygonToShapeGeometry(newBuffer);
      streets[id]["shapeMesh"].material = secondaryStreetMaterial;
    };
  };

  // Create unioned buffer
  const unionedNewBuffers = unionGeometries( newBuffers );
  //const newBuffersGeometryCollection = geometryFactory.createGeometryCollection( newBuffers );

  // Create net polygons and net shape meshes
  for (const id in blocks) {
    const netPolygon = blocks[id]['grossBlockPolygon'].difference(unionedNewBuffers);
    blocks[id]['netBlockPolygon'] = netPolygon;
    const netShapeGeometry = polygonToShapeGeometry(netPolygon);
    blocks[id]['netShapeMesh'].geometry.dispose();
    blocks[id]['netShapeMesh'].geometry = netShapeGeometry;
  };

  render();
};

render();