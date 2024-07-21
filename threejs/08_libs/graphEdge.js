import { Graph } from './graph.js';
import { Vertex } from './tgVertex.js'; // For testing instances against
import { Edge } from './tgEdge.js'; // For testing instances against
import { Face } from './tgFace.js'; // For testing instances against
import { Scene } from 'three'; // For testing instances against
import { absoluteBearingDifference } from './helperFunctions.js';

/**
 * EdgeGraph class
 * 
 * The EdgeGraph is the graph that stores the links between the edges in the topogeometry.
 * 
 * Currently (Jul 2024) vertices can only be created in empty space, so their creation
 * doesn't affect links between existing edges.
 */
export class EdgeGraph extends Graph {
    /**
     * Create a graph between edge geometries.
     * 
     * @param {Scene} scene - The threejs scene to add the graph to.
     */
    constructor(scene) {
        // Set the colour and layer of this graph
        super(0x05fd11, 3);

        this.group.name = 'edgeGraphGroup';
        this.observer = this.observer.bind(this);

        // Add the graph to the scene
        if (scene !== undefined) {
            scene.add(this.group);
        };

    };


    /**
     * Observer function - subscribe to notifications from the topogeometry.
     * 
     * @param {object} data - in the format {'action': ['created', 'modified' or 'deleted'], 'item':topogeometry object}
     */
    observer(data) {
        if (data['action'] === 'create') {
            if (data['item'] instanceof Vertex) {
                this.processVertex(data['item']);
            } else if (data['item'] instanceof Edge) {
                this.processEdge(data['item']);
            } else if (data['item'] instanceof Face) {
                console.log('edgeGraph: not processing Face');
            } else {
                console.log('Unexpected item in the bagging area.')
            }
        } else {
            console.warn("edgeGraph: 'action' was not 'create'")
        }
    };


    /**
     * Process a new topogeometry vertex.
     * 
     * @param {Vertex} vertex - topogeometry vertex
     */
    processVertex(vertex) {
        // Currently new topogeometry vertices do not affect edges.
    };


    /**
     * Process a new topogeometry edge.
     * 
     * Link it to adjacent edges.
     * Calculate the costs of reaching those edges.
     * Create arcs visualising the links.
     * 
     * @param {Edge} edge - topogeometry edge
     */
    processEdge(edge) {

        // For each of the two half-edges
        for (const he of [edge.hE1, edge.hE2]) {

            // Get the half-edge's destination
            const v = he.twin.origin

            // Loop through the half-edges leaving that vertex
            for (const adjHE of v.sortedHalfEdges) {

                // Don't include self loops.
                if (adjHE.id === he.twin.id) {
                    console.log('skipping self-loop')
                    continue;
                }

                // Calculate the difference between the bearings of the two half-edges
                const bearingChange =  absoluteBearingDifference(he.bearing, adjHE.bearing)

                // Get the parent edge of the half-edge
                const adjEdge = adjHE.edge;

                // Create the curve object representing the graph link
                // add its id to graph link properties below
                const arc = this.addLinkArc(
                    edge.midpoint,
                    adjEdge.midpoint
                );

                // Need to set it both ways
                this.setLink(
                    edge.id,
                    adjEdge.id,
                    {
                        'distance': edge.length / 2 + adjEdge.length / 2,
                        'bearingChange': bearingChange,
                        'via': v.id,
                        'visObjID': arc.id,
                        'mesh': arc
                    }
                );

                this.setLink(
                    adjEdge.id,
                    edge.id,
                    {
                        'distance': edge.length / 2 + adjEdge.length / 2,
                        'bearingChange': bearingChange,
                        'via': v.id,
                        'visObjID': arc.id,
                        'mesh': arc
                    }
                );

            }
        }

    };
};