import {configureStore, createSlice, PayloadAction} from "@reduxjs/toolkit";

interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}
interface OptionState  {
    options: TransportData[],
}


const initialState: OptionState = {
    options:  [],
}

export const optionSlice = createSlice({
    name:'options',
    initialState,
    reducers: {
        setOptions: (state, action: PayloadAction<TransportData[]> ) => {
            state.options.push(...action.payload);

        },
    }
})

export const {
    setOptions,
} = optionSlice.actions;