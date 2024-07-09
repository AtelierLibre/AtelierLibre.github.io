import { Element } from './tgElement.js';
import { v1Bearingv2 } from './helperFunctions.js';

/**
 * TopoGeometry - Half-edge (hyphenated so HalfEdge)
 * 
 * Half-edges should be oriented so that the adjacent face is to their left.
 * 
 * Future change to Buffer Geometry to allow for LineStrings?
 * Expects two TGVertexes to be passed in as arguments
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
        this.#bearing = null; // bearing of half-edge away from origin
        this.#face = null; // to the left
        this.#edge = null;

        this.#origin.addHalfEdge(this);

    };

    // get origin (set in constructor)
    get origin() { return this.#origin };

    // set & get twin
    set twin(twinHE) {
        this.#twin = twinHE;
    };
    get twin() { return this.#twin };

    // set & get next (cycling CCW around a face)
    set next(nextHE) {
        this.#next = nextHE;
    };
    get next() { return this.#next };

    // set & get prev
    set prev(prevHE) {
        this.#prev = prevHE;
    };
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

    // update bearing
    updateBearing() {
        const p1 = this.origin.position;
        const p2 = this.twin.origin.position;

        const bearing = v1Bearingv2(p1, p2);

        if (typeof bearing !== 'number') {
            throw new Error('Half-edge bearing not set correctly!');
        } else {
            this.#bearing = bearing
        };

        return bearing;
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