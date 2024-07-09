import { Group } from 'three';
import { Vertex } from './tgVertex.js'; // For testing instances against
import { Edge } from './tgEdge.js'; // For testing instances against
import { Face } from './tgFace.js'; // For testing instances against

/**
 * Object for visualising topogeometries
 * 
 * Idea is that it will be possible to store a sequence of lightweight topoGeometry objects
 * 
 * And that this object will be able to read them and display them.
 */
export class TopogeometryVis {
    /**
     * @param {Scene} scene - The threejs scene that the topogeometry visualiser will be added to.
     */
    constructor(scene) {

        this.hashmap = {};

        this.tgVertexGroup = new Group();
        this.tgVertexGroup.name = 'tgVertexGroup';
        this.tgVertexGroup.renderOrder = 3;

        this.tgEdgeGroup = new Group();
        this.tgEdgeGroup.name = 'tgEdgeGroup';
        //this.tgEdgeGroup.renderOrder = 2;

        this.tgFaceGroup = new Group();
        this.tgFaceGroup.name = 'tgFaceGroup';
        this.tgFaceGroup.translateY -= 10;
        this.tgFaceGroup.renderOrder = 1;

        this.observer = this.observer.bind(this);

        if (scene !== undefined) {
            //console.log('adding topogeometry visualiser group to the scene.')
            scene.add(this.tgVertexGroup);
            scene.add(this.tgEdgeGroup);
            scene.add(this.tgFaceGroup);
        };

    };

    /**
     * Observer function used when subscribing to notifications from the topogeometry
     * 
     * @param {object} data - in the format {'action': ['created', 'modified' or 'deleted'], 'item':topogeometry object}
     */
    observer(data) {
        //console.log("TopogeometryVis observed: ", data);

        if (data['action'] === 'create') {
            if (data['item'] instanceof Vertex) {
                this.createVertex(data['item']);
            } else if (data['item'] instanceof Edge) {
                this.createEdge(data['item']);
            } else if (data['item'] instanceof Face) {
                this.createFace(data['item']);
            };
        } else if (data['action'] === 'modify') {
            // Do some modification
        } else if (data['action'] === 'delete') {
            if (data['item'] instanceof Face) {
                this.deleteFace(data['item']);
            };
        }
    };

    /**
     * Create a threejs mesh geometry to represent a topogeometry vertex.
     * 
     * @param {Vertex} vertex - a topogeometry vertex
     */
    createVertex(vertex) {
        this.hashmap[vertex.id] = vertex.mesh;
        this.tgVertexGroup.add(vertex.mesh);
    };

    /**
     * Create a threejs line geometry to represent a topogeometry edge.
     * 
     * @param {Edge} edge - a topogeometry edge
     */
    createEdge(edge) {
        this.hashmap[edge.id] = edge.mesh;
        this.tgEdgeGroup.add(edge.mesh);
    };

    /**
     * Create a threejs shape geometry to represent a topogeometry face.
     * 
     * Note: the default winding in ThreeJS is CCW when viewed from the front
     * 
     * @param {Face} face - a topogeometry face
     */
    createFace(face) {
        // Don't process unbounded face 'f0'
        if (face.id !== 'f0') {
            console.log('createFace',face)
            this.tgFaceGroup.add(face.mesh);
        };
    };

    deleteFace(face) {

        let object_to_delete = this.tgFaceGroup.getObjectById(face.meshID);

        // Can't remove from scene if not a direct child of scene
        this.tgFaceGroup.remove(object_to_delete);

        //dispose of its custom geometry
        object_to_delete.geometry.dispose();

        //dispose of its material if custom
    };

};