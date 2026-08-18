import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";
import { SPACING } from "../../utils/spacing";

type LocationRowProps = {
  variant: "pickup" | "drop";
  label?: string;
  address: string;
  style?: ViewStyle;
};

export function LocationRow({
  variant,
  label,
  address,
  style,
}: LocationRowProps) {
  const defaultLabel = variant === "pickup" ? "Pickup" : "Destination";

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.dot,
          variant === "pickup" ? styles.dotPickup : styles.dotDrop,
        ]}
      />
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label ?? defaultLabel}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
      </View>
    </View>
  );
}

type LocationDividerProps = {
  style?: ViewStyle;
};

export function LocationDivider({ style }: LocationDividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotPickup: {
    backgroundColor: COLORS.pickup,
  },
  dotDrop: {
    backgroundColor: COLORS.drop,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  label: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  address: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.semiBold,
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 14,
    marginLeft: 22,
  },
});
