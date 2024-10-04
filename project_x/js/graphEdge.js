import { Graph } from './graph.js';
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

    // Currently new topogeometry vertices do not affect the edge graph
    //createdVertex(vertex) {};

    /**
     * Process the creation of a new topogeometry edge.
     * 
     * Link it to adjacent edges.
     * Calculate the costs of reaching those edges.
     * Create arcs visualising the links.
     * 
     * @param {Edge} edge - topogeometry edge
     */
    createdEdge(edge) {

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
                const arcLine = this.createArcLine(
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
                        'visObjID': arcLine.id,
                        'mesh': arcLine
                    }
                );

                this.setLink(
                    adjEdge.id,
                    edge.id,
                    {
                        'distance': edge.length / 2 + adjEdge.length / 2,
                        'bearingChange': bearingChange,
                        'via': v.id,
                        'visObjID': arcLine.id,
                        'mesh': arcLine
                    }
                );
            };
        };
    };

    modifiedEdge(edge) {

        // For each of the two half-edges
        for (const he of [edge.hE1, edge.hE2]) {

            // Get the half-edge's destination
            const destination = he.twin.origin

            // Loop through the half-edges leaving that vertex
            for (const adjHE of destination.sortedHalfEdges) {

                // Don't include self loops.
                if (adjHE.id === he.twin.id) {
                    continue;
                }

                // Get the parent edge of the half-edge
                const adjEdge = adjHE.edge;

                // Calculate the difference between the bearings of the two half-edges
                const bearingChange =  absoluteBearingDifference(he.bearing, adjHE.bearing)
                const distance = edge.length / 2 + adjEdge.length / 2

                const link1 = this.getLink(
                    edge.id,
                    adjEdge.id
                );
                link1['bearingChange'] = bearingChange;
                link1['distance'] = distance;
            
                const link2 = this.getLink(
                    adjEdge.id,
                    edge.id
                );
                link2['bearingChange'] = bearingChange;
                link2['distance'] = distance;
            
                const arcLine = link1['mesh']
                this.modifyArcLine(
                    arcLine,
                    edge.midpoint,
                    adjEdge.midpoint
                );
            };
        };
    };
};