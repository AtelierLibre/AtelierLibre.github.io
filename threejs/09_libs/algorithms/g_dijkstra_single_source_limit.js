import { Graph } from '../graph.js';
import { PriorityQueue } from './priorityQueue.js';

/**
 * Dijkstra's algorithm, generator with depth limit
 * 
 * This version avoids initializing all distances to infinity.
 * The distance to each vertex may be updated. Consider this when yielding.
 * 
 * @param {Graph} graph - A graph {'v0':{'v1':{...}, 'v2':{...}}, 'v1':{...}, ...}.
 * @param {string} startID - A string id e.g. 'v0'.
 * @param {string} costName - The name of the cost to use (e.g. 'distance', 'angle', 'time', 'money').
 * @param {number} costLimit - An number setting the limit of the search.
 * @param {boolean} uTurnPenalty - Whether to apply a u-turn penalty or not.
 * @yields ['current_id', {'previous_id':{'totalCost':number}}].
 */
export function* g_dijkstra_single_source_limit(graph, startID, costName, costLimit, uTurnPenalty, stepLimit=10) {

    let totalCosts = {}; // Object storing IDs and current calculated cost to reach them
    let predecessors = {}; // Object storing the IDs of each ID's current predecessor
    let visited = new Set(); // Set of visited IDs
    let pq = new PriorityQueue();

    // Total cost to reach starting ID is zero & it has no predecessor
    totalCosts[startID] = 0;
    predecessors[startID] = 'na'
    // Add starting ID to priority queue with priority of 0
    pq.enqueue(startID, 0);

    // Yield the starting ID and cost
    yield [startID, { null: { 'totalCost': 0 } }]

    // While the priority queue is not empty
    while (pq.values.length > 0) {

        // Get lowest cost ID from the priority queue
        // Comes as a Node with two properties, 'val' and 'priority'
        // 'val' is the ID
        let current = pq.dequeue();
        // If already visited skip
        if (visited.has(current.val)) continue;
        //else mark as visited
        visited.add(current.val);

        // If current shortest path (smallest cost) greater than limit, stop algorithm
        if (totalCosts[current.val] > costLimit) break;

        // For each neighbour of the current vertex, get its id and costs
        // for (let neighbour_id of graph.vertices[current.val]['neighbours']) {
        for (let [neighbourID, costs] of Object.entries(graph.links[current.val])) {

            // When finding the shortest angular path on an undirected edge graph it is typical to apply
            // a u-turn penalty to replicate the cost of entering an edge from one end, turning around
            // and leaving it via the same end.
            // The question marks are necessary to avoid TypeErrors if intermediate property name variables are undefined.
            let stepCost = graph.links[current.val][neighbourID][costName];

            if (uTurnPenalty) {
                if (
                    graph.links[current.val]?.[ predecessors[current.val] ]?.via ===
                    graph.links[current.val]?.[ neighbourID ]?.via
                ) {
                stepCost += 180;
                };
            };

            // Optional step limit
            if ( (stepLimit > 0) & (stepCost > stepLimit) ) {
                continue;
            };

            // Cost to reach the neighbour equals total cost to reach current vertex
            // plus extra cost to neighbour
            let updatedCost = totalCosts[current.val] + stepCost;

            // If the distance is greater than the limit, skip this neighbor
            if (updatedCost > costLimit) continue;

            // If the neighbour's id doesn't appear in the costs object yet OR
            // If the updated cost to the neighbour is less than the current total cost
            if (!totalCosts.hasOwnProperty(neighbourID) || updatedCost < totalCosts[neighbourID]) {
                // (over)write the neighbour's id and distance into the distances
                totalCosts[neighbourID] = updatedCost;
                predecessors[neighbourID] = current.val;
                // and (re)enqueue the neighbour and its new distance into the priority queue
                pq.enqueue(neighbourID, updatedCost);
                // and (in this version) yield the new result
                yield [neighbourID, { [current.val]: { 'totalCost': updatedCost } }]
            };
        };
    };
};