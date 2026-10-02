import {getDb} from "@/scripts/sqlite-client";
import {useDispatch} from "react-redux";
import {setOptions} from "@/redux/slice/optionSlice";
import { Dispatch, UnknownAction } from "@reduxjs/toolkit";


const getTransportData = 'SELECT r.feed_id AS tipo,\n' +
    '       CASE WHEN r.feed_id = \'bus\' AND CAST(r.route_short_name AS INTEGER) > 0\n' +
    '            THEN CAST(CAST(r.route_short_name AS INTEGER) AS TEXT)\n' +
    '            ELSE r.route_short_name\n' +
    '       END AS linea,\n' +
    '       CASE r.feed_id WHEN \'bus\'  THEN r.route_short_name\n' +
    '                      WHEN \'tren\' THEN r.route_long_name\n' +
    '       END AS ramal,\n' +
    '       r.route_id,\n' +
    '       a.agency_name AS empresa,\n' +
    '       CASE WHEN r.feed_id = \'bus\' THEN\n' +
    '            (SELECT t.trip_headsign FROM trips t\n' +
    '              WHERE t.route_id = r.route_id AND t.direction_id = 0\n' +
    '              LIMIT 1)\n' +
    '       END AS destino\n' +
    'FROM routes r\n' +
    'LEFT JOIN agency a ON a.agency_id = r.agency_id\n' +
    'ORDER BY CASE r.feed_id WHEN \'subte\' THEN 1 WHEN \'tren\' THEN 2 ELSE 3 END,\n' +
    '         CAST(linea AS INTEGER), linea, ramal;'


interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}

export const getTransportFilterData = async (dispatch: any) => {
    const db = await getDb();

    const data  = await db.getAllAsync<TransportData>(getTransportData);
    dispatch(setOptions(data));

}



