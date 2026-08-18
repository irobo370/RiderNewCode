import { useCallback, useRef } from "react";
import type MapView from "react-native-maps";
import type { MapCoordinate } from "../../utils/decodePolyline";

type NavigationCameraOptions = {
  pitch?: number;
  zoom?: number;
  duration?: number;
};

export function useNavigationCamera(mapRef: React.RefObject<MapView | null>) {
  const followingRef = useRef(true);

  const setFollowing = useCallback((following: boolean) => {
    followingRef.current = following;
  }, []);

  const follow = useCallback(
    (
      coordinate: MapCoordinate | null,
      heading = 0,
      options: NavigationCameraOptions = {},
    ) => {
      if (!followingRef.current || !coordinate || !mapRef.current) return;

      mapRef.current.animateCamera(
        {
          center: coordinate,
          heading,
          pitch: options.pitch ?? 55,
          zoom: options.zoom ?? 18,
        },
        { duration: options.duration ?? 500 },
      );
    },
    [mapRef],
  );

  const overview = useCallback(
    (
      coordinates: MapCoordinate[],
      edgePadding?: { top: number; right: number; bottom: number; left: number },
    ) => {
      if (!coordinates.length || !mapRef.current) return;
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: edgePadding ?? { top: 120, right: 48, bottom: 48, left: 48 },
        animated: true,
      });
    },
    [mapRef],
  );

  return {
    followingRef,
    setFollowing,
    follow,
    overview,
  };
}
