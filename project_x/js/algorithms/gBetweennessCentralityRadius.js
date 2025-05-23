/**
 * @fileoverview Description of file.
 */

import { gDijkstraSingleSourceLimit } from './gDijkstraSingleSourceLimit.js';

export async function* gBetweennessCentrality(
    graph, startID, costName, costLimit, uTurnPenalty, stepLimit = 10, delay=20) {

    // Run Dijkstra once to determine the nodes to process and in what order
    // Results kept in a Map to be able to use the insertion order
    const dijkstraResult = new Map();
    const dijkstraGenerator = gDijkstraSingleSourceLimit(
        graph, startID, costName, costLimit, uTurnPenalty, stepLimit, 0
    );
    for await (const result of dijkstraGenerator) {
        dijkstraResult.set(result['id'], result);
    }
    console.log('betweenness 5', dijkstraResult);
    
    
    const betweenness = {};

};