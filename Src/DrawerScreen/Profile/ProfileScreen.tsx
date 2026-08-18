import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";
import { ScreenHeader } from "../../components/ui";
import HomeBottomTabBar from "../../Home/Component/HomeBottomTabBar";
import { useSessionDataRefresh } from "../../hooks/useSessionDataRefresh";
import { logoutRequest } from "../../redux/Auth/sessionSlice";
import type {
  PaymentMethod,
  ProfileData,
  SavedAddress,
} from "../../service/api/types";
import {
  formatAddressDistance,
  formatPaymentBrandLabel,
  formatPaymentExpiry,
  formatPaymentMethodTitle,
} from "../../utils/profileHelpers";

const DEFAULT_AVATAR = require("../../../assets/header-avatar.jpg");

type SessionState = {
  profile: ProfileData | null;
  addresses: SavedAddress[];
  paymentMethods: PaymentMethod[];
  user: { name?: string | null; phone?: string } | null;
};

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function IconBox({
  children,
  size = 42,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <View style={[styles.iconBox, { width: size, height: size }]}>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <IconBox>
        <Ionicons name={icon} size={20} color="#212B32" />
      </IconBox>
      <View style={styles.infoTextCol}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AddressRow({
  address,
  onPress,
}: {
  address: SavedAddress;
  onPress: () => void;
}) {
  const distance = formatAddressDistance(address.distance_m);

  return (
    <TouchableOpacity style={styles.addressRow} onPress={onPress}>
      <View style={styles.addressDistanceBadge}>
        <Ionicons name="location-outline" size={12} color={COLORS.dark} />
        {distance ? (
          <Text style={styles.addressDistanceText}>{distance}</Text>
        ) : null}
      </View>

      <View style={styles.addressContent}>
        <Text style={styles.addressLabel}>{address.label}</Text>
        <Text style={styles.addressLine} numberOfLines={2}>
          {address.address_line}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color="#C1C6D7" />
    </TouchableOpacity>
  );
}

function PaymentMethodRow({ method }: { method: PaymentMethod }) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentBrandBadge}>
        <Text style={styles.paymentBrandText}>
          {formatPaymentBrandLabel(method.brand).toUpperCase()}
        </Text>
      </View>

      <View style={styles.paymentTextCol}>
        <Text style={styles.paymentTitle}>
          {formatPaymentMethodTitle(method)}
        </Text>
        <Text style={styles.paymentExpiry}>{formatPaymentExpiry(method)}</Text>
      </View>

      <View
        style={[
          styles.paymentRadio,
          method.is_default && styles.paymentRadioSelected,
        ]}
      >
        {method.is_default ? <View style={styles.paymentRadioDot} /> : null}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { refresh, refreshing } = useSessionDataRefresh();

  const { profile, addresses, user } = useSelector(
    (state: { session: SessionState }) => state.session,
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const displayName = profile?.name?.trim() || user?.name?.trim() || "Rider";
  const displayPhone = profile?.phone || user?.phone || "";
  const displayEmail = profile?.email?.trim() || "Not added";

  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : DEFAULT_AVATAR;

  const handleLogout = () => {
    dispatch(logoutRequest());
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <ScreenHeader title="Profile" style={styles.header} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          <LinearGradient
            colors={["#0773DE", "#37DDCC"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroCard}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <View style={styles.avatarRing}>
                  <Image source={avatarSource} style={styles.avatar} />
                </View>

                <View style={styles.heroTextCol}>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {displayPhone ? (
                    <Text style={styles.heroPhone}>{displayPhone}</Text>
                  ) : null}
                </View>
              </View>

              {/* <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("CompleteProfileScreen")}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity> */}
            </View>
          </LinearGradient>

          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => navigation.navigate("SettingScreen")}
            accessibilityRole="button"
          >
            <View style={styles.settingsLeft}>
              <IconBox>
                <Ionicons name="shield-outline" size={20} color={COLORS.dark} />
              </IconBox>
              <Text style={styles.settingsLabel}>Settings</Text>
            </View>

            <View style={styles.settingsChevronWrap}>
              <Ionicons name="chevron-forward" size={16} color={COLORS.dark} />
            </View>
          </TouchableOpacity>

          <View style={styles.sectionBlock}>
            <SectionTitle title="Personal Information" />
            <View style={styles.groupCard}>
              <View style={[styles.groupRow, styles.groupRowFirst]}>
                <InfoRow
                  icon="person-outline"
                  label="Full Name"
                  value={displayName}
                />
              </View>
              <View style={styles.groupRow}>
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={displayEmail}
                />
              </View>
              <View style={[styles.groupRow, styles.groupRowLast]}>
                <InfoRow
                  icon="call-outline"
                  label="Phone"
                  value={displayPhone || "Not added"}
                />
              </View>
            </View>
          </View>

          {/* <View style={styles.sectionBlock}>
            <SectionTitle title="Saved Addresses" />
            <View style={styles.groupCard}>
              {addresses.length === 0 ? (
                <TouchableOpacity
                  style={[styles.groupRow, styles.groupRowSingle]}
                  onPress={() => navigation.navigate("AddressScreen")}
                >
                  <Text style={styles.emptySectionText}>
                    No saved addresses
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#C1C6D7" />
                </TouchableOpacity>
              ) : (
                addresses.map((address, index) => (
                  <View
                    key={address.id}
                    style={[
                      styles.groupRow,
                      index === 0 && styles.groupRowFirst,
                      index === addresses.length - 1 && styles.groupRowLast,
                    ]}
                  >
                    <AddressRow
                      address={address}
                      onPress={() => navigation.navigate("AddressScreen")}
                    />
                  </View>
                ))
              )}
            </View>
          </View> */}

          {/* Payment Methods section — commented out
          <View style={styles.sectionBlock}>
            <SectionTitle title="Payment Methods" />
            <View style={styles.groupCard}>
              {paymentMethods.length === 0 ? (
                <TouchableOpacity
                  style={[styles.groupRow, styles.groupRowSingle]}
                  onPress={() => navigation.navigate("PaymentMethodScreen")}
                >
                  <Text style={styles.emptySectionText}>No payment methods</Text>
                  <Ionicons name="chevron-forward" size={14} color="#C1C6D7" />
                </TouchableOpacity>
              ) : (
                paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.groupRow, styles.groupRowSingle]}
                    onPress={() => navigation.navigate("PaymentMethodScreen")}
                  >
                    <PaymentMethodRow method={method} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
          */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <HomeBottomTabBar activeTab="profile" embedded />
    </SafeAreaView>
  );
}

const CARD_BORDER = "rgba(33, 43, 50, 0.1)";
const ROW_BORDER = "rgba(16, 24, 40, 0.1)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg + 2,
  },
  heroCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: SPACING.lg + 4,
    paddingVertical: SPACING.xl,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    marginRight: SPACING.md,
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.6,
    borderColor: COLORS.white,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  heroTextCol: {
    flex: 1,
  },
  heroName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.white,
  },
  heroPhone: {
    marginTop: 2,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.7)",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xs,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  settingsLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.dark,
  },
  settingsChevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(33, 43, 50, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlock: {
    gap: SPACING.sm + 2,
  },
  sectionTitle: {
    marginLeft: SPACING.xs,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#6C7278",
  },
  groupCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  groupRow: {
    borderBottomWidth: 1,
    borderBottomColor: ROW_BORDER,
    paddingHorizontal: SPACING.lg + 4,
    paddingVertical: SPACING.lg + 4,
  },
  groupRowFirst: {
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
  groupRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  groupRowSingle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    borderRadius: RADIUS.input,
    backgroundColor: "rgba(16, 24, 40, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  infoTextCol: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  infoValue: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: "#212B32",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm + 2,
  },
  addressDistanceBadge: {
    width: 38,
    minHeight: 38,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    gap: 5,
  },
  addressDistanceText: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.dark,
    textAlign: "center",
  },
  addressContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  addressLabel: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: "#212B32",
  },
  addressLine: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    flex: 1,
  },
  paymentBrandBadge: {
    width: 48,
    height: 32,
    borderRadius: RADIUS.badge,
    borderWidth: 1,
    borderColor: "rgba(193, 198, 215, 0.2)",
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBrandText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 15,
    color: "#1A1F71",
  },
  paymentTextCol: {
    flex: 1,
    gap: 2,
  },
  paymentTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.dark,
  },
  paymentExpiry: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
    color: "#6C7278",
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C1C6D7",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentRadioSelected: {
    borderColor: COLORS.primary,
  },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  emptySectionText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: "#FFDAD6",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)",
    marginTop: SPACING.sm,
  },
  logoutText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: "#BA1A1A",
  },
});
