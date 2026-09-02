import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { checkAppPermissions } from "../permissions/appPermissions";
import {
  isInitialSplashComplete,
  navigationRef,
} from "../navigation/navigationRef";

/**
 * Safety net for any future permission that IS marked `required: true` in
 * appPermissions.ts: if the user revokes it while the app is backgrounded,
 * send them back to the permissions screen before Home/Map.
 *
 * Location is intentionally NOT required (App Review 5.1.5 — the app must
 * stay usable with Location Services off or denied), so this currently
 * never redirects on Location changes; `allRequiredGranted` is vacuously
 * true whenever there are no required permissions.
 */
export default function PermissionsResumeGate() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const checkingRef = useRef(false);

  useEffect(() => {
    const ensurePermissions = async () => {
      if (!isInitialSplashComplete() || checkingRef.current) {
        return;
      }
      if (!navigationRef.isReady()) {
        return;
      }

      const routeName = navigationRef.getCurrentRoute()?.name as
        | string
        | undefined;
      if (
        routeName === "SplashScreen" ||
        routeName === "PermissionsRequiredScreen"
      ) {
        return;
      }

      checkingRef.current = true;
      try {
        const snapshot = await checkAppPermissions();
        if (snapshot.allRequiredGranted) {
          return;
        }
        if (!navigationRef.isReady()) {
          return;
        }
        navigationRef.reset({
          index: 0,
          routes: [{ name: "PermissionsRequiredScreen" as never }],
        });
      } finally {
        checkingRef.current = false;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasBackground =
          appStateRef.current === "background" ||
          appStateRef.current === "inactive";
        appStateRef.current = nextState;
        if (wasBackground && nextState === "active") {
          void ensurePermissions();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  return null;
}
