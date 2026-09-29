import {configureStore} from "@reduxjs/toolkit";
import {optionSlice} from "@/redux/slice/optionSlice";

export const store = configureStore({
        reducer: {
            options : optionSlice.reducer
        }
    }
);

export type RootState = ReturnType<typeof store.getState>;