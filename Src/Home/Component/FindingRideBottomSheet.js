import React, { useEffect, useCallback, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import BookingStepIndicator from "./BookingStepIndicator";
import { getMapLifecyclePanelHeight } from "../../constants/mapLayout";

const HORIZONTAL_PADDING = 20;
const PANEL_HEIGHT = getMapLifecyclePanelHeight();
const PROGRESS_TRACK_WIDTH = 353;

const FIGMA = {
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  progressTrack: "rgba(33, 43, 50, 0.1)",
  progressFill: "#0773DE",
  tripCardBorder: "rgba(33, 43, 50, 0.15)",
  menuButtonBg: "#F4F3F8",
};

const STATUS_COPY = {
  requested: {
    title: "Ride requested",
    subtitle: "Finding drivers nearby",
  },
  searching_driver: {
    title: "Ride requested",
    subtitle: "Finding drivers nearby",
  },
  driver_assigned: {
    title: "Driver on the way",
    subtitle: "Your driver is heading to pickup",
  },
  driver_arrived: {
    title: "Driver has arrived",
    subtitle: "Your driver is at the pickup point",
  },
  in_progress: {
    title: "Enjoy your ride",
    subtitle: "Trip in progress",
  },
  completed: {
    title: "Ride completed",
    subtitle: "Thanks for riding with us",
  },
  cancelled: {
    title: "Ride cancelled",
    subtitle: "This ride is no longer active",
  },
};

const SEARCH_TIPS = [
  "Searching for drivers within 3 km of your pickup",
  "You can cancel free while we search for a driver",
  "Share your live trip from the menu once a driver is assigned",
  "All Go4Ride drivers are verified before going online",
];

const CANCELLABLE_STATUSES = new Set([
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_arrived",
]);

function getStatusCopy(status, driver) {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.searching_driver;

  if (status === "driver_assigned" && driver?.name) {
    return {
      title: copy.title,
      subtitle: `${driver.name} is heading to you`,
    };
  }

  if (status === "driver_arrived" && driver?.name) {
    return {
      title: copy.title,
      subtitle: `${driver.name} is at your pickup point`,
    };
  }

  return copy;
}

function getTripInstruction(status) {
  if (status === "in_progress") {
    return "Heading to your destination";
  }
  if (status === "driver_arrived") {
    return "Meet your driver at the pickup point";
  }
  if (status === "driver_assigned") {
    return "Your driver is on the way";
  }
  return "Meet at the pickup point";
}

function FindingRideBottomSheet({
  visible,
  onCancel,
  isCancelling,
  status,
}) {
  const insets = useSafeAreaInsets();
  const [tipIndex, setTipIndex] = useState(0);
  const isSearching =
    !status || status === "requested" || status === "searching_driver";
  const canCancel = !status || CANCELLABLE_STATUSES.has(status);
  const { title, subtitle } = getStatusCopy(
    status ?? "searching_driver",
    null,
  );
  const tripInstruction = getTripInstruction(status ?? "searching_driver");
  const activeTip = SEARCH_TIPS[tipIndex % SEARCH_TIPS.length];

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible || !isSearching) return undefined;

    const timer = setInterval(() => {
      setTipIndex((current) => (current + 1) % SEARCH_TIPS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [visible, isSearching]);

  const startProgressAnimation = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [progress]);

  useEffect(() => {
    if (!visible || !isSearching) {
      cancelAnimation(progress);
      progress.value = isSearching ? 0 : 1;
      return undefined;
    }

    startProgressAnimation();
    return () => cancelAnimation(progress);
  }, [visible, isSearching, progress, startProgressAnimation]);

  const progressFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(progress.value, 0.001) }],
  }));

  const handleMenuPress = () => {
    Alert.alert("Ride options", undefined, [{ text: "Dismiss", style: "cancel" }]);
  };

  const handleCancelPress = () => {
    Alert.alert(
      "Cancel request?",
      "Your ride request will be cancelled. You can book again anytime.",
      [
      { text: "Keep searching", style: "cancel" },
      {
        text: "Cancel Request",
        style: "destructive",
        onPress: onCancel,
      },
    ]);
  };

  if (!visible) return null;

  return (
    <View style={[styles.panel, { height: PANEL_HEIGHT }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <BookingStepIndicator currentStep="go" />

        <View style={styles.headerBlock}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {isSearching ? (
              <Text style={styles.tipText}>{activeTip}</Text>
            ) : null}
          </View>

          <View style={styles.progressTrack}>
            {isSearching ? (
              <Reanimated.View style={[styles.progressFill, progressFillStyle]} />
            ) : (
              <View style={[styles.progressFill, styles.progressFillComplete]} />
            )}
          </View>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripCardContent}>
            <Text style={styles.tripLabel}>Trip Details</Text>
            <Text style={styles.tripInstruction}>{tripInstruction}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            disabled={isCancelling}
            accessibilityRole="button"
            accessibilityLabel="Ride options"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={FIGMA.textPrimary}
            />
          </TouchableOpacity>
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
              <Text style={styles.cancelText}>Cancel Request</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(FindingRideBottomSheet);

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 32,
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
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 16,
  },
  headerBlock: {
    gap: 22,
  },
  headerText: {
    paddingHorizontal: 4,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: FIGMA.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: FIGMA.textSecondary,
  },
  tipText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.primary,
    marginTop: 8,
  },
  progressTrack: {
    width: "100%",
    maxWidth: PROGRESS_TRACK_WIDTH,
    height: 4,
    borderRadius: 24,
    backgroundColor: FIGMA.progressTrack,
    overflow: "hidden",
    alignSelf: "center",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    borderRadius: 24,
    backgroundColor: FIGMA.progressFill,
    transformOrigin: "left center",
  },
  progressFillComplete: {
    width: "100%",
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: FIGMA.tripCardBorder,
    borderRadius: 16,
  },
  tripCardContent: {
    flex: 1,
    gap: 4,
  },
  tripLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: FIGMA.textSecondary,
  },
  tripInstruction: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 23,
    color: FIGMA.textPrimary,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: FIGMA.menuButtonBg,
    alignItems: "center",
    justifyContent: "center",
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
