import type {
  PaymentMethod,
  ProfileData,
  SavedAddress,
} from "../service/api/types";

export type OnboardingStep = 1 | 2 | 3;

export function isProfileIncomplete(
  profile: ProfileData | null | undefined,
): boolean {
  if (!profile) {
    return true;
  }

  return !profile.name?.trim() || !profile.email?.trim();
}

export function resolveOnboardingStep(
  profile: ProfileData | null | undefined,
  addresses: SavedAddress[] | null | undefined,
  paymentMethods: PaymentMethod[] | null | undefined,
): OnboardingStep | null {
  if (isProfileIncomplete(profile)) {
    return 1;
  }

  // Step 2: Add New Address — commented out (Login → OTP → Home direct)
  // if (!addresses?.length) {
  //   return 2;
  // }
  void addresses;

  // Step 3: Payment method — commented out
  // if (!paymentMethods?.length) {
  //   return 3;
  // }
  void paymentMethods;

  return null;
}

export function resolveOnboardingStepAfterSkip(
  skippedStep: OnboardingStep,
  profile: ProfileData | null | undefined,
  addresses: SavedAddress[] | null | undefined,
  paymentMethods: PaymentMethod[] | null | undefined,
): OnboardingStep | null {
  if (skippedStep === 1) {
    // Step 2: Add New Address — commented out
    // if (!addresses?.length) {
    //   return 2;
    // }
    void addresses;
    // Step 3: Payment method — commented out
    // if (!paymentMethods?.length) {
    //   return 3;
    // }
    void paymentMethods;
    return null;
  }

  if (skippedStep === 2) {
    // Step 3: Payment method — commented out
    // if (!paymentMethods?.length) {
    //   return 3;
    // }
    void paymentMethods;
    return null;
  }

  return null;
}

export function getOnboardingRouteName(
  step: OnboardingStep | null,
): string {
  switch (step) {
    case 1:
      return "ProfileOnboardingScreen";
    // Step 2: Add New Address — commented out
    // case 2:
    //   return "ProfileAddressOnboardingScreen";
    // Step 3: Payment method — commented out
    // case 3:
    //   return "ProfilePaymentOnboardingScreen";
    default:
      return "DrawerNavigator";
  }
}
