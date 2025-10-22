import { Platform } from 'react-native';
import MapNative from './Map.native';
import MapWeb from './Map.web';

const MapView = Platform.OS === 'web' ? MapWeb : MapNative;

export const { Marker, PROVIDER_GOOGLE } =
  Platform.OS === 'web'
    ? MapWeb
    : require('react-native-maps');

export default MapView;
