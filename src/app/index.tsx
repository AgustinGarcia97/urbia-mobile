import {Camera, MapView, StyleImport} from '@rnmapbox/maps';
import {useMemo} from "react";
import {Subway} from "@/components/subway/Subway";
import {useLightPreset} from "@/hooks/useLightPreset";

export default function HomeScreen() {
  const configLight = useLightPreset();
  const styleConfig = useMemo(
      () => ({ lightPreset: configLight, showTransitLabels: true }),
      [configLight]);
  return (
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}>
        <StyleImport id={"basemap"} existing config={styleConfig} />
        <Camera defaultSettings={{ centerCoordinate: [-58.3816, -34.6037], zoomLevel: 16, pitch: 60, heading: 45 }}/>
        <Subway/>
      </MapView>
  );
}
