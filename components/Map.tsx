// components/Map.tsx
import { Platform } from 'react-native';

let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  const WebMap = require('./Map.web');
  MapView = WebMap.default;
  Marker = WebMap.Marker;
  PROVIDER_GOOGLE = WebMap.PROVIDER_GOOGLE;
} else {
  const NativeMap = require('./Map.native');
  MapView = NativeMap.default;
  Marker = NativeMap.Marker;
  PROVIDER_GOOGLE = NativeMap.PROVIDER_GOOGLE;
}

export { Marker, PROVIDER_GOOGLE };
export default MapView;
