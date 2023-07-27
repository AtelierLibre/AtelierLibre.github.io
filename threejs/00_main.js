// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// SCENE
const scene = new THREE.Scene();

// GUI
const gui = new GUI();

// GEOMETRY
////////////////////////////////////////////////////////////////////////




// EVERYTHING ELSE
////////////////////////////////////////////////////////////////////////

// CAMERA
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 200;
camera.position.y = 200;
camera.position.x = 200;

// RENDERER
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// HELPERS
// Axes Helper
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

// Grid Helper
const size = 1000;
const divisions = 100;
const gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );



function render() {
    renderer.render(scene, camera);
  };

///////

const dummy = new THREE.Object3D();
const settings = {
  numX: 20,
  numY: 20,
  numZ: 20,
  stepX: 10,
  stepY: 10,
  stepZ: 10,
};

const props = {
  blockLength: 1,
};

// GEOMETRY
////////////////////////////////////////////////////////////////////////

const material = new THREE.MeshNormalMaterial();

const makeGeometry = () => {
  // Define parameters
  let blockLength = props.blockLength
  const blockWidth = 1;
  // Create the geometry
  const shape = new THREE.Shape();
  shape.moveTo( -(blockLength)/2, -(blockWidth)/2 );
  shape.lineTo( (blockLength)/2, -(blockWidth)/2 );
  shape.lineTo( (blockLength)/2, (blockWidth)/2 );
  shape.lineTo( -(blockLength)/2, (blockWidth)/2 );
  shape.lineTo( -(blockLength)/2, -(blockWidth)/2 );
  //const shapeGeometry = new THREE.ShapeGeometry( shape );

  // Add a hole
  const points = shape.getPoints();
  points.forEach(item => item.multiplyScalar(0.8));
  const holePath = new THREE.Shape(points.reverse());
  shape.holes.push(holePath);
  // Extrude
  const extrudeSettings = { depth: 3 };
  const extrusionGeometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

  return extrusionGeometry;
}

// create instancedMesh
let mesh;
let count = settings.numX * settings.numY * settings.numZ;
mesh = new THREE.InstancedMesh(makeGeometry(), material, count);

scene.add(mesh);

const updateGeometry = () => {

  const shapeGeometry = makeGeometry()

  mesh.geometry.dispose();

  mesh.geometry = shapeGeometry;

  console.log(shapeGeometry.area)

  render();
}

updateGeometry();

const updateMesh = () => {

    // count the number of instances & create new mesh
    count = settings.numX * settings.numY * settings.numZ;

    let i = 0;
    for (let x = 0; x < settings.numX; x++) {
      for (let y = 0; y < settings.numY; y++) {
        for (let z = 0; z < settings.numZ; z++) {
          dummy.position.set(
            x * settings.stepX,
            y * settings.stepY,
            z * settings.stepZ
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i++, dummy.matrix);
          mesh.instanceMatrix.needsUpdate = true;
          mesh.count = count;
        }
      }
    }

    // render
    render();
};

// Dat GUI main
gui.add(props, 'blockLength', 1, 20, 0.01).onChange( value => {updateGeometry();});
gui.add(settings, "numX").min(1).max(20).step(1).onChange(updateMesh);
gui.add(settings, "numY").min(1).max(20).step(1).onChange(updateMesh);
gui.add(settings, "numZ").min(1).max(20).step(1).onChange(updateMesh);
gui.add(settings, "stepX").min(0).max(10).step(0.1).onChange(updateMesh);
gui.add(settings, "stepY").min(0).max(10).step(0.1).onChange(updateMesh);
gui.add(settings, "stepZ").min(0).max(10).step(0.1).onChange(updateMesh);

// orbit controls - must come after declaration of camera and renderer
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableZoom = true;
orbitControls.addEventListener('change', render);
orbitControls.maxPolarAngle = Math.PI / 2 // keep camera above ground

// First call of updateMesh to create the starting geometry
updateMesh();

window.addEventListener( 'resize', onWindowResize );

// Handle resizing the view port (window)
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}