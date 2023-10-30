export function bfs(graph, start, n) {
    let queue = [{node: start, depth: 0}];
    let visited = new Map();
    visited.set(start, 0);

    while (queue.length > 0) {
        let current = queue.shift();
        if (current.depth > n) {
            break;
        }
        let neighbors = graph[current.node] || [];
        for (let neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.set(neighbor, current.depth + 1);
                queue.push({node: neighbor, depth: current.depth + 1});
            };
        };
    };

    return visited;
};

export function nodeNeighbours(jstsNode) {
    const outEdgeArray = jstsNode.getOutEdges()._outEdges;
    
    let toNodeArray = outEdgeArray.toArray().map(function(e){
        return e.getToNode();
    });
    
    return toNodeArray;
};

export function edgeNeighbours(jstsEdge) {
    // Get the two directed (half) edges for the original edge
    const dirEdges = jstsEdge._dirEdge

    // Get the toNodes for these two dirEdges
    const toNodes = dirEdges.map((e) => e.getToNode() );

    // Get the Arrays of out edges from these nodes
    const outEdgeArrays = toNodes.map((n) => n.getOutEdges()._outEdges.toArray());

    const flatOutEdgeArray = outEdgeArrays.flat();

    const parentEdgeArray = flatOutEdgeArray.map((outEdge) => outEdge._parentEdge);

    const parentEdgeSet = new Set(parentEdgeArray);

    return Array.from(parentEdgeSet);
};

export function polygonNeighbours( jstsPolygon ) {

    const dirEdges = jstsPolygon._userData.dirEdge._edgeRing._deList.toArray()
    // Get Twins' Polygon
    const polyNeighbours = dirEdges.filter((dE) => '_userData' in dE._sym).map((dE) => dE._sym._userData.Polygon)

    return polyNeighbours;
};