import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ManeuverType } from "../../utils/googleDirections";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";
import TurnInstruction from "./TurnInstruction";

type NavigationHeaderProps = {
  instruction: string;
  distanceToTurn: string;
  maneuver?: ManeuverType | null;
  streetName?: string;
  remainingDistance: string;
  remainingDuration: string;
  etaClock: string;
  progress: number;
};

export default function NavigationHeader({
  instruction,
  distanceToTurn,
  maneuver,
  streetName,
  remainingDistance,
  remainingDuration,
  etaClock,
  progress,
}: NavigationHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        <TurnInstruction
          instruction={instruction}
          distanceLabel={distanceToTurn}
          maneuver={maneuver}
        />
        {streetName ? (
          <Text style={styles.street} numberOfLines={1}>
            {streetName}
          </Text>
        ) : null}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{remainingDuration}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{remainingDistance}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{etaClock}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.dark,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  street: {
    ...TYPO.caption,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    marginLeft: 62,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  meta: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.white,
  },
  dot: {
    color: "rgba(255,255,255,0.45)",
  },
});
