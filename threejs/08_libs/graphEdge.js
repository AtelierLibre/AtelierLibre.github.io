import { Graph } from './graph.js';
import { Vertex } from './tgVertex.js'; // For testing instances against
import { Edge } from './tgEdge.js'; // For testing instances against
import { Face } from './tgFace.js'; // For testing instances against
import { Scene } from 'three'; // For testing instances against

/**
 * EdgeGraph class
 * 
 * Topological links and distances from edge to edge
 */
export class EdgeGraph extends Graph {
    /**
     * Create a graph between edge geometries.
     * @param {Scene} scene - The threejs scene that the graph visualiser will be added to.
     */
    constructor(scene) {
        super(0x05fd11, 3);

        //this.graphVisualiser = new GraphVisualiser(0x05fd11, 3);
        this.group.name = 'edgeGraphGroup';
        this.observer = this.observer.bind(this);

        if (scene !== undefined) {
            console.log('add edge graph group to the scene.')
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
     * In an edge graph, at point of creation, vertices serve no purpose.
     * 
     * @param {Vertex} vertex - a topogeometry vertex object
     */
    processVertex(vertex) {
        // pass
    };

    /**
     * Processes a topogeometry edge object. Creating links between it and its
     * adjacent edges, also creating threejs curving lines (arcs) that
     * visually represent the links.
     * 
     * @param {Edge} edge - a topogeometry edge object
     */
    processEdge(edge) {
        // Get the two end points of the edge
        const v1 = edge.hE1.origin;
        const v2 = edge.hE2.origin;

        for (const v of [v1, v2]) {
            // TODO: This will probably create self-links
            for (const he of v.sortedHalfEdges) {
                const e = he.edge;

                // Don't include self loops.
                // Could potentially also be achieved by filtering:
                // let filteredArray = array.filter(obj => obj.id !== idToRemove);
                if (e.id === edge.id) {
                    continue;
                }

                // Create the curve object representing the graph link
                // add its id to graph link properties below
                const arc = this.addLinkArc(
                    edge.midpoint,
                    e.midpoint
                );

                // Need to set it both ways
                this.setLink(
                    edge.id,
                    e.id,
                    {
                        'distance': edge.length / 2 + e.length / 2,
                        'via': v.id,
                        'visObjID': arc.id,
                        'mesh': arc
                    }
                );

                this.setLink(
                    e.id,
                    edge.id,
                    {
                        'distance': edge.length / 2 + e.length / 2,
                        'via': v.id,
                        'visObjID': arc.id,
                        'mesh': arc
                    }
                );

            }
        }

    };
};