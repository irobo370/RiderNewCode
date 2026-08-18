import { createNavigationContainerRef } from "@react-navigation/native";
import {
  getOnboardingRouteName,
  type OnboardingStep,
} from "../utils/onboardingProgress";

export const navigationRef = createNavigationContainerRef();

export type MainTabKey = "home" | "trips" | "earning" | "profile";

const MAIN_TAB_ROUTES: Record<MainTabKey, string> = {
  home: "DrawerNavigator",
  trips: "RideHistory",
  earning: "InsightScreen",
  profile: "ProfileScreen",
};

export function navigateMainTab(tab: MainTabKey) {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate(MAIN_TAB_ROUTES[tab] as never);
}

export function resetToLogin() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: "LoginScreen" as never }],
    });
  }
}

export function resetToHome() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: "DrawerNavigator" as never }],
    });
  }
}

export function goBackOrHome() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
    return;
  }

  resetToHome();
}

export function resetToOnboardingStep(step: OnboardingStep) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: getOnboardingRouteName(step) as never,
          params: { onboardingStep: step } as never,
        },
      ],
    });
  }
}

export function resetAfterAuth(onboardingStep: OnboardingStep | null) {
  if (onboardingStep == null) {
    resetToHome();
    return;
  }

  resetToOnboardingStep(onboardingStep);
}

let initialSplashComplete = false;

export function isInitialSplashComplete() {
  return initialSplashComplete;
}

export function completeInitialSplash() {
  initialSplashComplete = true;
}

export function navigateToTripSummary() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("TripSummaryScreen" as never);
  }
}

export function navigateToRidePayment() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("RidePaymentScreen" as never);
  }
}
