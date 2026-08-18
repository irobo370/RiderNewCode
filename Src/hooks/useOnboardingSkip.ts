import { useCallback } from "react";
import { useSelector } from "react-redux";

import {
  resolveOnboardingStepAfterSkip,
  type OnboardingStep,
} from "../utils/onboardingProgress";
import { resetAfterAuth } from "../navigation/navigationRef";

export function useOnboardingSkip(currentStep: OnboardingStep) {
  const profile = useSelector((state: any) => state.session?.profile);
  const addresses = useSelector((state: any) => state.session?.addresses ?? []);
  const paymentMethods = useSelector(
    (state: any) => state.session?.paymentMethods ?? [],
  );

  return useCallback(() => {
    const nextStep = resolveOnboardingStepAfterSkip(
      currentStep,
      profile,
      addresses,
      paymentMethods,
    );
    resetAfterAuth(nextStep);
  }, [currentStep, profile, addresses, paymentMethods]);
}
