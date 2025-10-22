import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState } from 'react';

const PROVIDER_GOOGLE = 'google';

type MarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type MapWebProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: number;
  markers?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
};

export default function MapWeb({
  latitude = 25.6866,
  longitude = -100.3161,
  zoom = 15,
  height = 400,
  markers = [],
  onMarkerClick,
}: MapWebProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: latitude, lng: longitude });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // 🔹 Cuando cambian los markers, centramos el mapa automáticamente
  useEffect(() => {
    if (markers.length > 0 && mapRef.current) {
      if (markers.length === 1) {
        // Solo un marcador → centra directamente
        const m = markers[0];
        setCenter({ lat: m.lat, lng: m.lng });
        mapRef.current.setZoom(16);
        mapRef.current.panTo({ lat: m.lat, lng: m.lng });
      } else {
        // Varios marcadores → ajusta los límites del mapa
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [markers]);

  if (!isLoaded) {
    return <p>Cargando mapa...</p>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '10px',
      }}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          icon={{
            url: '/seatly-marker.svg',
            scaledSize: new google.maps.Size(50, 70),
            anchor: new google.maps.Point(25, 70),
          }}
          onClick={() => onMarkerClick?.(m)}
        />
      ))}
    </GoogleMap>
  );
}

export { Marker, PROVIDER_GOOGLE };
