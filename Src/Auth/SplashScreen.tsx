import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { SplashBrandView, type SplashPhase } from "./SplashBrandView";
import {
  resetAfterAuth,
  completeInitialSplash,
} from "../navigation/navigationRef";
import { checkAppPermissions } from "../permissions/appPermissions";
import type { OnboardingStep } from "../utils/onboardingProgress";

const PHOTO_SPLASH_MS = 1000;
const MAP_SPLASH_MS = 1500;

type RootStackParamList = {
  SplashScreen: undefined;
  LoginScreen: undefined;
  PermissionsRequiredScreen: undefined;
};

export default function SplashScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hasNavigated = useRef(false);
  const [phase, setPhase] = useState<SplashPhase>("photo");
  const [mapPhaseReady, setMapPhaseReady] = useState(false);

  const { bootstrapping, isAuthenticated, onboardingStep } = useSelector(
    (state: {
      session?: {
        bootstrapping?: boolean;
        isAuthenticated?: boolean;
        onboardingStep?: OnboardingStep | null;
      };
    }) => state.session ?? {},
  );

  useEffect(() => {
    const photoTimer = setTimeout(() => setPhase("map"), PHOTO_SPLASH_MS);
    return () => clearTimeout(photoTimer);
  }, []);

  useEffect(() => {
    if (phase !== "map") {
      return;
    }

    const mapTimer = setTimeout(() => setMapPhaseReady(true), MAP_SPLASH_MS);
    return () => clearTimeout(mapTimer);
  }, [phase]);

  useEffect(() => {
    if (!mapPhaseReady || bootstrapping || hasNavigated.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      // Location status is read only to decide whether to show the one-time
      // informational screen below — it must never be able to strand the
      // user on the splash screen. Any failure reading it (e.g. Location
      // Services unavailable/misbehaving on this device) is treated the same
      // as "no location info" and we proceed straight into the app.
      let locationStatus: string | undefined;
      try {
        const permissions = await checkAppPermissions();
        locationStatus = permissions.permissions.find(
          (permission) => permission.id === "location",
        )?.status;
      } catch {
        locationStatus = undefined;
      }

      if (cancelled || hasNavigated.current) {
        return;
      }

      hasNavigated.current = true;

      // Location is optional (see appPermissions.ts) — the app must remain
      // usable whether or not it's granted (App Review 5.1.5). We only show
      // the informational permissions screen once, the first time the app
      // launches and iOS has not yet been asked ("undetermined"). Once the
      // user has made a choice (granted, denied, or blocked), we go straight
      // to Login/Home on every subsequent launch and never gate on it again.
      if (locationStatus === "undetermined") {
        navigation.reset({
          index: 0,
          routes: [{ name: "PermissionsRequiredScreen" }],
        });
        return;
      }

      completeInitialSplash();

      if (isAuthenticated) {
        resetAfterAuth(onboardingStep ?? null);
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    bootstrapping,
    isAuthenticated,
    mapPhaseReady,
    navigation,
    onboardingStep,
  ]);

  return <SplashBrandView phase={phase} />;
}
