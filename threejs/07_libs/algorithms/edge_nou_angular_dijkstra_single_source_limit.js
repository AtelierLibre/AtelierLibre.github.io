import { PriorityQueue } from './priorityQueue.js';

// Dijkstra's algorithm is interesting because, unlike Breadth First Search, the
// first distance calculated for each vertex may be 'wrong' and need updating. As
// such it would be more complicated to hold the results in an array or to yield them.

export function edge_nou_angular_dijkstra_single_source_limit(graph, start_id, limit) {

    let distances = {};
    let predecessors = {};
    let visited = new Set();
    let pq = new PriorityQueue();

    // This version avoids initializing all distances to infinity at once

    // Initialize the distance for the starting vertex and add it to the priority queue
    distances[start_id] = 0;
    predecessors[start_id] = 'na';
    pq.enqueue(start_id, 0);

    while (pq.values.length > 0) {
        let current = pq.dequeue(); // take the vertex off the front of the priority queue

        // Skip this vertex if we've already visited it - is this necessary?
        if (visited.has(current.val)) continue;

        visited.add(current.val);

        // If the current shortest distance is greater than the limit, stop the algorithm
        if (distances[current.val] > limit) break;

        // Note: this looks backwards as well e.g. if you start at 'e0' and move on to 'e1' as its neighbour
        // 'e0' will be considered again as one of the neighbours of 'e1'.
        for (let neighbour_id of graph.edges[current.val]['neighbours']) {

            // distance is a temporary variable, just within the for loop, which represents the sum of the
            // TOTAL distance from the current vertex back to the start vertex
            // +
            // the single step distance from the current vertex to the neighbour under consideration
            let distance = distances[current.val] + graph.edges[current.val]['neighbours_angular'][neighbour_id];

            // Add a penalty if the junction you pass through to get from the current vertex to the neighbour
            // under consideration is the same as the junction between the current vertex and its predecessor
            if (
                graph.edges[current.val]['neighbours_via'][ predecessors[current.val] ] ===
                graph.edges[current.val]['neighbours_via'][ neighbour_id ]
            ) {
            distance += 180;
            };

            // If the distance is greater than the limit, skip this neighbor
            if (distance > limit) continue;

            // Initialize the distance for the neighbor vertex if it hasn't been encountered yet
            // Or, if this is a shorter path to the neighbor vertex, update the shortest distance
            if (!distances.hasOwnProperty(neighbour_id) || distance < distances[neighbour_id]) {
                pq.enqueue(neighbour_id, distance);
                distances[neighbour_id] = distance;
                predecessors[neighbour_id] = current.val;
            };
        };
    };

    return { 'distances':distances, 'predecessors':predecessors };
}