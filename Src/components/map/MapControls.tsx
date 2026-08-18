import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";

type MapControlsProps = {
  onRecenter: () => void;
  onToggleTraffic?: () => void;
  trafficEnabled?: boolean;
  followEnabled?: boolean;
  top?: number;
};

export default function MapControls({
  onRecenter,
  onToggleTraffic,
  trafficEnabled = true,
  followEnabled = false,
  top,
}: MapControlsProps) {
  return (
    <View style={[styles.wrap, top != null ? { top } : null]}>
      <TouchableOpacity
        style={[styles.btn, followEnabled && styles.btnActive]}
        onPress={onRecenter}
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
      >
        <Ionicons
          name={followEnabled ? "navigate" : "locate-outline"}
          size={22}
          color={followEnabled ? COLORS.primary : "#6C7278"}
        />
      </TouchableOpacity>
      {onToggleTraffic ? (
        <TouchableOpacity
          style={[styles.btn, trafficEnabled && styles.btnActive]}
          onPress={onToggleTraffic}
          accessibilityRole="button"
          accessibilityLabel="Toggle traffic"
        >
          <Ionicons
            name="layers-outline"
            size={20}
            color={trafficEnabled ? COLORS.primary : "#6C7278"}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    gap: 12,
    zIndex: 25,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 7.5,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  btnActive: {
    borderWidth: 1.5,
    borderColor: "rgba(7, 115, 222, 0.35)",
  },
});
