import { getDb } from "@/scripts/sqlite-client"

const query_trip_route_id = 'SELECT t.trip_id, t.shape_id, t.feed_id, direction_id\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  WHERE t.route_id = ?\n' +
    '  GROUP BY t.trip_id\n' +
    '  ORDER BY COUNT(*) DESC\n' +
    '  LIMIT 1;'

const bus_shape = ' SELECT shape_pt_lat, shape_pt_lon\n' +
    '  FROM shapes WHERE shape_id = ?\n' +
    '  ORDER BY shape_pt_sequence;'

const bus_stop = 'SELECT DISTINCT estacion.stop_id AS estacion_id, estacion.stop_name AS estacion_nombre,\n' +
    '         estacion.stop_lat AS estacion_lat, estacion.stop_lon AS estacion_lon,\n' +
    '         boca.stop_id AS boca_id, boca.stop_name AS boca_nombre\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  JOIN stops anden ON anden.stop_id = st.stop_id\n' +
    '  JOIN stops estacion ON estacion.stop_id = COALESCE(anden.parent_station, anden.stop_id)\n' +
    '  LEFT JOIN stops boca ON boca.parent_station = estacion.stop_id AND boca.location_type = 2\n' +
    '  WHERE t.trip_id = ?\n' +
    '  ORDER BY estacion.stop_name, boca.stop_id;'

const bus_frecuency = 'SELECT DISTINCT estacion.stop_id AS estacion_id, estacion.stop_name AS estacion_nombre,\n' +
    '         estacion.stop_lat AS estacion_lat, estacion.stop_lon AS estacion_lon,\n' +
    '         boca.stop_id AS boca_id, boca.stop_name AS boca_nombre\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  JOIN stops anden ON anden.stop_id = st.stop_id\n' +
    '  JOIN stops estacion ON estacion.stop_id = COALESCE(anden.parent_station, anden.stop_id)\n' +
    '  LEFT JOIN stops boca ON boca.parent_station = estacion.stop_id AND boca.location_type = 2\n' +
    '  WHERE t.trip_id = ?\n' +
    '  ORDER BY estacion.stop_name, boca.stop_id;'


const query_trips_por_sentido = 'WITH conteo AS (\n' +
    '  SELECT t.trip_id, t.direction_id, t.shape_id, t.trip_headsign, COUNT(*) AS n_paradas\n' +
    '  FROM trips t JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  WHERE t.route_id = ?\n' +
    '  GROUP BY t.trip_id\n' +
    '),\n' +
    'mejor_por_sentido AS (\n' +
    '  SELECT *, ROW_NUMBER() OVER (PARTITION BY direction_id ORDER BY n_paradas DESC) AS orden\n' +
    '  FROM conteo\n' +
    ')\n' +
    'SELECT direction_id, trip_id, shape_id, trip_headsign\n' +
    'FROM mejor_por_sentido WHERE orden = 1\n' +
    'ORDER BY direction_id;'

export const getBusLinesArg = async  () => {




    const db = await getDb();
    let buses = await db.getAllAsync<{ route_short_name: string }>(`SELECT route_short_name
                    FROM routes
                    WHERE feed_id = 'bus'
                    `);

    const data = ['252A']//buses.map((b) => b.route_short_name);




    const placeholders = data.map(() => "?").join(",");

    const registers = await db.getAllAsync<{ route_id: string; route_short_name: string; color: string; agency_name: string }>(
        `SELECT r.route_id, r.route_short_name, a.agency_name
         FROM routes r
                  LEFT JOIN agency a ON a.agency_id = r.agency_id
         WHERE r.feed_id = 'bus' AND r.route_short_name  in (${placeholders});`, data
    )

    return await wrapBusData(registers);
}


const getBusLineShapeData = async (shape_id: string) => {
    const db = await getDb();
    return await db.getAllAsync(bus_shape, [shape_id]);
}

const getCoordinatesOfBusLineArg = (shapes: {shape_pt_lon:string ,shape_pt_lat:string}[]) => {
    return shapes.map((s: {shape_pt_lon:string; shape_pt_lat:string}) => [s.shape_pt_lon, s.shape_pt_lat]);
}

const getBusStations = async (trip_id: string) => {
    const db = await getDb();
    return await db.getAllAsync(bus_stop, trip_id);

}

const getBusFrecuency = async (trip_id: string) => {
    const db = await getDb();
    return await db.getAllAsync(bus_stop, trip_id);
}



const wrapBusData = async  (registers:{route_id: string; route_short_name: string; color: string; agency_name: string}[]) => {
    const db = await getDb();
    let data = [];

    for(const register of registers){
        const r = await db.getFirstAsync<{trip_id:string, shape_id: string, feed_id:string, direction_id:string}>(query_trip_route_id, register.route_id);

        if (!r) {
            console.warn(`Sin trips/shape para route_id: ${register.route_id}`);
            continue;
        }

        const sentidos = await db.getAllAsync<{ direction_id: number; trip_id: string; shape_id: string; trip_headsign: string }>(
            query_trips_por_sentido, [register.route_id]
        );

        for (const s of sentidos) {
            const shape = await getBusLineShapeData(s.shape_id);
            const coordinate = getCoordinatesOfBusLineArg(shape);
            const stops = await getBusStations(s.trip_id);
            const color = register.color ?? '#999999';
            const frecuency = await getBusFrecuency(r.trip_id);
            const l = register.route_short_name;
            const feed_id = r.feed_id;
            const agency_id = register.agency_name;


            data.push({
                route_id: register.route_id,
                trip_id: s.trip_id,
                direction_id: s.direction_id,
                trip_headsign: s.trip_headsign,
                shape, coordinate, stops, color,
                route_short_name: register?.route_short_name,
                feed_id: feed_id,
                agency_id: agency_id,
                frecuency: frecuency,

            });





        }
        return data;

    }
}







