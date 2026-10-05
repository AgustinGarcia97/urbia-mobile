import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import HomeScreen from "@/app/index";
import {Provider, useDispatch} from "react-redux";
import {store} from "@/redux/store";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import {Navbar} from "@/components/navbar/Navbar";


Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

SplashScreen.preventAutoHideAsync();

export default   function TabLayout() {

  return (
      <Provider store={store}>
          <GluestackUIProvider mode={'system'}>
              <Navbar/>
              <HomeScreen/>
          </GluestackUIProvider>
      </Provider>

  );
}
