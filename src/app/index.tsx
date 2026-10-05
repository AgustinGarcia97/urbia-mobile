import {Camera, MapView, StyleImport} from '@rnmapbox/maps';
import {useEffect, useMemo, useRef, useState} from "react";
import {Subway} from "@/components/subway/Subway";
import {useLightPreset} from "@/hooks/useLightPreset";
import {useDispatch, useSelector} from "react-redux";

import {Train} from "@/components/train/Train";
import {getDb} from "@/scripts/sqlite-client";
import {FeatureCollection} from "geojson";
import {Bus} from "@/components/bus/Bus";
import {Bike} from "@/components/bike/Bike";
import {getTransportData} from "@/data/queries/queries";
import {setOptions} from "@/redux/slice/optionSlice";
import {RootState} from "@/redux/store";

type Bounds = [[number, number], [number, number]];

interface TransportData {
    tipo: 'subte' | 'tren' | 'bus';
    linea: string;
    ramal: string | null;
    route_id: string;
    empresa: string | null;
    destino: string | null;
}


export default function HomeScreen() {

  const configLight = useLightPreset();
  const styleConfig = useMemo(
      () => ({ lightPreset: configLight, showTransitLabels: true }),
      [configLight]);
    const mapRef = useRef<MapView>(null);
    const [visibleBounds, setVisibleBounds] = useState<[[number, number], [number, number]] | null>(null);
    const [features, setFeatures] = useState<FeatureCollection | undefined>(undefined);
    const options = useSelector((state: RootState) => state.options);
    const onMapIdle = async () => {
        const bounds = await mapRef.current?.getVisibleBounds();
        if (bounds) setVisibleBounds( bounds as Bounds);

    };







    return (
      <MapView ref={mapRef} style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}  onMapIdle={onMapIdle}>
        <StyleImport id={"basemap"} existing config={styleConfig} />
        <Camera defaultSettings={{ centerCoordinate: [-58.3816, -34.6037], zoomLevel: 16, pitch: 60, heading: 45,  }}/>

          <Train visibleBounds={visibleBounds} />
          <Subway visibleBounds={visibleBounds}/>
          <Bus visibleBounds={visibleBounds}/>
          <Bike/>
      </MapView>
  );
}
