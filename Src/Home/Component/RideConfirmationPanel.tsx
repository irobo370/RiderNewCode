import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { DEFAULT_CURRENCY } from "../../constants/locale";
import { formatFare, resolveDisplayAddress } from "../../utils/rideHelpers";
import type { RideQuote } from "../../service/api/types";
import BookingStepIndicator from "./BookingStepIndicator";
import { getMapLifecyclePanelHeight } from "../../constants/mapLayout";

const HORIZONTAL_PADDING = 20;
const PANEL_HEIGHT = getMapLifecyclePanelHeight();

const FIGMA = {
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  tripBoxBg: "#F4F3F8",
  tripBoxBorder: "rgba(243, 244, 246, 0.5)",
  statBoxBg: "#F4F3F8",
  statBoxBorder: "rgba(7, 115, 222, 0.1)",
  divider: "#F3F4F6",
  primary: "#0773DE",
};

function TripConnector() {
  return (
    <View style={styles.connectorCol}>
      <View style={styles.tripDot} />
      <View style={styles.dashedLine} />
      <View style={styles.tripDot} />
    </View>
  );
}

function TripRow({ label, address }: { label: string; address: string }) {
  return (
    <View style={styles.tripRow}>
      <View style={styles.tripRowText}>
        <Text style={styles.tripLabel}>{label}</Text>
        <Text style={styles.tripAddress} numberOfLines={2}>
          {address}
        </Text>
      </View>
    </View>
  );
}

type RideConfirmationPanelProps = {
  visible: boolean;
  quote: RideQuote | undefined;
  rideTypeSlug: string | null;
  pickupAddress?: string | null;
  dropAddress?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onChangePayment?: () => void;
  isBooking?: boolean;
  hasPaymentMethod?: boolean;
};

function formatExpiryCountdown(expiresAt: string | undefined) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Quote expired — fares may have changed";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins > 0) return `Fare locked for ${mins}m ${secs}s`;
  return `Fare locked for ${secs}s`;
}

function getSelectedOption(quote: RideQuote | undefined, slug: string | null) {
  if (!quote || !slug) return null;
  return quote.options?.find((option) => option.slug === slug) ?? null;
}

function RideConfirmationPanel({
  visible,
  quote,
  rideTypeSlug,
  pickupAddress: preferredPickup,
  dropAddress: preferredDrop,
  onConfirm,
  onCancel,
  onChangePayment,
  isBooking = false,
  hasPaymentMethod = true,
}: RideConfirmationPanelProps) {
  const insets = useSafeAreaInsets();
  const selectedOption = getSelectedOption(quote, rideTypeSlug);
  const [expiryLabel, setExpiryLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !quote?.quote_expires_at) {
      setExpiryLabel(null);
      return undefined;
    }

    const tick = () => {
      setExpiryLabel(formatExpiryCountdown(quote.quote_expires_at));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [visible, quote?.quote_expires_at]);

  if (!visible) return null;

  const pickupAddress = resolveDisplayAddress(
    preferredPickup,
    quote?.pickup_address,
    "Pick-up location",
  );
  const dropAddress = resolveDisplayAddress(
    preferredDrop,
    quote?.drop_address,
    "Drop-off location",
  );
  const currency = quote?.currency ?? DEFAULT_CURRENCY;
  const fare = selectedOption?.estimated_fare ?? "0";
  const eta =
    selectedOption?.pickup_eta_min ??
    selectedOption?.total_eta_min ??
    selectedOption?.trip_duration_min ??
    5;
  const surge = parseFloat(quote?.surge_multiplier ?? "1");
  const fareNote =
    surge > 1
      ? `Includes ${surge.toFixed(1)}× surge pricing. Final fare may vary slightly.`
      : "Estimated fare — final amount may vary based on route and traffic.";

  return (
    <View style={[styles.panel, { height: PANEL_HEIGHT }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <BookingStepIndicator currentStep="confirm" />

        <View style={styles.tripDetailsCard}>
          <View style={styles.tripDetailsInner}>
            <TripConnector />
            <View style={styles.tripRows}>
              <TripRow label="Pick-up" address={pickupAddress} />
              <TripRow label="Drop-off" address={dropAddress} />
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Fare</Text>
            <Text style={styles.statValue}>{formatFare(currency, fare)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Estimated Arrival</Text>
            <Text style={styles.statValue}>{eta} mins</Text>
          </View>
        </View>

        <Text style={styles.fareNote}>{fareNote}</Text>
        {expiryLabel ? (
          <Text style={styles.expiryNote}>{expiryLabel}</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <Ionicons
              name={hasPaymentMethod ? "checkmark-circle" : "alert-circle-outline"}
              size={20}
              color={hasPaymentMethod ? COLORS.success : COLORS.error}
            />
            <Ionicons name="card-outline" size={20} color={FIGMA.textPrimary} />
            <Text style={styles.paymentText}>
              {hasPaymentMethod ? "•••• 4242" : "Add a payment method"}
            </Text>
          </View>
          <TouchableOpacity onPress={onChangePayment} hitSlop={8}>
            <Text style={styles.changeText}>
              {hasPaymentMethod ? "Change" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>

        {!hasPaymentMethod ? (
          <Text style={styles.paymentHint}>
            Add a payment method before confirming your ride.
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isBooking || !rideTypeSlug || !hasPaymentMethod}
            onPress={onConfirm}
          >
            <LinearGradient
              colors={["#0773DE", "#37DDCC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.confirmButton,
                (isBooking || !rideTypeSlug || !hasPaymentMethod) && {
                  opacity: 0.6,
                },
              ]}
            >
              {isBooking ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.confirmText}>Confirm Ride</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isBooking}
            onPress={onCancel}
            style={[styles.cancelButton, isBooking && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default React.memo(RideConfirmationPanel);

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 31,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.02,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 16,
      },
    }),
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 18,
  },
  footer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FIGMA.divider,
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
    backgroundColor: FIGMA.primary,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 88, 188, 0.1)",
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
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
    minHeight: 38,
  },
  tripRowText: {
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
  statsRow: {
    flexDirection: "row",
    gap: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: FIGMA.statBoxBg,
    borderWidth: 1,
    borderColor: FIGMA.statBoxBorder,
    borderRadius: 16,
    padding: 16,
    minHeight: 78,
    justifyContent: "space-between",
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: FIGMA.textSecondary,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    color: FIGMA.textPrimary,
  },
  fareNote: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: FIGMA.textSecondary,
  },
  expiryNote: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.primary,
  },
  paymentHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.error,
    marginTop: -8,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textPrimary,
  },
  changeText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.primary,
  },
  actions: {
    gap: 12,
  },
  confirmButton: {
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(7, 115, 222, 0.1)",
        shadowOpacity: 1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 16,
    color: "#FEFCFF",
  },
  cancelButton: {
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: FIGMA.textPrimary,
  },
  cancelText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 16,
    color: FIGMA.textPrimary,
  },
});
