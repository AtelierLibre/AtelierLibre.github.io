import { PriorityQueue } from './priorityQueue.js';

// Dijkstra's algorithm is interesting because, unlike Breadth First Search, the
// first distance calculated for each vertex may be 'wrong' and need updating. As
// such it would be more complicated to hold the results in an array or to yield them.

export function edge_dijkstra_single_source_limit(graph, start_id, limit) {

    let distances = {};
    let visited = new Set();
    let pq = new PriorityQueue();

    // This version avoids initializing all distances to infinity at once

    // Initialize the distance for the starting vertex and add it to the priority queue
    distances[start_id] = 0;
    pq.enqueue(start_id, 0);

    while (pq.values.length > 0) {
        let current = pq.dequeue();

        // Skip this vertex if we've already visited it
        if (visited.has(current.val)) continue;

        visited.add(current.val);

        // If the current shortest distance is greater than the limit, stop the algorithm
        if (distances[current.val] > limit) break;

        for (let neighbour_id of graph.edges[current.val]['neighbours']) {

            let distance = distances[current.val] + graph.edges[current.val]['neighbours_metric'][neighbour_id];

            // If the distance is greater than the limit, skip this neighbor
            if (distance > limit) continue;

            // Initialize the distance for the neighbor vertex if it hasn't been encountered yet
            // Or, if this is a shorter path to the neighbor vertex, update the shortest distance
            if (!distances.hasOwnProperty(neighbour_id) || distance < distances[neighbour_id]) {
                distances[neighbour_id] = distance;
                pq.enqueue(neighbour_id, distance);
            };
        };
    };

    return distances;
}