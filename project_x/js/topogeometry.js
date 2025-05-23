import { Vertex } from './tgVertex.js';
import { Edge } from './tgEdge.js';
import { Face } from './tgFace.js';
import { Group, Vector3 } from 'three';
import { calculateSignedArea } from './helperFunctions.js';

/**
 * Topogeometry
 */
export class Topogeometry {
    #time;

    constructor() {
        this.#time = 0;

        this.elements = {};

        this.vertices = {};
        this.edges = {};
        this.halfEdges = {};
        this.faces = {};

        this.tgVertexGroup = new Group();
        this.tgVertexGroup.name = 'tgVertexGroup';
        this.tgVertexGroup.renderOrder = 3;

        this.tgEdgeGroup = new Group();
        this.tgEdgeGroup.name = 'tgEdgeGroup';
        this.tgEdgeGroup.translateY(0.01);

        this.tgFaceGroup = new Group();
        this.tgFaceGroup.name = 'tgFaceGroup';
        this.tgFaceGroup.renderOrder = 1;

        this.observers = [];

        this.#createFace(); // Initialise topogeometry with unbounded face 'f0'
    };

    get currentTime() {
        const currentTime = this.#time;
        this.#time++; // Increment the time
        return currentTime;
    };

    /**
     * Converts a threejs vector (e.g. that received from rayPlaneIntersection)
     * into a topogeometry Vertex.
     * @param {Vector3} positionVector - threejs vector
     * @returns {Vertex} - new topogeometry Vertex
     */
    createVertex(positionVector) {
        // Create a new vertex with a reference to the parent topogeometry
        const vertex = new Vertex(this, positionVector.clone());

        // Add it to the vertices
        this.elements[vertex.id] = vertex;
        this.vertices[vertex.id] = vertex;

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
        const v1 = this.vertices[v1id];
        const v2 = this.vertices[v2id];

        // Create a new edge with a reference to the parent topogeometry
        // Pass in the vertices, not just the IDs
        // Edge and half-edges are created at the same time
        const newEdge = new Edge(this, v1, v2);

        this.elements[newEdge.id] = newEdge;
        this.edges[newEdge.id] = newEdge;

        //Note: the half-edges are created automatically by the edge
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
            let signedArea = calculateSignedArea(
                hE.origin.mesh.position,
                hE.next.origin.mesh.position
            );
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
                let signedArea = calculateSignedArea(hE.origin.mesh.position, hE.next.origin.mesh.position);
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
    };

    createFace(){
        this.#createFace()
    }

    /**
     * Creates a new face
     * 
     * A private method as it can't be called independently,
     * it results from the creation of a new edge.
     * @returns {Face} - the new topogeometry Face
     */
    #createFace(boundaryHEs) {
        // Create a new face with a reference to the parent topogeometry
        const face = new Face(this, boundaryHEs);

        this.elements[face.id] = face;
        this.faces[face.id] = face;

        return face;
    };

    /**
     * Modify an existing face
     * 
     * @param {Face} face - an existing tgFace
     */
    #modifyFace(face) {

        console.log('modified face', face.id);

    };

    #deleteFace(face) {

        let object_to_delete = this.tgFaceGroup.getObjectById(face.meshID);
        // remove it from the group and from the scene
        this.tgFaceGroup.remove(object_to_delete)
        //dispose of its custom geometry
        object_to_delete.geometry.dispose();
        this.notify('deleted', face)
        delete this.elements[face.id];
        delete this.faces[face.id];

    };

    deleteEdge(edge) {
        // place holder function
        // maybe want to invoke an edge's own delete function? to remove half edges as well?
        this.notify('deleted', edge);
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

    /**
     * Subscribe an observer function [patterns.dev/vanilla/observer-pattern]
     * Note: an observer is an individual function/method of an object, not a whole object
     * @param {function} observer - The observer function to subscribe 
     */
    subscribe(observer) {
        this.observers.push(observer);
    };

    /**
     * Unsubscribe an observer function
     * @param {function} observer - The observer function to unsubscribe 
     */
    unsubscribe(observer) {
        this.observers = this.observers.filter((observer_) => observer_ != observer)
    };

    /**
     * Notify observers of topogeometries that have been created, modified or deleted.
     * 
     * @param {string} action - ['create','modify','delete']
     * @param {Object} element - tgElement [Vertex, Edge, Face]
     */
    notify(action, element) {
        const validActions = ['created', 'modified', 'deleted'];
        if (validActions.includes(action)) {
            this.observers.forEach((observer) => observer({ 'action': action, 'element': element }));
        } else {
            console.warn(option + " is not a valid action.");
        };
    };

    /**
     * 
     * @param {Array} coordinate - x, y, z coordinate in the form of an array [x,y,z]
     * @returns {Vector3} - A threejs Vector3
     */
    vector3FromCoordinate(coordinate){
        return new Vector3(coordinate[0], coordinate[1], coordinate[2]);
    };

    // This method must be async to use await for the simulated delays, without the delay
    // I don't believe this needs to be async. It does need to be a generator though.
    async *processCoordinates(coordinates) {
        for (const coord of coordinates) {
            await new Promise(resolve => setTimeout(resolve, 30)); // simulated delay

            const vector3 = this.vector3FromCoordinate(coord);
            const vertex = this.createVertex(vector3);

            // Yield the object to indicate it's processed
            yield vertex;
        };
    };

    // This method must be async to use await for the simulated delays, without the delay
    // I don't believe this needs to be async. It does need to be a generator though.
    async *processLinks(links, vertexIDArray) {
        for (const link of links) {
            await new Promise(resolve => setTimeout(resolve, 10)); // simulated delay

            this.createEdge(vertexIDArray[link[0]], vertexIDArray[link[1]])

            // Yield the object to indicate it's processed
            yield;
        };
    };

    // This asynchronous method creates the generator and then iterates through it.
    async startProcessing(sample) {
        const vertexGenerator = this.processCoordinates(sample.coordinates);
        const vertexIDArray = new Array(); // map coordinate ID to created vertexID

        for await (const vertex of vertexGenerator) {
            vertexIDArray.push(vertex.id);
            console.log('Processed object', vertex.id);
            // Note: This just iterates through the generator. All of the
            // processing is done in the generator function.
        };

        const linkGenerator = this.processLinks(sample.links, vertexIDArray);

        for await (const link of linkGenerator) {
            console.log('Processed object', link);
            // Note: This just iterates through the generator. All of the
            // processing is done in the generator function.
        };
    };
};