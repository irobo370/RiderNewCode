import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import type { TrafficLevel } from "../../utils/googleDirections";

type RideInfoCardProps = {
  distanceLabel: string;
  durationLabel: string;
  fareLabel?: string | null;
  traffic?: TrafficLevel;
  bottom?: number;
};

const TRAFFIC_COPY: Record<TrafficLevel, { label: string; color: string }> = {
  clear: { label: "Light traffic", color: COLORS.trafficClear },
  moderate: { label: "Moderate traffic", color: COLORS.trafficModerate },
  heavy: { label: "Heavy traffic", color: COLORS.trafficHeavy },
};

export default function RideInfoCard({
  distanceLabel,
  durationLabel,
  fareLabel,
  traffic = "clear",
  bottom = 16,
}: RideInfoCardProps) {
  const trafficMeta = TRAFFIC_COPY[traffic];

  return (
    <View style={[styles.card, { bottom }]}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.value}>{durationLabel}</Text>
          <Text style={styles.label}>ETA</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.value}>{distanceLabel}</Text>
          <Text style={styles.label}>Distance</Text>
        </View>
        {fareLabel ? (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.value}>{fareLabel}</Text>
              <Text style={styles.label}>Fare</Text>
            </View>
          </>
        ) : null}
      </View>
      <View style={styles.trafficRow}>
        <Ionicons name="speedometer-outline" size={14} color={trafficMeta.color} />
        <Text style={[styles.trafficText, { color: trafficMeta.color }]}>
          {trafficMeta.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.dark,
  },
  label: {
    marginTop: 2,
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  trafficRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  trafficText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
});
