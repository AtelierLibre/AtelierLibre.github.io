/**
 * @fileoverview Implementation of Dijkstra's all shortest path algorithm as an asynchronous generator.
 * 
 * This version implements:
 * - A cost limit, the algorithm will stop once this is reached
 * - A step limit, optionally rejects steps beyond this limit
 * - U-turn penalty, for angular analysis, penalises exiting an edge via the entry junction
 * - All shortest paths, returns predecessors as a list, and the nuber of shortest paths
 * - An arbitrary time delay, to allow asynchronous functionality and animation
 * 
 * This version deliberately does not:
 * - Initialise all distances to infinity (reduces memory requirements)
 * 
 * Outstanding issues:
 * - Still not sure early exit is in the right place...
 */

import { Graph } from '../graph.js';
import { PriorityQueue } from './priorityQueue.js';

/**
 * Dijkstra's algorithm, generator with depth limit
 * 
 * Nodes may be yielded repeatedly if their shortest path changes.
 * 
 * @param {Graph} graph - A graph {'v0':{'v1':{...}, 'v2':{...}}, 'v1':{...}, ...}.
 * @param {string} startID - An object/node id as a string e.g. 'v0'.
 * @param {string} costName - The name of the cost to use (e.g. 'distance', 'angle', 'time', 'money').
 * @param {number} costLimit - An number setting the limit of the search.
 * @param {boolean} uTurnPenalty - Whether to apply a u-turn penalty or not.
 * @param {number} [stepLimit=10] - Maximum cost per step.
 * @param {number} [delay=20] - Delay between iterations (ms).
 * @yields {Object} - Intermediate result with current node info.
 */
export async function* gDijkstraSingleSourceLimit(
    graph, startID, costName, costLimit, uTurnPenalty, stepLimit=10, delay=20, debug=false) {

    let totalCosts = {}; // Object storing IDs and current calculated cost to reach them
    let predecessors = {}; // Object storing the IDs of each ID's current predecessor
    let pathCounts = {}; // Object storing the number of shortest paths to each node
    let visited = new Set(); // Set of visited IDs
    let pq = new PriorityQueue();

    // Total cost to reach starting ID is zero & it has no predecessor
    totalCosts[startID] = 0;
    predecessors[startID] = []; // No predecessors initially
    pathCounts[startID] = 1; // There's exactly one way to reach the start node
    // Add starting ID to priority queue with priority of 0
    pq.enqueue(startID, 0);

    if (debug) console.log(`Starting Dijkstra from ${startID} with costLimit ${costLimit}`);

    // Yield the starting ID and cost
    yield {'id':startID, 'predecessors':[], 'value': 0, 'pathCount':1};

    // While the priority queue is not empty
    while (pq.values.length > 0) {

        // Generic pause to enable asynchronous functionality - need to rethink this.
        await new Promise(resolve => setTimeout(resolve, delay)); // milliseconds

        // Get lowest cost ID from the priority queue
        const currentID = pq.dequeue();
        // If already visited skip
        if (visited.has(currentID)) continue;
        // Else mark as visited
        visited.add(currentID);

        if (debug) console.log(`Visiting node ${currentID}, current cost: ${totalCosts[currentID]}`);

        // For each neighbour of the current vertex, get its id and costs
        for (const [neighbourID, costs] of Object.entries(graph.links[currentID])) {

            // Get the current cost
            let stepCost = costs[costName];

            // When finding the shortest angular path on an undirected edge graph
            // a u-turn penalty can be added to replicate the cost of entering an edge from one end,
            // turning around and leaving via the same end.
            // The question marks avoid TypeErrors if intermediate property name variables are undefined.
            if (uTurnPenalty) {
                if (
                    graph.links[currentID]?.[ predecessors[currentID] ]?.via ===
                    graph.links[currentID]?.[ neighbourID ]?.via
                ) {
                stepCost += 180;
                if (debug) console.log(`Applying U-turn penalty for node ${currentID} to ${neighbourID}`);
                };
            };

            // If the step cost to reach this neighbour (including any u-turn penalty)
            // is greater than the stepLimit, skip this one and continue on to the next
            if (stepLimit > 0 && stepCost > stepLimit) {
                if (debug) console.log(`Skipping ${neighbourID} due to step limit of ${stepLimit}`);
                continue;
            };

            // Cost to reach the neighbour equals total cost to reach current vertex
            // plus extra cost to neighbour
            const updatedCost = totalCosts[currentID] + stepCost;

            // If the updatedCost for this neighbour is greater than the costLimit,
            // skip this one and continue on to the next.
            if (updatedCost > costLimit) continue;

            // If the neighbour's id doesn't appear in the costs object yet OR
            // If the updated cost to the neighbour is less than the current total cost
            if (!totalCosts.hasOwnProperty(neighbourID) || updatedCost < totalCosts[neighbourID]) {

                // (over)write the neighbour's id and distance into the distances
                totalCosts[neighbourID] = updatedCost;
                // Update path count
                pathCounts[neighbourID] = pathCounts[currentID];
                // Update predecessors list
                predecessors[neighbourID] = [currentID];
                // (re)Enqueue the neighbour and its new distance into the priority queue
                pq.enqueue(neighbourID, updatedCost);

                if (debug) console.log(`Updated cost for ${neighbourID}: ${updatedCost} via ${currentID}`);
                
                // Yield the intermediate result
                if (debug) console.log('id', neighbourID, 'predecessors', [currentID], 'value', updatedCost, 'pathCount', pathCounts[neighbourID])
                yield {'id': neighbourID, 'predecessors': [currentID], 'value': updatedCost, 'pathCount': pathCounts[neighbourID]};
            
            // If the updatedCost is equal to the totalCost to the neighbour, record a
            } else if (updatedCost === totalCosts[neighbourID]) {
                // If another shortest path of equal length is found
                pathCounts[neighbourID] += pathCounts[currentID];
                // Add the current node to the predecessors list
                predecessors[neighbourID].push(currentID);

                if (debug) console.log(`Found another shortest path for ${neighbourID} via ${currentID}`);

                // Yield the intermediate result with updated path count
                if (debug) console.log('id', neighbourID, 'predecessors', predecessors[neighbourID], 'value', updatedCost, 'pathCount', pathCounts[neighbourID])
                yield {'id': neighbourID, 'predecessors': predecessors[neighbourID], 'value': updatedCost, 'pathCount': pathCounts[neighbourID]};
            }
        };

        // If the current shortest path is greater than the cost limit, stop the algorithm
        // This needs to come after the shortest path has been updated by the neighbours. There is also
        // a 'continue' check on the neighbours so they won't be yielded if over the the totalCost.
        if (totalCosts[currentID] > costLimit) {
            if (debug) console.log(`Cost limit of ${costLimit} exceeded at node ${currentID}, stopping search.`);
            return; 
        }

    };

    if (debug) console.log("Finished Dijkstra.");
};