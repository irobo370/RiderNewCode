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

export async function getCurrentLocation(
  accuracy: Location.Accuracy = Location.Accuracy.Balanced,
): Promise<CurrentLocationResult | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy });
    const { latitude, longitude } = position.coords;

    const places = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (places.length > 0) {
      const address = formatPlaceAddress(places[0]);
      return {
        lat: latitude.toString(),
        lng: longitude.toString(),
        latitude,
        longitude,
        address: address.trim() || `${latitude}, ${longitude}`,
      };
    }

    return {
      lat: latitude.toString(),
      lng: longitude.toString(),
      latitude,
      longitude,
      address: `${latitude}, ${longitude}`,
    };
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    return await Location.watchPositionAsync(
      {
        accuracy: options.accuracy ?? Location.Accuracy.Balanced,
        distanceInterval: options.distanceInterval ?? 10,
        timeInterval: options.timeInterval ?? 2000,
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    return await Location.watchPositionAsync(
      {
        accuracy: options.accuracy ?? Location.Accuracy.High,
        distanceInterval: options.distanceInterval ?? 5,
        timeInterval: options.timeInterval ?? 1000,
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
