import { Graph } from './graph.js';
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
     * Adds an ID to the graph when a topogeometry vertex is created
     * 
     * In the current implementation of the interface this is very straightforward
     * as vertices don't link to or amend anything when they are created.
     * 
     * @param {Vertex} vertex - a topogeometry vertex object
     */
    createdVertex(vertex) {
        this.setLink(vertex.id);
    };

    /**
     * Adds a link to the graph when a topogeometry edge is created 
     * also creates a threejs line that visually represents the link.
     * 
     * @param {Edge} edge - a topogeometry edge object
     */
    createdEdge(edge) {
        // Create the arc representing the graph link
        // add its id to graph link properties below
        const arcLine = this.createArcLine(
            edge.hE1.origin.mesh.position,
            edge.hE2.origin.mesh.position
        );

        // Need to set it both ways
        this.setLink(
            edge.hE1.origin.id,
            edge.hE2.origin.id,
            {
                'distance': edge.length,
                'via': edge.id,
                'visObjID': arcLine.id,
                'mesh': arcLine
            }
        );

        this.setLink(
            edge.hE2.origin.id,
            edge.hE1.origin.id,
            {
                'distance': edge.length,
                'via': edge.id,
                'visObjID': arcLine.id,
                'mesh': arcLine
            }
        );

    };

    /**
     * Modifies a link in the vertex graph when a topogeometry edge is modified 
     * also creates an threejs curving line (arc) that visually represents the link.
     * 
     * @param {Edge} edge - a topogeometry edge object
     */
    modifiedEdge(edge) {
        const link1 = this.getLink(
            edge.hE1.origin.id,
            edge.hE2.origin.id
        );

        const link2 = this.getLink(
            edge.hE2.origin.id,
            edge.hE1.origin.id
        );

        const arcLine = link1['mesh']
        this.modifyArcLine(
            arcLine,
            edge.hE1.origin.mesh.position,
            edge.hE2.origin.mesh.position
        );

        //// Need to set it both ways
        //this.setLink(
        //    edge.hE1.origin.id,
        //    edge.hE2.origin.id,
        //    {
        //        'distance': edge.length,
        //        'via': edge.id,
        //        'visObjID': arc.id,
        //        'mesh': arc
        //    }
        //);
//
        //this.setLink(
        //    edge.hE2.origin.id,
        //    edge.hE1.origin.id,
        //    {
        //        'distance': edge.length,
        //        'via': edge.id,
        //        'visObjID': arc.id,
        //        'mesh': arc
        //    }
        //);
    };
};