import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { TYPO } from "../utils/typography";
import { SPACING } from "../utils/spacing";
import { goBackOrHome } from "../navigation/navigationRef";
import { useCountryMarket } from "../context/CountryMarketContext";
import { getCurrentLocation as resolveCurrentLocation, watchUserCoordinates, reverseGeocodeAddress } from "../utils/locationHelpers";
import { getMapLifecycleMapHeight } from "../constants/mapLayout";
import {
  autocompletePlaces,
  getPlaceDetails,
} from "../service/placesService/placesService";

const MAP_HEIGHT = getMapLifecycleMapHeight();
const SHEET_TOP = getMapLifecycleMapHeight();
const HORIZONTAL_PADDING = 18;
const MAP_DELTA = 0.02;

const FIGMA = {
  tripBoxBg: "#F4F3F8",
  tripBoxBorder: "rgba(243, 244, 246, 0.5)",
  textPrimary: "#1F1F1F",
  textSecondary: "#6C7278",
  separator: "rgba(169, 163, 147, 0.2)",
  pickupDot: "#00901F",
  dropDot: "#D52E2F",
};

function formatPlaceAddress(item) {
  return [item.name, item.subtitle].filter(Boolean).join(", ");
}

function TripConnector() {
  return (
    <View style={styles.connectorCol}>
      <View style={styles.pickupDot} />
      <View style={styles.dashedLine} />
      <View style={styles.dropDot} />
    </View>
  );
}

export default function LocationSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { country } = useCountryMarket();
  const mapRef = useRef(null);
  /** When true, GPS watch recenters the map. Kept false after first seed / place select. */
  const followUserLocationRef = useRef(false);
  const mapRegionRef = useRef(country.mapRegion);
  const seededPickupRef = useRef(false);
  const prevCountryIdRef = useRef(country.id);

  const updateFollowUserLocation = useCallback((enabled) => {
    followUserLocationRef.current = enabled;
  }, []);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [pickup, setPickup] = useState(
    route.params?.initialField === "pickup"
      ? (route.params?.initialQuery ?? "")
      : "",
  );
  const [drop, setDrop] = useState(
    route.params?.initialField === "drop"
      ? (route.params?.initialQuery ?? "")
      : "",
  );
  const [activeField, setActiveField] = useState(
    route.params?.initialField ?? "drop",
  );

  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchBiasCoords, setSearchBiasCoords] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /** Updates map camera via ref + animateToRegion (no React state setter). */
  const applyMapCoords = useCallback((coords, { animate = true } = {}) => {
    if (coords?.latitude == null || coords?.longitude == null) return;

    const nextRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: MAP_DELTA,
      longitudeDelta: MAP_DELTA,
    };

    mapRegionRef.current = nextRegion;
    setSearchBiasCoords({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (animate && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(nextRegion, 500);
    }
  }, []);

  useEffect(() => {
    const countryChanged = prevCountryIdRef.current !== country.id;
    prevCountryIdRef.current = country.id;
    if (!countryChanged) {
      return;
    }

    // Keep GPS camera when country / phone code changes.
    if (
      seededPickupRef.current &&
      pickupCoords?.latitude != null &&
      pickupCoords?.longitude != null
    ) {
      applyMapCoords(
        {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
        },
        { animate: true },
      );
      return;
    }

    mapRegionRef.current = country.mapRegion;
  }, [
    country.id,
    country.mapRegion,
    pickupCoords?.latitude,
    pickupCoords?.longitude,
    applyMapCoords,
  ]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let subscription = null;
    let cancelled = false;

    (async () => {
      // Seed map + pickup once from the user's real current location
      if (!seededPickupRef.current) {
        const location = await resolveCurrentLocation();
        if (!cancelled && location) {
          seededPickupRef.current = true;
          const coords = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          applyMapCoords(coords, { animate: true });
          setPickupCoords({
            ...coords,
            address: location.address,
          });
          // Center once, then stop locking the camera to GPS
          updateFollowUserLocation(false);
          // Only fill pickup — never touch drop
          if (
            route.params?.initialField !== "pickup" ||
            !route.params?.initialQuery
          ) {
            setPickup((prev) => prev || location.address);
          }
        } else if (!cancelled) {
          // GPS unavailable — stay on country fallback, don't follow
          seededPickupRef.current = true;
          updateFollowUserLocation(false);
        }
      }

      const next = await watchUserCoordinates((coords) => {
        // Follow GPS for map only while explicitly enabled
        if (cancelled || !followUserLocationRef.current) return;
        applyMapCoords(coords);
      });

      if (cancelled) {
        next?.remove();
        return;
      }

      subscription = next;
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, [applyMapCoords, updateFollowUserLocation]);

  const SEARCH_RADIUS_METERS = 50000;
  const searchRequestIdRef = useRef(0);

  const fetchPlaces = useCallback(
    async (text, biasCoords) => {
      if (!text || text.length < 2) {
        setGoogleResults([]);
        return;
      }

      const requestId = ++searchRequestIdRef.current;

      try {
        setLoading(true);

        // Places Autocomplete (New) — predictions only (name / subtitle / placeId)
        const formatted = await autocompletePlaces(
          text,
          biasCoords ?? searchBiasCoords,
          SEARCH_RADIUS_METERS,
        );

        // Ignore stale responses so pickup/drop searches don't overwrite each other
        if (requestId !== searchRequestIdRef.current) {
          return;
        }

        setGoogleResults(formatted);
      } catch (error) {
        console.log("Google Places Error:", error);
        if (requestId === searchRequestIdRef.current) {
          setGoogleResults([]);
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [searchBiasCoords],
  );

  useEffect(() => {
    const initialQuery = route.params?.initialQuery;
    if (!initialQuery) return;

    if (route.params?.initialField === "pickup") {
      setPickup(initialQuery);
      setDrop("");
      setActiveField("pickup");
    } else {
      setDrop(initialQuery);
      setActiveField("drop");
    }

    fetchPlaces(initialQuery);
    // Only run when route params change — do not re-sync on every fetchPlaces identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.initialQuery, route.params?.initialField]);

  const focusField = useCallback((field) => {
    setActiveField(field);
    setGoogleResults([]);
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await resolveCurrentLocation();

      if (!location) {
        alert(
          "Unable to get your current location. Enable location permission and GPS, then try again.",
        );
        return;
      }

      const formattedAddress = location.address;

      // Update pickup only — leave drop unchanged
      setPickup(formattedAddress);
      setGoogleResults([]);

      const coords = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setPickupCoords({
        ...coords,
        address: formattedAddress,
      });
      updateFollowUserLocation(false);
      applyMapCoords(coords);
      setActiveField("drop");
    } catch (error) {
      console.log("Location Error:", error);
    }
  };

  const activeQuery = activeField === "pickup" ? pickup.trim() : drop.trim();
  const showResults = activeQuery.length >= 2;

  const resolvePickupLocation = async () => {
    if (pickupCoords?.latitude != null && pickupCoords?.longitude != null) {
      if (pickupCoords.address?.trim()) {
        return pickupCoords;
      }

      const geocoded = await reverseGeocodeAddress(
        pickupCoords.latitude,
        pickupCoords.longitude,
      );
      return {
        ...pickupCoords,
        address: geocoded || pickup.trim() || "Current location",
      };
    }

    if (
      searchBiasCoords?.latitude != null &&
      searchBiasCoords?.longitude != null
    ) {
      if (pickup.trim()) {
        return {
          ...searchBiasCoords,
          address: pickup.trim(),
        };
      }

      const geocoded = await reverseGeocodeAddress(
        searchBiasCoords.latitude,
        searchBiasCoords.longitude,
      );
      return {
        ...searchBiasCoords,
        address: geocoded || "Current location",
      };
    }

    return null;
  };

  const handleSelect = async (item) => {
    try {
      // Place Details (New) — lat/lng, formattedAddress, addressComponents, types
      const details = await getPlaceDetails(item.placeId);

      if (!details?.latitude || !details?.longitude) {
        alert("Could not resolve destination coordinates. Try another place.");
        return;
      }

      const address =
        details.address || formatPlaceAddress(item) || details.name;

      const selectedPlace = {
        placeId: details.placeId || item.placeId,
        name: details.name || item.name,
        address,
        latitude: details.latitude,
        longitude: details.longitude,
        city: details.city,
        state: details.state,
        country: details.country,
        postalCode: details.postalCode,
        types: details.types,
      };

      if (activeField === "pickup") {
        // Apply selection to pickup only — do not sync into drop
        setPickup(address);
        setPickupCoords(selectedPlace);
        setGoogleResults([]);
        setActiveField("drop");
        updateFollowUserLocation(false);
        applyMapCoords({
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
        });
        return;
      }

      // Drop selection — keep existing pickup as-is
      const resolvedPickup = await resolvePickupLocation();
      if (!resolvedPickup?.latitude || !resolvedPickup?.longitude) {
        alert("Please set your pickup location first (use GPS or search).");
        setActiveField("pickup");
        return;
      }

      setDrop(address);
      setGoogleResults([]);
      updateFollowUserLocation(false);
      applyMapCoords({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      });

      navigation.navigate({
        name: "DrawerNavigator",
        merge: true,
        params: {
          screen: "HomeDrawer",
          params: {
            pickup: resolvedPickup,
            drop: selectedPlace,
            tripSelectedAt: Date.now(),
          },
        },
      });
    } catch (error) {
      console.log("Place Details Error:", error);
      alert(
        error?.message ||
          "Could not get place details. Check Places API (New) is enabled.",
      );
    }
  };

  const renderLocationItem = ({ item, index }) => (
    <View>
      <TouchableOpacity
        style={styles.locationRow}
        onPress={() => handleSelect(item)}
      >
        <Ionicons
          name="location-outline"
          size={20}
          color={FIGMA.textPrimary}
          style={styles.locationPin}
        />

        <View style={styles.locationText}>
          <Text style={styles.locationName}>{item.name}</Text>
          {item.subtitle ? (
            <Text style={styles.locationSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {index < googleResults.length - 1 ? (
        <View style={styles.resultSeparator} />
      ) : null}
    </View>
  );

  const listHeader = (
    <View style={styles.sheetContent}>
      <Text style={styles.sectionTitle}>Plan your ride</Text>

      <View style={styles.tripBox}>
        <TripConnector />

        <View style={styles.tripFields}>
          <View style={styles.tripInputRow}>
            <TextInput
              key="pickup-input"
              value={pickup}
              placeholder="Pickup location"
              placeholderTextColor={FIGMA.textPrimary}
              style={[
                styles.tripInput,
                activeField === "pickup" && styles.tripInputActive,
              ]}
              onFocus={() => focusField("pickup")}
              onChangeText={(text) => {
                setPickup(text);
                setActiveField("pickup");

                if (!text.trim()) {
                  setPickupCoords(null);
                  setGoogleResults([]);
                  // Keep camera where it is; do not resume GPS follow
                  return;
                }

                // Search only for pickup — never copy into drop
                fetchPlaces(text, pickupCoords ?? searchBiasCoords);
              }}
            />
          </View>

          <View style={styles.fieldSeparator} />

          <View style={styles.tripInputRow}>
            <TextInput
              key="drop-input"
              value={drop}
              placeholder="Drop location"
              placeholderTextColor={FIGMA.textSecondary}
              style={[
                styles.tripInput,
                !drop.trim() && styles.tripInputDrop,
                !!drop.trim() && styles.tripInputFilled,
                activeField === "drop" && styles.tripInputActive,
              ]}
              returnKeyType="search"
              onFocus={() => focusField("drop")}
              onChangeText={(text) => {
                setDrop(text);
                setActiveField("drop");

                if (!text.trim()) {
                  setGoogleResults([]);
                  return;
                }

                updateFollowUserLocation(false);
                // Search only for drop — never copy into pickup
                fetchPlaces(text, pickupCoords ?? searchBiasCoords);
              }}
              onSubmitEditing={() => {
                if (activeField === "drop" && googleResults.length > 0) {
                  handleSelect(googleResults[0]);
                }
              }}
            />
          </View>
        </View>
      </View>

      {!pickup.trim() ? (
        <TouchableOpacity
          style={styles.useCurrentRow}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={18} color={COLORS.primary} />
          <Text style={styles.useCurrentText}>Use Current Location</Text>
        </TouchableOpacity>
      ) : null}

      {loading && showResults ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : null}

      {showResults && !loading && googleResults.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="search" size={40} color={COLORS.border} />
          <Text style={styles.emptyText}>No locations found</Text>
        </View>
      ) : null}

      {showResults && googleResults.length > 0 ? (
        <View style={styles.resultsSpacer} />
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapSection}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={
            pickupCoords?.latitude != null && pickupCoords?.longitude != null
              ? {
                  latitude: pickupCoords.latitude,
                  longitude: pickupCoords.longitude,
                  latitudeDelta: MAP_DELTA,
                  longitudeDelta: MAP_DELTA,
                }
              : country.mapRegion
          }
          onMapReady={() => {
            if (mapRef.current?.animateToRegion) {
              mapRef.current.animateToRegion(mapRegionRef.current, 0);
            }
          }}
          showsUserLocation
          followsUserLocation={false}
          showsMyLocationButton={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        />

        <LinearGradient
          colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.mapTopGradient}
          pointerEvents="none"
        />

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 25 }]}
          onPress={goBackOrHome}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={FIGMA.textPrimary} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.sheet,
          {
            top:
              keyboardHeight > 0
                ? Math.max(insets.top, SHEET_TOP - keyboardHeight)
                : SHEET_TOP,
            bottom: keyboardHeight,
          },
        ]}
      >
        <FlatList
          data={showResults ? googleResults : []}
          keyExtractor={(item, index) => item.placeId + index}
          renderItem={renderLocationItem}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: MAP_HEIGHT,
    overflow: "hidden",
    zIndex: 0,
  },
  mapTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 200,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 16 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.02,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: -4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  sheetContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    ...TYPO.section,
    color: FIGMA.textPrimary,
    paddingHorizontal: 4,
  },
  tripBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: FIGMA.tripBoxBg,
    borderWidth: 1,
    borderColor: FIGMA.tripBoxBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  connectorCol: {
    width: 10,
    alignItems: "center",
    paddingTop: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: FIGMA.pickupDot,
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
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: FIGMA.dropDot,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 88, 188, 0.1)",
        shadowOpacity: 1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tripFields: {
    flex: 1,
    gap: 8,
  },
  tripInputRow: {
    minHeight: 32,
    justifyContent: "center",
  },
  tripInput: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: "#000000",
    padding: 0,
    margin: 0,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: "center",
        paddingVertical: 2,
      },
      ios: {
        paddingVertical: 4,
      },
    }),
  },
  tripInputDrop: {
    color: FIGMA.textSecondary,
  },
  tripInputFilled: {
    color: "#000000",
  },
  tripInputActive: {
    color: FIGMA.textPrimary,
  },
  fieldSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: FIGMA.separator,
  },
  useCurrentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  useCurrentText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  resultsSpacer: {
    height: 23,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 2,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  locationPin: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    gap: 4,
  },
  locationName: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: FIGMA.textPrimary,
  },
  locationSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 15,
    color: FIGMA.textSecondary,
  },
  resultSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: FIGMA.separator,
    marginVertical: 12,
    marginHorizontal: HORIZONTAL_PADDING,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: FIGMA.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  loader: {
    marginVertical: SPACING.md,
  },
});
