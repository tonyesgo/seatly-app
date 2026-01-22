// components/Map.native.tsx
// @ts-ignore
import MapView, { Marker } from "expo-maps";
import { useEffect, useRef } from "react";
import { Dimensions, Image } from "react-native";

type MarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  promotion?: { name: string };
};

type MapNativeProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
  markers?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
  style?: any;
};

export default function MapNative({
  latitude,
  longitude,
  zoom = 15,
  height = 400,
  markers = [],
  onMarkerClick,
  style,
}: MapNativeProps) {
  const mapRef = useRef<any>(null);

  const safeLat = isFinite(latitude) ? latitude : 25.6866;
  const safeLng = isFinite(longitude) ? longitude : -100.3161;
  const markerImg = require("../assets/images/seatly-marker.png");

  useEffect(() => {
    if (markers.length > 0 && mapRef.current?.setCamera) {
      const coords = markers.map((m) => ({
        latitude: m.lat,
        longitude: m.lng,
      }));

      if (coords.length === 1) {
        mapRef.current.setCamera({
          center: coords[0],
          zoom: 16,
        });
      } else {
        const avgLat =
          coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
        const avgLng =
          coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;

        mapRef.current.setCamera({
          center: { latitude: avgLat, longitude: avgLng },
          zoom: 12,
        });
      }
    }
  }, [markers]);

  return (
    <MapView
      ref={mapRef}
      style={[
        { width: Dimensions.get("window").width, height, borderRadius: 10 },
        style,
      ]}
      initialRegion={{
        latitude: safeLat,
        longitude: safeLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={false}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.name}
          onPress={() => onMarkerClick?.(m)}
        >
          <Image
            source={markerImg}
            style={{
              width: 32,
              height: 45,
              resizeMode: "contain",
              transform: [{ scale: 0.9 }],
            }}
          />
        </Marker>
      ))}
    </MapView>
  );
}
