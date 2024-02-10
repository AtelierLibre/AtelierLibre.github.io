export function edge_bfs_depth_limit( graph, startID, limit ) {

    const distances = {};
    const visited = new Set();
    const queue = [{ id:startID, distance:0 }];

    visited.add(startID);

    while ( queue.length ) {
        let current = queue.shift();
        let currentID = current.id;
        let currentDistance = current.distance;

        distances[currentID] = currentDistance;

        if ( currentDistance < limit ) {
            graph.edges[currentID]['neighbours'].forEach( neighbourID => {
                if ( !visited.has( neighbourID ) ) {
                    visited.add( neighbourID );
                    queue.push({ id:neighbourID, distance:currentDistance + 1 });
                }
            });
        }
    }

    return distances;
};