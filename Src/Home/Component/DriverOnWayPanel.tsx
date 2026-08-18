import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import type { DriverSummary, RideStatus } from "../../service/api/types";
import { getMapLifecyclePanelHeight } from "../../constants/mapLayout";

const HORIZONTAL_PADDING = 20;

export function getDriverOnWayPanelHeight(
  showOtp = false,
  _bottomInset = 0,
) {
  const base = getMapLifecyclePanelHeight();
  return showOtp ? Math.round(base + 96) : base;
}

const FIGMA = {
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  avatarBorder: "#37DDCC",
  verifiedBg: "#0773DE",
  plateBg: "#E9E7ED",
  otpBorder: "rgba(108, 114, 120, 0.1)",
  otpBoxBg: "rgba(255, 255, 255, 0.8)",
  otpBoxBorder: "rgba(205, 205, 205, 0.6)",
  actionBg: "#F4F3F8",
  actionBorder: "#F9FAFB",
  sosBg: "rgba(255, 218, 214, 0.4)",
  sosBorder: "#FFDAD6",
  sosText: "#BA1A1A",
  star: "#F59E0B",
};

const CANCELLABLE_STATUSES = new Set([
  "driver_assigned",
  "driver_arrived",
]);

type DriverOnWayPanelProps = {
  visible: boolean;
  status: RideStatus | null;
  driver: DriverSummary | null;
  startOtp: string | null;
  pickupAddress?: string;
  onCancel: () => void;
  isCancelling?: boolean;
};

function formatTrips(count?: number) {
  if (count == null) return null;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k trips`;
  }
  return `${count} trips`;
}

function OtpBoxes({ otp }: { otp: string }) {
  const digits = String(otp).replace(/\D/g, "").split("");
  if (!digits.length) return null;
  const contentWidth =
    Dimensions.get("window").width - HORIZONTAL_PADDING * 2 - 24;
  const gap = 8;
  const boxSize = Math.min(
    50,
    Math.floor((contentWidth - gap * (digits.length - 1)) / digits.length),
  );

  return (
    <View style={[styles.otpRow, { gap }]}>
      {digits.map((digit, index) => (
        <View
          key={`${digit}-${index}`}
          style={[styles.otpBox, { width: boxSize, height: boxSize }]}
        >
          <Text style={styles.otpDigit}>{digit}</Text>
        </View>
      ))}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  variant = "default",
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  variant?: "default" | "sos";
}) {
  const isSos = variant === "sos";

  return (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.actionCircle,
          isSos && styles.actionCircleSos,
        ]}
      >
        <Ionicons
          name={icon}
          size={isSos ? 22 : 24}
          color={isSos ? FIGMA.sosText : COLORS.primary}
        />
      </View>
      <Text style={[styles.actionLabel, isSos && styles.actionLabelSos]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DriverOnWayPanel({
  visible,
  status,
  driver,
  startOtp,
  pickupAddress,
  onCancel,
  isCancelling = false,
}: DriverOnWayPanelProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;
  if (!driver && !startOtp) return null;

  const canCancel = status && CANCELLABLE_STATUSES.has(status);
  const showOtp =
    (status === "driver_assigned" || status === "driver_arrived") &&
    Boolean(startOtp);
  const panelHeight = getDriverOnWayPanelHeight(showOtp, insets.bottom);
  const rating = driver?.rating ?? 4.8;
  const tripsLabel = formatTrips(driver?.total_trips);
  const vehicleName =
    [driver?.vehicle_color, driver?.vehicle_model]
      .filter(Boolean)
      .join(" ")
      .trim() || driver?.vehicle_model || "Vehicle";

  const handleCall = () => {
    if (!driver?.phone) return;
    Linking.openURL(`tel:${driver.phone}`).catch(() => {
      Alert.alert("Unable to call", "Could not open the phone app.");
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on a Go4Ride trip with ${driver?.name ?? "my driver"}${
          pickupAddress ? ` to ${pickupAddress}` : ""
        }.`,
      });
    } catch {
      // user dismissed
    }
  };

  const handleSos = () => {
    Alert.alert(
      "Emergency SOS",
      "Call emergency services?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 112",
          style: "destructive",
          onPress: () => Linking.openURL("tel:112"),
        },
      ],
    );
  };

  const handleCancelPress = () => {
    Alert.alert("Cancel ride?", "Your current trip will be cancelled.", [
      { text: "Keep ride", style: "cancel" },
      {
        text: "Cancel Ride",
        style: "destructive",
        onPress: onCancel,
      },
    ]);
  };

  return (
    <View style={[styles.panel, { height: panelHeight }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          showOtp && styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.driverRow}>
          <View style={styles.driverLeft}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {driver?.name?.charAt(0)?.toUpperCase() ?? "D"}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={8} color={COLORS.white} />
              </View>
            </View>

            <View style={styles.driverMeta}>
              <Text style={styles.driverName}>{driver?.name ?? "Driver assigned"}</Text>
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
            {driver?.vehicle_plate ? (
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{driver.vehicle_plate}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {status === "driver_assigned" ? (
          <View style={[styles.statusBanner, styles.statusBannerLive]}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <Text style={[styles.statusBannerText, styles.statusBannerLiveText]}>
              Driver accepted your ride
            </Text>
          </View>
        ) : null}

        {status === "driver_arrived" ? (
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.pickup} />
            <Text style={styles.statusBannerText}>Driver has arrived</Text>
          </View>
        ) : null}

        {status === "in_progress" ? (
          <View style={[styles.statusBanner, styles.statusBannerLive]}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
            <Text style={[styles.statusBannerText, styles.statusBannerLiveText]}>
              Trip in progress
            </Text>
          </View>
        ) : null}

        {showOtp && startOtp ? (
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>Share this OTP</Text>
            <Text style={styles.otpHint} numberOfLines={2}>
              Give this code to the driver to start the ride
            </Text>
            <OtpBoxes otp={startOtp} />
          </View>
        ) : null}

        <View style={[styles.actionsRow, showOtp && styles.actionsRowCompact]}>
          <ActionButton label="Call" icon="call-outline" onPress={handleCall} />
          <ActionButton
            label="Share"
            icon="share-social-outline"
            onPress={handleShare}
          />
          <ActionButton
            label="SOS"
            icon="warning"
            onPress={handleSos}
            variant="sos"
          />
        </View>
      </ScrollView>

      {canCancel ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isCancelling}
            onPress={handleCancelPress}
            style={[styles.cancelButton, isCancelling && { opacity: 0.6 }]}
          >
            {isCancelling ? (
              <ActivityIndicator color={FIGMA.textPrimary} />
            ) : (
              <Text style={styles.cancelText}>Cancel Ride</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(DriverOnWayPanel);

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 33,
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
    paddingTop: 24,
    paddingBottom: 12,
    gap: 24,
  },
  scrollContentCompact: {
    gap: 16,
    paddingTop: 20,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  statusBannerLive: {
    backgroundColor: COLORS.badgeBg,
  },
  statusBannerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.pickup,
  },
  statusBannerLiveText: {
    color: COLORS.primary,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
  otpCard: {
    borderWidth: 1,
    borderColor: FIGMA.otpBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
  },
  otpHint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    color: FIGMA.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  otpTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 22,
    color: FIGMA.textPrimary,
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    width: "100%",
  },
  otpBox: {
    borderRadius: 14,
    backgroundColor: FIGMA.otpBoxBg,
    borderWidth: 1,
    borderColor: FIGMA.otpBoxBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: FIGMA.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  actionsRowCompact: {
    paddingHorizontal: 8,
  },
  actionItem: {
    width: 88,
    alignItems: "center",
    gap: 6,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    backgroundColor: FIGMA.actionBg,
    borderWidth: 1,
    borderColor: FIGMA.actionBorder,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionCircleSos: {
    backgroundColor: FIGMA.sosBg,
    borderColor: FIGMA.sosBorder,
  },
  actionLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 16,
    color: FIGMA.textSecondary,
    textAlign: "center",
  },
  actionLabelSos: {
    color: FIGMA.sosText,
  },
  footer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F3F4F6",
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
