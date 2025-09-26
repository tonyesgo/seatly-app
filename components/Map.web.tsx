// components/Map.web.tsx
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type MarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type MapWebProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
  markers?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
};

export default function MapView({
  latitude,
  longitude,
  zoom = 15,
  height = 400,
  markers = [],
  onMarkerClick,
}: MapWebProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) {
    return <p>Cargando mapa...</p>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: `${height}px`,
        borderRadius: "10px",
      }}
      center={{ lat: latitude, lng: longitude }}
      zoom={zoom}
    >
      {markers.map((m) => (
        <Marker
  key={m.id}
  position={{ lat: m.lat, lng: m.lng }}
  icon={{
    url: "/seatly-marker.svg",
    scaledSize: new google.maps.Size(50, 70),
    anchor: new google.maps.Point(25, 70),
  }}
  onClick={() => onMarkerClick?.(m)}
/>



      ))}
    </GoogleMap>
  );
}
