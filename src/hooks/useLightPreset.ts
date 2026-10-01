import {useEffect, useState} from "react";

export type LightPreset = "dawn" | "day" | "dusk" | "night" | undefined;

const getLightPreset = (date: Date): LightPreset => {
    const h = date.getHours();
    if (h >= 20 || h < 6) return "night";
    if (h < 8) return "dawn";
    if (h < 17) return "day";
    return "dusk";
};

export const useLightPreset = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    return getLightPreset(time);
};
