/**
 * @fileoverview Asynchronous generators of a grid of linked points.
 */

import { Vector3 } from 'three';

/**
 * Dijkstra's algorithm, generator with depth limit
 * 
 * Nodes may be yielded repeatedly if their shortest path changes.
 * 
 * @param {number} rows - The number of rows of points to generate.
 * @param {number} columns - The number of columns of points to generate.
 * @param {number} distance - The distance between points.
 * @param {number} [delay=10] - Delay between iterations (ms).
 * @yields {array} - An x,y,z coordinate array such as [53,0,23] (y is up)
 */
export async function* agGrid(rows, columns, distance, delay=10) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {

            yield new Vector3( j*distance, 0, i*distance );

            // Optional: Add a small delay if needed
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Asynchronous generator that links together a grid of points.
 * 
 * This needs to run after the asynchronous generator of the grid of points
 * has completed. To make sure this is the case, collect the results of the
 * first generator into an array and then pass that array into this function.
 * 
 * Nodes may be yielded repeatedly if their shortest path changes.
 * 
 * @param {number} rows - The number points to be linked in each row.
 * @param {number} columns - The number points to be linked in each column.
 * @param {array} vertexIDs - An array containing the IDs of the vertices to link together.
 * @param {number} [delay=10] - Delay between iterations (ms).
 * @yields {array} - An array of indices to link together e.g. [0,1]
 */
export async function* agGridLinks(rows, columns, vertexIDs, delay=10) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const currentIndex = i * columns + j;

            // Right neighbor link
            if (j < columns - 1) {
                yield [ vertexIDs[currentIndex], vertexIDs[currentIndex + 1] ];
                // Optional: Yield control to the event loop if needed
                await new Promise(resolve => resolve());
            }

            // Bottom neighbor link
            if (i < rows - 1) {
                yield [ vertexIDs[currentIndex], vertexIDs[currentIndex + columns] ];
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}