import { Element } from './tgElement.js';
import { Vertex } from './tgVertex.js';
import { HalfEdge } from './tgHalfEdge.js';
import { Vector3, BufferGeometry, LineBasicMaterial, Line } from 'three';

const geometry = new BufferGeometry();
const baseMaterial = new LineBasicMaterial({ color: 0x989789, linewidth: 4 }); // linewidth:4 (on windows will always be 1)
const highlightMaterial = new LineBasicMaterial({ color: 0xFFFFFF, linewidth: 4 });

/**
 * TopoGeometry - Edge
 * 
 * Future change to Buffer Geometry to allow for LineStrings?
 */
export class Edge extends Element {
    static idCounter = 0;
    #length;
    #midpoint;

    /**
     * Constructing an edge is the main step in creating the DCEL.
     * Based on two vertices.
     * @param {Vertex} v1 
     * @param {Vertex} v2 
     */
    constructor(topogeometry, v1, v2) {
        // parent
        super(topogeometry);
        this.id = 'e' + Edge.idCounter++;
        //this.topogeometry = topogeometry;

        this.#length = null;
        this.#midpoint = new Vector3();
        // Geometry & Mesh
        this.geometry = geometry.clone();
        this.mesh = new Line(this.geometry, baseMaterial);
        this.mesh.userData['id'] = this.id;
        this.mesh.userData.baseMaterial = baseMaterial;
        this.mesh.userData.highlightMaterial = highlightMaterial;
        this.topogeometry.tgEdgeGroup.add(this.mesh);

        // Create half-edges
        this.hE1 = new HalfEdge(`${this.id}_1`, v1);
        this.hE1.timeCreated = this.timeCreated;
        this.hE2 = new HalfEdge(`${this.id}_2`, v2);

        // Set parent edge (this)
        this.hE1.edge = this;
        this.hE2.edge = this;

        // Set twins
        this.hE1.twin = this.hE2;
        this.hE2.twin = this.hE1;

        // Update bearings
        this.hE1.updateBearing();
        this.hE2.updateBearing();

        // Update half-edge geometry
        this.hE1.updateGeometry();
        this.hE2.updateGeometry();

        // Get the half-edges around each origin sorted by bearing
        this.hE1.origin.sortHalfEdges();
        this.hE2.origin.sortHalfEdges();

        // Based on the sorted arrays, update the hE pointers
        this.hE1.origin.updateHalfEdgePointers();
        this.hE2.origin.updateHalfEdgePointers();

        // Update the mesh, length and midpoint
        this.update();

        // notify observers
        this.topogeometry.notify('created', this);
    };

    // set & get timeCreated
    // timeCreated is private property of parent therefore need to use 'super'
    set timeCreated(time) {
        if (super.timeCreated === null) {
            super.timeCreated = time;
            this.hE1.timeCreated = time;
            this.hE2.timeCreated = time;
        } else {
            console.log(this.id, "timeCreated is already set")
        };
    };

    /**
     * update the threejs mesh geometry
     */
    updateGeometry() {
        this.mesh.geometry.setFromPoints([
            this.hE1.origin.mesh.position,
            this.hE2.origin.mesh.position]);
    }

    /**
     * Updates length to be straight line distance between the
     * end vertices.
     */
    updateLength() {
        this.#length = this.hE1.origin.mesh.position.distanceTo(
            this.hE2.origin.mesh.position
        );
    };
    get length() { return this.#length };

    // update & get midpoint
    updateMidpoint() {
        this.#midpoint.lerpVectors(
            this.hE1.origin.mesh.position,
            this.hE2.origin.mesh.position,
            0.5
        );
    };
    get midpoint() { return this.#midpoint };

    update() {
        this.updateLength();
        this.updateMidpoint();
        this.updateGeometry();
        return this;
    };
};