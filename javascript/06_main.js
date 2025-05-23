import * as THREE from 'three';
import { storage, storageTexture, wgslFn, code, instanceIndex, uniform, NodeAccess } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { Line2 } from 'three/addons/lines/webgpu/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

let camera, scene, renderer, orbitControls;
let computeInitPing;
let pingTexture;
let planeGeometry, planeMaterial, line;

// Function definition will be hoisted
init();
async function loadFile(url) {
	const response = await fetch(url);
	if (!response.ok) {
	  throw new Error(`Could not load file at ${url}`);
	}
	return response.text();
};

function onWindowResize() {
	renderer.setSize( window.innerWidth, window.innerHeight );
	const aspect = window.innerWidth / window.innerHeight;
	const frustumHeight = camera.top - camera.bottom;
	camera.left = - frustumHeight * aspect / 2;
	camera.right = frustumHeight * aspect / 2;
	camera.updateProjectionMatrix();
	render();
}

async function init() {
	if ( WebGPU.isAvailable() === false ) {
		document.body.appendChild( WebGPU.getErrorMessage() );
		throw new Error( 'No WebGPU support' );
	}

    // Load the shader code
	const commonWGSL = await loadFile('wgsl/common.wgsl');

	// scene
	scene = new THREE.Scene();
	
	// camera
	const aspect = window.innerWidth / window.innerHeight;
	camera = new THREE.OrthographicCamera( - aspect, aspect, 1, - 1, 0, 10 );
	camera.position.x = 2;
	camera.position.y = 3;
	camera.position.z = 3;
    // axes helper
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
	// texture - based on hdr values 
	const width = 1000, height = 1000;
	pingTexture = new THREE.StorageTexture( width, height );
	pingTexture.flipY = false;
	pingTexture.type = THREE.HalfFloatType;
	// Plane
	const planeSize = new THREE.Vector2(10, 10);
    planeGeometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y);
	planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: pingTexture,
		side: THREE.DoubleSide
    });
	const plane = new THREE.Mesh( planeGeometry, planeMaterial );
	scene.add( plane );
	// Create a Float32Array with vertex positions (e.g., for a square)
	const vertices = new Float32Array([
	  -1.0, -1.0,  0.01,  // Vertex 1
	   1.0,  1.0,  0.01,  // Vertex 2
	   3.0,  -1.0,  0.01,  // Vertex 3
	   1.0,  -1.0,  0.01  // Vertex 4
	]);
	const numVerts = vertices.length / 3;
	const vertsBuffer = new THREE.StorageBufferAttribute( vertices, 3 );
	const lineGeometry = new LineGeometry();
	lineGeometry.setPositions( vertices );
	const lineMaterial = new THREE.Line2NodeMaterial( {
		color: 0x99ff99,
		linewidth: 6,
		alphaToCoverage: true,
	} );
	line = new Line2( lineGeometry, lineMaterial );
	line.computeLineDistances();
	line.scale.set( 1, 1, 1 );
	scene.add( line );
	// Renderer
	renderer = new THREE.WebGPURenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.toneMapping = THREE.NoToneMapping;
	window.addEventListener( 'resize', onWindowResize );
	// Orbit controls
	orbitControls = new OrbitControls(camera, renderer.domElement);
	orbitControls.enableDamping = true; // Smooth the movement
	orbitControls.dampingFactor = 0.05;
	orbitControls.addEventListener('change', render);
	// Compute /////////////////////////////////////////////////////////////////
	// locsBuffer is a pointer into a storage buffer containing an array of
	// vec3<f32> elements, and the shader can both read from and modify this buffer
	const computeInitPingWGSL = wgslFn( `
		fn computeInitPingWGSL(
            writeTex: texture_storage_2d<rgba16float, write>,
            index: u32,
            width: u32,
            height: u32,
            vertsBuffer: ptr<storage, array<vec3<f32>>, read_write>,
            numVerts: u32,
            planeSize: vec2f
        ) -> void {
            let posX = index % width;
            let posY = index / width;
            let indexUV = vec2u(posX, posY);
            let uv = getUV(posX, posY, width, height); // uv in [0, 1]

            // Convert uv to vertex space (assumes plane centered at (0,0))
            let vertexPos = (uv - vec2(0.5, 0.5)) * planeSize;

            var totalContribution: f32 = 0.0;
            let R: f32 = 0.2;      // radius of influence
            let sigma: f32 = 0.1;  // controls Gaussian drop-off

            // Loop over each segment (vertex i to vertex i+1)
            for (var i: u32 = 0u; i < numVerts - 1u; i = i + 1u) {
                let A = (*vertsBuffer)[i].xy;
                let B = (*vertsBuffer)[i + 1u].xy;
                let ab = B - A;
                let segLength = length(ab);
                let ap = vertexPos - A;
                let t = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
                let closest = A + t * ab;
                let d_line = distance(vertexPos, closest);

                if (d_line < R) {
                    // Compute chord length for an infinite line intersecting a circle of radius R.
                    let chord = 2.0 * sqrt(R * R - d_line * d_line);
                    // Apply a Gaussian weight so that contributions drop off with distance.
                    let weight = exp(- (d_line * d_line) / (2.0 * sigma * sigma));
                    let contribution = weight * min(chord, segLength);
                    totalContribution = totalContribution + contribution;
                }
            }

            // Apply a min-max scaler.
            // If you know the expected range of totalContribution, set these constants accordingly.
            // In a fully robust solution, you'd compute these in a separate reduction pass.
            let minContribution: f32 = 0.0;
            let maxContribution: f32 = 1.0;
            let normalizedIntensity = clamp((totalContribution - minContribution) / (maxContribution - minContribution), 0.0, 1.0);

            textureStore(writeTex, indexUV, vec4(normalizedIntensity, 0.02, 0.02, 0));
        }
		`,
		[ code(commonWGSL) ] // Includes
	);

	// compute steps
	computeInitPing = computeInitPingWGSL({
		writeTex: storageTexture( pingTexture ),
		index: instanceIndex,
		width: width,
		height: height,
		vertsBuffer: storage( vertsBuffer, 'vec3', vertsBuffer.count ),
		numVerts: numVerts,
		planeSize: planeSize  // pass the new uniform here
	}).compute( width * height );
	// compute init
	await renderer.computeAsync( computeInitPing );
	render();
};

function render() {
	// render step
	renderer.renderAsync( scene, camera );
}