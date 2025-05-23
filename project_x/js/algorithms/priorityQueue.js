/**
 * Priority Queue.
 * 
 * Implemented as an array of tuples (removes need for a node object).
 * Note: Enqueued (val, priority) are stored as [priority, val]
 */
export class PriorityQueue {
    constructor() {
        this.values = [];
    }

    /**
     * enqueue
     * @param {string} val - An object/node id as a string e.g. 'v0'.
     * @param {number} priority - A priority e.g. distance
     */
    enqueue(val, priority) {
        // Insert as a tuple [priority, val]
        this.values.push([priority, val]);
        this.bubbleUp();
    }

    bubbleUp() {
        let idx = this.values.length - 1;
        const element = this.values[idx];
        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            let parent = this.values[parentIdx];
            if (element[0] >= parent[0]) break; // Compare priorities
            this.values[parentIdx] = element;
            this.values[idx] = parent;
            idx = parentIdx;
        }
    }

    /**
     * dequeue returns the value (ID etc.) with the lowest priority
     * Note: only the value (e.g. ID) is returned, not the priority
     * @returns {string} - An object/node id as a string e.g. 'v0'.
     */
    dequeue() {
        const min = this.values[0];
        const end = this.values.pop();
        if (this.values.length > 0) {
            this.values[0] = end;
            this.sinkDown();
        }
        return min[1]; // Return only the value, not the priority
    }

    sinkDown() {
        let idx = 0;
        const length = this.values.length;
        const element = this.values[0];
        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swap = null;

            if (leftChildIdx < length) {
                leftChild = this.values[leftChildIdx];
                if (leftChild[0] < element[0]) {
                    swap = leftChildIdx;
                }
            }

            if (rightChildIdx < length) {
                rightChild = this.values[rightChildIdx];
                if (
                    (swap === null && rightChild[0] < element[0]) ||
                    (swap !== null && rightChild[0] < leftChild[0])
                ) {
                    swap = rightChildIdx;
                }
            }

            if (swap === null) break;
            this.values[idx] = this.values[swap];
            this.values[swap] = element;
            idx = swap;
        }
    }

    /**
     * Returns whether the priority queue is empty.
     * @returns {boolean} - True if empty
     */
    isEmpty() {
        return this.values.length === 0;
    }
}