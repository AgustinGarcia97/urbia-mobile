import * as Device from 'expo-device';
import {Camera, LineLayer, MapView, Rain, ShapeSource, StyleImport} from '@rnmapbox/maps';
import {useEffect, useState} from "react";
import {copiarGtfsSiHaceFalta} from "@/scripts/sqlite-client";
import * as SQLite from 'expo-sqlite';
import Database from '@signalapp/sqlcipher';
import {
  getRouteBySubwayLineArg,
  getShapeBySubwayRouteArg,
  getSubwaysLinesArg,
  queriesScript
} from "@/data/queries/subways";
import * as FileSystem from 'expo-file-system/legacy';
export default function HomeScreen() {

  const getLightPreset = (date: Date): LightPreset =>  {

    if(date.getHours() >= 20 || date.getHours() < 6){
      return "night";
    }
    else if(date.getHours() >= 6 && date.getHours() < 8){
      return "dawn"
    }
    else if(date.getHours() >= 8 && date.getHours() < 17){
      return "day"
    }
    else if(date.getHours() >= 17 && date.getHours() < 20){
      return "dusk"
    }
    else return undefined
  }

  type LightPreset = "dawn" | "day" | "dusk" | "night"| undefined;

  const [configLight, setConfigLight] = useState<LightPreset>(getLightPreset (new Date));
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 6000);
    return () => clearInterval(interval);
  }, [] )

  useEffect( () => {
    setConfigLight(  getLightPreset(time) );
  },[time])


  useEffect(() => {
    const iniciar = async () => {
      const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite/gtfs.db');
      console.log('gtfs.db existe:', info.exists, '— tamaño:', info.exists ? info.size : 'N/A');
      await copiarGtfsSiHaceFalta();
    };

    iniciar();
  }, []);

  useEffect(() => {
    queriesScript();
  },[]);

  return (
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}>
        <StyleImport id={"basemap"} existing config={{lightPreset: configLight, showTransitLabels: false  }} />
        <Camera
            centerCoordinate={[-58.3816, -34.6037]}
            zoomLevel={16}
            pitch={60}
            heading={45}
        />
        <LineaA></LineaA>
      </MapView>
  );
}

const LineaA = () => {
  const [lines,setLines] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const route = await queriesScript();
      setLines(route);

        }) ();
    },[]);
  if (!lines) return null;

  return <ShapeSource shape={aFeatureLinea(lines.shape)}>
    <LineLayer id={"linea-b-trazo"} style={{lineColor: '#1583a6', lineWidth: 6,  lineOpacity: 1, lineEmissiveStrength: 1}}></LineLayer>

  </ShapeSource>;

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