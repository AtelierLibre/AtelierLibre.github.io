// IMPORTS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
scene.fog = new THREE.Fog( scene.background, 1, 5000 );

// CAMERA
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 200;
camera.position.y = 200;
camera.position.z = -200;

// RENDERER
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace; // amended from book
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;//VSMShadowMap;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Convenience render function
function render() {
  renderer.render(scene, camera);
};

// MATERIALS
////////////////////////////////////////////////////////////////////////
// #EAEAF2 - page background
// #EEE5DC - light brown street
// #D9D0C9 - building brown fill
// #B6A99C - building dark brown line
// Cherry red LineBasicMaterial
const redLineMaterial = new THREE.LineBasicMaterial({
  color: 0xD2042D,
  linewidth: 5,
  polygonOffset: true,
  polygonOffsetUnits: 1,
  polygonOffsetFactor: -1
});
// Grey street material
const streetMaterial = new THREE.MeshLambertMaterial( { color: 0x807E78 } );
// white steet line material
const whiteDashedLineMaterial = new THREE.LineDashedMaterial({
  color: 0xffffff,
  linewidth: 3,
  dashSize: 3,
  gapSize: 2,
  polygonOffset: true,
  polygonOffsetUnits: 1,
  polygonOffsetFactor: -2
});
// Green garden material
const gardenMaterial = new THREE.MeshLambertMaterial( { color: 0xCCDDCD } );
// Grey street material
const buildingMaterial = new THREE.MeshLambertMaterial( { color: 0xD9D0C9 } );

// GEOMETRY
////////////////////////////////////////////////////////////////////////
/*
// GROUND
const groundGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const groundMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
groundMaterial.color.setHSL( 0.095, 1, 0.75 );
const ground = new THREE.Mesh( groundGeometry, groundMaterial );
ground.position.y = -0.1;
ground.rotation.x = - Math.PI / 2;
ground.receiveShadow = true;
scene.add( ground );
*/

// Fixed Instance Array
const blockArrayDimension = 9;
let blockCount = blockArrayDimension * blockArrayDimension;

// Geometry and mesh parameters
const gui_values = {
  blockLength: 100,
  blockDepth: 100,
  streetWidth: 15,
  buildingSetBack: 0,
  buildingDepth: 15,
  planDepth: 12,
  numberOfStoreys: 1,
};

const blockLength = gui_values.blockLength;
const blockDepth = gui_values.blockDepth;
const innerBlockLength = blockLength - gui_values.streetWidth;
const innerBlockDepth = blockDepth - gui_values.streetWidth;
const buildingSetBack = gui_values.buildingSetBack;
const buildingLength = innerBlockLength - buildingSetBack;
const buildingDepth = innerBlockDepth - buildingSetBack;
const planDepth = gui_values.planDepth;
const storeyHeight = 3.2;
const numberOfStoreys = gui_values.numberOfStoreys;
const maxNumberOfStoreys = 30;

function createRectShape(rectLength, rectDepth, holeOffset) {
  // Define parameters
  const halfRectLength = rectLength / 2;
  const halfRectDepth = rectDepth / 2;
  // Create the outer shape
  const rectShape = new THREE.Shape();
  rectShape.moveTo(-halfRectLength, -halfRectDepth);
  rectShape.lineTo(halfRectLength, -halfRectDepth);
  rectShape.lineTo(halfRectLength, halfRectDepth);
  rectShape.lineTo(-halfRectLength, halfRectDepth);
  rectShape.lineTo(-halfRectLength, -halfRectDepth);

  if (typeof holeOffset !== "undefined") {
    const halfHoleLength = (rectLength - holeOffset)/2;
    const halfHoleDepth = (rectDepth - holeOffset)/2;
    // Create the hole shape
    const holeShape = new THREE.Shape();
    holeShape.moveTo(-halfHoleLength, -halfHoleDepth);
    holeShape.lineTo(halfHoleLength, -halfHoleDepth);
    holeShape.lineTo(halfHoleLength, halfHoleDepth);
    holeShape.lineTo(-halfHoleLength, halfHoleDepth);
    holeShape.lineTo(-halfHoleLength, -halfHoleDepth);
    rectShape.holes.push(holeShape);
  };

  return rectShape;
};

// Create the block shape
const blockShape = createRectShape( gui_values.blockLength, gui_values.blockDepth );
// Create the inner block shape
const innerBlockShape = createRectShape( innerBlockLength, innerBlockDepth );
// Create the building shape
const buildingShape = createRectShape( buildingLength, buildingDepth, planDepth );

// For examples of extracting outlines from shapes see:
// https://threejs.org/examples/webgl_geometry_shapes.html
function shapeToLineGeometry(shape) {
  //shape.autoClose = true;
  const points = shape.getPoints();
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  return lineGeometry;
};

// Create the red line and add it to the scene
const redLineGeometry = shapeToLineGeometry( blockShape );
const redLine = new THREE.Line( redLineGeometry, redLineMaterial );
redLine.position.y = 1;
redLine.rotation.x = - Math.PI / 2;
scene.add( redLine );

// Create the white line and add it to the scene
// Change this to an array of white lines crossing the whole world
const whiteLine = new THREE.Line( redLineGeometry, whiteDashedLineMaterial );
whiteLine.computeLineDistances(); // necessary to get the dashes to work
whiteLine.position.y = 0.5;
whiteLine.rotation.x = - Math.PI / 2;
scene.add( whiteLine );

// Create base street block geometry
const streetBlockGeometry = new THREE.ExtrudeGeometry( blockShape, { depth: 3 });//, bevelEnabled: false };
// Create the streetBlockInstanceMesh and add to the scene
const streetBlockInstancedMesh = new THREE.InstancedMesh(
  streetBlockGeometry,
  streetMaterial,
  blockCount
); // new THREE.ShadowMaterial( { color: 0x444444 } )
streetBlockInstancedMesh.position.y = -3.1;
streetBlockInstancedMesh.rotateX(-Math.PI/2);
streetBlockInstancedMesh.receiveShadow = true;
scene.add(streetBlockInstancedMesh);

// Create base street block geometry
const innerStreetBlockGeometry = new THREE.ExtrudeGeometry( innerBlockShape, { depth: 0.1 });//, bevelEnabled: false };
// Create the streetBlockInstanceMesh and add to the scene
const innerStreetBlockInstancedMesh = new THREE.InstancedMesh(
  innerStreetBlockGeometry,
  gardenMaterial,
  blockCount
);
innerStreetBlockInstancedMesh.position.y = -0.1;
innerStreetBlockInstancedMesh.rotateX(-Math.PI/2);
innerStreetBlockInstancedMesh.receiveShadow = true;
scene.add(innerStreetBlockInstancedMesh);

// Create building geometry
const buildingGeometry = new THREE.ExtrudeGeometry( buildingShape, { depth: storeyHeight });//, bevelEnabled: false };
// Create the streetBlockInstanceMesh and add to the scene
const buildingInstancedMesh = new THREE.InstancedMesh(
  buildingGeometry,
  buildingMaterial,
  blockCount * maxNumberOfStoreys
);
buildingInstancedMesh.rotateX(-Math.PI/2);
// try this - no changes
// buildingInstancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
buildingInstancedMesh.castShadow = true;
buildingInstancedMesh.receiveShadow = true;
scene.add(buildingInstancedMesh);

const dummy = new THREE.Object3D();
function updateInstancedMeshPositions(inputMesh, numZ = 1) {
  // count the number of instances to display (upto initial maximum)
  const mesh = inputMesh;
  const count = blockCount * numZ;
  // iterate through the instances and update their positions
  let i = 0;
  for (let z = 0; z < numZ; z++) {
  for (let x = 0; x < blockArrayDimension; x++) {
    for (let y = 0; y < blockArrayDimension; y++) {
      
        dummy.position.set(
          (x - 4) * gui_values.blockLength,
          (y - 4) * gui_values.blockDepth,
          z * (storeyHeight + 1)
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = count;
}
updateInstancedMeshPositions(streetBlockInstancedMesh);
updateInstancedMeshPositions(innerStreetBlockInstancedMesh);
updateInstancedMeshPositions(buildingInstancedMesh);

function changeBlockShape() {

  const blockLength = gui_values.blockLength;
  const blockDepth = gui_values.blockDepth;
  const innerBlockLength = blockLength - gui_values.streetWidth;
  const innerBlockDepth = blockDepth - gui_values.streetWidth;
  const buildingSetBack = gui_values.buildingSetBack;
  const buildingLength = innerBlockLength - buildingSetBack;
  const buildingDepth = innerBlockDepth - buildingSetBack;
  const planDepth = gui_values.planDepth;
  const storeyHeight = 3.2;
  const numberOfStoreys = gui_values.numberOfStoreys;

  console.log("Block Area (ha)", (Math.round(blockLength*blockDepth/100)/100));
  console.log("Building footprint (m2)", Math.round(buildingLength*buildingDepth));


  // Create the new block geometry
  const newBlockShape = createRectShape(blockLength, blockDepth);
  const newInnerBlockShape = createRectShape(innerBlockLength, innerBlockDepth);
  const newBuildingShape = createRectShape(buildingLength, buildingDepth, planDepth);

  // Update the red line geometry from the new block shape
  const newRedLineGeometry = shapeToLineGeometry(newBlockShape);
  redLine.geometry.dispose();
  redLine.geometry = newRedLineGeometry;

  // Update the block geometry from the new block shape
  streetBlockInstancedMesh.geometry.dispose();
  streetBlockInstancedMesh.geometry = new THREE.ExtrudeGeometry(newBlockShape, { depth: 3 });
  // streetBlockInstancedMesh.visible = false;

  // Update the inner block geometry from the new block shape
  innerStreetBlockInstancedMesh.geometry.dispose();
  innerStreetBlockInstancedMesh.geometry = new THREE.ExtrudeGeometry(newInnerBlockShape, { depth: 0.1 });

  // Update the building geometry from the new block shape
  buildingInstancedMesh.geometry.dispose();
  buildingInstancedMesh.geometry = new THREE.ExtrudeGeometry(newBuildingShape, { depth: storeyHeight });

  // Change the positions of the various InstancedMeshes
  updateInstancedMeshPositions(streetBlockInstancedMesh);
  updateInstancedMeshPositions(innerStreetBlockInstancedMesh);
  updateInstancedMeshPositions(buildingInstancedMesh, numberOfStoreys);

  // Render the changes
  console.log(renderer.info.memory.geometries);
  render();
}

// CONTROLS ETC.
////////////////////////////////////////////////////////////////////////

// LIGHTS AND SKYDOME
import * as lights from "./01_lights.js"
scene.add( lights.directionalLight );
scene.add( lights.hemisphereLight );

// SKYDOME
const vertexShader = document.getElementById( 'vertexShader' ).textContent;
const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
const uniforms = {
	'topColor': { value: new THREE.Color( 0x0077ff ) },
	'bottomColor': { value: new THREE.Color( 0xffffff ) },
	'offset': { value: 33 },
	'exponent': { value: 0.6 }
};
uniforms[ 'topColor' ].value.copy( lights.hemisphereLight.color );
scene.fog.color.copy( uniforms[ 'bottomColor' ].value );
const skyGeometry = new THREE.SphereGeometry( 4000, 32, 15 );
const skyMaterial = new THREE.ShaderMaterial( {
	uniforms: uniforms,
	vertexShader: vertexShader,
	fragmentShader: fragmentShader,
	side: THREE.BackSide
} );
const sky = new THREE.Mesh( skyGeometry, skyMaterial );
scene.add( sky );

// HELPERS
// Light Helpers
const dirLightHelper = new THREE.DirectionalLightHelper( lights.directionalLight, 10 );
scene.add( dirLightHelper );

const hemisphereLightHelper = new THREE.HemisphereLightHelper( lights.hemisphereLight, 10 );
scene.add( hemisphereLightHelper );

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
const blocksAndStreetsFolder = gui.addFolder( 'Blocks and Streets');
blocksAndStreetsFolder.add(gui_values, "blockLength", 10, 500, 0.01).name("Block Length (m)").onChange( value => {changeBlockShape();});
blocksAndStreetsFolder.add(gui_values, "blockDepth", 10, 500, 0.01).name("Block Depth (m)").onChange( value => {changeBlockShape();});
blocksAndStreetsFolder.add(gui_values, "streetWidth", 1, 50, 0.01).name("Street Width (m)").onChange( value => {changeBlockShape();});
const buildingsFolder = gui.addFolder( 'Buildings');
buildingsFolder.add(gui_values, "buildingSetBack", 0, 50, 0.01).name("Set Back (m)").onChange( value => {changeBlockShape();});
buildingsFolder.add(gui_values, "planDepth", 0, 50, 0.01).name("Plan Depth (m)").onChange( value => {changeBlockShape();});
buildingsFolder.add(gui_values, "numberOfStoreys", 0, 30, 1).name("Storeys").onChange( value => {changeBlockShape();});

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
// updateMesh();
render();