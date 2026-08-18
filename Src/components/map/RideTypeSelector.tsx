import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";

export type RideTypeOption = {
  slug: string;
  name: string;
  subtitle?: string;
  fareLabel: string;
  etaLabel?: string;
  selected?: boolean;
  available?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

type RideTypeSelectorProps = {
  options: RideTypeOption[];
  onSelect: (slug: string) => void;
};

export default function RideTypeSelector({
  options,
  onSelect,
}: RideTypeSelectorProps) {
  return (
    <View style={styles.list}>
      {options.map((option) => {
        const selected = Boolean(option.selected);
        return (
          <TouchableOpacity
            key={option.slug}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onSelect(option.slug)}
            disabled={option.available === false}
            activeOpacity={0.85}
          >
            <View style={[styles.icon, selected && styles.iconSelected]}>
              <Ionicons
                name={option.icon ?? "car-outline"}
                size={22}
                color={selected ? COLORS.primary : COLORS.dark}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{option.name}</Text>
              {option.subtitle ? (
                <Text style={styles.subtitle}>{option.subtitle}</Text>
              ) : null}
            </View>
            <View style={styles.meta}>
              <Text style={styles.fare}>{option.fareLabel}</Text>
              {option.etaLabel ? (
                <Text style={styles.eta}>{option.etaLabel}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  rowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.badgeBg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: {
    backgroundColor: COLORS.white,
  },
  copy: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.dark,
  },
  subtitle: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  meta: {
    alignItems: "flex-end",
  },
  fare: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.dark,
  },
  eta: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
