import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ManeuverType } from "../../utils/googleDirections";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";

const MANEUVER_ICONS: Record<ManeuverType, keyof typeof Ionicons.glyphMap> = {
  "turn-left": "arrow-back",
  "turn-right": "arrow-forward",
  "turn-slight-left": "arrow-undo",
  "turn-slight-right": "arrow-redo",
  "turn-sharp-left": "return-up-back",
  "turn-sharp-right": "return-up-forward",
  "uturn-left": "return-down-back",
  "uturn-right": "return-down-forward",
  straight: "arrow-up",
  merge: "git-merge",
  "ramp-left": "arrow-undo",
  "ramp-right": "arrow-redo",
  "fork-left": "git-branch",
  "fork-right": "git-branch",
  "roundabout-left": "sync",
  "roundabout-right": "sync",
  arrive: "flag",
  depart: "navigate",
};

type TurnInstructionProps = {
  instruction: string;
  distanceLabel: string;
  maneuver?: ManeuverType | null;
  compact?: boolean;
};

export default function TurnInstruction({
  instruction,
  distanceLabel,
  maneuver,
  compact = false,
}: TurnInstructionProps) {
  const icon = MANEUVER_ICONS[maneuver ?? "straight"] ?? "arrow-up";

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={compact ? 22 : 28} color={COLORS.white} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.distance}>{distanceLabel}</Text>
        <Text style={styles.instruction} numberOfLines={2}>
          {instruction}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowCompact: {
    gap: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  distance: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 24,
    color: COLORS.white,
  },
  instruction: {
    ...TYPO.bodySm,
    color: "rgba(255,255,255,0.92)",
    marginTop: 2,
  },
});
