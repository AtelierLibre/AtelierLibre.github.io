import { Graph } from './graph.js';
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
     * Creates FaceGraph links between a face and its adjacent faces.
     * Creates threejs arcs that visually represent the links.
     * 
     * @param {Face} face - a topogeometry edge object
     */
    createdFace(face) {

        let firstHE = face.halfEdges.values().next().value;

        for (let hE of firstHE.boundaryGenerator()) {
            let adjFace = hE.twin.face;

            if ((adjFace !== null) && (adjFace.id !== 'f0')) {

                let arcLine;

                // Create the curve object representing the graph link
                // add its id to graph link properties below
                if ((face.representativePoint !== null) && (adjFace.representativePoint !== null)) {

                    var rotatedFaceVector = face.representativePoint.clone();
                    var rotatedAdjFaceVector = adjFace.representativePoint.clone();

                    rotatedFaceVector.applyAxisAngle(new Vector3(1, 0, 0), (Math.PI / 2))
                    rotatedAdjFaceVector.applyAxisAngle(new Vector3(1, 0, 0), (Math.PI / 2))

                    arcLine = this.createArcLine(
                        rotatedFaceVector,
                        rotatedAdjFaceVector
                    );
                };

                this.setLink(
                    face.id,
                    adjFace.id,
                    {
                        'via': hE.id,
                        'visObjID': arcLine?.id ?? null, // undefined if arc doesn't exist
                        'mesh': arcLine
                    }
                );

                this.setLink(
                    adjFace.id,
                    face.id,
                    {
                        'via': hE.id,
                        'visObjID': arcLine?.id ?? null, // undefined if curveObject doesn't exist
                        'mesh': arcLine
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
    deletedFace(face) {

        // Remove the face id from the graph
        // Deleting a single face could require removing multiple links
        this.deleteLink(face.id)

    };
};