import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DriverSummary } from "../../service/api/types";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";

type DriverCardProps = {
  driver: DriverSummary;
  etaLabel?: string;
};

export default function DriverCard({ driver, etaLabel }: DriverCardProps) {
  const rating = driver.rating ?? 4.8;

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={COLORS.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {driver.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {driver.vehicle_color} {driver.vehicle_model}
        </Text>
        <View style={styles.plateRow}>
          <Text style={styles.plate}>{driver.vehicle_plate}</Text>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
        </View>
      </View>
      {etaLabel ? <Text style={styles.eta}>{etaLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.dark,
  },
  meta: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  plate: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.dark,
    backgroundColor: "#E9E7ED",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  rating: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.dark,
  },
  eta: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
});
