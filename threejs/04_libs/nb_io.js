/**
 * This function takes in a GeoJSON and returns an array of JSTS LineStrings.
 * @param {*} geoJSONfile 
 * @returns 
 */
export async function readGeoJSON_LineStringArray (geoJSONfile) {
    const reader = new jsts.io.GeoJSONReader();
    const t_ = fetch('..\\00_Libraries\\test.geojson')
      .then(response => response.json())
      .then(data => data.features);
    const res = await t_;
    return res.map((x) => reader.read(x.geometry));
};

/**
 * This function generates an array of JSTS LineStrings.
 */
export function generate_LineStringArray() {
    // Create pairs of JSTS coordinates for line ends
    const coordinatePairs = [];
    for (let i=0; i < 9; i++) {
      // Horizontal LineString Coordinates
      const h00 = new jsts.geom.Coordinate(-500, i*100-400);
      const h01 = new jsts.geom.Coordinate(500, i*100-400);
      coordinatePairs.push([h00, h01]);
      // Vertical LineString Coordinates
      const v00 = new jsts.geom.Coordinate(i*100-400, 0-500);
      const v01 = new jsts.geom.Coordinate(i*100-400, 1000-500);
      coordinatePairs.push([v00, v01]);
    };

    // Create JSTS linestrings from the coordinate pairs
    const array_LineStrings_ = []
    const lengthCoordinatePairs = coordinatePairs.length;
    for ( let i=0; i<lengthCoordinatePairs; i++) {
      // Create LineString
      const geometryFactory = new jsts.geom.GeometryFactory();
      const linestring = geometryFactory.createLineString(coordinatePairs[i]);
      linestring.setUserData({ street_id : i });
      array_LineStrings_.push( linestring ); // duplicate it into an array
    };

    return array_LineStrings_;
};