import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import HomeScreen from "@/app/index";
import {Provider, useDispatch} from "react-redux";
import {store} from "@/redux/store";
import {getTransportFilterData} from "@/data/queries/common";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

SplashScreen.preventAutoHideAsync();

export default  async function TabLayout() {
    const dispatch = useDispatch();
    await getTransportFilterData(dispatch);
  return (
      <Provider store={store}>
          <HomeScreen/>
      </Provider>

  );
}
