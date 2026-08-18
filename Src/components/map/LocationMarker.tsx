import React from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { COLORS } from "../../utils/colors";

type LocationMarkerProps = {
  coordinate: { latitude: number; longitude: number };
};

export default function LocationMarker({ coordinate }: LocationMarkerProps) {
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={styles.halo}>
        <View style={styles.dot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(7, 115, 222, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
