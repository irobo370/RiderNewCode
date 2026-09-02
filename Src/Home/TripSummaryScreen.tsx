import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../components/ui/PrimaryButton";
import { ArrivedBadge } from "../components/icons/ArrivedBadge";
import { useActiveRide } from "../context/ActiveRideContext";
import { getRide, getRideInvoice } from "../service/rideService/rideService";
import { resetToHome } from "../navigation/navigationRef";
import type { DriverSummary, Ride, RideInvoice } from "../service/api/types";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { getActiveCountry } from "../constants/locale";
import { getCurrencyMeta } from "../constants/countries";
import { resolveDisplayAddress } from "../utils/rideHelpers";

const HORIZONTAL_PADDING = 20;

const FIGMA = {
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  tripBoxBg: "#F4F3F8",
  tripBoxBorder: "rgba(243, 244, 246, 0.5)",
  avatarBorder: "#37DDCC",
  verifiedBg: "#0773DE",
  plateBg: "#E9E7ED",
  cardBorder: "rgba(0, 0, 0, 0.1)",
  farePillBg: "#F4F3F8",
  farePillBorder: "rgba(7, 115, 222, 0.1)",
  ratingBorder: "#F3F4F6",
  commentBg: "rgba(205, 205, 205, 0.2)",
  commentBorder: "rgba(205, 205, 205, 0.6)",
  star: "#F59E0B",
};

function formatFareAmount(currency: string, amount: string | null | undefined) {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return amount;
  const { symbol } = getCurrencyMeta(currency);
  return `${symbol}${num.toFixed(2)}`;
}

function formatTrips(count?: number) {
  if (count == null) return null;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k trips`;
  }
  return `${count} trips`;
}

function TripDetailsCard({
  pickupAddress,
  dropAddress,
}: {
  pickupAddress: string;
  dropAddress: string;
}) {
  return (
    <View style={styles.tripDetailsCard}>
      <View style={styles.tripDetailsInner}>
        <View style={styles.connectorCol}>
          <View style={styles.tripDot} />
          <View style={styles.dashedLine} />
          <View style={styles.tripDot} />
        </View>
        <View style={styles.tripRows}>
          <View style={styles.tripRow}>
            <Text style={styles.tripLabel}>Pick-up</Text>
            <Text style={styles.tripAddress}>{pickupAddress}</Text>
          </View>
          <View style={styles.tripRow}>
            <Text style={styles.tripLabel}>Drop-off</Text>
            <Text style={styles.tripAddress}>{dropAddress}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function DriverCard({ driver }: { driver: DriverSummary }) {
  const rating = driver.rating ?? 4.8;
  const tripsLabel = formatTrips(driver.total_trips);
  const vehicleName =
    [driver.vehicle_color, driver.vehicle_model]
      .filter(Boolean)
      .join(" ")
      .trim() || driver.vehicle_model;

  return (
    <View style={styles.driverCard}>
      <View style={styles.driverLeft}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {driver.name?.charAt(0)?.toUpperCase() ?? "D"}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={8} color={COLORS.white} />
          </View>
        </View>
        <View style={styles.driverMeta}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={FIGMA.star} />
            <Text style={styles.ratingText}>
              {rating.toFixed(1)}
              {tripsLabel ? ` • ${tripsLabel}` : ""}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.vehicleCol}>
        <Text style={styles.vehicleName}>{vehicleName}</Text>
        {driver.vehicle_plate ? (
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{driver.vehicle_plate}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FareCard({ fareLabel, paymentLabel }: { fareLabel: string; paymentLabel: string }) {
  return (
    <View style={styles.fareCard}>
      <View style={styles.fareLeft}>
        <Text style={styles.fareLabel}>TOTAL FARE</Text>
        <Text style={styles.fareAmount}>{fareLabel}</Text>
      </View>
      <View style={styles.paymentPill}>
        <Ionicons name="card-outline" size={18} color={FIGMA.textPrimary} />
        <Text style={styles.paymentText}>{paymentLabel}</Text>
      </View>
    </View>
  );
}

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} stars`}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={28}
            color={star <= rating ? FIGMA.star : FIGMA.textSecondary}
            style={star > rating ? styles.starMuted : undefined}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function TripSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { activeRide, clearActiveRide, tripPaymentMethod } = useActiveRide();
  const [ride, setRide] = useState<Ride | null>(activeRide);
  const [invoice, setInvoice] = useState<RideInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const rideId = activeRide?.id ?? ride?.id;

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        const [rideData, invoiceData] = await Promise.all([
          getRide(rideId),
          getRideInvoice(rideId).catch(() => null),
        ]);

        if (!isActive) return;
        setRide(rideData);
        if (invoiceData?.available) {
          setInvoice(invoiceData);
        }
      } catch {
        if (isActive && activeRide) {
          setRide(activeRide);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [rideId, activeRide]);

  useEffect(() => {
    if (!rideId && !loading) {
      resetToHome();
    }
  }, [rideId, loading]);

  const handleDone = useCallback(() => {
    clearActiveRide();
    resetToHome();
  }, [clearActiveRide]);

  const driver = ride?.driver ?? invoice?.driver ?? null;
  const pickupAddress = resolveDisplayAddress(
    invoice?.pickup_address,
    ride?.pickup_address,
    "Pickup location",
  );
  const dropAddress = resolveDisplayAddress(
    invoice?.drop_address,
    ride?.drop_address,
    "Drop location",
  );
  const currency = invoice?.currency ?? getActiveCountry().currency;
  const fareAmount = formatFareAmount(
    currency,
    invoice?.final_fare ?? ride?.final_fare ?? ride?.estimated_fare,
  );

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 88,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ArrivedBadge size={64} />
          <Text style={styles.headerTitle}>You&apos;ve Arrived!</Text>
          <Text style={styles.headerSubtitle}>
            Thanks for riding with us today
          </Text>
        </View>

        <View style={styles.cards}>
          <TripDetailsCard
            pickupAddress={pickupAddress}
            dropAddress={dropAddress}
          />

          {driver ? <DriverCard driver={driver} /> : null}

          <FareCard
            fareLabel={fareAmount}
            paymentLabel={tripPaymentMethod?.label ?? "Payment"}
          />

          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was your ride?</Text>
            <StarRating rating={rating} onChange={setRating} />
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (Optional)"
              placeholderTextColor="rgba(96, 112, 128, 0.5)"
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <PrimaryButton label="Done" onPress={handleDone} style={styles.doneBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 36,
    color: FIGMA.textPrimary,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textSecondary,
    textAlign: "center",
  },
  cards: {
    gap: 12,
  },
  tripDetailsCard: {
    backgroundColor: FIGMA.tripBoxBg,
    borderWidth: 1,
    borderColor: FIGMA.tripBoxBorder,
    borderRadius: 12,
    padding: 16,
  },
  tripDetailsInner: {
    flexDirection: "row",
    gap: 12,
  },
  connectorCol: {
    width: 10,
    alignItems: "center",
    paddingTop: 6,
  },
  tripDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  dashedLine: {
    width: 1,
    height: 26,
    marginVertical: 4,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: FIGMA.textSecondary,
    opacity: 0.5,
  },
  tripRows: {
    flex: 1,
    gap: 16,
  },
  tripRow: {
    gap: 0,
  },
  tripLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: FIGMA.textSecondary,
  },
  tripAddress: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 22,
    color: FIGMA.textPrimary,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  driverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: FIGMA.avatarBorder,
    backgroundColor: "#E8F8F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FONTS.semiBold,
    fontSize: 24,
    color: FIGMA.textPrimary,
  },
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 19,
    height: 18.5,
    borderRadius: 9999,
    backgroundColor: FIGMA.verifiedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMeta: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    lineHeight: 28,
    color: FIGMA.textPrimary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: FIGMA.textSecondary,
  },
  vehicleCol: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 120,
  },
  vehicleName: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textPrimary,
    textAlign: "right",
  },
  plateBadge: {
    backgroundColor: FIGMA.plateBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plateText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: FIGMA.textSecondary,
    textTransform: "uppercase",
  },
  fareCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  fareLeft: {
    flex: 1,
    gap: 4,
  },
  fareLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 16,
    color: FIGMA.textSecondary,
  },
  fareAmount: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 35,
    color: COLORS.primary,
  },
  paymentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: FIGMA.farePillBg,
    borderWidth: 1,
    borderColor: FIGMA.farePillBorder,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  paymentText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textPrimary,
  },
  ratingCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: FIGMA.ratingBorder,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: FIGMA.textPrimary,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  starMuted: {
    opacity: 0.3,
  },
  commentInput: {
    minHeight: 87,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FIGMA.commentBorder,
    backgroundColor: FIGMA.commentBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: FIGMA.textPrimary,
  },
  footer: {
    position: "absolute",
    left: HORIZONTAL_PADDING,
    right: HORIZONTAL_PADDING,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingTop: 8,
  },
  doneBtn: {
    height: 48,
  },
});
