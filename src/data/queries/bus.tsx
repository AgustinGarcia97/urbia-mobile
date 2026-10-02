import { getDb } from "@/scripts/sqlite-client"

const query_trip_route_id = 'SELECT t.trip_id, t.shape_id\n' +
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





const wrapBusData = async  (registers:{route_id:string,color:string}[]) => {
    const db = await getDb();
    let data = [];

    for(const register of registers){
        const r = await db.getFirstAsync<{trip_id:string, shape_id: string}>(query_trip_route_id, register.route_id);

        if (!r) {
            console.warn(`Sin trips/shape para route_id: ${register.route_id}`);
            continue;
        }

        const route_id = register.route_id;
        const trip_id = r.trip_id;
        const shape = await getBusLineShapeData(r.shape_id);
        const coordinate = getCoordinatesOfBusLineArg(shape);
        const stops = await getBusStations(r.trip_id);
        const color = '#d001ff';
        const frecuency = await getBusFrecuency(r.trip_id);

        data.push({route_id, trip_id, shape, coordinate, stops, color, frecuency});



    }
    return data;


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


export const getBusLinesArg = async  () => {

    const buses: string[] = [
        "bus_100",
        "bus_101",
        "bus_102",
        "bus_103",
        "bus_1036",
        "bus_1037",
        "bus_1038",
        "bus_1039",
        "bus_104",
        "bus_1040",
        "bus_1042",
        "bus_1043",
        "bus_1044",
        "bus_105",
        "bus_1050",
        "bus_106",
        "bus_1063",
        "bus_107",
        "bus_108",
        "bus_1087",
        "bus_1088",
        "bus_1089",
        "bus_109",
        "bus_1090",
        "bus_1091",
        "bus_1107",
        "bus_111",
        "bus_1111",
        "bus_1114",
        "bus_1115",

    ];
    const db = await getDb();
    const placeholders = buses.map(() => "?").join(",");

    const registers = await db.getAllAsync<{route_id:string, color:string}>(
        `SELECT route_id  FROM routes WHERE route_id IN (${placeholders})`, buses
    )

    return await wrapBusData(registers);
}