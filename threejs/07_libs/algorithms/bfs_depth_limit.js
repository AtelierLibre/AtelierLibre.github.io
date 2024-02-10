export function bfs_depth_limit( graph, start_id, limit ) {

    const distances = {};
    const visited = new Set();
    const queue = [{ vertex:start_id, depth:0 }];

    visited.add(start_id);

    while ( queue.length ) {
        let current = queue.shift();
        let currentVertex = current.vertex;
        let currentDepth = current.depth;

        distances[currentVertex] = currentDepth;

        if ( currentDepth < limit ) {
            graph.vertices[currentVertex]['neighbours'].forEach(neighbour => {
                if ( !visited.has( neighbour ) ) {
                    visited.add( neighbour );
                    queue.push({ vertex: neighbour, depth: currentDepth + 1 });
                }
            });
        }
    }

    return distances;
};