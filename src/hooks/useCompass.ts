import { useCallback, useEffect, useState } from 'react';

export type CompassState = {
  bearing: number | null;       // 0-360, 0 = North, clockwise
  supported: boolean;
  permissionNeeded: boolean;    // iOS 13+ requires explicit user gesture
  requestPermission: () => Promise<void>;
};

type ExtendedDOE = DeviceOrientationEvent & { webkitCompassHeading?: number };
type DOEStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export function useCompass(): CompassState {
  const [bearing, setBearing] = useState<number | null>(null);
  const [supported, setSupported] = useState<boolean>(() => 'DeviceOrientationEvent' in window);
  const [permissionNeeded, setPermissionNeeded] = useState(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const ext = e as ExtendedDOE;
    if (ext.webkitCompassHeading != null) {
      // iOS: magnetic heading, 0=North, clockwise — most reliable
      setBearing(Math.round(ext.webkitCompassHeading));
    } else if (e.alpha != null) {
      // Android: alpha is CCW from North → convert to CW bearing
      setBearing(Math.round((360 - e.alpha + 360) % 360));
    }
  }, []);

  const startListening = useCallback(() => {
    // Prefer deviceorientationabsolute (magnetic North) on Android Chrome
    window.addEventListener(
      'deviceorientationabsolute' as 'deviceorientation',
      handleOrientation,
      true,
    );
    window.addEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  const stopListening = useCallback(() => {
    window.removeEventListener(
      'deviceorientationabsolute' as 'deviceorientation',
      handleOrientation,
      true,
    );
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as DOEStatic;
    if (typeof DOE.requestPermission !== 'function') return;
    try {
      const result = await DOE.requestPermission();
      if (result === 'granted') {
        startListening();
        setPermissionNeeded(false);
      }
    } catch {
      // User dismissed the dialog — leave permissionNeeded true
    }
  }, [startListening]);

  useEffect(() => {
    if (!('DeviceOrientationEvent' in window)) {
      setSupported(false);
      return;
    }
    const DOE = DeviceOrientationEvent as DOEStatic;
    // iOS 13+ requires a user-gesture permission request
    if (typeof DOE.requestPermission === 'function') {
      setPermissionNeeded(true);
      return;
    }
    startListening();
    return stopListening;
  }, [startListening, stopListening]);

  return { bearing, supported, permissionNeeded, requestPermission };
}

/** Converts a 0-360 bearing to a cardinal direction label */
export function bearingToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
