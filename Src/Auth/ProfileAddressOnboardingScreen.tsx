import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Crosshair,
  MapPin,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { RADIUS, SPACING } from "../utils/spacing";
import { getCurrentLocation } from "../utils/locationHelpers";
import { PrimaryButton } from "../components/ui";
import { OnboardingStepHeader } from "../components/onboarding/OnboardingStepHeader";
import { sessionUpdateAddresses } from "../redux/Auth/sessionSlice";
import { useOnboardingSkip } from "../hooks/useOnboardingSkip";
import type { SavedAddress } from "../service/api/types";
import {
  createAddress,
  deleteAddress,
  listAddresses,
} from "../service/addressService/addressService";

// Step 3 (payment method) temporarily disabled — was 3
const TOTAL_STEPS = 2;
const CURRENT_STEP = 2;

type RootStackParamList = {
  ProfileOnboardingScreen: undefined;
  ProfileAddressOnboardingScreen: undefined;
  DrawerNavigator: undefined;
  // ProfilePaymentOnboardingScreen: undefined;
};

function formatDistance(distanceM?: number) {
  if (distanceM == null) {
    return null;
  }

  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceM)} m`;
}

function AddressDistanceBadge({ distanceM }: { distanceM?: number }) {
  const label = formatDistance(distanceM);

  return (
    <View style={styles.distanceBadge}>
      <MapPin size={12} color={COLORS.dark} strokeWidth={1.5} />
      {label ? <Text style={styles.distanceText}>{label}</Text> : null}
    </View>
  );
}

function SavedAddressRow({
  item,
  onMenuPress,
}: {
  item: SavedAddress;
  onMenuPress: (address: SavedAddress) => void;
}) {
  return (
    <View style={styles.savedAddressRow}>
      <AddressDistanceBadge distanceM={item.distance_m} />
      <View style={styles.savedAddressContent}>
        <Text style={styles.savedAddressLabel}>{item.label}</Text>
        <Text style={styles.savedAddressLine} numberOfLines={2}>
          {item.address_line}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onMenuPress(item)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${item.label}`}
      >
        <MoreVertical size={20} color={COLORS.dark} />
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileAddressOnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const handleSkip = useOnboardingSkip(CURRENT_STEP);

  const [searchQuery, setSearchQuery] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [currentLocationAddress, setCurrentLocationAddress] = useState("");
  const [currentCoords, setCurrentCoords] = useState<{
    lat: string;
    lng: string;
  } | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [savingNewAddress, setSavingNewAddress] = useState(false);

  const loadCurrentLocation = useCallback(async () => {
    const location = await getCurrentLocation(Location.Accuracy.Balanced);
    if (!location) {
      return;
    }

    setCurrentCoords({ lat: location.lat, lng: location.lng });
    setCurrentLocationAddress(location.address);
  }, []);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const params =
        currentCoords != null
          ? { lat: currentCoords.lat, lng: currentCoords.lng }
          : undefined;
      const data = await listAddresses(params);
      setAddresses(data);
      dispatch(sessionUpdateAddresses(data));
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not load addresses",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setLoadingAddresses(false);
    }
  }, [currentCoords, dispatch]);

  useEffect(() => {
    loadCurrentLocation();
  }, [loadCurrentLocation]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const filteredAddresses = addresses.filter((item) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.trim().toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.address_line.toLowerCase().includes(query)
    );
  });

  const handleUseCurrentLocation = async () => {
    if (!currentCoords || !currentLocationAddress) {
      Toast.show({
        type: "info",
        text1: "Location unavailable",
        text2: "Enable location permissions to use this option",
      });
      await loadCurrentLocation();
      return;
    }

    setSavingLocation(true);
    try {
      await createAddress({
        label: "Current Location",
        address_line: currentLocationAddress,
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });
      await loadAddresses();
      Toast.show({
        type: "success",
        text1: "Address saved",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save address",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const openAddModal = () => {
    setNewLabel("");
    setNewAddressLine(currentLocationAddress);
    setAddModalVisible(true);
  };

  const handleSaveNewAddress = async () => {
    const label = newLabel.trim();
    const addressLine = newAddressLine.trim();

    if (!label) {
      Toast.show({
        type: "error",
        text1: "Label required",
        text2: "Enter a name like Home or Work",
      });
      return;
    }

    if (!addressLine) {
      Toast.show({
        type: "error",
        text1: "Address required",
        text2: "Enter the full address",
      });
      return;
    }

    if (!currentCoords) {
      Toast.show({
        type: "error",
        text1: "Location unavailable",
        text2: "Enable location to save an address",
      });
      return;
    }

    setSavingNewAddress(true);
    try {
      await createAddress({
        label,
        address_line: addressLine,
        lat: currentCoords.lat,
        lng: currentCoords.lng,
      });
      setAddModalVisible(false);
      await loadAddresses();
      Toast.show({
        type: "success",
        text1: "Address saved",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save address",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setSavingNewAddress(false);
    }
  };

  const handleAddressMenu = (address: SavedAddress) => {
    Alert.alert(address.label, address.address_line, [
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(address.id);
            await loadAddresses();
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "Could not delete address",
              text2: error?.message ?? "Please try again",
            });
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleContinue = () => {
    // Step 3: Payment method — commented out; go home after addresses
    // navigation.reset({
    //   index: 0,
    //   routes: [{ name: "ProfilePaymentOnboardingScreen" }],
    // });
    navigation.reset({
      index: 0,
      routes: [{ name: "DrawerNavigator" }],
    });
  };

  const handleBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "ProfileOnboardingScreen" }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingStepHeader
          title="Add Your Addresses"
          currentStep={CURRENT_STEP}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
        />

        <View style={styles.searchField}>
          <Search size={20} color={COLORS.dark} opacity={0.3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your location..."
            placeholderTextColor="rgba(96, 112, 128, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleUseCurrentLocation}
            disabled={savingLocation}
            accessibilityRole="button"
          >
            <Crosshair size={24} color={COLORS.primary} />
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Use Current Location</Text>
              <Text style={styles.actionSubtitle} numberOfLines={2}>
                {currentLocationAddress || "Fetching your location..."}
              </Text>
            </View>
            {savingLocation ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <ChevronRight size={12} color={COLORS.dark} />
            )}
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.actionRowCompact}
            onPress={openAddModal}
            accessibilityRole="button"
          >
            <View style={styles.addRowLeft}>
              <Plus size={24} color={COLORS.primary} />
              <Text style={styles.actionTitle}>Add New Address</Text>
            </View>
            <ChevronRight size={12} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>SAVED ADDRESS</Text>

        <View style={styles.savedCard}>
          {loadingAddresses ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : filteredAddresses.length === 0 ? (
            <Text style={styles.emptyText}>No saved addresses yet</Text>
          ) : (
            filteredAddresses.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <SavedAddressRow item={item} onMenuPress={handleAddressMenu} />
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Address</Text>

            <Text style={styles.modalLabel}>Label</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Home, Work, etc."
              placeholderTextColor="rgba(96, 112, 128, 0.5)"
              value={newLabel}
              onChangeText={setNewLabel}
            />

            <Text style={styles.modalLabel}>Address</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Enter full address"
              placeholderTextColor="rgba(96, 112, 128, 0.5)"
              value={newAddressLine}
              onChangeText={setNewAddressLine}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewAddress}
                style={styles.modalSave}
                disabled={savingNewAddress}
              >
                {savingNewAddress ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderSearch,
    borderRadius: 48,
    paddingHorizontal: SPACING.lg,
    gap: 10,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.dark,
  },
  actionsCard: {
    borderWidth: 1,
    borderColor: "rgba(96, 112, 128, 0.2)",
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  actionRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionTextWrap: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 15,
    color: COLORS.primary,
  },
  actionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 15,
    color: "#6C7278",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(169, 163, 147, 0.2)",
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 15,
    color: "#6C7278",
    marginBottom: SPACING.md,
  },
  savedCard: {
    borderWidth: 1,
    borderColor: "rgba(96, 112, 128, 0.2)",
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  savedAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  distanceBadge: {
    width: 35,
    minHeight: 35,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 5,
  },
  distanceText: {
    fontFamily: FONTS.regular,
    fontSize: 8,
    lineHeight: 10,
    color: COLORS.dark,
    textAlign: "center",
  },
  savedAddressContent: {
    flex: 1,
    gap: 4,
  },
  savedAddressLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.dark,
  },
  savedAddressLine: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 15,
    color: "#6C7278",
  },
  loadingWrap: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#6C7278",
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl + 6,
    alignItems: "center",
  },
  continueButton: {
    borderRadius: RADIUS.full,
  },
  continueButtonText: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: FONTS.semiBold,
  },
  skipButton: {
    width: "100%",
    alignItems: "center",
  },
  skipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: COLORS.primary,
    textAlign: "center",
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
    marginBottom: SPACING.sm,
  },
  modalLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "#343434",
    marginTop: SPACING.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(205, 205, 205, 0.6)",
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.dark,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.lg,
    marginTop: SPACING.xl,
  },
  modalCancel: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  modalCancelText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: "#6C7278",
  },
  modalSave: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    minWidth: 88,
    alignItems: "center",
  },
  modalSaveText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.white,
  },
});
