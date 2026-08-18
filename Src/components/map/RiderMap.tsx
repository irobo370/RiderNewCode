import React, { forwardRef } from "react";
import { Platform, StyleSheet } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  type MapViewProps,
  type Region,
} from "react-native-maps";
import type { AnimatedRegion } from "react-native-maps";
import type { MapCoordinate } from "../../utils/decodePolyline";
import DestinationMarker from "./DestinationMarker";
import DriverMarker from "./DriverMarker";
import PickupMarker from "./PickupMarker";
import RoutePolyline from "./RoutePolyline";

export type RiderMapMode =
  | "idle"
  | "preview"
  | "searching"
  | "to_pickup"
  | "navigation";

type RiderMapProps = {
  initialRegion: Region;
  mode: RiderMapMode;
  pickup?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  driverCoordinate?: MapCoordinate | AnimatedRegion | null;
  driverHeading?: number;
  animatedDriver?: boolean;
  activeRoute?: MapCoordinate[];
  traveledRoute?: MapCoordinate[];
  alternativeRoutes?: MapCoordinate[][];
  showsTraffic?: boolean;
  showsUserLocation?: boolean;
  followUser?: boolean;
  mapPadding?: MapViewProps["mapPadding"];
  onMapReady?: () => void;
  onPanDrag?: () => void;
  onRegionChangeComplete?: MapViewProps["onRegionChangeComplete"];
};

const RiderMap = forwardRef<MapView, RiderMapProps>(function RiderMap(
  {
    initialRegion,
    mode,
    pickup,
    destination,
    driverCoordinate,
    driverHeading = 0,
    animatedDriver = false,
    activeRoute = [],
    traveledRoute = [],
    alternativeRoutes = [],
    showsTraffic = true,
    showsUserLocation = true,
    followUser = false,
    mapPadding,
    onMapReady,
    onPanDrag,
    onRegionChangeComplete,
  },
  ref,
) {
  const navigating = mode === "navigation";

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFillObject}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsTraffic={showsTraffic}
      showsBuildings
      showsIndoors={false}
      loadingEnabled
      scrollEnabled
      zoomEnabled
      rotateEnabled
      pitchEnabled={navigating || followUser}
      followsUserLocation={followUser && !driverCoordinate}
      mapPadding={mapPadding}
      onMapReady={onMapReady}
      onPanDrag={onPanDrag}
      onRegionChangeComplete={onRegionChangeComplete}
      toolbarEnabled={false}
    >
      {alternativeRoutes.map((coords, index) => (
        <RoutePolyline
          key={`alt-${index}`}
          coordinates={coords}
          kind="alternative"
        />
      ))}
      <RoutePolyline coordinates={traveledRoute} kind="traveled" />
      <RoutePolyline
        coordinates={activeRoute}
        kind="active"
        strokeWidth={navigating ? 7 : 6}
      />
      {pickup && mode !== "navigation" ? <PickupMarker coordinate={pickup} /> : null}
      {destination ? <DestinationMarker coordinate={destination} /> : null}
      {driverCoordinate ? (
        <DriverMarker
          coordinate={driverCoordinate}
          heading={driverHeading}
          animated={animatedDriver}
        />
      ) : null}
    </MapView>
  );
});

export default RiderMap;
