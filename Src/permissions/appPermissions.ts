import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

/**
 * Central registry of permissions that are genuinely required by installed features.
 *
 * Today the rider app only needs foreground location for map + pickup.
 * Camera / photos / microphone / push are NOT requested here because those
 * Expo modules are not installed and no screen uses them yet.
 * Add entries here only when a real feature needs them.
 */
export type AppPermissionId = "location";

export type PermissionUiStatus =
  | "granted"
  | "denied"
  | "blocked"
  | "undetermined";

export type AppPermissionDefinition = {
  id: AppPermissionId;
  title: string;
  description: string;
  /**
   * Whether this permission is a hard requirement for the app to function.
   * Location is intentionally NOT required: per App Review guideline 5.1.5,
   * the app must remain fully usable with Location Services disabled or
   * denied. Location is requested contextually by the specific features
   * that use it (map, pickup, fare estimate) and degrades gracefully when
   * unavailable — it never gates app launch, login, or navigation.
   */
  required: boolean;
  badge: "Recommended";
};

export type AppPermissionState = AppPermissionDefinition & {
  status: PermissionUiStatus;
  canAskAgain: boolean;
};

export type AppPermissionsSnapshot = {
  permissions: AppPermissionState[];
  allRequiredGranted: boolean;
  hasBlockedRequired: boolean;
  hasAskableMissing: boolean;
};

export const APP_PERMISSIONS: AppPermissionDefinition[] = [
  {
    id: "location",
    title: "Location",
    description:
      "Used to show your position on the map, set your pickup point, estimate fares, and match nearby drivers. You can still use the rest of the app without it.",
    required: false,
    badge: "Recommended",
  },
];

function toUiStatus(
  status: Location.PermissionStatus,
  canAskAgain: boolean,
): PermissionUiStatus {
  if (status === Location.PermissionStatus.GRANTED) {
    return "granted";
  }
  if (status === Location.PermissionStatus.UNDETERMINED) {
    return "undetermined";
  }
  // DENIED — permanently blocked when the OS will not show the dialog again.
  if (!canAskAgain) {
    return "blocked";
  }
  return "denied";
}

// If the Location API itself throws (device in a bad state, Location
// Services misbehaving, simulator quirks, etc.) we must never let that hang
// or crash app startup / login. Treat it like a permanently unavailable
// permission: don't keep re-prompting, and let every caller fall back to
// its "no location" path (getCurrentLocation() etc. already no-op safely).
const UNAVAILABLE_STATE = {
  status: "blocked" as PermissionUiStatus,
  canAskAgain: false,
};

async function readLocationState(): Promise<{
  status: PermissionUiStatus;
  canAskAgain: boolean;
}> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    return {
      status: toUiStatus(current.status, current.canAskAgain),
      canAskAgain: current.canAskAgain,
    };
  } catch {
    return UNAVAILABLE_STATE;
  }
}

async function requestLocationState(): Promise<{
  status: PermissionUiStatus;
  canAskAgain: boolean;
}> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === Location.PermissionStatus.GRANTED) {
      return {
        status: "granted",
        canAskAgain: current.canAskAgain,
      };
    }

    // Permanently denied — requesting again usually no-ops; send user to Settings.
    if (
      current.status === Location.PermissionStatus.DENIED &&
      !current.canAskAgain
    ) {
      return {
        status: "blocked",
        canAskAgain: false,
      };
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    return {
      status: toUiStatus(requested.status, requested.canAskAgain),
      canAskAgain: requested.canAskAgain,
    };
  } catch {
    return UNAVAILABLE_STATE;
  }
}

async function readPermissionState(
  id: AppPermissionId,
): Promise<{ status: PermissionUiStatus; canAskAgain: boolean }> {
  switch (id) {
    case "location":
      return readLocationState();
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

async function requestPermissionState(
  id: AppPermissionId,
): Promise<{ status: PermissionUiStatus; canAskAgain: boolean }> {
  switch (id) {
    case "location":
      return requestLocationState();
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function buildSnapshot(
  states: Array<{
    definition: AppPermissionDefinition;
    status: PermissionUiStatus;
    canAskAgain: boolean;
  }>,
): AppPermissionsSnapshot {
  const permissions: AppPermissionState[] = states.map((entry) => ({
    ...entry.definition,
    status: entry.status,
    canAskAgain: entry.canAskAgain,
  }));

  const required = permissions.filter((permission) => permission.required);
  const allRequiredGranted = required.every(
    (permission) => permission.status === "granted",
  );
  const hasBlockedRequired = required.some(
    (permission) => permission.status === "blocked",
  );
  const hasAskableMissing = required.some(
    (permission) =>
      permission.status === "undetermined" ||
      (permission.status === "denied" && permission.canAskAgain),
  );

  return {
    permissions,
    allRequiredGranted,
    hasBlockedRequired,
    hasAskableMissing,
  };
}

/** Read current OS status for every registered required permission. */
export async function checkAppPermissions(): Promise<AppPermissionsSnapshot> {
  const states = await Promise.all(
    APP_PERMISSIONS.map(async (definition) => {
      const result = await readPermissionState(definition.id);
      return { definition, ...result };
    }),
  );
  return buildSnapshot(states);
}

/**
 * Request only missing / askable permissions. Skips already-granted ones.
 * Does not open Settings for blocked permissions — caller should.
 */
export async function requestMissingAppPermissions(): Promise<AppPermissionsSnapshot> {
  const states = await Promise.all(
    APP_PERMISSIONS.map(async (definition) => {
      const current = await readPermissionState(definition.id);
      if (current.status === "granted") {
        return { definition, ...current };
      }
      if (current.status === "blocked") {
        return { definition, ...current };
      }
      const requested = await requestPermissionState(definition.id);
      return { definition, ...requested };
    }),
  );
  return buildSnapshot(states);
}

export async function openAppPermissionSettings(): Promise<void> {
  await Linking.openSettings();
}

export function permissionStatusLabel(status: PermissionUiStatus): string {
  switch (status) {
    case "granted":
      return "Allowed";
    case "blocked":
      return "Blocked";
    case "denied":
      return "Denied";
    case "undetermined":
      return "Not set";
    default:
      return status;
  }
}

export function isAndroid(): boolean {
  return Platform.OS === "android";
}
