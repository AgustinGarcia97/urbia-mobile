import {Fragment, useEffect, useMemo, useState} from "react";
import {queriesScript} from "@/data/queries/subways";
import {LineLayer, ModelLayer, Models, ShapeSource, SymbolLayer} from "@rnmapbox/maps";
import type {SymbolLayerStyle} from '@rnmapbox/maps';
import { Image } from 'react-native';
import { Asset } from 'expo-asset';
import {Shape} from "@expo/ui/jetpack-compose";

interface StopProps {
    stops: {
        boca_id: string;
        boca_nombre: string;
        estacion_id: string;
        estacion_nombre: string;
        stop_lat: number; //boca
        stop_lon: number; //boca
        estacion_lat: number;
        estacion_lon:number;
    }[],
    index: number,
    letra?: string
}
const urlDe = (modulo: number) => Image.resolveAssetSource(modulo).uri;

const MODELOS_MODULOS: Record<string, number> = {
    subte_LineaA: require('@/assets/models/3d/ARG_STOP_SUBWAY_LINE_A.glb'),
    subte_LineaB: require('../../../assets/models/3d/ARG_STOP_SUBWAY_LINE_B.glb'),
    subte_LineaC: require('../../../assets/models/3d/ARG_STOP_SUBWAY_LINE_C.glb'),
    subte_LineaD: require('../../../assets/models/3d/ARG_STOP_SUBWAY_LINE_D.glb'),
    subte_LineaE: require('../../../assets/models/3d/ARG_STOP_SUBWAY_LINE_E.glb'),
    subte_LineaH: require('../../../assets/models/3d/ARG_STOP_SUBWAY_LINE_H.glb'),
};

const useModelos = () => {
    const [modelos, setModelos] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        (async () => {
            const entradas = await Promise.all(
                Object.entries(MODELOS_MODULOS).map(async ([id, modulo]) => {
                    const [asset] = await Asset.loadAsync(modulo);
                    return [id, asset.localUri!] as const;
                })
            );
            setModelos(Object.fromEntries(entradas));
        })();
    }, []);

    return modelos;
};


export const Subway = () => {
    const modelos = useModelos();

    return (
        <>
            {modelos && <Models models={modelos} />}
            <Linea/>

        </>
    )
}



const Linea = () => {
    const [lines, setLines] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const route = await queriesScript();
            setLines(route);
        })();
    }, []);

    if (!lines) return null;
    return (
        <>
            {lines.map((line: {
                    shape: { shape_pt_lat: number; shape_pt_lon: number; }[];
                    color: any;
                    stop: StopProps['stops'],
                route_id: string;
                }, i: any,) => {
                    return (
                        <Fragment key={line.route_id}>
                            <ShapeSource id={`linea-${i}`} shape={aFeatureLinea(line.shape)}>
                                <LineLayer id={`linea-trazo-${i}`} style={{ lineColor: line.color, lineWidth: 6, lineEmissiveStrength: 1 }} />
                            </ShapeSource>
                            <Stop stops={line.stop} index={i} letra={line.route_id} />

                        </Fragment>
                    );
                }
            )
            }
        </>
    )
}

const Stop = ({ stops, index, letra }: StopProps) => {
    const shape = useMemo(() => aFeatureCollectionStops(stops), [stops]);
    const modeloId = letra && MODELOS_MODULOS[letra] ? letra : undefined;

    return (
        <>
            <ShapeSource id={`subway-stop-${index}`} shape={shape}>
                <ModelLayer
                    id={`subway-stop-3d-${index}`}
                    slot="top"
                    style={{
                        modelId: modeloId ?? '',
                        modelType: 'common-3d',
                        modelScale: [5, 5, 5],
                        visibility: modeloId ? 'visible' : 'none',
                    }}
                />
                <SymbolLayer
                    id={`subway-stop-label-${index}`}
                    slot="top"
                    style={{ textField: ['get', 'nombre'], textSize: 11, textOffset: [0, 1.4], textHaloColor: '#ffffff', textHaloWidth: 1.2 }}
                />
            </ShapeSource>
        </>

    );
};

const Station = ({ stops, index, letra }: StopProps) => {
    const shape = useMemo(() => aFeatureStation(stops), [stops]);
    return (
        <ShapeSource id={`${index}`} shape={shape}>

        </ShapeSource>
    )
}

function aFeatureCollectionStops(stops:StopProps["stops"]) {
    return {
        type: "FeatureCollection" as const,
        features: stops.map(p => ({
            type: "Feature" as const,
            properties: {
                nombre: p.boca_nombre
            },
            geometry:{
                type:'Point' as const,
                coordinates: [p.stop_lon, p.stop_lat]
            }
        }))
    }
}

function aFeatureLinea(puntos: { shape_pt_lat: number; shape_pt_lon: number }[]) {
    return {
        type: 'Feature' as const,
        properties: {},
        geometry: {
            type: 'LineString' as const,
            coordinates: puntos.map(p => [p.shape_pt_lon, p.shape_pt_lat]), // ojo el orden: lon primero
        },
    };
}

function aFeatureStation(stops: StopProps["stops"]) {
    // Las filas vienen una por boca: me quedo con una por estación
    const porEstacion = new Map<string, StopProps["stops"][number]>();
    for (const s of stops) {
        if (!porEstacion.has(s.estacion_id)) porEstacion.set(s.estacion_id, s);
    }

    return {
        type: "FeatureCollection" as const,
        features: [...porEstacion.values()].map(s => ({
            type: "Feature" as const,
            properties: { nombre: s.estacion_nombre },
            geometry: { type: "Point" as const, coordinates: [s.estacion_lon, s.estacion_lat] },
        })),
    };
}


