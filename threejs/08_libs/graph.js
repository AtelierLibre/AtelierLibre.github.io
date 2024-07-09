import { QuadraticBezierCurve3, Vector3, BufferGeometry, LineDashedMaterial, Line, Group } from 'three';

/**
 * Parent class for creating graph objects
 * 
 * The graph (#links) is kept as simple as possible so that it can link
 * arbitrary collections of vertices, edges and faces in a way
 * that can then be processed by largely unmodified graph algorithms
 * 
 * Structured as {'e01':{'e02':{'distance':43,'angle':90,'time':1.5,'via':'v01'},
 *                       'e03':{'distance':38,'angle':56,'time':4.2,'via':'v02'}},
 *                'e02':{etc... }}
 * 
 * The class includes the threejs group and the arc geometries for each link
 * so as to keep the adding/deleting of links from the graph and the adding/
 * deleting of arc geometries from the scene synchronized easily.
 * 
 */
export class Graph {
    #links;
    #arcColor
    #arcLayer
    #dashedLineMaterial

    /**
     * Construct...
     * @param {number} arcColor - Colour expressed as a hexadecimal number
     * @param {number} arcLayer - ThreeJS layer as an integer
     */
    constructor(arcColor = 0xfd6905, arcLayer = 0) {
        this.name = null;
        this.time = null;
        this.#links = {};

        this.group = new Group();

        this.#arcColor = arcColor;
        this.#arcLayer = arcLayer;
        this.#dashedLineMaterial = new LineDashedMaterial({
            color: this.#arcColor,
            linewidth: 2,
            scale: 1,
            dashSize: 0.2,
            gapSize: 0.1
        });
    };

    /**
     * Getter for links is provided primarily to prevent direct setting of the links
     */
    get links() {
        return this.#links;
    };

    /**
     * Adds or updates Graph links and impedances
     * 
     * Note: Only links 'id1' to 'id2'. Symmetrical links must be added independently.
     * 
     * @param {string} id1 - The id of the source object. Must be supplied.
     * @param {string} [id2] - The id of the target object. Optional.
     * @param {object} [impedances] - Any impedances associated with the link. Can only be provided if id1 and id2 are supplied.
     * @throws {Error} If the parameters are not of the correct type or are not supplied in the correct combination.
     */
    setLink(id1, id2, impedances) {
        // Type checking
        if (typeof id1 !== 'string') {
            throw new Error("'id1' must be a string.");
        };
        if (id2 !== undefined && typeof id2 !== 'string') {
            throw new Error("'id2' must be a string.");
        };
        if (impedances !== undefined && typeof impedances !== 'object') {
            throw new Error("'impedances' must be an object.");
        };

        // If only id1 was supplied
        if (id1 !== undefined && id2 === undefined && impedances === undefined) {

            // If 'id1' isn't already in links, add it as a key to an empty object
            if (!(id1 in this.#links)) { this.#links[id1] = {} };

        }
        // If id1 and id2 were supplied
        else if (id1 !== undefined && id2 !== undefined && impedances === undefined) {

            // If 'id1' isn't already in links, add it as a key to an empty object
            if (!(id1 in this.#links)) { this.#links[id1] = {} };

            // If 'id2' isn't in 'id1's links, add it as a key to an empty object
            if (!(id2 in this.#links[id1])) { this.#links[id1][id2] = {} };

        }
        // If all three parameters were supplied
        else if (id1 !== undefined && id2 !== undefined && impedances !== undefined) {

            // If 'id1' isn't already in links, add it as a key to an empty object
            if (!(id1 in this.#links)) { this.#links[id1] = {} };

            // If 'id2' isn't in 'id1's links, add it as a key to an empty object
            if (!(id2 in this.#links[id1])) { this.#links[id1][id2] = {} };

            // Update the impedances
            this.#links[id1][id2] = { ...this.#links[id1][id2], ...impedances };

        }
        // Check if the third parameter was supplied without the second
        else {
            throw new Error("'id1' or 'id1'&'id2' or 'id1'&'id2'&'impedances' must be supplied.");
            // Handle error...
        };
    };

    /**
     * Delete a key from a nested object
     *
     * Also deletes any mesh first before removing the object.
     * 
     * @param {*} obj 
     * @param {*} keyToDelete 
     */
    deleteNestedKey(obj, keyToDelete) {
        for (const key in obj) { // for every key in the object
            // if the top level key is the one to delete
            if (key === keyToDelete) {
                if (typeof obj[key] === 'object') {
                    const subobj = obj[key];
                    // for every sublevel object
                    for (const subkey in subobj) {
                        if (typeof subobj[subkey] === 'object') {
                            // that has a mesh, dispose of the geometry (the material remains)
                            if (subobj[subkey].hasOwnProperty('mesh')) {
                                this.group.remove(subobj[subkey]['mesh'])
                                subobj[subkey]['mesh'].geometry.dispose();
                            }
                        }
                        // and then delete the sublevel object
                        delete subobj[subkey]
                    }
                }
                // and finally delete the top level key (and subobject)
                delete obj[key]
            // if the top level key is NOT the one to delete
            } else {
                if (typeof obj[key] === 'object') {
                    const subobj = obj[key];
                    // for every sublevel object
                    for (const subkey in subobj) {
                        // if the subkey is the one to delete,
                        if (subkey === keyToDelete){
                            if (typeof subobj[subkey] === 'object') {
                                // if it has a mesh, dispose of the geometry (the material remains)
                                if (subobj[subkey].hasOwnProperty('mesh')) {
                                    this.group.remove(subobj[subkey]['mesh'])
                                    subobj[subkey]['mesh'].geometry.dispose();
                                }
                            }
                            // then delete the subkey and object
                            delete subobj[subkey]
                        }
                    }
                }
                // don't delete the top level key
            }
        }
    }

    /**
     * Deletes Graph links
     * 
     * Note:
     * If two ids are supplied, deletes link from 'id1' to 'id2' (i.e. only deletes 'id2' from within the nested
     * object keyed as 'id1'). Symmetrical links must be deleted independently.
     * If one id is supplied, deletes all links containing that id.
     * I don't currently see the need to delete individual impedances
     * 
     * @param {string} id1 - The id of the source object. Must be supplied.
     * @param {string} [id2] - The id of the target object. Optional.
     * @throws {Error} If the parameters are not of the correct type or are not supplied in the correct combination.
     */
    deleteLink(id1, id2) {
        // Type checking
        if (typeof id1 !== 'string') {
            throw new Error("'id1' must be a string.");
        };
        if (id2 !== undefined && typeof id2 !== 'string') {
            throw new Error("'id2' must be a string.");
        };

        // If only id1 was supplied delete top level and nested keys with that id
        if (id1 !== undefined && id2 === undefined) {

            this.deleteNestedKey(this.links, id1)

        }

        // If id1 and id2 were supplied, only delete id2 from within id1
        else if (id1 !== undefined && id2 !== undefined) {
            if (id1 in this.links) {
                if (id2 in this.links[id1]) {
                    if ('mesh' in this.links[id1][id2]) {
                        this.links[id1][id2]['mesh'].geometry.dispose()
                    }
                    delete this.links[id1][id2];
                } else {
                    console.warn("'id2' not found in 'id1' object")
                }
            } else {
                console.warn("'id1' not found.")
            };
        }

        // Check if the third parameter was supplied without the second
        else {
            throw new Error("'id1' or 'id1'&'id2' must be supplied.");
            // Handle error...
        };

    };

    /**
     * Creates a line object arcing between the vector positions of two topogeometries and
     * - adds it to the threejs group for this particular graph
     * - returns the object so that its id can be added to the graph link's properties
     * 
     * @param {Vector3} startVector - vector position representing a topogeometry
     * @param {Vector3} endVector - vector position representing a topogeometry
     * @returns - threejs line (arc) representing link between entities
     */
    addLinkArc(startVector, endVector) {

        const arc = this.#createArc(startVector, endVector);

        arc.layers.set(this.#arcLayer);

        this.group.add(arc);

        return arc;

    };

    /**
     * Create a line object arcing between the vector positions of two topogeometries
     * 
     * @param {Vector3} startVector - threejs Vector3 representing position of start
     * @param {Vector3} endVector - threejs Vector3 representing position of end
     * @returns - threejs Line (including geometry and material)
     */
    #createArc(startVector, endVector) {

        const midVector = startVector.clone();
        midVector.lerp(endVector, 0.5);
        midVector.setY(startVector.distanceTo(endVector) / 2);

        const quadraticBezierCurve = new QuadraticBezierCurve3(
            startVector,
            midVector,
            endVector,
        );

        const points = quadraticBezierCurve.getPoints(10);

        const geometry = new BufferGeometry().setFromPoints(points);

        const arc = new Line(geometry, this.#dashedLineMaterial);

        arc.computeLineDistances();

        return arc;
    };
};