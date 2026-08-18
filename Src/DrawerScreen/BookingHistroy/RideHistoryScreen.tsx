import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";
import { ScreenHeader } from "../../components/ui";
import HomeBottomTabBar from "../../Home/Component/HomeBottomTabBar";
import {
  useRideHistory,
  type BookingFilter,
} from "../../hooks/rides/useRideHistory";
import {
  formatRideDateTime,
  formatRideTypeLabel,
  getRideFareLabel,
  getRideTimestamp,
  isRideCancelled,
  isRideCompleted,
} from "../../utils/bookingHelpers";
import {
  formatFare,
  isCoordinateLikeAddress,
  resolveDisplayAddress,
} from "../../utils/rideHelpers";
import type { Ride, RideInvoice } from "../../service/api/types";
import { DEFAULT_CURRENCY } from "../../constants/locale";
import {
  getRideInvoice,
  repeatRide,
} from "../../service/rideService/rideService";
import { reverseGeocodeAddress } from "../../utils/locationHelpers";

const FILTERS: BookingFilter[] = ["All", "Completed", "Cancelled"];

function RouteTimeline({
  pickup,
  dropoff,
}: {
  pickup: string;
  dropoff: string;
}) {
  return (
    <View style={styles.routeBlock}>
      <View style={styles.routeRow}>
        <View style={styles.timelineCol}>
          <View style={styles.timelineDotOuter}>
            <View style={styles.timelineDot} />
          </View>
          <View style={styles.timelineDash} />
        </View>
        <View style={styles.routeTextCol}>
          <Text style={styles.routeLabel}>Pick-up</Text>
          <Text style={styles.routeAddress} numberOfLines={2}>
            {pickup}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.timelineColEnd}>
          <View style={styles.timelineDotOuter}>
            <View style={styles.timelineDot} />
          </View>
        </View>
        <View style={styles.routeTextCol}>
          <Text style={styles.routeLabel}>Drop-off</Text>
          <Text style={styles.routeAddress} numberOfLines={2}>
            {dropoff}
          </Text>
        </View>
      </View>
    </View>
  );
}

function useReadableRideAddress(
  storedAddress: string | undefined,
  lat: string | undefined,
  lng: string | undefined,
  placeholder: string,
) {
  const [address, setAddress] = useState(() =>
    resolveDisplayAddress(storedAddress, null, placeholder),
  );

  useEffect(() => {
    let cancelled = false;

    const initial = resolveDisplayAddress(storedAddress, null, placeholder);
    setAddress(initial);

    if (!isCoordinateLikeAddress(storedAddress)) {
      return () => {
        cancelled = true;
      };
    }

    const latitude = parseFloat(lat ?? "");
    const longitude = parseFloat(lng ?? "");
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return () => {
        cancelled = true;
      };
    }

    reverseGeocodeAddress(latitude, longitude).then((resolved) => {
      if (!cancelled && resolved) {
        setAddress(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [storedAddress, lat, lng, placeholder]);

  return address;
}

function BookingCard({
  ride,
  onRepeat,
  onInvoice,
  repeating,
  loadingInvoice,
}: {
  ride: Ride;
  onRepeat: (ride: Ride) => void;
  onInvoice: (ride: Ride) => void;
  repeating: boolean;
  loadingInvoice: boolean;
}) {
  const completed = isRideCompleted(ride);
  const cancelled = isRideCancelled(ride);
  const { date, time } = formatRideDateTime(getRideTimestamp(ride));
  const fare = getRideFareLabel(ride);
  const rideType = formatRideTypeLabel(ride.ride_type_slug);
  const canDownloadInvoice = completed && ride.invoice_available;
  const pickupAddress = useReadableRideAddress(
    ride.pickup_address,
    ride.pickup_lat,
    ride.pickup_lng,
    "Pickup location",
  );
  const dropAddress = useReadableRideAddress(
    ride.drop_address,
    ride.drop_lat,
    ride.drop_lng,
    "Drop location",
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.statusBadge,
              completed ? styles.statusCompleted : styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                completed ? styles.statusTextCompleted : styles.statusTextCancelled,
              ]}
            >
              {completed ? "Completed" : "Cancelled"}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.metaText}>{date}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <Text
            style={[
              styles.fareText,
              completed ? styles.fareCompleted : styles.fareCancelled,
            ]}
          >
            {fare}
          </Text>
          <View style={styles.rideTypeBadge}>
            <Text style={styles.rideTypeText}>{rideType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <RouteTimeline pickup={pickupAddress} dropoff={dropAddress} />

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.repeatButtonWrap}
          onPress={() => onRepeat(ride)}
          disabled={repeating}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={COLORS.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.repeatButton}
          >
            {repeating ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.repeatButtonText}>Repeat Ride</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.invoiceButton,
            !canDownloadInvoice && styles.invoiceButtonDisabled,
          ]}
          onPress={() => onInvoice(ride)}
          disabled={!canDownloadInvoice || loadingInvoice}
          accessibilityRole="button"
        >
          {loadingInvoice ? (
            <ActivityIndicator color={COLORS.dark} size="small" />
          ) : (
            <Text
              style={[
                styles.invoiceButtonText,
                !canDownloadInvoice && styles.invoiceButtonTextDisabled,
              ]}
            >
              {canDownloadInvoice ? "Download Invoice" : "No Invoice"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InvoiceModal({
  visible,
  invoice,
  onClose,
}: {
  visible: boolean;
  invoice: RideInvoice | null;
  onClose: () => void;
}) {
  if (!invoice) {
    return null;
  }

  const fare = invoice.final_fare
    ? formatFare(invoice.currency ?? DEFAULT_CURRENCY, invoice.final_fare)
    : "—";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Ride Invoice</Text>
          <Text style={styles.modalFare}>{fare}</Text>
          <Text style={styles.modalLine}>
            {resolveDisplayAddress(
              invoice.pickup_address,
              null,
              "Pickup location",
            )}
          </Text>
          <Text style={styles.modalArrow}>↓</Text>
          <Text style={styles.modalLine}>
            {resolveDisplayAddress(
              invoice.drop_address,
              null,
              "Drop location",
            )}
          </Text>
          {invoice.driver?.name ? (
            <Text style={styles.modalMeta}>Driver: {invoice.driver.name}</Text>
          ) : null}
          {invoice.download_url ? (
            <Text style={styles.modalMeta}>Download: {invoice.download_url}</Text>
          ) : (
            <Text style={styles.modalMeta}>
              PDF download is not available yet.
            </Text>
          )}
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RideHistoryScreen() {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<BookingFilter>("All");
  const [repeatingRideId, setRepeatingRideId] = useState<string | null>(null);
  const [loadingInvoiceRideId, setLoadingInvoiceRideId] = useState<string | null>(
    null,
  );
  const [invoice, setInvoice] = useState<RideInvoice | null>(null);
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } =
    useRideHistory(activeTab);

  const rides = data?.items ?? [];

  const handleRepeatRide = useCallback(
    async (ride: Ride) => {
      setRepeatingRideId(ride.id);
      try {
        const repeatData = await repeatRide(ride.id);
        const pickup = {
          latitude: parseFloat(repeatData.pickup.lat),
          longitude: parseFloat(repeatData.pickup.lng),
          address: repeatData.pickup_address,
        };
        const drop = {
          latitude: parseFloat(repeatData.drop.lat),
          longitude: parseFloat(repeatData.drop.lng),
          address: repeatData.drop_address,
        };

        navigation.navigate("DrawerNavigator", {
          screen: "HomeDrawer",
          params: {
            pickup,
            drop,
            tripSelectedAt: Date.now(),
          },
        });
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Could not repeat ride",
          text2: error?.message ?? "Please try again",
        });
      } finally {
        setRepeatingRideId(null);
      }
    },
    [navigation],
  );

  const handleInvoice = useCallback(async (ride: Ride) => {
    if (!ride.invoice_available) {
      return;
    }

    setLoadingInvoiceRideId(ride.id);
    try {
      const invoiceData = await getRideInvoice(ride.id);
      setInvoice(invoiceData);
      setInvoiceVisible(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not load invoice",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setLoadingInvoiceRideId(null);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <ScreenHeader title="Trips" style={styles.header} />

        <View style={styles.filterTabs}>
          {FILTERS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>Could not load trips</Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : rides.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No trips yet</Text>
            </View>
          ) : (
            rides.map((ride) => (
              <BookingCard
                key={ride.id}
                ride={ride}
                onRepeat={handleRepeatRide}
                onInvoice={handleInvoice}
                repeating={repeatingRideId === ride.id}
                loadingInvoice={loadingInvoiceRideId === ride.id}
              />
            ))
          )}
        </ScrollView>
      </View>

      <HomeBottomTabBar activeTab="trips" embedded />

      <InvoiceModal
        visible={invoiceVisible}
        invoice={invoice}
        onClose={() => {
          setInvoiceVisible(false);
          setInvoice(null);
        }}
      />
    </SafeAreaView>
  );
}

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
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#F4F3F8",
    borderRadius: 48,
    padding: 6,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  filterTab: {
    flex: 1,
    height: 37,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabActive: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterTabText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: SPACING.xl,
    gap: 14,
  },
  centerState: {
    paddingVertical: 48,
    alignItems: "center",
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "#6C7278",
  },
  retryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 20,
    padding: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusCompleted: {
    backgroundColor: "rgba(0, 107, 39, 0.1)",
  },
  statusCancelled: {
    backgroundColor: "rgba(186, 26, 26, 0.1)",
  },
  statusText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  statusTextCompleted: {
    color: "#006B27",
  },
  statusTextCancelled: {
    color: "#BA1A1A",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6C7278",
  },
  fareText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 23,
  },
  fareCompleted: {
    color: COLORS.primary,
  },
  fareCancelled: {
    color: "#6C7278",
    textDecorationLine: "line-through",
  },
  rideTypeBadge: {
    backgroundColor: "#EEEDF3",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  rideTypeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#212B32",
  },
  cardDivider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(108, 114, 120, 0.15)",
    marginVertical: SPACING.lg,
  },
  routeBlock: {
    gap: SPACING.lg,
  },
  routeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineCol: {
    width: 10,
    alignItems: "center",
  },
  timelineColEnd: {
    width: 10,
    alignItems: "center",
    paddingTop: 6,
  },
  timelineDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0, 88, 188, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  timelineDash: {
    width: 1,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
    borderLeftWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(108, 114, 120, 0.5)",
  },
  routeTextCol: {
    flex: 1,
    gap: 4,
  },
  routeLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
  },
  routeAddress: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.dark,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: SPACING.xl,
  },
  repeatButtonWrap: {
    flex: 1,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  repeatButton: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
  },
  repeatButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: "#FEFCFF",
  },
  invoiceButton: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  invoiceButtonDisabled: {
    opacity: 0.5,
  },
  invoiceButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.dark,
  },
  invoiceButtonTextDisabled: {
    color: COLORS.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.dark,
  },
  modalFare: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    marginVertical: SPACING.sm,
  },
  modalLine: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.dark,
  },
  modalArrow: {
    textAlign: "center",
    color: "#6C7278",
  },
  modalMeta: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: "#6C7278",
    marginTop: SPACING.sm,
  },
  modalClose: {
    marginTop: SPACING.xl,
    alignSelf: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  modalCloseText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
