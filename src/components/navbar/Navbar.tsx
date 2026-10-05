import {FlatList, Text} from 'react-native';
import { Box } from '@/components/ui/box';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/redux/store";
import {TransportData} from "@/interfaces/interfaces";
import {useEffect, useState} from "react";
import {List} from "@expo/ui";
import {removeUnitNamespace} from "@formatjs/ecma402-abstract";
import {getDb} from "@/scripts/sqlite-client";
import {getTransportData} from "@/data/queries/queries";
import {setOptions} from "@/redux/slice/optionSlice";

type TransportGroups = {
    tren: TransportData[];
    subte: TransportData[];
    bus: TransportData[];
};

export const Navbar = () => {

    const [optionsTransports, setOptionsTransports] = useState<TransportGroups>();

    const dispatch = useDispatch();
    useEffect(  ()  => {
        (async () => {
            const db = await getDb();
            const d = await db.getAllAsync<TransportData>(getTransportData);
            dispatch(setOptions(d));
            const o = prepareData(d);
            setOptionsTransports(o);


        }) ();
    }, []);

    if(!optionsTransports ){
        return null;
    }
    return (
        <FlatList
            data={optionsTransports.tren}
            keyExtractor={(item, index:number) => index.toString()}
            renderItem={({ item }) => (
                <>
                    <Box>
                        <Text>{item.linea}</Text>
                        <Text>{item.destino}</Text>
                    </Box>

                </>
            )}
        />

    )
}

const prepareData = (data: TransportData[]) => {
    return data.reduce<TransportGroups>((acc, transport) => {
        acc[transport.tipo].push(transport);
        return acc;
    }, {
        tren: [],
        subte: [],
        bus: [],
    });
}