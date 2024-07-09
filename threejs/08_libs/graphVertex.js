import { Graph } from './graph.js';
import { Vertex } from './tgVertex.js'; // For testing instances against
import { Edge } from './tgEdge.js'; // For testing instances against
import { Face } from './tgFace.js'; // For testing instances against
import { Scene } from 'three'; // For testing instances against

/**
 * VertexGraph class
 * 
 * The most straightforward graph (?). Simple topological links and distances
 * along edges between vertices. Symmetrical.
 */
export class VertexGraph extends Graph {
    /**
     * Create a graph between edge geometries.
     * @param {Scene} scene - The threejs scene that the graph visualiser will be added to.
     */
    constructor(scene) {
        super(undefined, 2);

        //this.graphVisualiser = new GraphVisualiser(undefined, 2);
        this.group.name = 'vertexGraphGroup';
        this.observer = this.observer.bind(this);

        if (scene !== undefined) {
            console.log('add vertex graph visualiser group to the scene.')
            scene.add(this.group);
        };

    };

    /**
     * Observer function used when subscribing to notifications from the topogeometry
     * 
     * @param {object} data - in the format {'action': ['created' or 'deleted'], 'item':topogeometry object}
     */
    observer(data) {

        if (data['action'] === 'create') {
            if (data['item'] instanceof Vertex) {
                this.processVertex(data['item']);
            } else if (data['item'] instanceof Edge) {
                this.processEdge(data['item']);
            } else if (data['item'] instanceof Face) {
                console.log('vertexGraph: not processing Face');
            } else {
                console.log('Unexpected item in the bagging area.')
            }
        } else {
            console.warn("vertexGraph: 'action' was not 'create'")
        }
    };

    /**
     * Processes a topogeometry vertex object into an id in the graph
     * 
     * In the current implementation of the interface this is very straightforward
     * as vertices don't link to or amend anything when they are created.
     * 
     * @param {Vertex} vertex - a topogeometry vertex object
     */
    processVertex(vertex) {
        this.setLink(vertex.id);
    };

    /**
     * Processes a topogeometry edge object into links in the graph and also 
     * creates an threejs curving line (arc) that visually represents the link.
     * 
     * @param {Edge} edge - a topogeometry edge object
     */
    processEdge(edge) {
        // Create the arc representing the graph link
        // add its id to graph link properties below
        const arc = this.addLinkArc(
            edge.hE1.origin.position,
            edge.hE2.origin.position
        );

        // Need to set it both ways
        this.setLink(
            edge.hE1.origin.id,
            edge.hE2.origin.id,
            {
                'distance': edge.length,
                'via': edge.id,
                'visObjID': arc.id,
                'mesh': arc
            }
        );

        this.setLink(
            edge.hE2.origin.id,
            edge.hE1.origin.id,
            {
                'distance': edge.length,
                'via': edge.id,
                'visObjID': arc.id,
                'mesh': arc
            }
        );

    };
};