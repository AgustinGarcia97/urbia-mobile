import {Fragment, useEffect, useMemo, useState} from "react";
import {getRouteByOneTrainLineArg} from "@/data/queries/trains";
import {getBusLinesArg} from "@/data/queries/bus";
import {Images, LineLayer, ModelLayer, Models, ShapeSource, SymbolLayer} from "@rnmapbox/maps";
import {Asset} from "expo-asset";
import {useDispatch} from "react-redux";
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


const EARTH_RADIUS_M = 6371000;
const BUS_STOP_OFFSET_METERS =-5; // separación respecto al eje de la calle, ajustar según ancho de vereda


const BUS_MODELS = {
    'bus': require('@/assets/models/3d/bus/outdated_soviet_bus_stop.glb')
};


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

function nearestTrackBearing(stop: LatLon, routeShape: ShapePoint[]): number {
    if (routeShape.length < 2) return 0;

    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < routeShape.length; i++) {
        const p = {lat: routeShape[i].shape_pt_lat, lon: routeShape[i].shape_pt_lon};
        const d = haversineDistance(stop, p);
        if (d < closestDist) {
            closestDist = d;
            closestIdx = i;
        }
    }

    const a = routeShape[Math.max(0, closestIdx - 1)];
    const b = routeShape[Math.min(routeShape.length - 1, closestIdx + 1)];
    return bearingBetween({lat: a.shape_pt_lat, lon: a.shape_pt_lon}, {lat: b.shape_pt_lat, lon: b.shape_pt_lon});
}

type Parada = LatLon & { heading: number };

function paradaPointForStop(stop: LatLon, routeShape: ShapePoint[], lado: 1 | -1 = 1): Parada {
    const bearing = nearestTrackBearing(stop, routeShape);
    const direccion = (bearing + 90 * lado + 360) % 360;
    const punto = destinationPoint(stop, direccion, BUS_STOP_OFFSET_METERS);
    return {...punto, heading: (direccion + 180) % 360};
}

type Bounds = [[number, number], [number, number]]; // [[rightLon, topLat], [leftLon, bottomLat]]
const BOUNDS_PADDING_DEG = 0.05; // margen extra, ajustable

function isWithinBounds(lat: number, lon: number, bounds: Bounds | null): boolean {
    if (!bounds) return true; // todavía no hay bounds (primer render) → no filtramos
    const [[rightLon, topLat], [leftLon, bottomLat]] = bounds;
    return lon >= leftLon - BOUNDS_PADDING_DEG && lon <= rightLon + BOUNDS_PADDING_DEG
        && lat >= bottomLat - BOUNDS_PADDING_DEG && lat <= topLat + BOUNDS_PADDING_DEG;
}

const useModelos = () => {
    const [modelos, setModelos] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        (async () => {
            const entradas = await Promise.all(
                Object.entries(BUS_MODELS).map(async ([id, modulo]) => {
                    const [asset] = await Asset.loadAsync(modulo);
                    return [id, asset.localUri!] as const;
                })
            );
            setModelos(Object.fromEntries(entradas));
        })();
    }, []);

    return modelos;
};

export const Bus = ({visibleBounds}:{visibleBounds: Bounds | null}) => {
    const modelos = useModelos();
    const [lines, setLines] = useState<any>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            const route = await getBusLinesArg();
            setLines(route);

        })();
    }, []);


    if (!lines) return null;


    return (
        <>
            <Images  images={{
                'pin-bus': require('@/assets/images/bus/bus-stop.png'),
            }} />

            {modelos && <Models models={modelos}/>}
            {
                lines.filter((line: any) => line.direction_id === 1).map((line :{
                    direction_id: string;
                    shape: {shape_pt_lat: number, shape_pt_lon: number}[],
                    route_id: string,
                    color: string,
                    stops: StopProps['stops']

                }, i:number) => {
                    const visibleStops = line.stops.filter(s => isWithinBounds(s.estacion_lat, s.estacion_lon, visibleBounds));
                    return(

                        <Fragment key={`${line.route_id}-${line.direction_id}`}>
                            <ShapeSource id={`bus-trazo-${line.route_id}-${line.direction_id}`} shape={aFeatureBusLine(line.shape)}>
                                <LineLayer id={`bus-trazo-${i}`} style={{lineColor: line.color, lineWidth: 6, lineEmissiveStrength: 1}}/>
                            </ShapeSource>
                            <Stop stops={visibleStops} index={i} trackShape={line.shape}/>
                        </Fragment>

                    )
                })
            }

        </>
    )
}
const aFeatureBusLine = (shapes : ({shape_pt_lat:number; shape_pt_lon:number}[])) => {
            return {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                    type: 'LineString' as const,
                    coordinates: shapes.map(p => [p.shape_pt_lon, p.shape_pt_lat]),
                }
            }
}

export function aFeatureStationBus(stops: StopProps["stops"], routeShape: ShapePoint[]) {
    return {
        type: "FeatureCollection" as const,
        features: stops.map(s => {
            const punto = paradaPointForStop({lat: s.estacion_lat, lon: s.estacion_lon}, routeShape);
            return {
                type: "Feature" as const,
                properties: {nombre: s.estacion_nombre, heading: [0, 0, punto.heading]},
                geometry: {type: "Point" as const, coordinates: [punto.lon, punto.lat]},
            };
        }),
    };
}





const Stop = ({stops, index, trackShape}: StopProps & { trackShape: ShapePoint[] }) => {
    const shape = useMemo(() => aFeatureStationBus(stops, trackShape), [stops, trackShape]);


    return (
        <>
            <ShapeSource id={`bus-stop-${index}`} shape={shape}>
                <ModelLayer
                    minZoomLevel={16}
                    id={`bus-stop-3d-${index}`}
                    slot="top"
                    style={{
                        modelId: 'bus',
                        modelRotation: ['get', 'heading'],
                        modelType: 'common-3d',
                        modelScale: [5, 5,5],
                        visibility: 'visible',
                        modelEmissiveStrength: 1
                    }}
                />
                <SymbolLayer
                    id={`bus-stop-label-${index}`}
                    slot="top"
                    style={{
                        textField: ['get', 'nombre'],
                        textSize: 11,
                        textOffset: [0, 1.4],
                        textHaloColor: '#000000',
                        textHaloWidth: 1.2
                    }}
                />
            </ShapeSource>
            <ShapeSource  id={`bus-stop-${index}-static`} shape={shape}>
                <SymbolLayer
                    id={`bus-stop-label-${index}-static`}
                    maxZoomLevel={16}
                    slot="top"
                    style={{
                        textField: ['get', 'nombre'],
                        textSize: 11,
                        textOffset: [0, 1.4],
                        iconImage: 'pin-bus',
                        iconSize: 0.05,



                    }}/>


            </ShapeSource>
        </>

    );
};