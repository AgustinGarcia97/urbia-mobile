import {getDb} from "@/scripts/sqlite-client";

//Query 2 - trip de route_id
const query = 'SELECT t.trip_id, t.shape_id\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  WHERE t.route_id = ?\n' +
    '  GROUP BY t.trip_id\n' +
    '  ORDER BY COUNT(*) DESC\n' +
    '  LIMIT 1;'

const getShape = ' SELECT shape_pt_lat, shape_pt_lon\n' +
    '  FROM shapes WHERE shape_id = ?\n' +
    '  ORDER BY shape_pt_sequence;'

const getStations ='  SELECT DISTINCT estacion.stop_id   AS estacion_id,\n' +
    '                  estacion.stop_name AS estacion_nombre,\n' +
    '                  estacion.stop_lat  AS estacion_lat,\n' +
    '                  estacion.stop_lon  AS estacion_lon\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  JOIN stops anden ON anden.stop_id = st.stop_id\n' +
    '  JOIN stops estacion ON estacion.stop_id = COALESCE(anden.parent_station, anden.stop_id)\n' +
    '  WHERE t.route_id = ?\n' +
    '  ORDER BY estacion.stop_name;\n'

const getTimeLine = '  SELECT t.trip_id, t.service_id, t.trip_headsign, MIN(st.arrival_time) AS hora_salida\n' +
    '  FROM trips t\n' +
    '  JOIN stop_times st ON st.trip_id = t.trip_id\n' +
    '  WHERE t.route_id = ?\n' +
    '  GROUP BY t.trip_id, t.service_id, t.trip_headsign\n' +
    '  ORDER BY t.service_id, hora_salida;'


const wrapTrainData = async (registers: {route_id:string , route_color: string}[]) => {
    const db = await getDb();
    let data = [];
    for (const register of registers) {

        const r = await db.getFirstAsync<{ trip_id: string; shape_id: string }>(query, [register.route_id]);
        if (!r) {
            console.warn(`Sin trips/shape para route_id: ${register.route_id}`);
            continue;
        }

        const route_id = register.route_id;
        const shape = await getTrainLineShapeData(r.shape_id);
        const coordinates = await getCoordinatesOfTrainLineArg(shape);
        const stops = await getTrainStations(route_id);
        const color = `#${register.route_color}`;
        const timeline = await getTimelineTrain(route_id);

        data.push({r,shape,coordinates,color,route_id, stops,timeline});
    }

    return data;
}

const getTrainLineShapeData = async (shape_id:string) => {
    const db = await getDb();
    return await db.getAllAsync(getShape,[shape_id]);
}

const getCoordinatesOfTrainLineArg =   (shapes :{shape_pt_lon:string ,shape_pt_lat:string}[]) => {
    return shapes.map((p: { shape_pt_lon: string ; shape_pt_lat: string; }) => [p.shape_pt_lon, p.shape_pt_lat]);
}

const getTrainStations = async (trip_id: string) => {
    const db = await getDb();
    return await db.getAllAsync(getStations,[trip_id]);
}

const getTimelineTrain = async (route_id:string)  => {
    const db = await getDb();
    return await db.getAllAsync(getTimeLine,[route_id]);

}

export const getRouteByOneTrainLineArg = async  (lineas:string[], dispatch) => {
    const db = await getDb();
    const placeholders = lineas.map(() => "?").join(",");

    const registers = await db.getAllAsync<{ route_id: string; route_color: string }>
    (`SELECT route_id, route_color FROM routes WHERE route_id IN (${placeholders})`,lineas);

        return await wrapTrainData(registers);
    }

