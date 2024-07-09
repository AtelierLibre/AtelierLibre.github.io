
import { Graph } from '../graph.js';

/**
 * Breadth First Search generator with depth limit
 * 
 * For BFS, weights are not considered. BFS also yields each object (node) only once,
 * it does not 'update' the path used to get to a node as Dijkstra does.
 * 
 * @param {Graph} graph - A graph {'v0':{'v1':{...}, 'v2':{...}}, 'v1':{...}, ...}.
 * @param {string} start_id - A string id e.g. 'v0'.
 * @param {number} limit - An integer setting the depth limit of the search.
 * @yields ['current_id', {'previous_id':{'depth':number}}].
 */
export function* g_bfs_depth_limit(graph, start_id, limit) {

    const visited = new Set();
    const queue = [{ 'id': start_id, 'depth': 0, 'predecessor': null }];
    const links = graph.links;
    console.log(links)

    visited.add(start_id);

    while (queue.length) {
        let current = queue.shift();

        if (current.depth < limit) {
            for (let [neighbour_id, value] of Object.entries(graph.links[current.id])) {
                if (!visited.has(neighbour_id)) {
                    visited.add(neighbour_id);
                    queue.push({ 'id': neighbour_id, 'depth': current.depth + 1, 'predecessor':current.id });
                }
            }
        }

        // [current.predecessor] is a 'computed property name' and should be the string id of the predecessor
        yield [current.id, { [current.predecessor]:{ 'depth': current.depth }}];
    }
};