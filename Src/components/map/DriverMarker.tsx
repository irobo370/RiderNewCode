import React from "react";
import { Image, StyleSheet } from "react-native";
import { Marker, MarkerAnimated } from "react-native-maps";
import type { AnimatedRegion } from "react-native-maps";

const DRIVER_CAR_IMAGE = require("../../../assets/car.png");

type DriverMarkerProps = {
  coordinate:
    | AnimatedRegion
    | { latitude: number; longitude: number };
  heading?: number;
  animated?: boolean;
};

export default function DriverMarker({
  coordinate,
  heading = 0,
  animated = false,
}: DriverMarkerProps) {
  const MarkerComponent = animated ? MarkerAnimated : Marker;

  return (
    <MarkerComponent
      coordinate={coordinate as any}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading}
      flat
      tracksViewChanges={false}
    >
      <Image source={DRIVER_CAR_IMAGE} style={styles.car} resizeMode="contain" />
    </MarkerComponent>
  );
}

const styles = StyleSheet.create({
  car: {
    width: 52,
    height: 52,
  },
});
