import {getDb} from "@/scripts/sqlite-client";
import {useDispatch} from "react-redux";
import {setOptions} from "@/redux/slice/optionSlice";
import { Dispatch, UnknownAction } from "@reduxjs/toolkit";




interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}

