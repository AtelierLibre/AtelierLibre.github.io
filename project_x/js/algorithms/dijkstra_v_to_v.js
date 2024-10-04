// start = starting node, end = target node
function dijkstra_v_to_v(start, end) {
    const queue = new PriorityQueue();
    const distances = {};
    const previous = {};

    // Set initial state
    for (let vertex in this.vertices) {
        if (vertex === start) {
            distances[vertex] = 0;
            queue.enqueue(vertex, 0);
        } else {
            distances[vertex] = Infinity;
            queue.enqueue(vertex, Infinity);
        }
        previous[vertex] = null;
    }

    // As long as there is something to visit
    while (queue.values.length) {
        let smallest = queue.dequeue().val;
        if (smallest === end) {
            // We are done and need to build up the path
            let path = [];
            while (previous[smallest]) {
                path.push(smallest);
                smallest = previous[smallest];
            }
            path.push(smallest);
            return path.reverse();
        }

        if (smallest || distances[smallest] !== Infinity) {
            for (let neighbor in this.vertices[smallest]) {
                let nextNode = this.vertices[smallest][neighbor];
                let candidate = distances[smallest] + nextNode.weight;
                let nextNeighbor = nextNode.node;
                if (candidate < distances[nextNeighbor]) {
                    distances[nextNeighbor] = candidate;
                    previous[nextNeighbor] = smallest;
                    queue.enqueue(nextNeighbor, candidate);
                }
            }
        }
    }
};