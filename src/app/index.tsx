import {Camera, MapView, StyleImport} from '@rnmapbox/maps';
import {useEffect, useMemo, useRef, useState} from "react";
import {Subway} from "@/components/subway/Subway";
import {useLightPreset} from "@/hooks/useLightPreset";
import {useDispatch} from "react-redux";
import {getTransportFilterData} from "@/data/queries/common";
import {Train} from "@/components/train/Train";
import {getDb} from "@/scripts/sqlite-client";
import {FeatureCollection} from "geojson";
type Bounds = [[number, number], [number, number]];

export default function HomeScreen() {

  const configLight = useLightPreset();
  const styleConfig = useMemo(
      () => ({ lightPreset: configLight, showTransitLabels: true }),
      [configLight]);
    const mapRef = useRef<MapView>(null);
    const [visibleBounds, setVisibleBounds] = useState<[[number, number], [number, number]] | null>(null);
    const [features, setFeatures] = useState<FeatureCollection | undefined>(undefined);

    const onMapIdle = async () => {
        const bounds = await mapRef.current?.getVisibleBounds();
        if (bounds) setVisibleBounds( bounds as Bounds);
        const result = await mapRef.current?.querySourceFeatures(
            'composite',
            ['==', ['get', 'maki'], 'rail-metro'],
            ['transit_stop_label']
        );
        setFeatures(result);

    };



    const dispatch = useDispatch();
    useEffect(() => {
        getTransportFilterData(dispatch);
    }, [dispatch]);



    return (
      <MapView ref={mapRef} style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}  onMapIdle={onMapIdle}>
        <StyleImport id={"basemap"} existing config={styleConfig} />
        <Camera defaultSettings={{ centerCoordinate: [-58.3816, -34.6037], zoomLevel: 16, pitch: 60, heading: 45,  }}/>

          <Train visibleBounds={visibleBounds} features={features}/>
          <Subway visibleBounds={visibleBounds}/>
      </MapView>
  );
}
