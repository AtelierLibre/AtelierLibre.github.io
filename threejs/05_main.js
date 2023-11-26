import * as THREE from 'three';
import 'jsts';
import * as JSTS_3JS from 'nb_jsts_3js';
import * as MATERIALS from 'nb_materials';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
/*
import { GUI } from 'lil-gui';
import { OrbitControls } from 'orbitcontrols';
import { TransformControls } from 'transformcontrols';
*/
// THREEJS objects //
let container;
let camera, scene, renderer;
let transformControl;
// Groups
const mainGroup = new THREE.Group();
mainGroup.rotateX(-Math.PI/2);
// Create vertex positions, helper group and objects
const vertexHelperGroup = new THREE.Group();
      vertexHelperGroup.rotateX(-Math.PI/2);
const vertexPositions = [
	new THREE.Vector3( -100, 100, 0 ),
	new THREE.Vector3( 100, 100, 0 ),
	new THREE.Vector3( 100, -100, 0 ),
	new THREE.Vector3( -100, -100, 0 )
];
const vertexHelperGeometry = new THREE.BoxGeometry( 5, 5, 5 );
const vertexHelperMaterial = new THREE.MeshLambertMaterial( { color: 0x472C4C } )
for (const vertexPosition of vertexPositions) {
	const vertexHelper = new THREE.Mesh(
		vertexHelperGeometry,
		vertexHelperMaterial
	);
	vertexHelper.position.copy(vertexPosition);
	vertexHelperGroup.add( vertexHelper );
};
// Raycaster
const raycaster = new THREE.Raycaster();
// store position of mouse events
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();
// JSTS objects //
const GeometryFactory = jsts.geom.GeometryFactory;
const geometryFactory = new GeometryFactory();
const Coordinate = jsts.geom.Coordinate;
const LineSegment = jsts.geom.LineSegment;
const Angle = jsts.algorithm.Angle;
// Run the initialise function
initialise();
function initialise() {
	container = document.getElementById( 'container' );
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );
	// Camera
	function addCamera( scene ) {
		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.set( 0, 250, 250 );
		scene.add( camera );
	}
	addCamera( scene )
	// Lights
	function addLights( scene ) {
		scene.add( new THREE.AmbientLight( 0xf0f0f0, 3 ) );
		const light = new THREE.SpotLight( 0xffffff, 4.5 );
		light.position.set( 0, 1500, 200 );
		light.angle = Math.PI * 0.2;
		light.decay = 0;
		light.castShadow = true;
		light.shadow.camera.near = 200;
		light.shadow.camera.far = 2000;
		light.shadow.bias = - 0.000222;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;
		scene.add( light );
	}
	addLights( scene )
	// Ground Plane
	function addGroundPlane( mainGroup ) {
		const planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
		const planeMaterial = new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.2 } );
		const plane = new THREE.Mesh( planeGeometry, planeMaterial );
			  plane.position.y = - 200;
			  plane.receiveShadow = true;
		mainGroup.add( plane );
	};
	addGroundPlane( mainGroup );
	// Grid Helper
	function addGridHelper( scene ) {
		const helper = new THREE.GridHelper( 2000, 100 );
		      helper.position.y = - 199;
		      helper.material.opacity = 0.25;
		      helper.material.transparent = true;
		scene.add( helper );
	}
	addGridHelper( scene )
	// Renderer
	function createRenderer () {
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.shadowMap.enabled = true;
		container.appendChild( renderer.domElement );
	}
	createRenderer()
	// OrbitControls
	const orbitControls = new OrbitControls( camera, renderer.domElement );
	orbitControls.damping = 0.2;
	orbitControls.addEventListener( 'change', render );
	// TransformControls
	function addTransformControl( scene ) {
		transformControl = new TransformControls( camera, renderer.domElement );
		transformControl.showY = false; // NB Has to come before addEventListener??
		transformControl.addEventListener( 'change', render );
		transformControl.addEventListener( 'dragging-changed', function ( event ) {
			// When dragging, disable the orbitControls
			orbitControls.enabled = ! event.value;
			// When dragging stops, run the JSTS code
			if (event.value == false ) {
				jstsMagic( vertexHelperGroup );
			};
		} );
		transformControl.addEventListener( )
		scene.add( transformControl );
	}
	addTransformControl( scene )
	document.addEventListener( 'pointerdown', onPointerDown );
	document.addEventListener( 'pointerup', onPointerUp );
	document.addEventListener( 'pointermove', onPointerMove );
	window.addEventListener( 'resize', onWindowResize );
	// Add parent group
	scene.add( mainGroup );
	scene.add( vertexHelperGroup );
	// Run the JSTS code once at the end of initialization
	jstsMagic( vertexHelperGroup );
	render();
};
function render() {
	renderer.render( scene, camera );
};
function onPointerDown( event ) {
	onDownPosition.x = event.clientX;
	onDownPosition.y = event.clientY;
}
function onPointerUp( event ) {
	onUpPosition.x = event.clientX;
	onUpPosition.y = event.clientY;
	// if the mouse didn't move between down and up, detach the transformControl
	if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {
		transformControl.detach();
		render();
	}
}
function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera( pointer, camera );
	// Only test for intersection against vertexHelperObjects
	const intersects = raycaster.intersectObjects( vertexHelperGroup.children, false );
	// if it intersects something(s)
	if ( intersects.length > 0 ) {
		// get the first intersected object
		const object = intersects[ 0 ].object;
		// if the object is NOT a transformControl object, attach a transformControl
		if ( object !== transformControl.object ) {
			transformControl.attach( object );
		}
	}
}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	render();
}
function jstsMagic( vertexHelperGroup ) {
	// empty the threeJS mainGroup of existing geometry
	mainGroup.children.length = 0;
	// Create JSTS coordinates from vertexHelper positions
	const cornerCoordinates = [];
	for (const v of vertexHelperGroup.children) {
		cornerCoordinates.push(
			new Coordinate(
				v.position.x, 
				v.position.y)
		);
	};
	// create an arry of JSTS edge LineSegments
	const edgeLineSegments = [];
	for (let i=0; i<(cornerCoordinates.length); i++) {
		// Create temporary coordinates
		const c0 = cornerCoordinates[i];
		const c1 = cornerCoordinates[ (i+1) % cornerCoordinates.length ];
		const lineSegment = new LineSegment(c0, c1);
		edgeLineSegments.push(lineSegment);
	};
	// Find the indices of the two longest LineSegments
	function longestLineSegments(arr) {
		let longestLengths = [-Infinity, -Infinity];
		let longestIndices = [0,2]
		for (let j=0; j<arr.length; j++) {
			const jLength = arr[j].getLength();
			if (jLength > longestLengths[0]) {
				longestLengths = [jLength, longestLengths[0]]
				longestIndices = [j, longestIndices[0]]
			} else if (jLength > longestLengths[1]) {
				longestLengths[1] = jLength
				longestIndices[1] = j
			};
		};
		return longestIndices;
	}
	const two_longestLineSegments = longestLineSegments(edgeLineSegments);
	const longestLineSegmentArray = [
		edgeLineSegments[two_longestLineSegments[0]],
		edgeLineSegments[two_longestLineSegments[1]]
	];
	// Find the coordinate of the intersection between the two longest LineSegments
	const intersectionCoord = edgeLineSegments[two_longestLineSegments[0]].lineIntersection(
		edgeLineSegments[two_longestLineSegments[1]]
	);
	// Find the angle of the unoriented bisector of the smallest angle between the two vectors
	// See: https://github.com/locationtech/jts/blame/master/modules/core/src/main/java/org/locationtech/jts/algorithm/Angle.java#L194
	const angDel = Angle.angleBetweenOriented(
		edgeLineSegments[two_longestLineSegments[0]].midPoint(),
		intersectionCoord,
		edgeLineSegments[two_longestLineSegments[1]].midPoint(),
	);
	const angBi = Angle.angle(
		intersectionCoord,
		edgeLineSegments[two_longestLineSegments[0]].midPoint()
		) + angDel / 2;
	const bisector = Angle.normalize(angBi);
	// Project the intersection of the two longest lines along the bisector
	// to the distance to the midpoint of the first of the longest lines
	function project(coordinate, angle, dist) {
		const x = coordinate.getX() + dist * Math.cos(angle);
		const y = coordinate.getY() + dist * Math.sin(angle);
		return new Coordinate(x, y);
	};
	const projCoord = project(
		intersectionCoord,
		bisector,
		intersectionCoord.distance(
			edgeLineSegments[two_longestLineSegments[0]].midPoint()
		)
	);
	// Bisector lineSegment
	const bisectorLineSegment = new LineSegment(intersectionCoord, projCoord);
	// create an array of boundaryPoints and offset boundary points
	const PLOT_WIDTH = 10;
	const boundaryPoints = [];
	const offsetBoundaryPoints = [];
	const edgeLineSegmentBoundaryPointArrays = [];
	// For each edgeLineSegment
	for (const edgeLineSegment of edgeLineSegments) {
		const edgeLineSegmentBoundaryPoints = [];
		const totalLength = edgeLineSegment.getLength();
		const halfEdgeLength = totalLength/2;
		let initialOffset = 0;
		// If the number of plots is odd, offset the initial starting position by half a plot width
		if (Math.floor(totalLength / PLOT_WIDTH) % 2 != 0) {
			initialOffset = PLOT_WIDTH / 2;
		};
		let distFromCorner = halfEdgeLength - initialOffset;
		while (distFromCorner > (2 * PLOT_WIDTH)) {
			// Note: This currently creates a double point in the centre
			const relativePosition = distFromCorner / totalLength;
			const rPs = [ relativePosition, ( 1 - relativePosition ) ]
			// Old
			boundaryPoints.push(edgeLineSegment.pointAlong( relativePosition ));
			boundaryPoints.push(edgeLineSegment.pointAlong( 1 - relativePosition ));
			offsetBoundaryPoints.push(edgeLineSegment.pointAlongOffset( relativePosition, -10 ));
			offsetBoundaryPoints.push(edgeLineSegment.pointAlongOffset( (1 - relativePosition), -10 ));
			// Alternately push boundary points closer to start (i=0) and end (i=1)
			// Hack here -1000 on the basis that blocks don't exceed that...
			for ( let i = 0; i < 2; i++ ) {
				edgeLineSegmentBoundaryPoints.push(
					{
						'coord' : edgeLineSegment.pointAlong( rPs[i] ),
						'corner' : edgeLineSegment.getCoordinate(i),
						'distFromCorner' : distFromCorner,
						'offsetCoord' : edgeLineSegment.pointAlongOffset( rPs[i], -1000 ),
						'lineSegment' : new LineSegment(
							edgeLineSegment.pointAlong( rPs[i] ),
							edgeLineSegment.pointAlongOffset( rPs[i], -1000 )
						),
						'edgeSegment' : edgeLineSegment,
					}
				);
			};
			// Update for next loop
			distFromCorner -= PLOT_WIDTH;
		};
		edgeLineSegmentBoundaryPointArrays.push( edgeLineSegmentBoundaryPoints );
	};
	// Create a map that holds boundar points associated with each corner
	const cornerMap = new Map(cornerCoordinates.map((obj) => [obj, []]))
	// iterate across the edgeLineSegmentBoundaryPointArrays
	// each time extracting the point that is closest to a corner (or the first if there is a tie)
	while ((edgeLineSegmentBoundaryPointArrays[0].length + 
			edgeLineSegmentBoundaryPointArrays[1].length +
			edgeLineSegmentBoundaryPointArrays[2].length +
			edgeLineSegmentBoundaryPointArrays[3].length) > 0) {
	    let index = 0;
	    let value = Infinity;
	    for (let i=0;i<4;i++) {
	        if (edgeLineSegmentBoundaryPointArrays[i].at(-1) && (edgeLineSegmentBoundaryPointArrays[i].at(-1)['distFromCorner'] < value)) {
	            value = edgeLineSegmentBoundaryPointArrays[i].at(-1)['distFromCorner'];
	            index = i;
	        };
	    };
	
		const bP = edgeLineSegmentBoundaryPointArrays[index].pop()
		cornerMap.get(bP['corner']).push(bP)
	};
	const finalLineSegments = [];
	const medialIntersections = [];
	// First iterate through the corners finding edges to intersect with the medial line
	function lineSegmentsFromLongEdges(value, key, map) {
		let bP = value.at(-1);
		while ( bP && longestLineSegmentArray.includes(bP['edgeSegment']) ) {
			const bPextracted = value.pop();
			const medialIntersection = bisectorLineSegment.lineIntersection(bPextracted['lineSegment']);
			medialIntersections.push(medialIntersection);
			finalLineSegments.push(new LineSegment(bPextracted['coord'], medialIntersection))
			bP = value.at(-1)
		}
	}
	cornerMap.forEach(lineSegmentsFromLongEdges);
	// Find the extreme intersection points with the medial axis line
	let minMIx = medialIntersections[0];
	let maxMIx = medialIntersections[0];
	for (const mI of medialIntersections) {
		if (mI.getX() < minMIx.getX()) {
			minMIx = mI
		};
		if (mI.getX() > maxMIx.getX()) {
			maxMIx = mI
		};
	}
	const trimmedMedialLineSegment = new LineSegment(minMIx, maxMIx)
	finalLineSegments.push(trimmedMedialLineSegment);
	const cornerLineSegments = [];
	// First iterate through the corners finding edges to intersect with the medial line
	function lineSegmentIntersection(value, key, map) {
		let bP = value.at(-1);
		while ( bP ) {
			const bPextracted = value.pop();
			const lS_ = bPextracted['lineSegment'];
			// Find the nearest intersection point
			// This might be horrible...
			// Iterate through the current set of lineSegments looking for intersections
			let minIPdist = Infinity;
			let closestIP;
			for (const fLS of finalLineSegments) {
				// get the intersection point
				const iP = lS_.intersection(fLS);
				if (iP) {
					const iPdist = bPextracted['coord'].distance(iP)
					if (iPdist < minIPdist) {
						minIPdist = iPdist;
						closestIP = iP;
					};
				};
			};
			finalLineSegments.push(new LineSegment(bPextracted['coord'], closestIP))
			bP = value.at(-1)
		}
	}
	cornerMap.forEach(lineSegmentIntersection);
	// ADD EVERYTHING TO THREEJS
	// threeJS - Add edgeLines and midPoints to mainGroup
	for (const boundaryPoint of boundaryPoints) {
		const sphereGeometry = new THREE.SphereGeometry( 2 );
		mainGroup.add(JSTS_3JS.coordinateToSphereMesh(boundaryPoint, sphereGeometry, MATERIALS.redMaterial))
	}
	for (const offsetBoundaryPoint of offsetBoundaryPoints) {
		const sphereGeometry = new THREE.SphereGeometry( 1.3 );
		mainGroup.add(JSTS_3JS.coordinateToSphereMesh(offsetBoundaryPoint, sphereGeometry, MATERIALS.darkLimeGreenMaterial))
	}
	const sphereGeometry = new THREE.SphereGeometry( 2 );
	if (intersectionCoord && projCoord) {
	mainGroup.add(JSTS_3JS.coordinateToSphereMesh(intersectionCoord, sphereGeometry, MATERIALS.orangeMaterial))
	mainGroup.add(JSTS_3JS.coordinateToSphereMesh(projCoord, sphereGeometry, MATERIALS.orangeMaterial))
    };
	// Bisector Line
	// mainGroup.add(JSTS_3JS.linestringToLine (bisectorLineSegment.toGeometry(geometryFactory), MATERIALS.darkGreyLineBasicMaterial));
	// Medial Axis Line
	mainGroup.add(JSTS_3JS.linestringToLine (trimmedMedialLineSegment.toGeometry(geometryFactory), MATERIALS.darkLimeGreenLineBasicMaterial));
	// Edge Lines
	for (let i=0; i<4; i++) {
		mainGroup.add(JSTS_3JS.linestringToLine (edgeLineSegments[i].toGeometry(geometryFactory), MATERIALS.darkLimeGreenLineBasicMaterial));
	};
	// Final Lines
	for ( const fL of finalLineSegments) {
		mainGroup.add(JSTS_3JS.linestringToLine (fL.toGeometry(geometryFactory), MATERIALS.darkLimeGreenLineBasicMaterial));
	};
	// Corner Lines
	for (const cLS of cornerLineSegments) {
		mainGroup.add(JSTS_3JS.linestringToLine (cLS, MATERIALS.bloodRedLineBasicMaterial));
	};
};
