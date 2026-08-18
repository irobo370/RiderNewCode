import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { TYPO } from "../../utils/typography";
import { RADIUS, SPACING, SHADOW } from "../../utils/spacing";
import { SHEET_HANDLE } from "../../components/ui";

const OFFER_IMAGES = {
  premium: require("../../../assets/promotional-car.png"),
  eco: require("../../../assets/promotional-bike.png"),
};

const LocationBottomSheet = forwardRef(
  ({ recentDestinations = [], specialOffers = [], bottomInset = 72 }, ref) => {
    const snapPoints = useMemo(() => ["58%", "88%"], []);
    const navigation = useNavigation();

    const openLocationSearch = (query = "") => {
      navigation.navigate("LocationSearch", {
        initialQuery: query.trim(),
        initialField: "drop",
      });
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        handleIndicatorStyle={SHEET_HANDLE.indicatorStyle}
        backgroundStyle={SHEET_HANDLE.backgroundStyle}
      >
        <BottomSheetView style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomInset + SPACING.xl }}
          >
            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.9}
              onPress={() => openLocationSearch()}
            >
              <Ionicons name="search" size={20} color={COLORS.textMuted} />
              <Text style={styles.searchPlaceholder}>Where to go?</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Recent destinations</Text>

            <View style={styles.listCard}>
              {recentDestinations.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.destinationRow,
                    index < recentDestinations.length - 1 && styles.rowBorder,
                  ]}
                  onPress={() => openLocationSearch(item.title)}
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
              ))}
            </View>

            <Text style={styles.sectionTitle}>Special Offers</Text>

            {specialOffers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                activeOpacity={0.92}
                style={styles.offerWrapper}
              >
                <LinearGradient
                  colors={
                    offer.variant === "premium"
                      ? ["#0773DE", "#5BA8FF", "#E8F2FF"]
                      : COLORS.darkGradient
                  }
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.offerCard}
                >
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

                  <Image
                    source={OFFER_IMAGES[offer.variant] ?? OFFER_IMAGES.premium}
                    style={styles.offerImage}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default LocationBottomSheet;

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.lg,
    height: 52,
    marginTop: -SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
    ...SHADOW.card,
  },
  searchPlaceholder: {
    ...TYPO.body,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    ...TYPO.section,
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    marginBottom: SPACING.xxl,
    overflow: "hidden",
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  distanceCol: {
    width: 44,
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  distanceText: {
    marginTop: 4,
    fontSize: 11,
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
  offerWrapper: {
    marginBottom: SPACING.md,
  },
  offerCard: {
    borderRadius: RADIUS.cardLg,
    minHeight: 120,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingLeft: SPACING.lg,
  },
  offerContent: {
    flex: 1,
    paddingVertical: SPACING.lg,
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: RADIUS.badge,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginBottom: SPACING.sm,
  },
  offerBadgeEco: {
    backgroundColor: COLORS.primary,
  },
  offerBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: "rgba(255,255,255,0.9)",
  },
  offerImage: {
    width: 130,
    height: 90,
    marginRight: SPACING.sm,
  },
});
