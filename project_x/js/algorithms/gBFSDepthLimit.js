/**
 * @fileoverview Description of file.
 */

import { Graph } from '../graph.js';

/**
 * Breadth First Search, generator with depth limit
 * 
 * For BFS, weights are not considered. BFS also yields each object (node) only once,
 * it does not 'update' the path used to get to a node as Dijkstra does.
 * 
 * @param {Graph} graph - A graph {'v0':{'v1':{...}, 'v2':{...}}, 'v1':{...}, ...}.
 * @param {string} start_id - A string id e.g. 'v0'.
 * @param {number} limit - An integer setting the depth limit of the search.
 * @param {number} delay - Milliseconds delay to introduce.
 * @yields {'id':current.id, 'predecessor':current.predecessor, 'value': current.depth}
 */
export async function* gBFSDepthLimit(graph, start_id, limit, delay = 20) {

    const visited = new Set();
    const queue = [{ 'id': start_id, 'depth': 0, 'predecessor': null }];

    visited.add(start_id);
    let index = 0;

    while (index < queue.length) {

        // Introduce generic pause to enable asynchronous functionality - need to rethink this.
        if (index % 10 === 0) await new Promise(resolve => setTimeout(resolve, delay)); // milliseconds

        let current = queue[index++]; //NB queue.shift();
        const { id, depth } = current;

        if (depth < limit) {
            for (const [neighbour_id] of Object.entries(graph.links[current.id])) {
                if (!visited.has(neighbour_id)) {
                    visited.add(neighbour_id);
                    queue.push({
                        'id': neighbour_id,
                        'depth': depth + 1,
                        'predecessor': id
                    });
                }
            }
        }

        yield {'id':id, 'predecessor':current.predecessor, 'value': depth};
    }
};