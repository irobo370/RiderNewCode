import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";

type DestinationMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title?: string;
};

export default function DestinationMarker({
  coordinate,
  title = "Destination",
}: DestinationMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.wrap}>
        <View style={styles.pin}>
          <Text style={styles.label}>D</Text>
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
    borderRadius: 8,
    backgroundColor: COLORS.drop,
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
    backgroundColor: COLORS.drop,
  },
});
