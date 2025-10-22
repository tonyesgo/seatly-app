import { useEffect, useRef } from "react";
import { Dimensions, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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
  const mapRef = useRef<MapView | null>(null);

  const safeLat = isFinite(latitude) ? latitude : 25.6866;
  const safeLng = isFinite(longitude) ? longitude : -100.3161;

  const regionToUse = {
    latitude: safeLat,
    longitude: safeLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // 📍 Ruta del marker optimizada
  const markerImg = require("../assets/images/seatly-marker.png");

  // 👇 Centrado automático cuando hay markers
  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      const coords = markers
        .filter((m) => isFinite(m.lat) && isFinite(m.lng))
        .map((m) => ({
          latitude: m.lat,
          longitude: m.lng,
        }));

      if (coords.length === 1) {
        // Solo un bar → centramos directo
        mapRef.current.animateToRegion(
          {
            ...coords[0],
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800
        );
      } else if (coords.length > 1) {
        // Varios bares → ajustamos zoom automáticamente
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [markers]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[
        { width: Dimensions.get("window").width, height, borderRadius: 10 },
        style,
      ]}
      initialRegion={regionToUse}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.name}
          description={m.promotion?.name}
          onPress={() => onMarkerClick?.(m)}
        >
          {/* 🧩 Imagen nítida, con escala y proporción controlada */}
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
