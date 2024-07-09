import { Vector2, Vector3, Shape, ShapeGeometry, MeshBasicMaterial, DoubleSide, Mesh } from 'three';
import { Element } from './tgElement.js';

// Materials
const baseMaterial = new MeshBasicMaterial({
    color: 0x596667,
    side: DoubleSide,
    transparent: true,
    opacity: 0.5
});
const highlightMaterial = baseMaterial.clone()
highlightMaterial.color = 0xFFFF00;

/**
 * Topogeometry Face (CCW)
 * 
 * The boundary of a face is defined by a sequence of CCW half-edges.
 * This is different from threejs shapes which have a CW boundary.
 */
export class Face extends Element {
    #halfEdges;

    static idCounter = 0;

    constructor(boundaryHEs) {
        // parent
        super();
        this.id = 'f' + Face.idCounter++;

        this.#halfEdges = new Map();
        this.representativePoint = null;
        this.mesh = null;
        this.meshID = null;

        // update halfEdges - not sure this is going to work
        this.halfEdges = boundaryHEs;

        // The unbounded face 'f0' has no mesh or representative point
        if ( this.id !== 'f0' ) {
            this.createMesh(); // Create Mesh & Update representative point
        }
    };

    // 
    set halfEdges(boundaryHEMap) {
        if (this.id !== 'f0') {
            if (boundaryHEMap instanceof Map) {
                this.#halfEdges = boundaryHEMap;

                // Cycle through the boundary half-edges and update their pointers to this face
                for (let [hE_id, hE] of boundaryHEMap) {
                    hE.face = this;
                }
            } else {
                console.warn('Not a Map', boundaryHEMap);
            }
        }
    };

    get halfEdges() {
        return this.#halfEdges;
    };

    createMesh() {

        // Extract the origin points from the chain of halfEdges
        const points = [];
        for (let hE of this.halfEdges) {
            points.push(
                new Vector2(
                    hE[1].origin.position.x,
                    hE[1].origin.position.z
                )
            );
        }

        // Create a Shape from the points & add any holes
        const shape = new Shape(points);
        // const holePath = new THREE.Path();
        // shape.holes.push( holePath );

        // Convert the Shape to a ShapeGeometry
        const shapeGeometry = new ShapeGeometry(shape);

        // Create representative point
        this.representativePoint = new Vector3;
        shapeGeometry.computeBoundingBox();
        shapeGeometry.boundingBox.getCenter(this.representativePoint);

        // Create the Mesh
        this.mesh = new Mesh(
            shapeGeometry,
            baseMaterial
        );

        // Rotate the individual mesh so that clones are also rotated
        this.mesh.rotateX(Math.PI / 2);

        // Store the base and highlight materials in the Mesh
        this.mesh.userData.baseMaterial = baseMaterial;
        this.mesh.userData.highlightMaterial = highlightMaterial;

        // Set reciprocal IDs & representative point
        this.mesh.userData['id'] = this.id;
        this.meshID = this.mesh.id;
    }
}