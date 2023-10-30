import * as GRAPH from 'nb_graph';
import * as MATERIALS from 'nb_materials';

export function updateSelectionMap( selectionMap, INTERSECTED, selectionSteps ) {
    // Identify jsts object type 'Ct':Polyogn, 'mr':node, 'zr':line
    const constructorName = INTERSECTED.userData.jsts.constructor.name;
    let jstsNeighbours = [];

    // Should be empty anyway, but clear incase...
    selectionMap.clear();

    switch (constructorName) {
      // If origin element is a polygon
      case 'Vt': //Ct
        // Get the neighbouring polygons
        jstsNeighbours = GRAPH.polygonNeighbours(INTERSECTED.userData.jsts);
        // add the mesh of each neighbouring node to the selection set
        jstsNeighbours.forEach((element) => {
            //console.log(element._userData.threeJS)
            selectionMap.set( element._userData.threeJS, 1 )
        });
        break;

      // If origin element is a node
      case 'Ji': //mr
        // Get the neighbouring nodes
        jstsNeighbours = GRAPH.nodeNeighbours(INTERSECTED.userData.jsts);
        // add the mesh of each neighbouring node to the selection set
        jstsNeighbours.forEach((element) => {
            selectionMap.set( element._userData.threeJS, 1 )
        });
        break;

      // If origin element is an edge
      case 'Vr': //zr
        // Get the neighbouring nodes
        jstsNeighbours = GRAPH.edgeNeighbours(INTERSECTED.userData.jsts);
        // add the mesh of each neighbouring node to the selection set
        jstsNeighbours.forEach((element) => {
            selectionMap.set( element._line._userData.threeJS, 1 )
        });
        break;

      default:
        console.log("I've no idea what that is.")
    };

    // Overwrite the first object with a depth of 0 - this is a quick fudge.
    selectionMap.set(INTERSECTED, 0);

    // Change the colours of items in the Selection Map
    selectionMap.forEach((depth, threeJSObject) => {

        // Store the object's original material in its user data
        threeJSObject.userData['originalMaterial'] = threeJSObject.material;

        // Set the object's material to lime green
        switch (threeJSObject.geometry.type) {

            case 'ShapeGeometry':
                if (depth === 0) {
                    threeJSObject.material = MATERIALS.limeGreenMaterial;
                } else {
                    threeJSObject.material = MATERIALS.darkLimeGreenMaterial;
                };
                break;

            case 'SphereGeometry':
                if (depth === 0) {
                    threeJSObject.material = MATERIALS.limeGreenMaterial;
                } else {
                    threeJSObject.material = MATERIALS.darkLimeGreenMaterial;
                };
                break;

            case 'BufferGeometry':
                if (depth === 0) {
                    threeJSObject.material = MATERIALS.limeGreenLineBasicMaterial;
                } else {
                    threeJSObject.material = MATERIALS.darkLimeGreenLineBasicMaterial;
                };
                break;
            
            default:
                console.log('help')

        }
    });

};

export function resetSelectionMapMaterials( selectionMap ) {
    selectionMap.forEach((value, key) => {
        key.material = key.userData['originalMaterial'];
    });
};