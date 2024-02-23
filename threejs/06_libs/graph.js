import { BufferGeometry, Color, Group, Line, LineBasicMaterial, SphereGeometry, MeshBasicMaterial, Mesh} from 'three';
import { Lut } from 'three/addons/math/Lut.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

const vertexBasicColorHex = 0x655967;
const vertexHoverColorHex = 0xFFFFFF;
const edgeBasicColorHex = 0x989789;
const edgeLineWidth = 0.01;

const vertexMesh = new Mesh(
    new SphereGeometry( 0.1, 16, 16 ),
    new MeshBasicMaterial({ color:vertexBasicColorHex })
);
vertexMesh.userData['basicColorHex'] = vertexBasicColorHex;
vertexMesh.userData['hoverColorHex'] = vertexHoverColorHex;

const bfsSphereMesh = new Mesh(
    new SphereGeometry( 0.125, 16, 16 ),
    new MeshBasicMaterial()
);

function hashCoordinates(x, y) {
    var hash = `${x},${y}`;
    return hash;
}

export class Vertex {
    constructor( vertexGroup, rayPlaneIntersection ) {
        this.vID = hashCoordinates( rayPlaneIntersection.x, rayPlaneIntersection.z );
        this.neighbours = [];
        this.mesh = vertexMesh.clone();
        this.mesh.position.copy( rayPlaneIntersection );
        this.mesh.userData['ID'] = this.vID;
        vertexGroup.add( this.mesh )
    }
}

export class Graph {
    constructor( graphObjectsGroup ) {
        this.adjacencyList = {};

        this.graphObjectsGroup = graphObjectsGroup;
        // vertexGroup
        this.vertexGroup = new Group();
        this.vertexGroup.name = "vertexGroup";
        // edgeGroup
        this.edgeGroup = new Group();
        this.edgeGroup.name = "edgeGroup";        

        this.bfsSphereGroup = new Group();
        this.graphObjectsGroup.add( this.bfsSphereGroup );

        this.lut = undefined;
        this.bfsMaterialArray = [];
    }

    addVertex( rayPlaneIntersection ) {
        const idHash = hashCoordinates( rayPlaneIntersection.x, rayPlaneIntersection.z );
        if (!this.adjacencyList[idHash]) {
            this.adjacencyList[idHash] = new Vertex( this.vertexGroup, rayPlaneIntersection )
        };
    }

    addEdge(vID1, vID2) {
        if ( vID1 !== vID2 ) {
            if ( this.adjacencyList[vID1]['neighbours'].includes( vID2 ) == false ) {
                this.adjacencyList[vID1]['neighbours'].push( vID2 );
                this.adjacencyList[vID2]['neighbours'].push( vID1 );

                const lineGeometry = new LineGeometry();
                lineGeometry.setPositions ( [
                    this.adjacencyList[ vID1 ].mesh.position.x,
                    this.adjacencyList[ vID1 ].mesh.position.y,
                    this.adjacencyList[ vID1 ].mesh.position.z,
                    this.adjacencyList[ vID2 ].mesh.position.x,
                    this.adjacencyList[ vID2 ].mesh.position.y,
                    this.adjacencyList[ vID2 ].mesh.position.z,
                ] )

                /* linewidth on windows will always be 1 */
                const lineMaterial = new LineMaterial( {
                    color: edgeBasicColorHex,
                    linewidth: edgeLineWidth
                } );

                const line = new Line2( lineGeometry, lineMaterial );
                line.computeLineDistances();
                line.scale.set( 1, 1, 1 );
                this.edgeGroup.add(line);
            };
        };
    };

    addbfsSphere( vID, depth ) {
        const bfsMesh = bfsSphereMesh.clone();
        bfsMesh.position.copy( this.adjacencyList[ vID ].mesh.position );
        bfsMesh.material = this.bfsMaterialArray[depth];
        this.bfsSphereGroup.add( bfsMesh )
    }

    bfs(start) {
        const queue = [start];
        const result = [];
        const visited = {};
        visited[start] = true;

        while (queue.length) {
            let currentVertex = queue.shift();
            result.push(currentVertex);

            this.adjacencyList[currentVertex]['neighbours'].forEach(neighbor => {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push(neighbor);
                }
            });
        }

        return result;
    };

    bfs_depth(start) {
        const queue = [{ vertex: start, depth: 0 }];
        const result = [];
        const visited = {};
        visited[start] = true;
    
        while (queue.length) {
            let current = queue.shift();
            let currentVertex = current.vertex;
            let currentDepth = current.depth;
            result.push({ vertex: currentVertex, depth: currentDepth });
    
            this.adjacencyList[currentVertex]['neighbours'].forEach(neighbor => {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push({ vertex: neighbor, depth: currentDepth + 1 });
                }
            });
        }
    
        return result;
    }

    traverseGraph( start, limit ) {

        // Empty children
        this.bfsSphereGroup.children.length = 0;
        this.bfsMaterialArray.length = 0;

        // Create a new color lookup table with the same
        // number of colors as the selected limit
        this.lut = new Lut( 'rainbow', limit );
        this.bfsMaterialArray = this.lut.lut.map(
            (c) => new MeshBasicMaterial({ color: c })
        ).reverse();

        const result = this.bfs_depth_limit( start, limit );
        return result;

    }

    bfs_depth_limit(start, limit) {

        const queue = [{ vertex: start, depth: 0 }];
        const result = [];
        const visited = {};
        visited[start] = true;
    
        while (queue.length) {
            let current = queue.shift();
            let currentVertex = current.vertex;
            let currentDepth = current.depth;
            result.push({ vertex: currentVertex, depth: currentDepth });
    
            // Insert to get spheres to appear as algorithm progresses
            this.addbfsSphere( currentVertex, currentDepth );
            //

            if (currentDepth < limit) {
                this.adjacencyList[currentVertex]['neighbours'].forEach(neighbor => {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        queue.push({ vertex: neighbor, depth: currentDepth + 1 });
                    }
                });
            }
        }
    
        return result;
    };
};