import { Graph } from './graph.js';
import { Vertex } from './tgVertex.js'; // For testing instances against
import { Edge } from './tgEdge.js'; // For testing instances against
import { Face } from './tgFace.js'; // For testing instances against
import { Scene, Vector3 } from 'three'; // For testing instances against

/**
 * FaceGraph class
 * 
 * Topological links and distances from face to face
 */
export class FaceGraph extends Graph {
    /**
     * Create a graph between edge geometries.
     * @param {Scene} scene - The threejs scene that the graph visualiser will be added to.
     */
    constructor(scene) {
        super(0x000fed, 4);

        //this.graphVisualiser = new GraphVisualiser(0x000fed, 4);
        this.group.name = 'faceGraphGroup';
        this.observer = this.observer.bind(this);

        if (scene !== undefined) {
            scene.add(this.group);
        };
    };

    /**
     * Observer function used when subscribing to notifications from the topogeometry
     * 
     * @param {object} data - in the format {'action': ['created', 'modified' or 'deleted'], 'item':topogeometry object}
     */
    observer(data) {

        if (data['action'] === 'create') {
            if (data['item'] instanceof Vertex) {
                console.log('faceGraph: not processing Vertex');
            } else if (data['item'] instanceof Edge) {
                console.log('faceGraph: not processing Vertex');
            } else if (data['item'] instanceof Face) {
                this.createFaceLinks(data['item']);
            } else {
                console.log('Unexpected item in the bagging area.')
            }
        } else if (data['action'] === 'delete') {
            if (data['item'] instanceof Face) {
                this.deleteFaceLinks(data['item']);
            }
        } else {
            console.warn("faceGraph: 'action' was not 'create'")
        };
    };

    /**
     * Creates FaceGraph links between a face and its adjacent faces.
     * Creates threejs arcs that visually represent the links.
     * 
     * @param {Face} face - a topogeometry edge object
     */
    createFaceLinks(face) {

        let firstHE = face.halfEdges.values().next().value;

        for (let hE of firstHE.boundaryGenerator()) {
            let adjFace = hE.twin.face;

            if ((adjFace !== null) && (adjFace.id !== 'f0')) {

                let arc;

                // Create the curve object representing the graph link
                // add its id to graph link properties below
                if ((face.representativePoint !== null) && (adjFace.representativePoint !== null)) {

                    var rotatedFaceVector = face.representativePoint.clone();
                    var rotatedAdjFaceVector = adjFace.representativePoint.clone();

                    rotatedFaceVector.applyAxisAngle(new Vector3(1, 0, 0), (Math.PI / 2))
                    rotatedAdjFaceVector.applyAxisAngle(new Vector3(1, 0, 0), (Math.PI / 2))

                    arc = this.addLinkArc(
                        rotatedFaceVector,
                        rotatedAdjFaceVector
                    );
                };

                this.setLink(
                    face.id,
                    adjFace.id,
                    {
                        'via': hE.id,
                        'visObjID': arc?.id ?? null, // undefined if arc doesn't exist
                        'mesh': arc
                    }
                );

                this.setLink(
                    adjFace.id,
                    face.id,
                    {
                        'via': hE.id,
                        'visObjID': arc?.id ?? null, // undefined if curveObject doesn't exist
                        'mesh': arc
                    }
                );
            } else {
                console.warn('adjFace is null for some reason')
            };
        };
    };

    /**
     * Deletes FaceGraph links when a face is deleted from the topogeometry.
     * Deletes the threejs arcs that visually represent the links.
     * @param {Face} face 
     */
    deleteFaceLinks(face) {

        // Remove the face id from the graph
        // Deleting a single face could require removing multiple links
        this.deleteLink(face.id)

    };
};