import {getDb} from "@/scripts/sqlite-client";
import {useDispatch} from "react-redux";
import {setOptions} from "expo-splash-screen";


export const getSubwaysLinesArg = async () => {
    const db = await getDb();
    return await db.getAllAsync<{ route_id: string; route_color: string }>(
        `SELECT route_id, route_color
         FROM routes
         WHERE feed_id = 'subte'
         ORDER BY route_short_name`
    );
}

export const getRouteBySubwayLineArg = async (lines: { route_id: string; route_color: string }[]) => {
    const db = await getDb();
    const route = [];
    let color = ""

    for (const line of lines) {
        let register = await db.getFirstAsync<{ trip_id: string; shape_id: string; route_color: string;feed_id :string  }>
        (`SELECT trip_id, shape_id, feed_id FROM trips WHERE route_id = ? LIMIT 1`, [line.route_id]);

        const linea = await db.getFirstAsync<{ route_short_name: string }>(
            `SELECT route_short_name FROM routes WHERE route_id = ?`,
            [line.route_id]
        );

        if (register) {
            if(line.route_id === "subte_LineaA"){
                color = '#0098BD'
            } else if(line.route_id === "subte_LineaB"){
                color = '#E32740'
            } else if(line.route_id === "subte_LineaC"){
                color ='#013D93'
            } else if(line.route_id === "subte_LineaD"){
                color = '#01725C'
            } else if(line.route_id === "subte_LineaE"){
                color = '#751E7C'
            } else if(line.route_id === "subte_LineaH"){
                color = '#F3C800'
            } else if(line.route_id === "subte_PM-Civico"){
                color = '#FE9901'
            } else if(line.route_id === "subte_PM-Savio"){
                color = '#FE9901'
            }
            const stop = await getStopsBySubwayLineArg(line.route_id);
            const shape = await getShapeBySubwayRouteArg(register);
            const coordinates = await getCoordinatesOfSubwayLineArg(shape);
            const route_id = line.route_id;
            const feed_id = register.feed_id;
            const l = linea?.route_short_name;

            route.push({register,shape,coordinates,color,stop,route_id, feed_id, l});
        }
    }
    return route;
}

export const getShapeBySubwayRouteArg  = async  (trip: {shape_id:string}) => {
    const db = await getDb();
    let shape;

    let register = await db.getAllAsync
    (`SELECT shape_pt_lat, shape_pt_lon from shapes WHERE shape_id = ? ORDER BY shape_pt_sequence`, [trip.shape_id],);

    if(register) {shape = register;}

    return shape;
    }

export const getCoordinatesOfSubwayLineArg = async  (shapes) => {
    return shapes.map((p: { shape_pt_lon: any; shape_pt_lat: any; }) => [p.shape_pt_lon, p.shape_pt_lat]);
}

export const getStopsBySubwayLineArg = async  (subway_line:string) => {
    const db = await getDb();

    let response = await db.getAllAsync(
        `SELECT DISTINCT estacion.stop_id AS estacion_id, estacion.stop_name AS estacion_nombre,
                           estacion.stop_lat AS estacion_lat, estacion.stop_lon AS estacion_lon,
                           boca.stop_id AS boca_id, boca.stop_name AS boca_nombre, boca.stop_lat, boca.stop_lon
           FROM trips t
                    JOIN stop_times st ON st.trip_id = t.trip_id
                    JOIN stops anden ON anden.stop_id = st.stop_id
                    JOIN stops estacion ON estacion.stop_id = anden.parent_station
                    LEFT JOIN stops boca ON boca.parent_station = estacion.stop_id AND boca.location_type = 2
           WHERE t.trip_id = (SELECT trip_id FROM trips WHERE route_id = ? LIMIT 1)
           ORDER BY estacion.stop_name, boca.stop_id;
        `, [subway_line]);

    if(response){
        return response;
    }
    return null;
}

//obtener subte por x cantidad de lineas.
export const getRouteByOneSubwayLineArg = async  (lineas:string[]) => {
    const db = await getDb();
    const placeholders = lineas.map(() => "?").join(",");

    const registers = await db.getAllAsync<{ route_id: string; route_color: string }>
    (`SELECT route_id, route_color FROM routes WHERE route_id IN (${placeholders})`,lineas);
    if(registers) {
        return getRouteBySubwayLineArg(registers);
    }
}

export const queriesScript = async () => {

    return await getRouteByOneSubwayLineArg(["subte_LineaA","subte_LineaD","subte_LineaC","subte_LineaB","subte_LineaH","subte_LineaE"]);


}



