import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { SplashBrandView, type SplashPhase } from "./SplashBrandView";
import {
  resetAfterAuth,
  completeInitialSplash,
} from "../navigation/navigationRef";
import type { OnboardingStep } from "../utils/onboardingProgress";

const PHOTO_SPLASH_MS = 1000;
const MAP_SPLASH_MS = 1500;

type RootStackParamList = {
  SplashScreen: undefined;
  LoginScreen: undefined;
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

    hasNavigated.current = true;
    completeInitialSplash();

    if (isAuthenticated) {
      resetAfterAuth(onboardingStep ?? null);
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
  }, [
    bootstrapping,
    isAuthenticated,
    mapPhaseReady,
    navigation,
    onboardingStep,
  ]);

  return <SplashBrandView phase={phase} />;
}
