import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";

type PickupMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title?: string;
};

export default function PickupMarker({
  coordinate,
  title = "Pickup",
}: PickupMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.wrap}>
        <View style={styles.pin}>
          <Text style={styles.label}>P</Text>
        </View>
        <View style={styles.stem} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.pickup,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  label: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  stem: {
    width: 2,
    height: 8,
    backgroundColor: COLORS.pickup,
  },
});
