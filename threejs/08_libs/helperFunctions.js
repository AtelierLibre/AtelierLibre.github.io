import { Vector3 } from 'three';

/**
 * Basic hash of two coordinates
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @returns {string} - Hash of x,y
 */
export function hashCoordinates(x, y) {
    var hash = `${x},${y}`;
    return hash;
};

/**
 * Converts radians to degrees
 * @param {number} radians
 * @returns {number} - degrees
 */
function radToDeg(radians) {
    let degrees = radians * (180 / Math.PI);
    return degrees;
};

/**
 * Calculate the signed change in bearing, turning from bearing 1 to bearing 2.
 * 
 * Returns 0 if the difference between the bearings is below the defined threshold.
 * This is because a difference of exactly 180° could equally be CW or CCW.
 * 
 * Just setting it to zero doesn't solve the problem. In the case of a CW outer boundary
 * with projections, this  counts the negative turn into the projection and the negative
 * turn out of the projection but doesn't offset them with a positive 180° turn at the end of the
 * projection, leading to a total bearing change that is negative, implying that the boundary
 * is CCW rather than CW.
 * @param {number} b1 - bearing 1
 * @param {number} b2 - bearing 2
 * @param {number} tolerance - minimum difference required to calculate CW or CCW
 * @return {number} - signed change in bearing from b1 to b2
 */
export function signedBearingChange(b1, b2, tolerance = 0.001) {
    let delta = b2 - b1;

    if (delta > 180) {
        delta -= 360;
    } else if (delta < -180) {
        delta += 360;
    }

    if ((180 - Math.abs(delta)) < tolerance) {
        console.warn('Bearing difference below tolerance. Returning 0');
        return 0;
    } else {
        return delta;
    }
};

/**
 * Calculates the change in bearing when moving from A to C via B.
 * 2D calculation (x & z) from a 3D vector, where y is up.
 * @param {*} A - 3D vector (v.x, v.y, v.z)
 * @param {*} B - 3D vector (v.x, v.y, v.z)
 * @param {*} C - 3D vector (v.x, v.y, v.z)
 * @returns {number} - Change in bearing in degrees
 */
export function calculateBearingChange2D(A, B, C) {
    // Calculate the directions
    let directionAB = Math.atan2(B.x - A.x, B.z - A.z);
    let directionBC = Math.atan2(C.x - B.x, C.z - B.z);

    // Calculate the deviation from forward motion
    let deviation = directionBC - directionAB;

    // Normalize the deviation to the range [-pi, pi]
    deviation = (deviation + Math.PI) % (2 * Math.PI) - Math.PI;

    // If the deviation is less than -pi, add it to 2*pi to get the smaller angle on the opposite side of the circle
    if (deviation < -Math.PI) {
        deviation = 2 * Math.PI + deviation;
    }

    // Absolute deviation
    deviation = Math.abs(deviation);

    // Convert to degrees
    let deviationDegrees = radToDeg(deviation);

    return deviationDegrees;
};

/**
 * Calculate the compass bearing (radians) from one x,z position to another
 * @param {*} v1 
 * @param {*} v2 
 * @returns 
 */
export function v1Bearingv2(v1, v2) {
    const dx = v2.x - v1.x;
    const dz = v2.z - v1.z;

    let bearing = Math.atan2(dz, dx);
    bearing = bearing * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
};

export function isClockwise(points) {
    //Assumes polygon is simple (no intersections or holes)
    //Last point should not be the same as the first point
    //Polygon should have at least three points
    let sum = 0;

    for (let i = 0; i < points.length - 1; i++) {
        let cur = points[i],
            next = points[i + 1];
        sum += (next[0] - cur[0]) * (next[1] + cur[1]);
    }

    return sum > 0;
};

export function isFirstPointEqualToLast(points) {
    let firstPoint = points[0];
    let lastPoint = points[points.length - 1];
    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
}

/**
 * 
 * @param {Vector3} v1 
 * @param {Vector3} v2 
 * @returns 
 */
export function calculateSignedArea(v1, v2) {
    return (v1.x * (-v2.z) - v2.x * (-v1.z)) / 2;
}