import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";
import HomeBottomPanel from "./Component/HomeBottomPanel";
import HomeSearchBar from "./Component/HomeSearchBar";
import HomeBottomTabBar from "./Component/HomeBottomTabBar";
import RideSelectionBottomSheet from "./Component/RideSelectionBottomSheet";
import RideConfirmationPanel from "./Component/RideConfirmationPanel";
import FindingRideBottomSheet from "./Component/FindingRideBottomSheet";
import DriverOnWayPanel from "./Component/DriverOnWayPanel";
import RiderMap from "../components/map/RiderMap";
import NavigationHeader from "../components/map/NavigationHeader";
import MapControls from "../components/map/MapControls";
import { useRideQuote } from "../hooks/rides/useRideQuote";
import { useRecentDestinations } from "../hooks/rides/useRecentDestinations";
import { useCreateRide } from "../hooks/rides/useCreateRide";
import { sendRideCancel } from "../hooks/rides/useRideWebSocket";
import { useSmoothDriverCoordinate } from "../hooks/rides/useSmoothDriverCoordinate";
import { useHeadingFromCoordinates } from "../hooks/rides/useHeadingFromCoordinates";
import { useLiveDrivingRoute } from "../hooks/rides/useLiveDrivingRoute";
import { useTurnByTurn } from "../hooks/rides/useTurnByTurn";
import { useSavedPlaces } from "../hooks/addresses/useSavedPlaces";
import { useActiveRide } from "../context/ActiveRideContext";
import {
  generateIdempotencyKey,
  toCoordinates,
  resolveDisplayAddress,
  isCoordinateLikeAddress,
} from "../utils/rideHelpers";
import { decodePolyline, regionFromCoordinates } from "../utils/decodePolyline";
import type { RecentDestination } from "../utils/recentDestinations";
import { resetToLogin } from "../navigation/navigationRef";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { SPACING } from "../utils/spacing";
import {
  getCurrentLocation,
  watchUserCoordinates,
  reverseGeocodeAddress,
} from "../utils/locationHelpers";
import { MAP_LIFECYCLE_MAP_EDGE_INSET } from "../constants/mapLayout";
import { useCountryMarket } from "../context/CountryMarketContext";

function truncateAddress(text: string | undefined, max = 16) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const TAG_WIDTH = 140;
const TAG_HEIGHT = 22;
/** ~25m visible radius while driver is heading to pickup */
const DRIVER_APPROACH_DELTA = 0.00022;
/** ~8m visible radius — max street zoom on driver */
const DRIVER_MAX_ZOOM_DELTA = 0.00008;

function getAddressTagStyle(
  point: { x: number; y: number } | null,
  mapSize: { width: number; height: number },
) {
  if (!point || !mapSize.width || !mapSize.height) return null;

  const offsetX = 12;
  const offsetY = -32;

  let left = point.x + offsetX;
  let top = point.y + offsetY;

  if (left + TAG_WIDTH > mapSize.width - 12) {
    left = point.x - TAG_WIDTH - 8;
  }
  if (left < 12) {
    left = 12;
  }
  if (top < 12) {
    top = point.y + 8;
  }
  if (top + TAG_HEIGHT > mapSize.height - 12) {
    top = mapSize.height - TAG_HEIGHT - 12;
  }

  return { left, top };
}

export default function HomeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { country } = useCountryMarket();
  const rootNavigation = navigation.getParent();
  const { isAuthenticated } = useSelector((state: any) => state.session);
  const [region, setRegion] = useState(country.mapRegion);
  /** Once GPS has centered the map, country fallback must not take over. */
  const hasCenteredOnUserRef = useRef(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    generateIdempotencyKey(),
  );
  const [isRideSheetOpen, setIsRideSheetOpen] = useState(false);
  const [isRideConfirmationOpen, setIsRideConfirmationOpen] = useState(false);
  const [pendingRideTypeSlug, setPendingRideTypeSlug] = useState(null);
  const [pickupTagPosition, setPickupTagPosition] = useState(null);
  const [dropTagPosition, setDropTagPosition] = useState(null);
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });
  /** Client Directions polyline when quote.route.polyline is missing. */
  const [directionsCoords, setDirectionsCoords] = useState([]);
  const [showsTraffic, setShowsTraffic] = useState(true);
  const [followNavigation, setFollowNavigation] = useState(true);
  const mapRef = useRef(null);
  const tagUpdateTimerRef = useRef(null);
  const hadActiveRideRef = useRef(false);
  const isDriverArrivedRef = useRef(false);
  const isDriverOnWayRef = useRef(false);
  const isTripInProgressRef = useRef(false);
  const followNavigationRef = useRef(true);
  const followUserOnIdleRef = useRef(true);
  const mapInitialRegionRef = useRef(null);
  const [mapLayoutEpoch, setMapLayoutEpoch] = useState(0);
  const prevCountryIdRef = useRef(country.id);

  followNavigationRef.current = followNavigation;

  useEffect(() => {
    const countryChanged = prevCountryIdRef.current !== country.id;
    prevCountryIdRef.current = country.id;
    if (!countryChanged) {
      return;
    }

    // Changing India / DRC / US must keep the camera on the user's GPS.
    if (
      hasCenteredOnUserRef.current ||
      (pickupLocation?.latitude != null && pickupLocation?.longitude != null)
    ) {
      if (pickupLocation?.latitude == null || pickupLocation?.longitude == null) {
        return;
      }
      const nextRegion = {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion?.(nextRegion, 250);
      return;
    }

    // No GPS yet — temporary market city only.
    setRegion(country.mapRegion);
  }, [
    country.id,
    country.mapRegion,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
  ]);

  const {
    activeRide,
    setActiveRide,
    clearActiveRide,
    routePolyline,
    legPolyline,
    driver,
    wsStatus,
    startOtp,
  } = useActiveRide();
  const {
    mutate: requestQuote,
    data: quoteData,
    reset: resetQuote,
    isPending: isQuotePending,
    isError: isQuoteError,
    error: quoteFetchError,
  } = useRideQuote();
  const createRideMutation = useCreateRide();
  const {
    data: recentDestinations = [],
    isLoading: isRecentDestinationsLoading,
  } = useRecentDestinations(2);
  const { home: homePlace, work: workPlace } = useSavedPlaces(isAuthenticated);

  const tripStatus = wsStatus ?? activeRide?.status ?? null;

  const isSearchingTrip =
    tripStatus === "requested" || tripStatus === "searching_driver";

  const isDriverOnWayTrip =
    tripStatus === "driver_assigned" ||
    tripStatus === "driver_arrived" ||
    tripStatus === "in_progress";
  isDriverOnWayRef.current = isDriverOnWayTrip;

  const isDriverArrived = tripStatus === "driver_arrived";
  isDriverArrivedRef.current = isDriverArrived;

  const isTripInProgress = tripStatus === "in_progress";
  isTripInProgressRef.current = isTripInProgress;

  useEffect(() => {
    if (!activeRide?.id) {
      return;
    }

    const pickupLat = parseFloat(activeRide.pickup_lat);
    const pickupLng = parseFloat(activeRide.pickup_lng);
    const dropLat = parseFloat(activeRide.drop_lat);
    const dropLng = parseFloat(activeRide.drop_lng);

    if (!Number.isNaN(pickupLat) && !Number.isNaN(pickupLng)) {
      setPickupLocation({
        latitude: pickupLat,
        longitude: pickupLng,
        address: activeRide.pickup_address,
      });
    }

    if (!Number.isNaN(dropLat) && !Number.isNaN(dropLng)) {
      setDropLocation({
        latitude: dropLat,
        longitude: dropLng,
        address: activeRide.drop_address,
      });
    }
  }, [
    activeRide?.id,
    activeRide?.pickup_lat,
    activeRide?.pickup_lng,
    activeRide?.pickup_address,
    activeRide?.drop_lat,
    activeRide?.drop_lng,
    activeRide?.drop_address,
  ]);

  /** Matches driverMapGradient (180) + status pill so fit stays in the visible map band. */
  const driverMapTopChrome = insets.top + 156;

  const driverTripMapPadding = useMemo(
    () => ({
      top: driverMapTopChrome,
      right: 48,
      bottom: MAP_LIFECYCLE_MAP_EDGE_INSET,
      left: 48,
    }),
    [driverMapTopChrome],
  );

  const ROUTE_EDGE_PADDING = useMemo(
    () => ({
      top: 120,
      right: 60,
      bottom: MAP_LIFECYCLE_MAP_EDGE_INSET,
      left: 60,
    }),
    [],
  );

  const isActiveTrip =
    tripStatus === "searching_driver" ||
    tripStatus === "requested" ||
    tripStatus === "driver_assigned" ||
    tripStatus === "driver_arrived" ||
    tripStatus === "in_progress";

  const isActiveTripRef = useRef(isActiveTrip);
  isActiveTripRef.current = isActiveTrip;

  const shouldShowTripSheet = Boolean(
    activeRide?.id &&
      tripStatus &&
      tripStatus !== "completed" &&
      tripStatus !== "cancelled",
  );

  const prepareActiveTripUi = useCallback(() => {
    setIsRideSheetOpen(false);
    setIsRideConfirmationOpen(false);
    setPendingRideTypeSlug(null);
  }, []);

  const restoreIdleHomeView = useCallback(() => {
    setIsRideSheetOpen(false);
    setIsRideConfirmationOpen(false);
    setPendingRideTypeSlug(null);
    setDropLocation(null);
    setDirectionsCoords([]);
    setFollowNavigation(true);
    resetQuote();
    // RN params ignore `undefined` — use null so focus hydration cannot revive drop.
    navigation.setParams({ pickup: pickupLocation, drop: null });
    // Force a clean map layout pass after trip chrome (flex:1) → idle (fixed height).
    if (hadActiveRideRef.current) {
      setMapLayoutEpoch((value) => value + 1);
    }

    const latitude = pickupLocation?.latitude;
    const longitude = pickupLocation?.longitude;
    if (latitude == null || longitude == null) {
      return;
    }

    const nextRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(nextRegion);

    const applyIdleCamera = () => {
      mapRef.current?.animateCamera?.(
        {
          center: { latitude, longitude },
          heading: 0,
          pitch: 0,
          zoom: 15,
        },
        { duration: 350 },
      );
    };

    applyIdleCamera();
    setTimeout(applyIdleCamera, 80);
    setTimeout(applyIdleCamera, 320);
  }, [navigation, pickupLocation, resetQuote]);

  const previewRouteCoords = useMemo(() => {
    if (!pickupLocation?.latitude || !dropLocation?.latitude) return [];

    const fromQuote = decodePolyline(quoteData?.route?.polyline);
    if (fromQuote.length > 0) return fromQuote;

    return directionsCoords;
  }, [
    quoteData?.route?.polyline,
    directionsCoords,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
    dropLocation?.latitude,
    dropLocation?.longitude,
  ]);

  const activeRouteCoords = useMemo(
    () => decodePolyline(routePolyline ?? activeRide?.route_polyline),
    [routePolyline, activeRide?.route_polyline],
  );

  const legRouteCoords = useMemo(
    () => decodePolyline(legPolyline),
    [legPolyline],
  );

  const dropCoordinate = useMemo(() => {
    if (!activeRide) return null;
    const latitude = parseFloat(activeRide.drop_lat);
    const longitude = parseFloat(activeRide.drop_lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  }, [activeRide]);

  const driverCoordinate = useMemo(() => {
    if (!driver?.lat || !driver?.lng) return null;
    const latitude = parseFloat(String(driver.lat));
    const longitude = parseFloat(String(driver.lng));
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  }, [driver?.lat, driver?.lng]);

  const animatedDriverCoordinate = useSmoothDriverCoordinate(driverCoordinate);
  const driverHeading = useHeadingFromCoordinates(driverCoordinate);

  const pickupCoordinate = useMemo(() => {
    if (activeRide) {
      const latitude = parseFloat(activeRide.pickup_lat);
      const longitude = parseFloat(activeRide.pickup_lng);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
    if (pickupLocation?.latitude && pickupLocation?.longitude) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
      };
    }
    return null;
  }, [
    activeRide,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
  ]);

  const previewDropCoordinate = useMemo(() => {
    if (dropLocation?.latitude && dropLocation?.longitude) {
      return {
        latitude: dropLocation.latitude,
        longitude: dropLocation.longitude,
      };
    }
    return dropCoordinate;
  }, [dropLocation?.latitude, dropLocation?.longitude, dropCoordinate]);

  const routeOrigin = useMemo(() => {
    if (isTripInProgress) return driverCoordinate ?? pickupCoordinate;
    if (tripStatus === "driver_assigned" || tripStatus === "driver_arrived") {
      return driverCoordinate ?? pickupCoordinate;
    }
    return pickupCoordinate;
  }, [isTripInProgress, tripStatus, driverCoordinate, pickupCoordinate]);

  const routeDestination = useMemo(() => {
    if (isTripInProgress) return dropCoordinate ?? previewDropCoordinate;
    if (tripStatus === "driver_assigned" || tripStatus === "driver_arrived") {
      return pickupCoordinate;
    }
    return previewDropCoordinate;
  }, [
    isTripInProgress,
    tripStatus,
    dropCoordinate,
    previewDropCoordinate,
    pickupCoordinate,
  ]);

  const { primary: liveRoute, alternatives: liveAlternatives } =
    useLiveDrivingRoute({
      origin: routeOrigin,
      destination: routeDestination,
      encodedFallback:
        (isTripInProgress ? legPolyline : null) ??
        routePolyline ??
        activeRide?.route_polyline ??
        quoteData?.route?.polyline,
      enabled: Boolean(routeOrigin && routeDestination),
    });

  const turnByTurn = useTurnByTurn(liveRoute, routeOrigin);

  const displayLegCoords = useMemo(() => {
    if (turnByTurn.remainingCoordinates.length > 1) {
      return turnByTurn.remainingCoordinates;
    }
    if (legRouteCoords.length > 0) return legRouteCoords;
    return liveRoute?.coordinates ?? [];
  }, [turnByTurn.remainingCoordinates, legRouteCoords, liveRoute]);

  const routeCoords = useMemo(() => {
    if (isTripInProgress) return displayLegCoords;
    if (isActiveTrip) {
      if (displayLegCoords.length > 1) return displayLegCoords;
      if (liveRoute?.coordinates?.length) return liveRoute.coordinates;
      return activeRouteCoords;
    }
    if (liveRoute?.coordinates?.length) return liveRoute.coordinates;
    return previewRouteCoords;
  }, [
    isTripInProgress,
    isActiveTrip,
    displayLegCoords,
    liveRoute,
    activeRouteCoords,
    previewRouteCoords,
  ]);

  const fitMapToCoords = useCallback(
    (coords) => {
      if (!coords.length || isDriverArrivedRef.current) return false;

      if (
        isDriverOnWayRef.current &&
        driver?.lat &&
        driver?.lng &&
        !isTripInProgressRef.current
      ) {
        return false;
      }

      const edgePadding =
        isTripInProgressRef.current ||
        (isDriverOnWayRef.current && !isDriverArrivedRef.current)
          ? driverTripMapPadding
          : ROUTE_EDGE_PADDING;

      const bottomSheetOffset = isTripInProgressRef.current ? 0.12 : 0.2;

      const applyRegionFallback = () => {
        const fitted = regionFromCoordinates(coords, {
          paddingFactor: 2.4,
          bottomSheetOffset,
        });
        if (fitted) {
          setRegion(fitted);
          mapRef.current?.animateToRegion?.(fitted, 400);
          return true;
        }
        return false;
      };

      // Keep controlled `region` in sync so later re-renders don't snap away from the route.
      const syncControlledRegion = () => {
        const fitted = regionFromCoordinates(coords, {
          paddingFactor: 2.4,
          bottomSheetOffset,
        });
        if (fitted) {
          setRegion(fitted);
        }
      };

      if (mapRef.current) {
        try {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding,
            animated: true,
          });
          syncControlledRegion();
          return true;
        } catch {
          return applyRegionFallback();
        }
      }

      return applyRegionFallback();
    },
    [
      ROUTE_EDGE_PADDING,
      driver?.lat,
      driver?.lng,
      driverTripMapPadding,
    ],
  );

  const zoomToDriver = useCallback(
    (
      coord: { latitude: number; longitude: number },
      delta = DRIVER_MAX_ZOOM_DELTA,
    ) => {
      if (!mapRef.current) return false;

      const targetRegion = {
        latitude: coord.latitude - delta * 0.22,
        longitude: coord.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };

      mapRef.current.animateToRegion(targetRegion, 400);
      return true;
    },
    [],
  );

  const getDriverPickupCoords = useCallback(() => {
    if (!activeRide) return [];

    const coords = [];

    if (driver?.lat && driver?.lng) {
      const lat = parseFloat(String(driver.lat));
      const lng = parseFloat(String(driver.lng));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        coords.push({ latitude: lat, longitude: lng });
      }
    }

    const pickupLat = parseFloat(activeRide.pickup_lat);
    const pickupLng = parseFloat(activeRide.pickup_lng);
    if (!Number.isNaN(pickupLat) && !Number.isNaN(pickupLng)) {
      coords.push({ latitude: pickupLat, longitude: pickupLng });
    }

    return coords;
  }, [activeRide, driver?.lat, driver?.lng]);

  const trackDriverOnMap =
    (tripStatus === "driver_assigned" || tripStatus === "driver_arrived") &&
    Boolean(driverCoordinate);

  const zoomToStreetLevel = useCallback(() => {
    if (!driverCoordinate) return false;
    return zoomToDriver(
      driverCoordinate,
      isDriverArrived ? DRIVER_MAX_ZOOM_DELTA : DRIVER_APPROACH_DELTA,
    );
  }, [driverCoordinate, isDriverArrived, zoomToDriver]);

  useEffect(() => {
    if (!shouldShowTripSheet) return;

    prepareActiveTripUi();
  }, [activeRide?.id, shouldShowTripSheet, prepareActiveTripUi]);

  useEffect(() => {
    if (!activeRide || !isActiveTrip || isDriverOnWayTrip) return;

    const timer = setTimeout(() => {
      const allCoords = [...activeRouteCoords, ...legRouteCoords];
      const coordsToFit =
        allCoords.length > 0
          ? allCoords
          : activeRouteCoords.length > 0
            ? activeRouteCoords
            : [
                {
                  latitude: parseFloat(activeRide.pickup_lat),
                  longitude: parseFloat(activeRide.pickup_lng),
                },
                {
                  latitude: parseFloat(activeRide.drop_lat),
                  longitude: parseFloat(activeRide.drop_lng),
                },
              ].filter(
                (point) =>
                  !Number.isNaN(point.latitude) &&
                  !Number.isNaN(point.longitude),
              );

      fitMapToCoords(coordsToFit);
    }, 450);

    return () => clearTimeout(timer);
  }, [
    activeRide,
    isActiveTrip,
    isDriverOnWayTrip,
    activeRouteCoords,
    legRouteCoords,
    fitMapToCoords,
  ]);

  useEffect(() => {
    if (!followNavigation) return;

    const target = driverCoordinate ?? routeOrigin;
    if (!target) return;

    if (isTripInProgress) {
      mapRef.current?.animateCamera?.(
        {
          center: target,
          heading: driverHeading || turnByTurn.heading || 0,
          pitch: 55,
          zoom: 18,
        },
        { duration: 600 },
      );
      return;
    }

    if (trackDriverOnMap) {
      mapRef.current?.animateCamera?.(
        {
          center: target,
          heading: driverHeading || 0,
          pitch: 35,
          zoom: 16,
        },
        { duration: 500 },
      );
    }
  }, [
    followNavigation,
    isTripInProgress,
    trackDriverOnMap,
    driverCoordinate?.latitude,
    driverCoordinate?.longitude,
    driverHeading,
    routeOrigin?.latitude,
    routeOrigin?.longitude,
    turnByTurn.heading,
  ]);


  useEffect(() => {
    if (!isTripInProgress || !activeRide) return;

    const coords = [
      ...displayLegCoords,
      ...(driverCoordinate ? [driverCoordinate] : []),
      ...(dropCoordinate ? [dropCoordinate] : []),
    ];

    if (!coords.length) return;

    const timer = setTimeout(() => fitMapToCoords(coords), 450);
    return () => clearTimeout(timer);
  }, [
    isTripInProgress,
    activeRide,
    displayLegCoords,
    driverCoordinate,
    dropCoordinate,
    fitMapToCoords,
    driverTripMapPadding,
  ]);

  useEffect(() => {
    if (isActiveTrip || !previewRouteCoords.length) return;

    const timer = setTimeout(() => fitMapToCoords(previewRouteCoords), 450);
    return () => clearTimeout(timer);
  }, [previewRouteCoords, isActiveTrip, fitMapToCoords]);

  useEffect(() => {
    if (activeRide?.id) {
      hadActiveRideRef.current = true;
      return;
    }

    if (!hadActiveRideRef.current) return;

    hadActiveRideRef.current = false;
    restoreIdleHomeView();
  }, [activeRide?.id, restoreIdleHomeView]);

  const handleRecentDestinationPress = useCallback(
    async (destination: RecentDestination) => {
      try {
        let pickup = pickupLocation;

        if (!pickup?.latitude || !pickup?.longitude) {
          const resolved = await getCurrentLocation();
          if (!resolved) {
            navigation.navigate("LocationSearch", {
              initialQuery: destination.title,
              initialField: "drop",
            });
            return;
          }

          pickup = {
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            address: resolved.address,
          };
          setPickupLocation(pickup);
        }

        const drop = {
          address: destination.address,
          name: destination.title,
          latitude: destination.latitude,
          longitude: destination.longitude,
        };

        setDropLocation(drop);
        navigation.setParams({
          pickup,
          drop,
          tripSelectedAt: Date.now(),
        });

        const fitted = regionFromCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: drop.latitude, longitude: drop.longitude },
          ],
          { paddingFactor: 2.4, bottomSheetOffset: 0.2 },
        );
        if (fitted) {
          setRegion(fitted);
          mapRef.current?.animateToRegion?.(fitted, 400);
        }

        requestQuote({
          pickup: toCoordinates(pickup),
          drop: toCoordinates(drop),
        });
        setIsRideSheetOpen(true);
      } catch {
        Toast.show({
          type: "error",
          text1: "Could not use destination",
          text2: "Please try again",
        });
      }
    },
    [navigation, pickupLocation, requestQuote],
  );

  const specialOffers = [
    {
      id: 1,
      badge: "NEW TIER",
      title: "Luxe Premium",
      subtitle: "20% off your first 3 rides",
      variant: "premium" as const,
    },
    {
      id: 2,
      badge: "ECO-CHOICE",
      title: "Go Green",
      subtitle: "Earn double points on bikes",
      variant: "eco" as const,
    },
  ];

  const showHomeChrome =
    !isActiveTrip && !dropLocation?.latitude && !shouldShowTripSheet;

  followUserOnIdleRef.current = showHomeChrome;

  const showRideMapChrome =
    (isRideSheetOpen || isRideConfirmationOpen) &&
    !isActiveTrip &&
    !shouldShowTripSheet;

  const showFindingMapChrome = shouldShowTripSheet && isSearchingTrip;
  const showDriverMapChrome = shouldShowTripSheet && isDriverOnWayTrip;

  const lifecycleMapPadding = useMemo(
    () => ({
      top:
        showFindingMapChrome || showDriverMapChrome
          ? driverMapTopChrome
          : 120,
      right: 48,
      bottom: MAP_LIFECYCLE_MAP_EDGE_INSET,
      left: 48,
    }),
    [driverMapTopChrome, showDriverMapChrome, showFindingMapChrome],
  );

  const driverEtaLabel =
    tripStatus === "in_progress"
      ? "Trip in progress"
      : driver?.eta_min != null
        ? `Arriving in ${driver.eta_min} min`
        : "Driver on the way";

  const dismissRideSelection = useCallback(() => {
    restoreIdleHomeView();
  }, [restoreIdleHomeView]);

  const dismissRideConfirmation = useCallback(() => {
    setIsRideConfirmationOpen(false);
    setPendingRideTypeSlug(null);
    setIsRideSheetOpen(true);
  }, []);

  const handleMapBackPress = useCallback(() => {
    if (isRideConfirmationOpen) {
      dismissRideConfirmation();
      return;
    }
    dismissRideSelection();
  }, [
    dismissRideConfirmation,
    dismissRideSelection,
    isRideConfirmationOpen,
  ]);

  const handleRideSheetClose = useCallback(() => {
    setIsRideSheetOpen(false);
  }, []);

  const updateMarkerTagPositions = useCallback(async () => {
    if (!mapRef.current || !showRideMapChrome) {
      setPickupTagPosition(null);
      setDropTagPosition(null);
      return;
    }

    const toPoint = async (location) => {
      if (location?.latitude == null || location?.longitude == null) {
        return null;
      }

      try {
        return await mapRef.current.pointForCoordinate({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } catch {
        return null;
      }
    };

    const [pickupPoint, dropPoint] = await Promise.all([
      toPoint(pickupLocation),
      toPoint(dropLocation),
    ]);

    setPickupTagPosition(pickupPoint);
    setDropTagPosition(dropPoint);
  }, [pickupLocation, dropLocation, showRideMapChrome]);

  const scheduleMarkerTagUpdate = useCallback(() => {
    if (!showRideMapChrome) return;

    if (tagUpdateTimerRef.current) {
      clearTimeout(tagUpdateTimerRef.current);
    }

    tagUpdateTimerRef.current = setTimeout(() => {
      updateMarkerTagPositions();
    }, 16);
  }, [showRideMapChrome, updateMarkerTagPositions]);

  useEffect(() => {
    if (!showRideMapChrome) {
      setPickupTagPosition(null);
      setDropTagPosition(null);
      return;
    }

    const timer = setTimeout(() => {
      updateMarkerTagPositions();
    }, 450);

    return () => clearTimeout(timer);
  }, [
    showRideMapChrome,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
    dropLocation?.latitude,
    dropLocation?.longitude,
    previewRouteCoords.length,
    mapLayout.width,
    mapLayout.height,
    updateMarkerTagPositions,
  ]);

  useEffect(
    () => () => {
      if (tagUpdateTimerRef.current) {
        clearTimeout(tagUpdateTimerRef.current);
      }
    },
    [],
  );

  const fetchQuote = useCallback(() => {
    if (!pickupLocation?.latitude || !dropLocation?.latitude) return;

    requestQuote({
      pickup: toCoordinates(pickupLocation),
      drop: toCoordinates(dropLocation),
    });
  }, [
    pickupLocation?.latitude,
    pickupLocation?.longitude,
    dropLocation?.latitude,
    dropLocation?.longitude,
    requestQuote,
  ]);

  useEffect(() => {
    if (
      pickupLocation?.latitude &&
      pickupLocation?.longitude &&
      dropLocation?.latitude &&
      dropLocation?.longitude
    ) {
      fetchQuote();
    }
  }, [fetchQuote]);

  useEffect(() => {
    if (
      !pickupLocation?.latitude ||
      !dropLocation?.latitude ||
      isActiveTrip ||
      shouldShowTripSheet ||
      isRideConfirmationOpen
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setIsRideSheetOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    pickupLocation?.latitude,
    pickupLocation?.longitude,
    dropLocation?.latitude,
    dropLocation?.longitude,
    isActiveTrip,
    shouldShowTripSheet,
    isRideConfirmationOpen,
  ]);

  const handleRideSelect = useCallback(({ rideTypeSlug }) => {
    setPendingRideTypeSlug(rideTypeSlug);
    setIsRideSheetOpen(false);
    setIsRideConfirmationOpen(true);
  }, []);

  const handleConfirmBooking = useCallback(
    async () => {
      if (!pendingRideTypeSlug) return;

      if (!isAuthenticated) {
        Toast.show({
          type: "error",
          text1: "Login required",
          text2: "Please sign in to book a ride.",
        });
        resetToLogin();
        return;
      }

      if (!pickupLocation || !dropLocation) {
        Toast.show({
          type: "error",
          text1: "Missing locations",
          text2: "Please select pickup and drop locations.",
        });
        return;
      }

      const quote = quoteData;
      if (!quote) {
        Toast.show({
          type: "error",
          text1: "Quote unavailable",
          text2: "Please wait for fares to load and try again.",
        });
        return;
      }

      try {
        const pickupAddress = resolveDisplayAddress(
          pickupLocation.address,
          quote.pickup_address,
          "Pickup location",
        );
        const dropAddress = resolveDisplayAddress(
          dropLocation.address,
          quote.drop_address,
          "Drop location",
        );

        const createdRide = await createRideMutation.mutateAsync({
          payload: {
            pickup: toCoordinates(pickupLocation),
            drop: toCoordinates(dropLocation),
            pickup_address: pickupAddress,
            drop_address: dropAddress,
            ride_type_slug: pendingRideTypeSlug,
          },
          idempotencyKey,
        });

        setIsRideConfirmationOpen(false);
        setPendingRideTypeSlug(null);
        setActiveRide(createdRide);
        prepareActiveTripUi();
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Booking failed",
          text2: error?.message ?? "Unable to book ride.",
        });
      }
    },
    [
      createRideMutation,
      dropLocation,
      idempotencyKey,
      isAuthenticated,
      pendingRideTypeSlug,
      pickupLocation,
      prepareActiveTripUi,
      quoteData,
      setActiveRide,
    ],
  );

  const handleCancelRide = useCallback(() => {
    if (!activeRide?.id) {
      return;
    }

    const sent = sendRideCancel(activeRide.id);
    if (!sent) {
      Toast.show({
        type: "error",
        text1: "Cancel failed",
        text2: "Live ride connection is not ready. Try again.",
      });
      return;
    }

    clearActiveRide();
    setIdempotencyKey(generateIdempotencyKey());
    restoreIdleHomeView();

    Toast.show({
      type: "info",
      text1: "Ride cancelled",
    });
  }, [
    activeRide?.id,
    clearActiveRide,
    restoreIdleHomeView,
  ]);

  const handleFindingBackPress = useCallback(() => {
    Alert.alert("Cancel ride?", "Your driver search will be stopped.", [
      { text: "Keep searching", style: "cancel" },
      {
        text: "Cancel ride",
        style: "destructive",
        onPress: handleCancelRide,
      },
    ]);
  }, [handleCancelRide]);

  const handleDriverBackPress = useCallback(() => {
    Alert.alert("Cancel ride?", "Your current trip will be cancelled.", [
      { text: "Keep ride", style: "cancel" },
      {
        text: "Cancel Ride",
        style: "destructive",
        onPress: handleCancelRide,
      },
    ]);
  }, [handleCancelRide]);

  const handleRecenterMap = useCallback(() => {
    setFollowNavigation(true);

    if (isTripInProgress) {
      const target = driverCoordinate ?? routeOrigin;
      if (target) {
        mapRef.current?.animateCamera?.(
          {
            center: target,
            heading: driverHeading || turnByTurn.heading || 0,
            pitch: 55,
            zoom: 18,
          },
          { duration: 400 },
        );
        return;
      }
    }

    if (driverCoordinate && trackDriverOnMap) {
      mapRef.current?.animateCamera?.(
        {
          center: driverCoordinate,
          heading: driverHeading,
          pitch: 40,
          zoom: 16,
        },
        { duration: 400 },
      );
      return;
    }

    if (routeCoords.length > 1) {
      fitMapToCoords(routeCoords);
      return;
    }

    if (pickupLocation?.latitude) {
      mapRef.current?.animateToRegion?.(
        {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        400,
      );
      return;
    }

    // Idle home with no pickup yet — fetch GPS and open the map there.
    void (async () => {
      const resolved = await getCurrentLocation();
      if (!resolved) {
        return;
      }
      setPickupLocation({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        address: resolved.address,
      });
      hasCenteredOnUserRef.current = true;
      const nextRegion = {
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion?.(nextRegion, 400);
    })();
  }, [
    driverCoordinate,
    driverHeading,
    fitMapToCoords,
    isTripInProgress,
    pickupLocation,
    routeCoords,
    routeOrigin,
    trackDriverOnMap,
    turnByTurn.heading,
  ]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let locationSubscription: { remove: () => void } | null = null;

      const pickup = route.params?.pickup;
      const drop = route.params?.drop;

      if (pickup) {
        setPickupLocation(pickup);
        if (
          pickup.latitude != null &&
          pickup.longitude != null &&
          isCoordinateLikeAddress(pickup.address)
        ) {
          reverseGeocodeAddress(pickup.latitude, pickup.longitude).then(
            (address) => {
              if (!isActive || !address) return;
              setPickupLocation((prev) =>
                prev?.latitude === pickup.latitude &&
                prev?.longitude === pickup.longitude
                  ? { ...prev, address }
                  : prev,
              );
            },
          );
        }
      }

      if (drop?.latitude != null && drop?.longitude != null) {
        setDropLocation(drop);
        if (isCoordinateLikeAddress(drop.address)) {
          reverseGeocodeAddress(drop.latitude, drop.longitude).then(
            (address) => {
              if (!isActive || !address) return;
              setDropLocation((prev) =>
                prev?.latitude === drop.latitude &&
                prev?.longitude === drop.longitude
                  ? { ...prev, address }
                  : prev,
              );
            },
          );
        }
      } else if (drop == null && route.params?.drop === null) {
        setDropLocation(null);
      }

      const mapTarget = drop?.latitude ? drop : pickup;
      const hasCompleteTrip =
        pickup?.latitude &&
        pickup?.longitude &&
        drop?.latitude &&
        drop?.longitude;

      if (hasCompleteTrip) {
        const fitted = regionFromCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: drop.latitude, longitude: drop.longitude },
          ],
          { paddingFactor: 2.4, bottomSheetOffset: 0.2 },
        );
        if (fitted) {
          setRegion(fitted);
          mapRef.current?.animateToRegion?.(fitted, 400);
        }
      } else if (mapTarget?.latitude && mapTarget?.longitude) {
        const nextRegion = {
          latitude: mapTarget.latitude,
          longitude: mapTarget.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion?.(nextRegion, 400);
      }

      const sheetTimer = setTimeout(() => {
        if (isActiveTripRef.current || activeRide?.id) {
          prepareActiveTripUi();
          return;
        }

        if (hasCompleteTrip) {
          requestQuote({
            pickup: toCoordinates(pickup),
            drop: toCoordinates(drop),
          });
          setIsRideSheetOpen(true);
        }
      }, 400);

      const centerMapOnCoords = (
        latitude: number,
        longitude: number,
        animate = true,
      ) => {
        const nextRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(nextRegion);
        if (animate) {
          mapRef.current?.animateToRegion?.(nextRegion, 400);
        }
      };

      const startLiveLocation = async () => {
        if (hasCompleteTrip || activeRide?.id || drop?.latitude) return;

        if (pickup?.latitude) {
          hasCenteredOnUserRef.current = true;
        } else {
          // Allow the first GPS fix (seed or watch) to move the camera.
          hasCenteredOnUserRef.current = false;
        }

        const subscriptionPromise = watchUserCoordinates(
          (coords) => {
          if (!isActive) return;
          if (isActiveTripRef.current) return;

          setPickupLocation((prev) => {
            if (!prev) {
              return {
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: "Your Current Location",
              };
            }
            return {
              ...prev,
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
          });

          const shouldFollowUser =
            followUserOnIdleRef.current && followNavigationRef.current;

          if (shouldFollowUser) {
            hasCenteredOnUserRef.current = true;
            centerMapOnCoords(coords.latitude, coords.longitude);
            return;
          }

          if (hasCenteredOnUserRef.current) return;

          hasCenteredOnUserRef.current = true;
          centerMapOnCoords(coords.latitude, coords.longitude);
        },
          { distanceInterval: 5, timeInterval: 1500 },
        );

        // Seed map + pickup once from the user's real current location
        if (!pickup?.latitude) {
          const resolved = await getCurrentLocation();
          if (!isActive) {
            (await subscriptionPromise)?.remove();
            return;
          }
          if (resolved && !hasCenteredOnUserRef.current) {
            hasCenteredOnUserRef.current = true;
            setPickupLocation({
              latitude: resolved.latitude,
              longitude: resolved.longitude,
              address: resolved.address,
            });
            centerMapOnCoords(resolved.latitude, resolved.longitude);
          } else if (resolved) {
            setPickupLocation((prev) =>
              prev
                ? prev
                : {
                    latitude: resolved.latitude,
                    longitude: resolved.longitude,
                    address: resolved.address,
                  },
            );
          }
        }

        const subscription = await subscriptionPromise;
        if (!isActive) {
          subscription?.remove();
          return;
        }

        locationSubscription = subscription;
      };

      startLiveLocation();

      return () => {
        isActive = false;
        clearTimeout(sheetTimer);
        locationSubscription?.remove();
      };
    }, [
      route.params?.pickup,
      route.params?.drop,
      route.params?.tripSelectedAt,
      requestQuote,
      prepareActiveTripUi,
      activeRide?.id,
      isAuthenticated,
    ]),
  );

  const quoteError = isQuoteError
    ? (quoteFetchError?.message ?? "Unable to load fares. Check your connection and try again.")
    : null;

  const hasPickup = Boolean(pickupLocation?.latitude);
  const hasDrop = Boolean(dropLocation?.latitude);

  const searchGuidanceText = !hasPickup
    ? "Allow location access for a faster pickup"
    : !hasDrop
      ? "Now choose your destination"
      : null;

  const panelGuidanceText = !hasPickup
    ? "Set your pickup by enabling location or searching on the map"
    : !hasDrop
      ? "Pick a destination to see fares and ride options"
      : null;

  const displayPickup = resolveDisplayAddress(
    pickupLocation?.address,
    quoteData?.pickup_address,
    "Your Current Location",
  );
  const displayDrop = resolveDisplayAddress(
    dropLocation?.address,
    quoteData?.drop_address,
    "Drop location",
  );

  if (region && !mapInitialRegionRef.current) {
    mapInitialRegionRef.current = region;
  }

  const mapRegion = region ?? mapInitialRegionRef.current ?? country.mapRegion;

  const pickupTagStyle = getAddressTagStyle(pickupTagPosition, mapLayout);
  const dropTagStyle = getAddressTagStyle(dropTagPosition, mapLayout);

  const mapMode = isTripInProgress
    ? "navigation"
    : trackDriverOnMap
      ? "to_pickup"
      : isSearchingTrip
        ? "searching"
        : dropLocation?.latitude
          ? "preview"
          : "idle";

  const handleSavedPlacePress = useCallback(
    (place) => {
      if (!place) return;
      handleRecentDestinationPress({
        id: place.id,
        title: place.label,
        address: place.address_line,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lng),
        distance: "",
      });
    },
    [handleRecentDestinationPress],
  );

  return (
    <View style={styles.container}>
      <View
        // Remount only after restoreIdleHomeView so trip→idle cannot leave a
        // collapsed map strip (seen after kill → recover → cancel).
        key={`map-${mapLayoutEpoch}`}
        collapsable={false}
        style={showHomeChrome ? styles.mapSection : styles.mapSectionTrip}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setMapLayout({ width, height });
        }}
      >
        <RiderMap
          ref={mapRef}
          initialRegion={mapRegion}
          mode={mapMode}
          pickup={
            mapMode === "navigation"
              ? null
              : pickupCoordinate
          }
          destination={previewDropCoordinate}
          driverCoordinate={
            animatedDriverCoordinate ?? driverCoordinate
          }
          driverHeading={driverHeading || turnByTurn.heading || 0}
          animatedDriver={Boolean(animatedDriverCoordinate)}
          activeRoute={routeCoords}
          traveledRoute={
            mapMode === "navigation" || mapMode === "to_pickup"
              ? turnByTurn.traveledCoordinates
              : []
          }
          alternativeRoutes={
            mapMode === "preview"
              ? liveAlternatives.map((route) => route.coordinates)
              : []
          }
          showsTraffic={showsTraffic}
          showsUserLocation
          followUser={mapMode === "idle" && followNavigation}
          mapPadding={
            isTripInProgress || trackDriverOnMap
              ? driverTripMapPadding
              : !showHomeChrome
                ? lifecycleMapPadding
                : undefined
          }
          onMapReady={() => {
            scheduleMarkerTagUpdate();
            // Prefer live GPS pickup over country fallback city.
            const gpsRegion =
              pickupLocation?.latitude != null &&
              pickupLocation?.longitude != null
                ? {
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : mapRegion;
            if (mapRef.current?.animateToRegion) {
              mapRef.current.animateToRegion(gpsRegion, 0);
            }
          }}
          onPanDrag={() => setFollowNavigation(false)}
          onRegionChangeComplete={scheduleMarkerTagUpdate}
        />

        {mapMode === "navigation" ? (
          <NavigationHeader
            instruction={turnByTurn.nextInstruction}
            distanceToTurn={turnByTurn.distanceToTurnLabel}
            maneuver={turnByTurn.currentStep?.maneuver}
            streetName={turnByTurn.streetName}
            remainingDistance={turnByTurn.remainingDistanceLabel}
            remainingDuration={turnByTurn.remainingDurationLabel}
            etaClock={turnByTurn.etaClock}
            progress={turnByTurn.progress}
          />
        ) : null}

        {showHomeChrome && (
          <>
            <HomeSearchBar
              style={styles.searchOverlay}
              guidanceText={searchGuidanceText}
              showGuidanceChevron={Boolean(hasPickup && !hasDrop)}
              onPress={() =>
                navigation.navigate("LocationSearch", {
                  initialQuery: "",
                  initialField: hasPickup ? "drop" : "pickup",
                })
              }
            />
            <MapControls
              top={insets.top + 12}
              onRecenter={handleRecenterMap}
              onToggleTraffic={() => setShowsTraffic((value) => !value)}
              trafficEnabled={showsTraffic}
              followEnabled={followNavigation}
            />
          </>
        )}

        {showRideMapChrome && (
          <View style={styles.rideMapChrome} pointerEvents="box-none">
            <LinearGradient
              colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.rideMapTopGradient}
              pointerEvents="none"
            />

            <TouchableOpacity
              style={[styles.rideBackBtn, { top: insets.top + 25 }]}
              onPress={handleMapBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color="#1F1F1F"
              />
            </TouchableOpacity>

            {displayPickup && pickupTagStyle ? (
              <View
                style={[styles.addressPill, pickupTagStyle]}
                pointerEvents="none"
              >
                <Text style={styles.addressPillText} numberOfLines={1}>
                  {truncateAddress(displayPickup)}
                </Text>
                <Ionicons name="pencil" size={12} color="#333333" />
              </View>
            ) : null}

            {displayDrop && dropTagStyle ? (
              <View
                style={[styles.addressPill, dropTagStyle]}
                pointerEvents="none"
              >
                <Text style={styles.addressPillText} numberOfLines={1}>
                  {truncateAddress(displayDrop)}
                </Text>
                <Ionicons name="pencil" size={12} color="#333333" />
              </View>
            ) : null}

            <MapControls
              top={insets.top + 88}
              onRecenter={handleRecenterMap}
              onToggleTraffic={() => setShowsTraffic((value) => !value)}
              trafficEnabled={showsTraffic}
              followEnabled={followNavigation}
            />
          </View>
        )}

        {showFindingMapChrome && (
          <View style={styles.rideMapChrome} pointerEvents="box-none">
            <LinearGradient
              colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.rideMapTopGradient}
              pointerEvents="none"
            />

            <TouchableOpacity
              style={[styles.rideBackBtn, { top: insets.top + 25 }]}
              onPress={handleFindingBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#1F1F1F" />
            </TouchableOpacity>
          </View>
        )}

        {showDriverMapChrome && (
          <View style={styles.rideMapChrome} pointerEvents="box-none">
            {tripStatus !== "in_progress" ? (
              <LinearGradient
                colors={[
                  "#FFFFFF",
                  "#FFFFFF",
                  "rgba(255, 255, 255, 0.65)",
                  "rgba(255, 255, 255, 0)",
                ]}
                locations={[0, 0.45, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.driverMapGradient}
                pointerEvents="none"
              />
            ) : null}

            <TouchableOpacity
              style={[styles.rideBackBtn, { top: insets.top + 25 }]}
              onPress={handleDriverBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#1F1F1F" />
            </TouchableOpacity>

            {tripStatus !== "in_progress" ? (
              <View style={[styles.arrivingRow, { top: insets.top + 24 }]}>
                <View style={styles.arrivingPill}>
                  <Text style={styles.arrivingText}>{driverEtaLabel}</Text>
                </View>
              </View>
            ) : null}

            {tripStatus !== "in_progress" ? (
              <View style={[styles.liveBadge, { top: insets.top + 36 }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : null}

            {tripStatus !== "in_progress" ? (
              <MapControls
                top={insets.top + 99}
                onRecenter={handleRecenterMap}
                onToggleTraffic={() => setShowsTraffic((value) => !value)}
                trafficEnabled={showsTraffic}
                followEnabled={followNavigation}
              />
            ) : (
              <MapControls
                top={insets.top + 168}
                onRecenter={handleRecenterMap}
                onToggleTraffic={() => setShowsTraffic((value) => !value)}
                trafficEnabled={showsTraffic}
                followEnabled={followNavigation}
              />
            )}
          </View>
        )}
      </View>

      {showHomeChrome && (
        <ScrollView
          style={styles.panelSection}
          contentContainerStyle={styles.panelContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        >
          <HomeBottomPanel
            recentDestinations={recentDestinations}
            isRecentDestinationsLoading={isRecentDestinationsLoading}
            onDestinationPress={handleRecentDestinationPress}
            specialOffers={specialOffers}
            locationGuidance={panelGuidanceText}
            hasPickup={hasPickup}
            homePlace={homePlace}
            workPlace={workPlace}
            onSavedPlacePress={handleSavedPlacePress}
            onAddSavedPlace={() =>
              rootNavigation?.navigate("AddressScreen" as never)
            }
          />
        </ScrollView>
      )}

      <RideSelectionBottomSheet
        visible={isRideSheetOpen}
        onClose={handleRideSheetClose}
        onSelectRide={handleRideSelect}
        quote={quoteData}
        isQuoteLoading={isQuotePending}
        quoteError={quoteError}
        onRetryQuote={fetchQuote}
      />

      <RideConfirmationPanel
        visible={isRideConfirmationOpen}
        quote={quoteData}
        rideTypeSlug={pendingRideTypeSlug}
        pickupAddress={pickupLocation?.address}
        dropAddress={dropLocation?.address}
        onConfirm={handleConfirmBooking}
        onCancel={dismissRideConfirmation}
        onChangePayment={() =>
          rootNavigation?.navigate("PaymentMethodScreen" as never)
        }
        isBooking={createRideMutation.isPending}
      />

      <FindingRideBottomSheet
        visible={shouldShowTripSheet && isSearchingTrip}
        onCancel={handleCancelRide}
        isCancelling={false}
        status={tripStatus}
      />

      <DriverOnWayPanel
        visible={shouldShowTripSheet && isDriverOnWayTrip}
        status={tripStatus}
        driver={driver}
        startOtp={startOtp ?? activeRide?.start_otp ?? null}
        pickupAddress={resolveDisplayAddress(
          pickupLocation?.address,
          activeRide?.pickup_address,
          "Pickup",
        )}
        onCancel={handleCancelRide}
        isCancelling={false}
      />
      {showHomeChrome && (
        <HomeBottomTabBar activeTab="home" embedded />
      )}
    </View>
  );
}

const MAP_HEIGHT = 434;
/** Map strip visible below the search pill, before the white panel */
const MAP_STRIP_BELOW_SEARCH = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapSection: {
    height: MAP_HEIGHT,
    minHeight: MAP_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
    overflow: "hidden",
    zIndex: 1,
  },
  mapSectionTrip: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    overflow: "hidden",
    zIndex: 1,
  },
  panelSection: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: COLORS.white,
    zIndex: 0,
  },
  panelContent: {
    flexGrow: 1,
  },
  searchOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: MAP_STRIP_BELOW_SEARCH,
    zIndex: 15,
    elevation: 15,
  },
  rideMapChrome: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  rideMapTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  rideBackBtn: {
    position: "absolute",
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 200,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
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
  addressPill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: TAG_WIDTH,
    zIndex: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addressPillText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "#000000",
  },
  driverCarMarker: {
    width: 80,
    height: 80,
  },
  driverMapGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  arrivingRow: {
    position: "absolute",
    left: 72,
    right: 72,
    alignItems: "center",
    zIndex: 2,
  },
  arrivingPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  arrivingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 28,
    color: "#1F1F1F",
    textAlign: "center",
  },
  liveBadge: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: "rgba(7, 115, 222, 0.05)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.primary,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    gap: 12,
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 7.5,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
