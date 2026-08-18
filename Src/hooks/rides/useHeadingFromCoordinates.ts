import { useEffect, useRef, useState } from "react";
import { bearingDegrees } from "../../utils/navigationGeometry";

type LatLng = {
  latitude: number;
  longitude: number;
};

/**
 * Derives a compass heading from successive driver GPS points.
 */
export function useHeadingFromCoordinates(coordinate: LatLng | null): number {
  const prevRef = useRef<LatLng | null>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (!coordinate) {
      prevRef.current = null;
      return;
    }

    if (prevRef.current) {
      const distanceLat = Math.abs(coordinate.latitude - prevRef.current.latitude);
      const distanceLng = Math.abs(coordinate.longitude - prevRef.current.longitude);
      if (distanceLat > 0.00001 || distanceLng > 0.00001) {
        setHeading(bearingDegrees(prevRef.current, coordinate));
      }
    }

    prevRef.current = coordinate;
  }, [coordinate?.latitude, coordinate?.longitude]);

  return heading;
}
