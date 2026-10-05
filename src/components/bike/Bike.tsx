import {useEffect, useState} from "react";
import {getEcobiciStation} from "@/data/queries/bike";
import {ShapeSource} from "@rnmapbox/maps";
import {useSelector} from "react-redux";
import {RootState} from "@/redux/store";

interface EcoBiciState {
    station_id: number,
    name: string,
    lat:number,
    long:number,
    capacity?:number | null,
    is_charging_station:boolean,
}

interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}

export const Bike = () => {
    const [bikes, setBikes] = useState<EcoBiciState[]>([]);
    const state: TransportData[] = useSelector((state: RootState) => state.options.options);
    useEffect(() => {
        (async () => {
          const b =  await getEcobiciStation();
          setBikes(b);
         }) ();
    },[])
    if (!bikes) {return null}

    return (
       <></>

    )
}