import {Fragment, useEffect, useMemo, useState} from "react";
import {Images, LineLayer, ModelLayer, Models, ShapeSource, SymbolLayer} from "@rnmapbox/maps";
import {getRouteByOneTrainLineArg} from "@/data/queries/trains";
import {useDispatch, useSelector} from "react-redux";
import {Asset} from 'expo-asset';
import {FeatureCollection} from "geojson";
import {setOptions} from "@/redux/slice/optionSlice";

interface StopProps {
    stops: {
        boca_id: string;
        boca_nombre: string;
        estacion_id: string;
        estacion_nombre: string;
        stop_lat: number; //boca
        stop_lon: number; //boca
        estacion_lat: number;
        estacion_lon: number;
    }[],
    index: number,
    letra?: string,
    shape?: {
        boca_id: string;
        boca_nombre: string;
        estacion_id: string;
        estacion_nombre: string;
        stop_lat: number;
        stop_lon: number;
        estacion_lat: number;
        estacion_lon: number
    }[]
}


interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}

const TRAIN_MODELS: Record<string, number> = {
        '0': require('@/assets/models/3d/train/Plataforma-Anden-ARG-1-split.glb'),
        '1': require('@/assets/models/3d/train/Plataforma-Anden-ARG-2-split.glb'),
};

const useModelos = () => {
    const [modelos, setModelos] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        (async () => {
            const entradas = await Promise.all(
                Object.entries(TRAIN_MODELS).map(async ([id, modulo]) => {
                    const [asset] = await Asset.loadAsync(modulo);
                    return [id, asset.localUri!] as const;
                })
            );
            setModelos(Object.fromEntries(entradas));
        })();
    }, []);

    return modelos;
};

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


const EARTH_RADIUS_M = 6371000;
const PLATFORM_OFFSET_METERS = 10;

type LatLon = { lat: number; lon: number };
type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function haversineDistance(a: LatLon, b: LatLon) {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function bearingBetween(a: LatLon, b: LatLon) {
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLon = toRad(b.lon - a.lon);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function destinationPoint(origin: LatLon, bearingDeg: number, distanceMeters: number): LatLon {
    const delta = distanceMeters / EARTH_RADIUS_M;
    const theta = toRad(bearingDeg);
    const phi1 = toRad(origin.lat);
    const lambda1 = toRad(origin.lon);

    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
    const lambda2 =
        lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));

    return {lat: toDeg(phi2), lon: toDeg(lambda2)};
}


function nearestTrackBearing(station: LatLon, trackShape: ShapePoint[]): number {
    if (trackShape.length < 2) return 0;

    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < trackShape.length; i++) {
        const p = {lat: trackShape[i].shape_pt_lat, lon: trackShape[i].shape_pt_lon};
        const d = haversineDistance(station, p);
        if (d < closestDist) {
            closestDist = d;
            closestIdx = i;
        }
    }

    const a = trackShape[Math.max(0, closestIdx - 1)];
    const b = trackShape[Math.min(trackShape.length - 1, closestIdx + 1)];
    return bearingBetween({lat: a.shape_pt_lat, lon: a.shape_pt_lon}, {lat: b.shape_pt_lat, lon: b.shape_pt_lon});
}


type Platform = LatLon & { heading: number };

function platformPointsForStation(station: LatLon, trackShape: ShapePoint[]): [Platform, Platform] {
    const bearing = nearestTrackBearing(station, trackShape);
    const dirA = (bearing + 90) % 360;
    const dirB = (bearing - 90 + 360) % 360;

    const andenA = destinationPoint(station, dirA, PLATFORM_OFFSET_METERS);
    const andenB = destinationPoint(station, dirB, PLATFORM_OFFSET_METERS);

    return [
        {...andenA, heading: (dirB + 180) % 360},
        {...andenB, heading: (dirA + 180) % 360},
    ];
}

export function aFeatureCollectionStops(stops: StopProps["stops"], trackShape: ShapePoint[]) {
    return {
        type: "FeatureCollection" as const,
        features: stops.flatMap(p => {
            const station = {lat: p.estacion_lat, lon: p.estacion_lon};
            const andenes = platformPointsForStation(station, trackShape);
            return andenes.map((anden, direction) => ({
                type: "Feature" as const,
                properties: {
                    nombre: p.estacion_nombre,
                    modelId: String(direction),
                    heading: [0, 0, anden.heading],
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [anden.lon, anden.lat],
                },
            }));
        }),
    };
}

type Bounds = [[number, number], [number, number]]; // [[rightLon, topLat], [leftLon, bottomLat]]
const BOUNDS_PADDING_DEG = 0.05; // margen extra, ajustable

function isWithinBounds(lat: number, lon: number, bounds: Bounds | null): boolean {
    if (!bounds) return true; // todavía no hay bounds (primer render) → no filtramos
    const [[rightLon, topLat], [leftLon, bottomLat]] = bounds;
    return lon >= leftLon - BOUNDS_PADDING_DEG && lon <= rightLon + BOUNDS_PADDING_DEG
        && lat >= bottomLat - BOUNDS_PADDING_DEG && lat <= topLat + BOUNDS_PADDING_DEG;
}



export const Train = ({visibleBounds, features}: {
    visibleBounds: Bounds | null,
    features?: Promise<FeatureCollection | undefined>
}) => {
    const [lines, setLines] = useState<any>(null);
    const modelos = useModelos();
    const dispatch = useDispatch();
    const trenes = [
        'tren_BNO_BELGRANO_NORTE',
        'tren_BSU_CATAN_LOZANO',
        'tren_BSU_SAENZ_CATAN_MARINOS',
        'tren_MIT_MITRE_TIGRE',
        'tren_MIT_MITRE_ZARATE',
        'tren_MIT_MITRE_CAPILLA',
        'tren_MIT_MITRE_SUAREZ',
        'tren_ROC_BOSQUES_T',
        'tren_ROC_HAEDO',
        'tren_ROC_UNIVERSITARIO',
        'tren_ROC_MONTE_LARGO',
        'tren_ROC_MONTE',
        'tren_ROC_CHASCOMUS',
        'tren_ROC_LA_PLATA',
        'tren_ROC_KORN',
        'tren_ROC_EZEIZA',
        'tren_ROC_CANUELAS',
        'tren_ROC_BOSQUES_Q',
        'tren_ROC_GUTIERREZ',
        'tren_SMA_RETIRO_CABRED',
        'tren_SAR_MERLO_LASHERAS',
        'tren_SAR_MORENO_MERCEDES',
        'tren_SAR_ONCE_MORENO',
        'tren_TDC_MAIPU_DELTA',
        'tren_URQ_URQUIZA',
        'tren_MIT_MITRE_BME'
    ];


    useEffect(() => {
        (async () => {
            const route = await getRouteByOneTrainLineArg(trenes, dispatch);
            setLines(route);



        })();
    }, []);



    const dedupedStopsByLine = useMemo(() => {
        if (!lines) return [];
        const vistas = new Set<string>();
        return lines.map((line: { stops: StopProps['stops'] }) =>
            line.stops.filter(s => {
                if (vistas.has(s.estacion_id)) return false;
                vistas.add(s.estacion_id);
                return true;
            })
        );
    }, [lines]);

    if (!lines) return null;

    return (
        <>
            <Images  images={{
                'pin-tren': require('@/assets/images/pin-tren-arg.png'),
            }} />
            {modelos && <Models models={modelos}/>}
            {lines.map((line: {
                shape: { shape_pt_lat: number; shape_pt_lon: number }[];
                route_id: string;
                color: any;
                stops: StopProps['stops']
            }, i: any) => {
                const visibleStops = dedupedStopsByLine[i].filter(s => isWithinBounds(s.estacion_lat, s.estacion_lon, visibleBounds));
                return (
                    <Fragment key={line.route_id}>
                        <ShapeSource id={`tren-${line.route_id}`} shape={aFeatureLinea(line.shape)}>
                            <LineLayer id={`tren-trazo-${line.route_id}`}
                                       style={{lineColor: line.color, lineWidth: 6, lineEmissiveStrength: 1}}/>
                        </ShapeSource>
                        <Stop stops={visibleStops} index={i} trackShape={line.shape}/>
                        <Station index={i}  stops={visibleStops}/>
                    </Fragment>
                )
            })}
        </>
    );
}

const Stop = ({stops, index, trackShape}: StopProps & { trackShape: ShapePoint[] }) => {
    const shape = useMemo(() => aFeatureCollectionStops(stops, trackShape), [stops, trackShape]);

    return (
        <>
            <ShapeSource id={`train-stop-${index}`} shape={shape}>
                <ModelLayer
                    minZoomLevel={16}
                    id={`train-stop-3d-${index}`}
                    slot="top"
                    style={{
                        modelId: ['get', 'modelId'],
                        modelRotation: ['get', 'heading'],
                        modelType: 'common-3d',
                        modelScale: [20, 20, 20],
                        visibility: 'visible',
                        modelEmissiveStrength: 1
                    }}
                />
                <SymbolLayer
                    id={`train-stop-label-${index}`}
                    slot="top"
                    style={{
                        textField: ['get', 'nombre'],
                        textSize: 11,
                        textOffset: [0, 1.4],
                        textHaloColor: '#ffffff',
                        textHaloWidth: 1.2
                    }}
                />
            </ShapeSource>
        </>
    );
};

const aFeatureCollectionStations = (stops: StopProps["stops"]) => {
    return {
        type: 'FeatureCollection' as const,
        features: stops.map(p => ({
            type: "Feature" as const,
            properties: {
                nombre: p.estacion_nombre,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [p.estacion_lon, p.estacion_lat],
            }
        }))
    }
}

const Station = ({stops, index}: StopProps) => {
    const shape = useMemo(() => aFeatureCollectionStations(stops), [stops]);
    return (
        <ShapeSource shape={shape} id={`${index}`}>
            <SymbolLayer
                maxZoomLevel={16}
                id={`${index}`}
                style={{
                    textField: ['get', 'nombre'],
                    textSize: 11,
                    textOffset: [0, 1.4],
                    iconImage: 'pin-tren',
                    iconSize: 0.03
                }}/>
        </ShapeSource>
    )
}