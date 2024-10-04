// IMPORTS
import * as THREE from 'three';

// Access the canvas
const canvas = document.querySelector('canvas.webgl')

let camera, scene, renderer, line;
// Array to hold lines
const lines = [];
let linesIndex = 0;
let pointsIndex = 0;

const frustumSize = 4;

const coords = new THREE.Vector3();

// Global boolean to keep track of whether actively drawing or not
let drawing = false;

// Make line material global
const lineMaterial = new THREE.LineBasicMaterial();

init();
render();

function init() {
  const aspect = window.innerWidth / window.innerHeight;

  // Create a camera
  camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 20);
  camera.position.z = 5;

  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x232023 );

  // Axes Helper
  const axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );

  // Grid Helper
  const size = 1000;
  const divisions = 100;
  const gridHelper = new THREE.GridHelper( size, divisions );
  scene.add( gridHelper );

  // Renderer settings
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // EventListeners or CallBacks
  //////////////////////////////
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener("dblclick", onDoubleClick);
  window.addEventListener('resize', onWindowResize);
};

// CALLBACK FUNCTIONS
/////////////////////

function onPointerDown(event) {
  if (drawing == false) {
    // Create a line
    const lineGeometry = new THREE.BufferGeometry()
    const positionAttribute = new THREE.BufferAttribute(new Float32Array(1000 * 3), 3); // allocate large enough buffer
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    lineGeometry.setAttribute('position', positionAttribute);
    lines[linesIndex] = new THREE.Line(lineGeometry, lineMaterial);
    line = lines[linesIndex];
    scene.add(line);
    // Add first point
    coords.x = (event.clientX / window.innerWidth) * 2 - 1;
    coords.y = -(event.clientY / window.innerHeight) * 2 + 1;
    coords.z = (camera.near + camera.far) / (camera.near - camera.far);
    coords.unproject(camera);
    addPoint(coords.x, coords.y, 0);
    // initial points
    addPoint(1, 0, 0); // current pointer coordinate (NB while moving the mouse around?)
    drawing = true;
  } else {
    coords.x = (event.clientX / window.innerWidth) * 2 - 1;
    coords.y = -(event.clientY / window.innerHeight) * 2 + 1;
    coords.z = (camera.near + camera.far) / (camera.near - camera.far);
    coords.unproject(camera);
    addPoint(coords.x, coords.y, 0);
    render();
  }
};
  
function onPointerMove(event) {
  if (drawing == false) {
  } else {
    coords.x = (event.clientX / window.innerWidth) * 2 - 1;
    coords.y = -(event.clientY / window.innerHeight) * 2 + 1;
    coords.z = (camera.near + camera.far) / (camera.near - camera.far);
    coords.unproject(camera);
    updatePoint(coords.x, coords.y, 0);
    render();
  }
};

function onDoubleClick(event) {
  console.log("Double click!");
  console.log(lines.length);
  linesIndex += 1;
  pointsIndex = 0;
  drawing = false;
};

// HELPER FUNCTIONS
///////////////////

function addPoint(x, y, z) {
  const positionAttribute = line.geometry.getAttribute('position');
  positionAttribute.setXYZ(pointsIndex, x, y, z);
  positionAttribute.needsUpdate = true;
  pointsIndex++;
  line.geometry.setDrawRange(0, pointsIndex);
};

function updatePoint(x, y, z) {
  const positionAttribute = line.geometry.getAttribute('position');
  positionAttribute.setXYZ(pointsIndex - 1, coords.x, coords.y, 0);
  positionAttribute.needsUpdate = true;
};

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -frustumSize * aspect / 2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
};

function render() {
  renderer.render(scene, camera);
};