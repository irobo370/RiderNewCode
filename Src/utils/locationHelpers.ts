import { Platform } from "react-native";
import * as Location from "expo-location";

export type CurrentLocationResult = {
  lat: string;
  lng: string;
  latitude: number;
  longitude: number;
  address: string;
};

function formatPlaceAddress(place: Location.LocationGeocodedAddress): string {
  return [
    place.name,
    place.street,
    place.district,
    place.city,
    place.region,
  ]
    .filter(Boolean)
    .join(", ");
}

function toResult(
  latitude: number,
  longitude: number,
  address?: string | null,
): CurrentLocationResult {
  return {
    lat: latitude.toString(),
    lng: longitude.toString(),
    latitude,
    longitude,
    address: address?.trim() || "Your Current Location",
  };
}

async function ensureForegroundPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === "granted") {
    return true;
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === "granted";
}

async function ensureAndroidNetworkProvider() {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    // User dismissed the dialog or provider is unavailable — GPS may still work.
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function readDevicePosition(
  accuracy: Location.Accuracy,
): Promise<Location.LocationObject | null> {
  await ensureAndroidNetworkProvider();

  const fresh = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy,
      mayShowUserSettingsDialog: true,
    }),
    12_000,
  );
  if (fresh) {
    return fresh;
  }

  // Fast fallback when a fresh fix is slow (common on cold start / simulator).
  return (
    (await withTimeout(
      Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 500,
      }),
      2_000,
    )) ?? null
  );
}

/** Reverse-geocode coords into a readable address, or null on failure. */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!places.length) return null;
    const address = formatPlaceAddress(places[0]);
    return address.trim() || null;
  } catch {
    return null;
  }
}

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export type UserPosition = UserCoordinates & {
  heading: number | null;
  speed: number | null;
};

/** Current GPS lat/lng only (no reverse-geocode). Used for OTP verify, etc. */
export async function getCurrentCoords(): Promise<UserCoordinates | null> {
  try {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      return null;
    }

    const position = await readDevicePosition(Location.Accuracy.Balanced);
    if (!position) {
      return null;
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the user's current GPS position.
 * Never throws away coordinates if reverse-geocoding fails.
 */
export async function getCurrentLocation(
  accuracy: Location.Accuracy = Location.Accuracy.Balanced,
): Promise<CurrentLocationResult | null> {
  try {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      return null;
    }

    const position = await readDevicePosition(accuracy);
    if (!position) {
      return null;
    }

    const { latitude, longitude } = position.coords;
    const address = await reverseGeocodeAddress(latitude, longitude);
    return toResult(latitude, longitude, address);
  } catch {
    return null;
  }
}

/**
 * Subscribe to foreground GPS updates for map camera / search bias.
 * Always reports the user's real current coordinates.
 */
export async function watchUserCoordinates(
  onUpdate: (coords: UserCoordinates) => void,
  options: {
    accuracy?: Location.Accuracy;
    distanceInterval?: number;
    timeInterval?: number;
  } = {},
): Promise<Location.LocationSubscription | null> {
  try {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      return null;
    }

    await ensureAndroidNetworkProvider();

    return await Location.watchPositionAsync(
      {
        accuracy: options.accuracy ?? Location.Accuracy.Balanced,
        distanceInterval: options.distanceInterval ?? 10,
        timeInterval: options.timeInterval ?? 2000,
        mayShowUserSettingsDialog: true,
      },
      (position) => {
        const { latitude, longitude } = position.coords;
        onUpdate({ latitude, longitude });
      },
    );
  } catch {
    return null;
  }
}

/**
 * High-accuracy GPS watch used during live navigation.
 */
export async function watchUserPosition(
  onUpdate: (coords: UserPosition) => void,
  options: {
    accuracy?: Location.Accuracy;
    distanceInterval?: number;
    timeInterval?: number;
  } = {},
): Promise<Location.LocationSubscription | null> {
  try {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      return null;
    }

    await ensureAndroidNetworkProvider();

    return await Location.watchPositionAsync(
      {
        accuracy: options.accuracy ?? Location.Accuracy.High,
        distanceInterval: options.distanceInterval ?? 5,
        timeInterval: options.timeInterval ?? 1000,
        mayShowUserSettingsDialog: true,
      },
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        onUpdate({
          latitude,
          longitude,
          heading: heading != null && heading >= 0 ? heading : null,
          speed: speed != null && speed >= 0 ? speed : null,
        });
      },
    );
  } catch {
    return null;
  }
}
