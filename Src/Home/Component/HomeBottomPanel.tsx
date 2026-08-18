import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";
import { RADIUS, SPACING } from "../../utils/spacing";
import type { RecentDestination } from "../../utils/recentDestinations";

type Offer = {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  variant: "premium" | "eco";
};

const OFFER_IMAGES = {
  premium: require("../../../assets/promotional-car.png"),
  eco: require("../../../assets/promotional-bike.png"),
} as const;

/** Figma: promotional-car.png frame inside 18px horizontal padding (393 − 36 = 357) */
const OFFER_CARD = {
  width: 357,
  height: 192,
} as const;

type HomeBottomPanelProps = {
  recentDestinations?: RecentDestination[];
  specialOffers?: Offer[];
  isRecentDestinationsLoading?: boolean;
  onDestinationPress?: (destination: RecentDestination) => void;
  locationGuidance?: string | null;
  hasPickup?: boolean;
  homePlace?: { id: string; label: string; address_line: string; lat: string; lng: string } | null;
  workPlace?: { id: string; label: string; address_line: string; lat: string; lng: string } | null;
  onSavedPlacePress?: (place: {
    id: string;
    label: string;
    address_line: string;
    lat: string;
    lng: string;
  }) => void;
  onAddSavedPlace?: () => void;
};

export default function HomeBottomPanel({
  recentDestinations = [],
  specialOffers = [],
  isRecentDestinationsLoading = false,
  onDestinationPress,
  locationGuidance,
  hasPickup = true,
  homePlace = null,
  workPlace = null,
  onSavedPlacePress,
  onAddSavedPlace,
}: HomeBottomPanelProps) {
  const navigation = useNavigation();

  const openLocationSearch = (query = "") => {
    navigation.navigate("LocationSearch", {
      initialQuery: query.trim(),
      initialField: "drop",
    });
  };

  const handleDestinationPress = (destination: RecentDestination) => {
    if (onDestinationPress) {
      onDestinationPress(destination);
      return;
    }

    openLocationSearch(destination.title);
  };

  return (
    <View style={styles.panel}>
      {locationGuidance ? (
        <View style={styles.guidanceBanner}>
          <Ionicons
            name={hasPickup ? "navigate-outline" : "location-outline"}
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.guidanceBannerText}>{locationGuidance}</Text>
        </View>
      ) : null}

      <View style={styles.savedRow}>
        <TouchableOpacity
          style={styles.savedChip}
          onPress={() =>
            homePlace ? onSavedPlacePress?.(homePlace) : onAddSavedPlace?.()
          }
          activeOpacity={0.85}
        >
          <View style={styles.savedIcon}>
            <Ionicons name="home-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.savedCopy}>
            <Text style={styles.savedTitle}>Home</Text>
            <Text style={styles.savedSubtitle} numberOfLines={1}>
              {homePlace?.address_line ?? "Add home"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.savedChip}
          onPress={() =>
            workPlace ? onSavedPlacePress?.(workPlace) : onAddSavedPlace?.()
          }
          activeOpacity={0.85}
        >
          <View style={styles.savedIcon}>
            <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.savedCopy}>
            <Text style={styles.savedTitle}>Work</Text>
            <Text style={styles.savedSubtitle} numberOfLines={1}>
              {workPlace?.address_line ?? "Add work"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent</Text>

      <View style={styles.listCard}>
        {isRecentDestinationsLoading ? (
          <Text style={styles.emptyText}>Loading recent destinations…</Text>
        ) : recentDestinations.length === 0 ? (
          <Text style={styles.emptyText}>No recent destinations yet</Text>
        ) : (
          recentDestinations.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.destinationRow,
                index < recentDestinations.length - 1 && styles.rowBorder,
              ]}
              onPress={() => handleDestinationPress(item)}
            >
            <View style={styles.distanceCol}>
              <Ionicons
                name="navigate-outline"
                size={16}
                color={COLORS.textMuted}
              />
              <Text style={styles.distanceText}>{item.distance}</Text>
            </View>

            <View style={styles.destinationText}>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <Text style={styles.destinationAddress} numberOfLines={2}>
                {item.address}
              </Text>
            </View>

            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => {}}
            >
              <MaterialIcons
                name="more-vert"
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={[styles.sectionTitle, styles.offersTitle]}>
        Special Offers
      </Text>

      <View style={styles.promoContainer}>
        {specialOffers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            activeOpacity={0.92}
            style={styles.offerOuterShadow}
          >
            <View style={styles.offerInnerShadow}>
              <View style={styles.offerCard}>
                {offer.variant === "eco" ? (
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      styles.ecoBackground,
                    ]}
                  />
                ) : null}

                <Image
                  source={OFFER_IMAGES[offer.variant]}
                  style={
                    offer.variant === "premium"
                      ? styles.promoCarImage
                      : styles.promoBikeImage
                  }
                  resizeMode="cover"
                />

                {offer.variant === "premium" ? (
                  <LinearGradient
                    colors={[
                      "rgba(7, 115, 222, 0.9)",
                      "rgba(7, 115, 222, 0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : (
                  <LinearGradient
                    colors={["rgba(15, 23, 42, 0.8)", "rgba(15, 23, 42, 0)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}

                <View style={styles.offerBackground}>
                  <View style={styles.offerContent}>
                    <View
                      style={[
                        styles.offerBadge,
                        offer.variant === "eco" && styles.offerBadgeEco,
                      ]}
                    >
                      <Text style={styles.offerBadgeText}>{offer.badge}</Text>
                    </View>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  guidanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.badgeBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: SPACING.lg,
  },
  guidanceBannerText: {
    ...TYPO.bodySm,
    color: COLORS.primary,
    flex: 1,
  },
  savedRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: SPACING.xl,
  },
  savedChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  savedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  savedCopy: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.black,
  },
  savedSubtitle: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    ...TYPO.section,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  offersTitle: {
    marginTop: SPACING.xxl,
  },
  listCard: {
    backgroundColor: COLORS.white,
  },
  emptyText: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
    paddingVertical: SPACING.lg,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  distanceCol: {
    minWidth: 44,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm - 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  distanceText: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  destinationText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  destinationTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.black,
    marginBottom: 4,
  },
  destinationAddress: {
    ...TYPO.bodySm,
    color: COLORS.text,
    lineHeight: 18,
  },
  promoContainer: {
    gap: SPACING.lg,
  },
  offerOuterShadow: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.004)",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.102,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  offerInnerShadow: {
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.102,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  offerCard: {
    width: "100%",
    height: OFFER_CARD.height,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.004)",
  },
  ecoBackground: {
    backgroundColor: "#0F172A",
  },
  promoCarImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: OFFER_CARD.height,
    opacity: 1,
  },
  promoBikeImage: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: OFFER_CARD.height,
    opacity: 1,
  },
  offerBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  offerContent: {
    padding: 24,
    maxWidth: "62%",
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  offerBadgeEco: {
    backgroundColor: COLORS.primary,
  },
  offerBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.6,
  },
  offerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 18,
  },
});
