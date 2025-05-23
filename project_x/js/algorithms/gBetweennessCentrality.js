/**
 * @fileoverview Implementation of Betweenness Centrality algorithm as an asynchronous generator.
 * 
 * The goal is for this to be a radius-limited implementation of Betweenness Centrality. However,
 * this brings up a question about how the radius is applied. When assessing the Betweenness
 * Centrality of a node, the question is if it is on the shortest path between two *other* nodes.
 * 
 * So, starting from a node in question, *other* nodes upto x distance away are selected and then
 * the shortest paths between them calculated and the sum of the fractions of those shortest paths
 * that pass through the node in question are totalled up. However, if the node in question is at
 * the centre of a roughly circular area, the other nodes might be on opposite sides of the circle
 * i.e. 2x apart.
 * 
 * This might be a distraction because, if you were calculating betweenness centrality for the whole
 * map (i.e. without the initial radial selection) the radius could only apply to the shortest paths
 * from the other nodes.
 * 
 * In any case, where the idea is to calculate Betweenness Centrality for only part of the map, there
 * will be useful partial results beyond the edge of the completed area, so it would be good to store
 * these in some way, and also to keep track of which nodes have been visited so far to generate these
 * partial results so that these don't have to be repeated.
 * 
 * Thinking ahead to the next step, it would also be good to be able to keep track of which values
 * need to be recalculated following some change in the topogeometry that impacts the shortes paths.
 */

import { gDijkstraSingleSourceLimit } from './gDijkstraSingleSourceLimitAll.js';

/**
 * Betweenness centrality calculation using Dijkstra's algorithm as an async generator.
 * 
 * @param {Graph} graph - The graph in the format {'v0':{'v1':{...}, 'v2':{...}}, 'v1':{...}, ...}.
 * @param {string} costName - The name of the cost to use (e.g., 'distance').
 * @param {boolean} uTurnPenalty - Whether to apply a U-turn penalty.
 * @param {number} [stepLimit=10] - Maximum cost per step.
 * @param {number} [delay=20] - Delay between iterations (ms).
 * @yields {Object} - Partial centrality scores as an object mapping node IDs to scores.
 */
export async function* gBetweennessCentrality(
    graph, startID, costName, costLimit, uTurnPenalty, stepLimit = 10, delay=20
) {

    let centrality = {}; // Store centrality scores dynamically

    // For each and every node 's' of the whole graph
    for (const s in graph.links) {
        console.log('s', s)
        let totalCosts = {};
        let predecessors = {};
        let pathCounts = {};
        let stack = []; // To process nodes in reverse order
        let dependency = {};

        // Run Dijkstra's algorithm from source 's' and gather path info
        // Note this is an asynchronous generator function
        const dijkstra = gDijkstraSingleSourceLimit(
            graph, s, costName, Infinity, uTurnPenalty, stepLimit, delay
        );

        // Each result here is a partial result
        // they need to be stored in the variables above to allow them to be updated
        // Is there an issue that the stack is an array and nodes may be pushed to it multiple times?
        for await (const result of dijkstra) {
            console.log('bcDijkstra result:', result)
            const { id, predecessors: preds, value, pathCount } = result;
            totalCosts[id] = value;
            predecessors[id] = preds;
            pathCounts[id] = pathCount;
            stack.push(id);
            dependency[id] = 0; // Initialize dependency
        }

        console.log('gBetweennessCentraliy, Dijkstra iteration ', s, 'finished');
        console.log('tC',totalCosts);
        console.log('p',predecessors);
        console.log('pC',pathCounts);
        console.log('s',stack); // To process nodes in reverse order
        console.log('d',dependency);

        // Accumulate dependencies in reverse order
        while (stack.length > 0) {
            const w = stack.pop();

            // Check predecessors[w] is an array before iterating
            console.assert(Array.isArray(predecessors[w]))

            for (const v of predecessors[w]) {
                const coeff = (pathCounts[v] / pathCounts[w]) * (1 + dependency[w]);
                dependency[v] = (dependency[v] || 0) + coeff;
            }

            if (w !== s) {
                centrality[w] = (centrality[w] || 0) + dependency[w];
            }
        
            // Yield partial centrality scores after processing each node
            yield { ...centrality };
        }

        // Optional delay between processing sources to simulate real-time progress
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Yield final centrality scores
    yield { ...centrality };
};