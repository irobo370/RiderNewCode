import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";
import { SPACING } from "../../utils/spacing";
import BookingStepIndicator from "./BookingStepIndicator";
import { formatFare } from "../../utils/rideHelpers";
import { DEFAULT_CURRENCY } from "../../constants/locale";
import { getMapLifecyclePanelHeight } from "../../constants/mapLayout";

const HORIZONTAL_PADDING = 18;
const PANEL_HEIGHT = getMapLifecyclePanelHeight();
const FOOTER_HEIGHT = 68;

const FIGMA = {
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  borderInactive: "#E8E8EA",
  iconInactiveBg: "#EEEEF0",
  iconActiveBg: "#DEE0FF",
  providerPanelBg: "#F9F9FC",
  providerBorder: "rgba(7, 115, 222, 0.1)",
  badgeBg: "#DEE0FF",
  divider: "#EEEEF0",
  chevronMuted: "#747688",
};

const G4R_LOGO = require("../../../assets/icon.png");

const RIDE_CATEGORIES = [
  {
    key: "mini",
    name: "Mini",
    subtitle: "Affordable daily rides",
    bestFor: "Best for 1–3 passengers",
    capacity: "4 seats",
    apiSlug: "mini",
    icon: "car-sport-outline",
    placeholderFrom: "from FC 12,000",
  },
  {
    key: "prime",
    name: "Prime",
    subtitle: "Top-rated drivers & sedans",
    bestFor: "Best for comfort",
    capacity: "4 seats",
    apiSlug: "sedan",
    icon: "car-outline",
    placeholderFrom: "from FC 18,000",
  },
  {
    key: "bike",
    name: "Bike",
    subtitle: "Quick solo trips",
    bestFor: "Best for solo riders",
    capacity: "1 seat",
    apiSlug: "bike",
    icon: "bicycle-outline",
    placeholderFrom: "from FC 8,000",
  },
  {
    key: "xl",
    name: "XL",
    subtitle: "SUVs for up to 6 people",
    bestFor: "Best for groups",
    capacity: "6 seats",
    apiSlug: "xl",
    icon: "bus-outline",
    placeholderFrom: "from FC 24,000",
  },
];

function getQuoteOption(quote, apiSlug) {
  return quote?.options?.find((option) => option.slug === apiSlug);
}

function getFastestSlug(quote) {
  if (!quote?.options?.length) return null;
  let fastest = null;
  let minEta = Infinity;
  for (const option of quote.options) {
    if (!option.available) continue;
    const eta = option.pickup_eta_min ?? option.total_eta_min ?? null;
    if (eta != null && eta < minEta) {
      minEta = eta;
      fastest = option.slug;
    }
  }
  return fastest;
}

function getCheapestSlug(quote) {
  if (!quote?.options?.length) return null;
  let cheapest = null;
  let minFare = Infinity;
  for (const option of quote.options) {
    if (!option.available) continue;
    const fare = parseFloat(option.estimated_fare ?? "0");
    if (fare > 0 && fare < minFare) {
      minFare = fare;
      cheapest = option.slug;
    }
  }
  return cheapest;
}

function buildProviders(quote, apiSlug) {
  const g4rOption = getQuoteOption(quote, apiSlug);
  const currency = quote?.currency ?? DEFAULT_CURRENCY;
  const g4rFare = parseFloat(g4rOption?.estimated_fare ?? "0");
  const g4rEta = g4rOption?.pickup_eta_min ?? g4rOption?.total_eta_min ?? 3;

  return [
    {
      id: "g4r",
      name: "G4R",
      isG4R: true,
      eta: g4rEta,
      fare: g4rOption?.estimated_fare,
      currency,
      available: g4rOption?.available ?? false,
      cheapest: true,
    },
    {
      id: "provider_a",
      name: "A",
      isPlaceholder: true,
      eta: 5,
      fare: g4rFare > 0 ? String(Math.round(g4rFare * 1.18)) : "18",
      currency,
    },
    {
      id: "provider_b",
      name: "B",
      isPlaceholder: true,
      eta: 6,
      fare: g4rFare > 0 ? String(Math.round(g4rFare * 1.14)) : "17",
      currency,
    },
  ];
}

function RideSelectionBottomSheet({
  visible,
  onClose,
  onSelectRide,
  quote,
  isQuoteLoading,
  quoteError,
  onRetryQuote,
}) {
  const insets = useSafeAreaInsets();
  const [expandedKey, setExpandedKey] = useState("mini");
  const [selectedSlug, setSelectedSlug] = useState("mini");
  const [selectedProvider, setSelectedProvider] = useState("g4r");

  const selectedCategory =
    RIDE_CATEGORIES.find((c) => c.apiSlug === selectedSlug) ??
    RIDE_CATEGORIES.find((c) => c.key === expandedKey);

  useEffect(() => {
    setExpandedKey("mini");
    setSelectedSlug("mini");
    setSelectedProvider("g4r");
  }, [quote?.quote_expires_at]);

  const toggleCategory = (category) => {
    setExpandedKey(category.key);
    setSelectedSlug(category.apiSlug);
    setSelectedProvider("g4r");
  };

  const getFromLabel = (category) => {
    const option = getQuoteOption(quote, category.apiSlug);
    if (option?.estimated_fare) {
      return `from ${formatFare(quote?.currency ?? DEFAULT_CURRENCY, option.estimated_fare)}`;
    }
    return category.placeholderFrom;
  };

  const handleConfirm = useCallback(() => {
    if (selectedProvider !== "g4r") return;
    onSelectRide?.({ rideTypeSlug: selectedSlug });
  }, [onSelectRide, selectedProvider, selectedSlug]);

  const confirmLabel = `Confirm ${selectedCategory?.name ?? "Ride"}`;

  const fastestSlug = getFastestSlug(quote);
  const cheapestSlug = getCheapestSlug(quote);

  const isConfirmDisabled =
    !selectedSlug ||
    selectedProvider !== "g4r" ||
    isQuoteLoading ||
    !!quoteError;

  const renderProviderRow = (provider) => {
    const isG4R = provider.isG4R;
    const isSelected = isG4R && selectedProvider === "g4r";

    return (
      <TouchableOpacity
        key={provider.id}
        activeOpacity={isG4R ? 0.9 : 1}
        disabled={!isG4R || !provider.available}
        onPress={() => {
          if (isG4R) setSelectedProvider("g4r");
        }}
        style={[
          styles.providerRow,
          isSelected && styles.providerRowSelected,
          isG4R && !provider.available && styles.providerRowDisabled,
        ]}
      >
        <View style={styles.providerLeft}>
          {isG4R ? (
            <Image source={G4R_LOGO} style={styles.g4rLogoImage} />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderLogoText}>{provider.name}</Text>
            </View>
          )}

          <View style={styles.providerText}>
            <View style={styles.providerNameRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {isG4R && provider.cheapest ? (
                <View style={styles.cheapestBadge}>
                  <Text style={styles.cheapestBadgeText}>CHEAPEST</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.providerEta}>
              {isG4R && !provider.available
                ? "No drivers nearby"
                : `ETA: ${provider.eta} mins`}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.providerFare,
            isG4R && isSelected && styles.providerFareActive,
          ]}
        >
          {formatFare(provider.currency ?? DEFAULT_CURRENCY, provider.fare ?? "0")}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.panel, { height: PANEL_HEIGHT }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        bounces
      >
        <Text style={styles.header}>Select Ride</Text>
        <BookingStepIndicator currentStep="ride" />

        {quote?.route?.distance_km || quote?.route?.duration_min ? (
          <View style={styles.routeSummary}>
            <Text style={styles.routeSummaryText}>
              {[
                quote?.route?.duration_min
                  ? `${Math.round(Number(quote.route.duration_min))} min`
                  : null,
                quote?.route?.distance_km
                  ? `${Number(quote.route.distance_km).toFixed(1)} km`
                  : null,
              ]
                .filter(Boolean)
                .join("  •  ")}
            </Text>
          </View>
        ) : null}

        {isQuoteLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Fetching fares...</Text>
          </View>
        ) : null}

        {!isQuoteLoading && quoteError ? (
          <View style={styles.stateBox}>
            <Ionicons
              name="cloud-offline-outline"
              size={40}
              color={COLORS.textLight}
            />
            <Text style={styles.stateText}>
              {quoteError || "Check your connection and try again"}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRetryQuote}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isQuoteLoading && !quoteError ? (
          <View style={styles.categoryList}>
            {RIDE_CATEGORIES.map((category) => {
              const isExpanded = expandedKey === category.key;
              const providers = buildProviders(quote, category.apiSlug);
              const option = getQuoteOption(quote, category.apiSlug);
              const isUnavailable = option && !option.available;

              return (
                <View
                  key={category.key}
                  style={[
                    styles.categoryCard,
                    isExpanded && styles.categoryCardExpanded,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                      styles.categoryHeader,
                      isExpanded && styles.categoryHeaderExpanded,
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          isExpanded
                            ? styles.categoryIconActive
                            : styles.categoryIconInactive,
                        ]}
                      >
                        <Ionicons
                          name={category.icon}
                          size={22}
                          color={
                            isExpanded ? COLORS.primary : FIGMA.textSecondary
                          }
                        />
                      </View>

                      <View style={styles.categoryText}>
                        <View style={styles.categoryNameRow}>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          {category.apiSlug === fastestSlug ? (
                            <View style={styles.tagBadge}>
                              <Text style={styles.tagBadgeText}>FASTEST</Text>
                            </View>
                          ) : null}
                          {category.apiSlug === cheapestSlug ? (
                            <View style={[styles.tagBadge, styles.tagBadgeAlt]}>
                              <Text style={styles.tagBadgeText}>CHEAPEST</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.categorySubtitle,
                            isExpanded && styles.categorySubtitleActive,
                          ]}
                        >
                          {category.subtitle}
                        </Text>
                        <Text style={styles.categoryMeta}>
                          {category.capacity} · {category.bestFor}
                        </Text>
                        {isUnavailable ? (
                          <Text style={styles.unavailableText}>
                            No drivers nearby — try another ride type
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.categoryRight}>
                      {!isExpanded ? (
                        <Text style={styles.fromPrice}>
                          {getFromLabel(category)}
                        </Text>
                      ) : null}
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={isExpanded ? COLORS.primary : FIGMA.chevronMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.providerPanel}>
                      {providers.map((provider) => renderProviderRow(provider))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.confirmFooter, { paddingBottom: insets.bottom + 8 }]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isConfirmDisabled}
          onPress={handleConfirm}
        >
          <LinearGradient
            colors={["#0773DE", "#37DDCC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.confirmButton,
              isConfirmDisabled && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(RideSelectionBottomSheet);

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 30,
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
    paddingBottom: 16,
  },
  header: {
    ...TYPO.section,
    color: FIGMA.textPrimary,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: FIGMA.borderInactive,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(59, 91, 255, 0.04)",
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryCardExpanded: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(59, 91, 255, 0.08)",
        shadowOpacity: 1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  categoryHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.divider,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconActive: {
    backgroundColor: FIGMA.iconActiveBg,
  },
  categoryIconInactive: {
    backgroundColor: FIGMA.iconInactiveBg,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: FIGMA.badgeBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagBadgeAlt: {
    backgroundColor: "#E8F9F6",
  },
  tagBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    lineHeight: 12,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  categoryMeta: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
    color: FIGMA.textSecondary,
    marginTop: 2,
  },
  unavailableText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  categoryName: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textPrimary,
  },
  categorySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 20,
    color: FIGMA.textSecondary,
  },
  categorySubtitleActive: {
    color: COLORS.primary,
  },
  categoryRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 8,
  },
  fromPrice: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: FIGMA.textSecondary,
    textAlign: "right",
  },
  providerPanel: {
    backgroundColor: FIGMA.providerPanelBg,
    padding: 16,
    gap: 6,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
  },
  providerRowSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: FIGMA.providerBorder,
  },
  providerRowDisabled: {
    opacity: 0.5,
  },
  providerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  g4rLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    resizeMode: "cover",
  },
  placeholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8E8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLogoText: {
    color: FIGMA.textPrimary,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  providerText: {
    flex: 1,
    gap: 2,
  },
  providerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  providerName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 24,
    color: FIGMA.textPrimary,
  },
  cheapestBadge: {
    backgroundColor: FIGMA.badgeBg,
    borderRadius: 9999,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  cheapestBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  providerEta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 20,
    color: FIGMA.textSecondary,
  },
  providerFare: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA.textPrimary,
    textAlign: "right",
    minWidth: 66,
  },
  providerFareActive: {
    color: COLORS.primary,
  },
  confirmFooter: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FIGMA.divider,
    minHeight: FOOTER_HEIGHT,
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
  routeSummary: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: SPACING.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.badgeBg,
    alignItems: "center",
  },
  routeSummaryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  stateText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: FIGMA.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  retryText: {
    fontFamily: FONTS.semiBold,
    color: FIGMA.textPrimary,
  },
});
