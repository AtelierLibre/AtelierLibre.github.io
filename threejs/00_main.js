// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 200;
camera.position.y = 200;
camera.position.z = -200;

// RENDERER
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Convenience render function
function render() {
  renderer.render(scene, camera);
};

// GEOMETRY
////////////////////////////////////////////////////////////////////////

const material = new THREE.MeshNormalMaterial();

// Geometry and mesh parameters
const gui_values = {
  blockLength: 1,
  numX: 50,
  numY: 50,
  numZ: 50,
  stepX: 10,
  stepY: 10,
  stepZ: 10,
};

const makeGeometry = () => {
  // Define parameters
  let blockLength = gui_values.blockLength;
  const blockWidth = 1;
  // Create the outer shape
  const shape = new THREE.Shape();
  shape.moveTo( -(blockLength)/2, -(blockWidth)/2 );
  shape.lineTo( (blockLength)/2, -(blockWidth)/2 );
  shape.lineTo( (blockLength)/2, (blockWidth)/2 );
  shape.lineTo( -(blockLength)/2, (blockWidth)/2 );
  shape.lineTo( -(blockLength)/2, -(blockWidth)/2 );
  // Add a hole
  const points = shape.getPoints();
  points.forEach(item => item.multiplyScalar(0.8));
  const holePath = new THREE.Shape(points.reverse());
  shape.holes.push(holePath);
  // Extrude the shape
  const extrudeSettings = { depth: 3, bevelEnabled: false };
  const extrusionGeometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  return extrusionGeometry;
}

// create instancedMesh and add to the scene
let mesh;

let count = gui_values.numX * gui_values.numY * gui_values.numZ;
mesh = new THREE.InstancedMesh(makeGeometry(), material, count);
// Rotate the mesh to sit on the ground plane
mesh.rotateX(-Math.PI/2);
scene.add(mesh);

// changing the geometry requires replacing it in the instancedMesh
const replaceGeometry = () => {
  const shapeGeometry = makeGeometry() // create the new geometry
  mesh.geometry.dispose(); // remove the old geometry
  mesh.geometry = shapeGeometry; // use the new geometry
  render();
}

const dummy = new THREE.Object3D();
const updateMesh = () => {
  // count the number of instances to display (upto initial maximum)
  count = gui_values.numX * gui_values.numY * gui_values.numZ;
  // iterate through the instances and update their positions
  let i = 0;
  for (let x = 0; x < gui_values.numX; x++) {
    for (let y = 0; y < gui_values.numY; y++) {
      for (let z = 0; z < gui_values.numZ; z++) {
        dummy.position.set(
          x * gui_values.stepX,
          y * gui_values.stepY,
          z * gui_values.stepZ
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = count;
  render();
};

// CONTROLS ETC.
////////////////////////////////////////////////////////////////////////

// HELPERS
// Axes Helper
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

// Grid Helper
const size = 1000;
const divisions = 100;
const gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );

// GUI
const gui = new GUI();
gui.add(gui_values, 'blockLength', 1, 20, 0.01).onChange( value => {replaceGeometry();});
gui.add(gui_values, "numX").min(1).max(50).step(1).onChange(updateMesh);
gui.add(gui_values, "numY").min(1).max(50).step(1).onChange(updateMesh);
gui.add(gui_values, "numZ").min(1).max(50).step(1).onChange(updateMesh);
gui.add(gui_values, "stepX").min(0).max(10).step(0.1).onChange(updateMesh);
gui.add(gui_values, "stepY").min(0).max(10).step(0.1).onChange(updateMesh);
gui.add(gui_values, "stepZ").min(0).max(10).step(0.1).onChange(updateMesh);

// orbit controls - must come after declaration of camera and renderer
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableZoom = true;
orbitControls.addEventListener('change', render);
orbitControls.maxPolarAngle = Math.PI / 2 // keep camera above ground

// Handle resizing the view port (window)
window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render(); // Doesn't seem to work on Firefox without this
}

// First call of updateMesh and render to create the starting geometry
updateMesh();
render();