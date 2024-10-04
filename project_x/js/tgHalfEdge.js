import { Element } from './tgElement.js';
import { v1Bearingv2, insetLineSegment } from './helperFunctions.js';
import { BufferGeometry, Float32BufferAttribute } from 'three';

const geometry = new BufferGeometry();

/**
 * TopoGeometry - Half-edge (hyphenated so HalfEdge)
 * 
 * Half-edges are oriented counter-clockwise i.e. the adjacent face is to the left
 * 
 * Half-edge 1 should originate in the same location as the threejs geometry.
 * 
 * Future change to Buffer Geometry to allow for LineStrings? Potentially store
 * copies of the parent edge's geometry only (i.e. not material or mesh) oriented
 * according to the half-edge direction i.e. reversed for hE2.
 */
export class HalfEdge extends Element {
    #origin;
    #twin;
    #next;
    #prev;
    #bearing;
    #face;
    #edge;

    constructor(heID, originV) {
        // parent
        super();
        this.id = heID;

        this.#origin = originV;
        this.#twin = null;
        this.#next = null;
        this.#prev = null;
        this.#bearing = null; // bearing away from origin
        this.#face = null; // to the left
        this.#edge = null;
        // Geometry
        this.geometry = geometry.clone();

        this.#origin.addHalfEdge(this);

    };

    // get origin (set in constructor)
    get origin() { return this.#origin };

    // set & get twin
    set twin(twinHE) { this.#twin = twinHE };
    get twin() { return this.#twin };

    // set & get next (cycling CCW around a face)
    set next(nextHE) { this.#next = nextHE };
    get next() { return this.#next };

    // set & get prev
    set prev(prevHE) { this.#prev = prevHE };
    get prev() { return this.#prev };

    // set & get bearing
    set bearing(b) { this.#bearing = b };
    get bearing() { return this.#bearing };

    // set & get face
    set face(face) { this.#face = face };
    get face() { return this.#face };

    // set & get parent edge
    set edge(edge) { this.#edge = edge };
    get edge() { return this.#edge };

    /**
     * Update the half-edge's bearing
     * 
     * Requires the half-edge's twin to be set.
     * 
     * @returns {number} - The bearing of this half-edge
     */
    updateBearing() {
        if (this.twin !== null) {
            const p1 = this.origin.mesh.position;
            const p2 = this.twin.origin.mesh.position;
            return this.#bearing = v1Bearingv2(p1, p2);
        } else {
            console.warn("HalfEdge.updateBearing, twin not set.")
        }
    };

    /**
     * Update the half-edge's geometry
     * 
     * Currently requires the half-edge's twin to be set.
     * 
     * There is the intention that edges (and half-edges) should be able to be
     * linestrings, not just linesegments.
     * 
     */
    updateGeometry() {
        const p1 = [this.#origin.mesh.position.x, this.#origin.mesh.position.z]
        const p2 = [this.#twin.origin.mesh.position.x, this.#twin.origin.mesh.position.z];
        // Update the geometry
        this.geometry.setAttribute(
            'position',
            new Float32BufferAttribute(
                [ p1[0], 0, p1[1], p2[0], 0, p2[1] ],
                3
            )
        );

        if (this.face) { this.face.updateMeshGeometry() };

    };


    /**
     * Yields the chain of next half-edges starting with this one.
     */
    *boundaryGenerator() {
        const startingHE = this;
        yield startingHE;

        let nextHE = this.next;
        while (startingHE != nextHE) {
            yield nextHE;
            nextHE = nextHE.next;
        };
    };

};