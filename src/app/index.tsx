import * as Device from 'expo-device';
import {Camera, LineLayer, MapView, Rain, ShapeSource, StyleImport} from '@rnmapbox/maps';
import {useEffect, useMemo, useState} from "react";
import * as SQLite from 'expo-sqlite';
import Database from '@signalapp/sqlcipher';
import {
  getRouteBySubwayLineArg,
  getShapeBySubwayRouteArg,
  getSubwaysLinesArg,
  queriesScript
} from "@/data/queries/subways";
import * as FileSystem from 'expo-file-system/legacy';
import {Subway} from "@/components/subway/Subway";
export default function HomeScreen() {

  const getLightPreset = (date: Date): LightPreset =>  {

    if(date.getHours() >= 20 || date.getHours() < 6){
      return "day";
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
    }, 60000);
    return () => clearInterval(interval);
  }, [] )

  useEffect( () => {
    setConfigLight(  getLightPreset(time) );
  },[time])


  useEffect(() => {
    queriesScript()
  },[]);

  const styleConfig = useMemo(
      () => ({ lightPreset: configLight, showTransitLabels: true }),
      [configLight] // solo se recrea cuando este valor específico cambia
  );

  return (
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}>
        <StyleImport id={"basemap"} existing config={styleConfig} />
        <Camera

            defaultSettings={{ centerCoordinate: [-58.3816, -34.6037], zoomLevel: 16, pitch: 60, heading: 45 }}
        />
        <Subway/>
      </MapView>
  );
}
