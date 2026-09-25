import {getDb} from "@/scripts/sqlite-client";

export const getSubwaysLinesArg = async () => {
    const db = await getDb();

    return await db.getAllAsync<{ route_id: string }>(
        `SELECT route_id
         FROM routes
         WHERE feed_id = 'subte'
         ORDER BY route_short_name`
    );
}

export const getRouteBySubwayLineArg = async (lines: { route_id: string }[]) => {
    const db = await getDb();
    const route = [];

    for (const line of lines) {
        let register = await db.getFirstAsync<{ trip_id: string; shape_id: string }>(
            `SELECT trip_id, shape_id FROM trips WHERE route_id = ? LIMIT 1`, [line.route_id]
        );
        if (register) {
            const shape = await getShapeBySubwayRouteArg(register);
            const coordinates = await getCoordinatesOfSubwayLineArg(shape);
            route.push({register,shape,coordinates});
        }
    }
    return route;
}

export const getShapeBySubwayRouteArg  = async  (trip: {shape_id:string}) => {
    const db = await getDb();
    let shape;
    let register = await db.getAllAsync(
        `SELECT shape_pt_lat, shape_pt_lon from shapes WHERE shape_id = ? ORDER BY shape_pt_sequence`, [trip.shape_id],
        );

       if(register) {
           shape = register;
       }
    return shape;
    }

export const getCoordinatesOfSubwayLineArg = async  (shapes) => {
    return shapes.map((p: { shape_pt_lon: any; shape_pt_lat: any; }) => [p.shape_pt_lon, p.shape_pt_lat]);
}

export const queriesScript = async () => {
    const lines = await getSubwaysLinesArg();
    const routes = await getRouteBySubwayLineArg(lines);


    return routes[0];

}



