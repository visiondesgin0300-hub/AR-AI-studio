import { useEffect, useState } from 'react';

/** Haversine distance between two coordinates, returns metres */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GPSState = {
  distance: number | null;    // metres from target
  supported: boolean;
  permissionDenied: boolean;
};

export function useGPS(targetLat: number, targetLng: number): GPSState {
  const [state, setState] = useState<GPSState>({
    distance: null,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    permissionDenied: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setState({
          distance: haversineMeters(
            coords.latitude, coords.longitude,
            targetLat, targetLng,
          ),
          supported: true,
          permissionDenied: false,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          permissionDenied: err.code === GeolocationPositionError.PERMISSION_DENIED,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [targetLat, targetLng]);

  return state;
}

/** Format a distance in metres to a readable string */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}
