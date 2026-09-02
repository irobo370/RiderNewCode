import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  checkAppPermissions,
  openAppPermissionSettings,
  requestMissingAppPermissions,
  type AppPermissionsSnapshot,
} from "../permissions/appPermissions";

const EMPTY_SNAPSHOT: AppPermissionsSnapshot = {
  permissions: [],
  allRequiredGranted: false,
  hasBlockedRequired: false,
  hasAskableMissing: false,
};

type UseAppPermissionsOptions = {
  /** Recheck when app returns to foreground (e.g. after Settings). Default true. */
  recheckOnForeground?: boolean;
  /** Run an initial status check on mount. Default true. */
  checkOnMount?: boolean;
};

export function useAppPermissions(options: UseAppPermissionsOptions = {}) {
  const { recheckOnForeground = true, checkOnMount = true } = options;
  const [snapshot, setSnapshot] =
    useState<AppPermissionsSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await checkAppPermissions();
      setSnapshot(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestMissing = useCallback(async () => {
    setRequesting(true);
    try {
      const next = await requestMissingAppPermissions();
      setSnapshot(next);
      return next;
    } finally {
      setRequesting(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    await openAppPermissionSettings();
  }, []);

  useEffect(() => {
    if (!checkOnMount) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [checkOnMount, refresh]);

  useEffect(() => {
    if (!recheckOnForeground) {
      return;
    }

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasBackground =
          appStateRef.current === "background" ||
          appStateRef.current === "inactive";
        appStateRef.current = nextState;
        if (wasBackground && nextState === "active") {
          void refresh();
        }
      },
    );

    return () => subscription.remove();
  }, [recheckOnForeground, refresh]);

  return {
    ...snapshot,
    loading,
    requesting,
    refresh,
    requestMissing,
    openSettings,
  };
}
