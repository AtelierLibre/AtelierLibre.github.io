import * as THREE from 'three';

// Function to convert JSTS LineString to THREE line geometry (buffer geometry)
export function linestringToLineGeometry (linestring) {
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

/**
 * Function to convert JSTS Linestring to THREE line (includes geometry and material)
 * @param {*} linestring 
 * @param {*} lineMaterial 
 * @returns 
 */
export function linestringToLine (linestring, lineMaterial) {
  // Convert JSTS linestring to threejs Line
  const geometry = linestringToLineGeometry( linestring );
  
  // Create a line
  const line = new THREE.Line( geometry, lineMaterial );

  // Calculate dash spacing
  line.computeLineDistances();

  return line;
};

/**
 * Returns a THREE sphere - you have to position the mesh, not the geometry
 * @param {*} point 
 * @returns 
 */
export function pointToSphere (point) {
  const sphere = new THREE.SphereGeometry(5, 6, 6); // (radius, widthSegments, heightSegments)

  return sphere;
};

/**
 * Creates THREE js mesh from geometry and material and sets position to JSTS coordinate.
 * @param {*} geometryJSTS 
 * @param {*} geometry3js 
 * @param {*} material3js 
 * @returns 
 */
export function nodeToSphereMesh(JSTSnode, material3js) {
  const coordinates = JSTSnode.getCoordinate();

  const sphere = new THREE.SphereGeometry(5, 6, 6);

  const mesh3js = new THREE.Mesh( sphere, material3js );

  // console.log(coordinates); // z coordinate from JSTS as NaN prevents geometry appearing
  mesh3js.position.set(coordinates.x, coordinates.y, 0);

  return mesh3js;
};

/**
 * Creates THREE js mesh from geometry and material and sets position to JSTS coordinate.
 * @param {*} geometryJSTS 
 * @param {*} geometry3js 
 * @param {*} material3js 
 * @returns 
 */
export function pointToSphereMesh(geometryJSTS, geometry3js, material3js) {
  const coordinates = geometryJSTS.getCoordinates()[0];

  const mesh3js = new THREE.Mesh( geometry3js, material3js );

  // console.log(coordinates); // z coordinate from JSTS as NaN prevents geometry appearing
  mesh3js.position.set(coordinates.x, coordinates.y, 0);

  return mesh3js;
};

// Function to convert JSTS polygon to THREE shape
export function polygonToShape (polygon) {
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
export function polygonToShapeGeometry (polygon) {
  const shape = polygonToShape(polygon);
  const geometry = new THREE.ShapeGeometry( shape );
  return geometry;
};
  
// Function to convert JSTS polygon to THREE mesh
export function polygonToShapeMesh (polygon, material) {
    const geometry = polygonToShapeGeometry( polygon );
    const shapeMesh = new THREE.Mesh( geometry, material ) ;
    return shapeMesh;
};

// JSTS only
// Function to union an array of JSTS geometries (works for Linestrings and Polygons)
const geometryFactory = new jsts.geom.GeometryFactory();

export function unionGeometries (geometries) {
    const geometryCollection = geometryFactory.createGeometryCollection(geometries);
    const unionedGeometry = geometryCollection.union();
    return unionedGeometry;
  };