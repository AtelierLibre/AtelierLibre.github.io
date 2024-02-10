import { BufferGeometry, Group, Line, LineBasicMaterial, SphereGeometry, MeshBasicMaterial, Mesh, Vector3 } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
//
const vertexMesh = new Mesh(
    new SphereGeometry( 0.1, 16, 16 ),
    new MeshBasicMaterial({ color:0x655967 })
);
vertexMesh.userData['basicColorHex'] = 0x655967;
vertexMesh.userData['hoverColorHex'] = 0xFFFFFF;

function hashCoordinates(x, y) {
    var hash = `${x},${y}`;
    return hash;
};

function radToDeg(radians) {
    let degrees = radians * (180 / Math.PI);
    return degrees;
}

function calculateBearingChange2D(A, B, C) {
    // Calculate the directions
    let directionAB = Math.atan2(B.x - A.x, B.z - A.z);
    let directionBC = Math.atan2(C.x - B.x, C.z - B.z);

    // Calculate the deviation from forward motion
    let deviation = directionBC - directionAB;

    // Normalize the deviation to the range [-pi, pi]
    deviation = (deviation + Math.PI) % (2 * Math.PI) - Math.PI;

    // If the deviation is less than -pi, add it to 2*pi to get the smaller angle on the opposite side of the circle
    if (deviation < -Math.PI) {
        deviation = 2 * Math.PI + deviation;
    }

    // Take the absolute value of the deviation
    deviation = Math.abs(deviation);

    // Convert to degrees
    let deviationDegrees = radToDeg(deviation);

    return deviationDegrees;
}

class Vertex {
    constructor( coordinates ) {
        this.ID = hashCoordinates( coordinates.x, coordinates.z );
        this.eIDs = new Set(); // set for the IDs of incident edges
        this.neighbours = [];
        this.neighbours_metric = {};
        // Geometry
        this.mesh = vertexMesh.clone();
        this.mesh.position.copy( coordinates );
        this.mesh.userData['ID'] = this.ID;
    };
};

class Edge {
    constructor( vertices, vID1, vID2, nextEdgeID ) {
        this.ID = nextEdgeID;
        this.vIDs = new Set([vID1, vID2]); // store in a set as order unneccessary - helpful?
        this.vID1 = vID1,
        this.vID2 = vID2,
        this.neighbours = new Set();
        this.neighbours_metric = {};
        this.neighbours_angular = {};
        this.neighbours_via = {};

        this.length = vertices[vID1].mesh.position.distanceTo(
            vertices[vID2].mesh.position
        );

        // Geometry
        this.mesh = new Line(
            new BufferGeometry(),
            /* linewidth on windows will always be 1 */
            new LineBasicMaterial({ color:0x989789, }) // linewidth:4 
        );
        this.mesh.geometry.setFromPoints([
            vertices[ vID1 ].mesh.position,
            vertices[ vID2 ].mesh.position
        ]);
        this.mesh.userData['ID'] = this.ID;
        this.midPoint = new Vector3();
        this.midPoint.lerpVectors(
            vertices[ vID1 ].mesh.position,
            vertices[ vID2 ].mesh.position,
            0.5
        );
    };
};

export class Graph {
    constructor() {
        this.edges = {};
        this.vertices = {};

        this.edgeIDCounter = 0;
        // vertexGroup
        this.vertexGroup = new Group();
        this.vertexGroup.name = "vertexGroup";
        // edgeGroup
        this.edgeGroup = new Group();
        this.edgeGroup.name = "edgeGroup";
    };

    generateEdgeId() {
        return 'e' + this.edgeIDCounter++;
    };

    addVertex( coordinates ) {
        // Only add a vertex if there isn't already one at that location
        const vertexID = hashCoordinates( coordinates.x, coordinates.z );
        if (!this.vertices[vertexID]) {
            // Create the vertex
            this.vertices[vertexID] = new Vertex( coordinates );
            // Add its mesh to the scene (via the vertex Group)
            this.vertexGroup.add(this.vertices[vertexID].mesh)
        };
    }

    addEdge( vID1,vID2 ) {
        // Only add an edge if it is between different vertices and doesn't already exist
        if ( vID1 !== vID2 ) {
            // neighbours are symmetric so it should be enough to check the neighbours of one vertex
            if ( this.vertices[vID1]['neighbours'].includes( vID2 ) == false ) {

                // if all checks pass, generate a new edge ID
                const newEdgeID = this.generateEdgeId();

                // Create the edge
                this.edges[newEdgeID] = new Edge( this.vertices, vID1, vID2, newEdgeID );

                // Get the neighbouring edges
                this.edges[newEdgeID]['neighbours'] = new Set([
                    ...this.vertices[ vID1 ].eIDs,
                    ...this.vertices[ vID2 ].eIDs
                ]);
                // Set the neighbouring edges
                this.edges[newEdgeID]['neighbours'].forEach((value) => {
                    this.edges[value]['neighbours'].add(newEdgeID);
                });

                // Convert the set of neighbours (this.edges[newEdgeID]['neighbours']) to an object with distances
                let newObject = [...this.edges[newEdgeID]['neighbours']].reduce((obj, key) => {
                    obj[key] = (
                        ( this.edges[newEdgeID].length / 2 ) +
                        ( this.edges[key].length / 2 )
                    );
                    return obj;
                }, this.edges[newEdgeID]['neighbours_metric']);
                // Set the neighbouring edges
                Object.entries( this.edges[newEdgeID]['neighbours_metric'] ).forEach(([key, value]) => {
                    this.edges[key]['neighbours_metric'][newEdgeID] = value;
                });

                // Set angular distance
                for (let eID of this.edges[newEdgeID]['neighbours']){
                    let set1 = this.edges[eID]['vIDs'];
                    let set2 = this.edges[newEdgeID]['vIDs'];
                    let vIDA = [...set1].filter(x => !set2.has(x))[0];
                    let vIDB = [...set1].filter(x => set2.has(x))[0];
                    let vIDC = [...set2].filter(x => !set1.has(x))[0];
                    const bearingChange = calculateBearingChange2D(
                        this.vertices[vIDA].mesh.position, 
                        this.vertices[vIDB].mesh.position, 
                        this.vertices[vIDC].mesh.position 
                    );
                    console.log( 'bearingChange:', bearingChange );
                    this.edges[newEdgeID]['neighbours_angular'][eID] = bearingChange;
                    this.edges[newEdgeID]['neighbours_via'][eID] = vIDB;
                    this.edges[eID]['neighbours_angular'][newEdgeID] = bearingChange;
                    this.edges[eID]['neighbours_via'][newEdgeID] = vIDB;
                }

                // Set angular distance
                //for (let vID of this.vertices[vID2]['neighbours']) {
                //    //calculateBearingChange2D(A, B, C)
                //    const bearingChange = calculateBearingChange2D(
                //        this.vertices[vID1].mesh.position, 
                //        this.vertices[vID2].mesh.position, 
                //        this.vertices[vID].mesh.position 
                //    );
                //    console.log( 'bearingChange:', bearingChange );
                //};
                //for (let vID of this.vertices[vID1]['neighbours']) {
                //    //calculateBearingChange2D(A, B, C)
                //    const bearingChange = calculateBearingChange2D(
                //        this.vertices[vID2].mesh.position, 
                //        this.vertices[vID1].mesh.position, 
                //        this.vertices[vID].mesh.position 
                //    );
                //    console.log( 'bearingChange:', bearingChange );
                //}

                // Creating an edge is equivalent to making two vertices neighbours of each other
                this.vertices[vID1]['neighbours'].push( vID2 );
                this.vertices[vID2]['neighbours'].push( vID1 );

                this.vertices[vID1]['neighbours_metric'][vID2] = this.edges[newEdgeID].length;//metric_dist;
                this.vertices[vID2]['neighbours_metric'][vID1] = this.edges[newEdgeID].length;//metric_dist;

                this.vertices[vID1]['eIDs'].add( newEdgeID );
                this.vertices[vID2]['eIDs'].add( newEdgeID );


                // Add the edge mesh to the scene (via the edge Group)
                this.edgeGroup.add( this.edges[newEdgeID].mesh );

                // Label the edge
				const edgeDiv = document.createElement( 'div' );
				edgeDiv.className = 'label';
				edgeDiv.textContent = this.edges[newEdgeID]['ID'] + ': ' + this.edges[newEdgeID].length.toFixed(1);
				edgeDiv.style.backgroundColor = 'transparent';

				const edgeLabel = new CSS2DObject( edgeDiv );
				edgeLabel.position.set( this.edges[newEdgeID].midPoint.x, this.edges[newEdgeID].midPoint.y, this.edges[newEdgeID].midPoint.z );
				edgeLabel.center.set( 0, 1 );
                edgeLabel.layers.set( 1 );

				this.edges[newEdgeID].mesh.add( edgeLabel );
            };
        };
    };
};