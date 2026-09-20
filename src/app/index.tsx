import * as Device from 'expo-device';
import {Camera, MapView, StyleImport} from '@rnmapbox/maps';
import {useEffect, useState} from "react";

export default function HomeScreen() {

  const getLightPreset = (date: Date): LightPreset =>  {

    if(date.getHours() >= 20 || date.getHours() < 6){
      return "night";
    }
    else if(date.getHours() >= 6 || date.getHours() < 8){
      return "dawn"
    }
    else if(date.getHours() >= 8 || date.getHours() < 17){
      return "day"
    }
    else if(date.getHours() >= 17 || date.getHours() < 20){
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

  return (
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/standard"  rotateEnabled={true}>
        <StyleImport id={"basemap"} existing config={{lightPreset: configLight, showTransitLabels: false  }} />
        <Camera
            centerCoordinate={[-58.3816, -34.6037]}
            zoomLevel={16}
            pitch={60}
            heading={45}
        />
      </MapView>
  );
}