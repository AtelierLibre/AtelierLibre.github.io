import { Vertex } from './tgVertex.js';
import { Edge } from './tgEdge.js';
import { Face } from './tgFace.js';
import { Vector3 } from 'three';
import { calculateSignedArea } from './helperFunctions.js';

/**
 * Topogeometry
 */
export class Topogeometry {
    #time;

    constructor() {
        this.#time = 0;

        this.vertices = {};
        this.edges = {};
        this.halfEdges = {};
        this.faces = {};

        this.observers = [];

        this.#createFace(); // Initialise topogeometry with unbounded face 'f0'
    };

    get currentTime() {
        this.#time++; // Increment the time
        return this.#time;
    };

    /**
     * Converts a threejs vector (e.g. that received from rayPlaneIntersection)
     * into a topogeometry Vertex.
     * @param {Vector3} positionVector - threejs vector
     * @returns {Vertex} - new topogeometry Vertex
     */
    createVertex(positionVector) {

        // Create a new vertex
        const vertex = new Vertex(positionVector.clone());

        vertex.timeCreated = this.currentTime;

        // Add it to the vertices
        this.vertices[vertex.id] = vertex;

        // notify observers
        this.notify('create', vertex);

        return vertex;
    };

    /**
     * Adding an edge is the primary operation that links vertices together
     * and potentially creates faces. Could get messy...
     * 
     * @param {Vertex} v1id 
     * @param {Vertex} v2id 
     * @returns 
     */
    createEdge(v1id, v2id) {
        // Checks to determine whether to add the edge or not
        // TODO Probably want to prevent parallel edges, at least when segments...
        // Don't add self loops
        if (v1id === v2id) {
            return;
        };

        // look up once
        const time = this.currentTime;
        const v1 = this.vertices[v1id];
        const v2 = this.vertices[v2id];

        // Pass in the vertices, not just the IDs
        // Edge and half-edges are created at the same time
        const newEdge = new Edge(v1, v2);
        newEdge.timeCreated = time;

        //Note: the half-edges are created automatically by the edge
        this.edges[newEdge.id] = newEdge;
        this.halfEdges[newEdge.hE1.id] = newEdge.hE1;
        this.halfEdges[newEdge.hE2.id] = newEdge.hE2;

        // Cycle through the hE1.boundaryGenerator() once, extracting
        // useful information as we go.
        const hE1Boundary = new Map();
        let hE1existingFace = null;
        let hE2InhE1Boundary = false;
        let hE1totalSignedArea = 0;
        for (let hE of newEdge.hE1.boundaryGenerator()) {
            // Extract any reference to an existing face
            if (hE1existingFace === null) {
                if (hE.face !== null) { hE1existingFace = hE.face; };
            };
            // Determine whether hE2 is also in the cycle
            if (hE.id == newEdge.hE2.id) {
                hE2InhE1Boundary = true;
            };
            // Calculate signed area
            let signedArea = calculateSignedArea(hE.origin.position, hE.next.origin.position);
            hE1totalSignedArea += signedArea;
            // Add every half-edge to the map
            hE1Boundary.set(hE['id'], hE)
        };

        if (hE1Boundary.size === 2) {
            /////////
            // Isolated new line
            // - set the face to the unbounded face
            /////////

            newEdge.hE1.face = this.faces['f0'];
            newEdge.hE2.face = this.faces['f0'];

        } else if (hE2InhE1Boundary) {
            //////////
            // Both half-edges in the same cycle
            // - modification the boundary of the existing face
            // - (potentially 'f0')
            //////////

            // set the their faces to match the others in the cycle
            newEdge.hE1.face = hE1existingFace;
            newEdge.hE2.face = hE1existingFace;

            // modify the pre-existing face
            hE1existingFace.halfEdges = hE1Boundary;

        } else {
            ///////////
            // Split existing face
            // - either modifies 'f0' and creates a new face
            // - or splits an existing inner face and creates  two new inner faces
            ///////////

            // Generate the boundary cycle of the second half-edge
            ////////
            const hE2Boundary = new Map();
            let hE2totalSignedArea = 0;
            for (let hE of newEdge.hE2.boundaryGenerator()) {
                // Calculate signedArea
                let signedArea = calculateSignedArea(hE.origin.position, hE.next.origin.position);
                hE2totalSignedArea += signedArea;
                // Add every half-edge to the map
                hE2Boundary.set(hE['id'], hE)
            };

            // Check if there is ambiguity in either signedArea
            // I don't think this should be triggered as the case of a chain of segments without area
            // should be captured by a separate test.
            /////////
            const tolerance = 0.0001
            if ((Math.abs(hE1totalSignedArea) < tolerance) || (Math.abs(hE2totalSignedArea) < tolerance)) {
                console.warn("Signed area below tolerance")
            }

            if (hE1existingFace === this.faces['f0']) {
                // If the pre-existing face was 'f0'
                // - modify existing face 'f0'
                // - create a new face

                // Determine which new cycle is the modification of 'f0'
                if (hE1totalSignedArea < 0) {

                    this.faces['f0'].halfEdges = hE1Boundary;
                    const newFace = this.#createFace(hE2Boundary);

                } else {

                    this.faces['f0'].halfEdges = hE2Boundary;
                    const newFace = this.#createFace(hE1Boundary);

                };

            } else {
                // If the existing face is NOT 'f0'
                // - create two new faces
                // - delete the existing face

                // create two new faces, set boundaries & update pointers
                const newFace1 = this.#createFace(hE1Boundary);
                const newFace2 = this.#createFace(hE2Boundary);

                // delete the existing face
                this.#deleteFace(hE1existingFace)

            };
        };

        // notify observers
        this.notify('create', newEdge);
    };

    /**
     * Creates a new face
     * 
     * A private method as it can't be called independently,
     * it results from the creation of a new edge.
     * @returns {Face} - the new topogeometry Face
     */
    #createFace(boundaryHEs) {
        const face = new Face(boundaryHEs);

        face.timeCreated = this.currentTime;

        this.faces[face.id] = face;

        // notify observers
        this.notify('create', face);

        return face;
    };

    /**
     * Modify an existing face
     * 
     * @param {Face} face - an existing tgFace
     */
    #modifyFace(face) {

        console.log('modify face', face.id);

    };

    #deleteFace(face) {

        this.notify('delete', face)
        delete this.faces[face.id];

    };

    deleteEdge(edge) {
        // place holder function
        // maybe want to invoke an edge's own delete function? to remove half edges as well?
        this.notify('delete', edge);
        delete this.edges[edge];
    };

    /**
     * Given an id of an object in the topogeometry, returns a threejs vector
     * representative of that objects position
     * @param {string} id - id of an object in the topogeometry
     */
    getRepresentativeVector(id) {
        if (id.startsWith('v')) {

            return this.vertices[id].position;

        } else if (id.startsWith('e')) {

            return this.edges[id].midpoint;

        } else if (id.startsWith('f')) {

            return this.faces[id].representativePoint;

        }
    };

    // Handling observers [patterns.dev/vanilla/observer-pattern]
    // Note: observers are individual functions/methods of objects, not whole objects
    subscribe(func) {
        this.observers.push(func);
    };

    unsubscribe(func) {
        this.observers = this.observers.filter((observer) => observer != func)
    };

    /**
     * Notify observers of topogeometries that have been created, modified or deleted.
     * 
     * @param {string} action - ['create','modify','delete']
     * @param {Object} item - tgElement [Vertex, Edge, Face]
     */
    notify(action, item) {
        const validActions = ['create', 'modify', 'delete'];

        if (validActions.includes(action)) {

            // Send the notification
            this.observers.forEach((observer) => observer({ 'action': action, 'item': item }));

        } else {

            console.warn(option + " is not a valid option.");

        };
    };

};