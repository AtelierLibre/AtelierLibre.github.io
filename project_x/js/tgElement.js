/**
 * Topogeometry - Element
 * Parent class with common methods for Vertices, Half-edges, Edges and Faces
 */
export class Element {
    #id;
    #timeCreated;
    #timeDeleted;

    constructor(topogeometry) {
        this.#id = null;
        if (topogeometry) {
            this.topogeometry = topogeometry;
            this.#timeCreated = topogeometry.currentTime;
        } else {
            this.topogeometry = null;
            this.#timeCreated = null;
        }
        this.#timeDeleted = null;

    };

    // set & get id
    set id(id) {
        if (this.#id === null) {
            this.#id = id
        } else {
            console.log(this.id, "id is already set")
        };
    }
    get id() { return this.#id };

    // set & get timeCreated
    set timeCreated(time) {
        if (this.#timeCreated === null) {
            this.#timeCreated = time
        } else {
            console.log(this.id, "timeCreated is already set")
        };
    };
    get timeCreated() { return this.#timeCreated };

    // set & get timeDeleted
    set timeDeleted(time) {
        if (this.#timeDeleted === null) {
            this.#timeDeleted = time
        } else {
            console.log(this.id, "timeDeleted is already set")
        };
    };
    get timeDeleted() { return this.#timeDeleted };
};