    import { Vector3, SphereGeometry, Mesh, MeshBasicMaterial } from 'three';
    import { Element } from './tgElement.js';
    import { HalfEdge } from './tgHalfEdge.js';

    const geometry = new SphereGeometry(0.15, 8, 8); // radius, width segments, height segments
    const baseMaterial = new MeshBasicMaterial({ color: 0x989789 });//0x655967 });
    const highlightMaterial = new MeshBasicMaterial({ color: 0xFFFFFF });//0xFFFF00 });
    const mesh = new Mesh(geometry, baseMaterial);

    /**
     * Topogeometry vertex class 
     * 
     * Should be fairly minimal. Strictly, it requires only
     * one link to an adjacent half-edge.
     * 
     * Ordering of half-edges around the vertex is stored in the
     * half-edges themselves.
     */
    export class Vertex extends Element {
        static idCounter = 0;

        /**
         * Create a vertex
         * @param {Vector3} vector3 - A threejs vector3 representing its position.
         */
        constructor(topogeometry, vector3) {
            // parent
            //console.log("topogeometry.currentTime",topogeometry.currentTime)
            super(topogeometry);

            this.id = 'v' + Vertex.idCounter++;

            this.halfEdges = new Object();
            this.sortedHalfEdges = new Array();

            this.mesh = mesh.clone();
            this.mesh.userData.baseMaterial = baseMaterial;
            this.mesh.userData.highlightMaterial = highlightMaterial;
            this.mesh.position.copy(vector3);
            this.mesh.userData['id'] = this.id;
            this.topogeometry.tgVertexGroup.add(this.mesh);

            // notify observers
            this.topogeometry.notify('created', this);
        };

        /**
         * Link a half-edge with the vertex (half-edges originate FROM this vertex)
         * @param {HalfEdge} halfEdge
         */
        addHalfEdge(halfEdge) {

            this.halfEdges[halfEdge.id] = halfEdge;

        };

        /**
         * Sorts the halfEdges by their bearing away from the vertex
         * 
         * Note: The sorting is not stored on the vertex itself but on
         * the .next and .prev pointers on the half-edges (updated separately).
         */
        sortHalfEdges() {

            // Copy the half-edges into an array
            let halfEdgeArray = Object.values(this.halfEdges)

            // Check types
            for (let hE of halfEdgeArray) {
                if (typeof hE !== 'object' || typeof hE.bearing !== 'number') {
                    throw new Error('Item in array is not an object, or `.bearing` is not a number!');
                }
            }

            // Note: sorts in place.
            this.sortedHalfEdges = halfEdgeArray.sort((a, b) => a.bearing - b.bearing);

            return this.sortedHalfEdges
        };

        /**
         * Based on the order of the half-edges in the sorted array, update
         * the `.next` and `.prev` pointers for half-edges originating from
         * this vertex.
         */
        updateHalfEdgePointers() {
            let arr = this.sortedHalfEdges

            for (let i = 0; i < arr.length; i++) {
                let prevIndex = (i - 1 + arr.length) % arr.length;
                let nextIndex = (i + 1) % arr.length;

                let prevHE = arr[prevIndex];
                let currentHE = arr[i];
                let nextHE = arr[nextIndex];

                currentHE.prev = prevHE.twin;
                prevHE.twin.next = currentHE;
            }

            return this.sortedHalfEdges
        };

        /**
         * Triggered when the position of the vertex mesh is modified by the transformControls
         */
        modifyPosition() {
            for (let hE of this.sortedHalfEdges) {
                hE.updateGeometry();
                hE.twin.updateGeometry();
                hE.updateBearing();
                hE.twin.updateBearing();
                hE.edge.update();
                this.topogeometry.notify('modified',hE.edge)
            }
        }

    };