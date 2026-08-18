import { useEffect, useRef } from "react";
import { AnimatedRegion } from "react-native-maps";

type LatLng = {
  latitude: number;
  longitude: number;
};

const ANIMATION_MS = 800;

/**
 * Smoothly animates the driver car marker between WebSocket location updates.
 */
export function useSmoothDriverCoordinate(coordinate: LatLng | null) {
  const animatedCoordinate = useRef<AnimatedRegion | null>(null);
  const hasCoordinateRef = useRef(false);

  if (coordinate && !animatedCoordinate.current) {
    animatedCoordinate.current = new AnimatedRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    });
    hasCoordinateRef.current = true;
  }

  useEffect(() => {
    if (!coordinate || !animatedCoordinate.current) {
      return;
    }

    if (!hasCoordinateRef.current) {
      animatedCoordinate.current.setValue({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      hasCoordinateRef.current = true;
      return;
    }

    animatedCoordinate.current
      .timing({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: ANIMATION_MS,
        useNativeDriver: false,
      })
      .start();
  }, [coordinate?.latitude, coordinate?.longitude]);

  useEffect(() => {
    if (!coordinate) {
      hasCoordinateRef.current = false;
      animatedCoordinate.current = null;
    }
  }, [coordinate]);

  return coordinate ? animatedCoordinate.current : null;
}
