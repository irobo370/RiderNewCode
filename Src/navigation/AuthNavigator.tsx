import React, { useEffect, useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import useCustomFonts from "../utils/fonts";
import SplashScreen from "../Auth/SplashScreen";
import LoginScreen from "../Auth/LoginScreen";
import OtpScreen from "../Auth/OtpScreen";
import ProfileOnboardingScreen from "../Auth/ProfileOnboardingScreen";
// Step 2: Add New Address onboarding — commented out (Login → OTP → Home direct)
// import ProfileAddressOnboardingScreen from "../Auth/ProfileAddressOnboardingScreen";
// Step 3: Payment method onboarding — commented out
// import ProfilePaymentOnboardingScreen from "../Auth/ProfilePaymentOnboardingScreen";
import CompleteProfileScreen from "../Auth/CompleteProfileScreen";
import AddressScreen from "../Auth/AddressScreen";
import PaymentMethodScreen from "../Auth/PaymentMethodScreen";
import DrawerNavigator from "./DrawerNavigator";
import RideHistoryScreen from "../DrawerScreen/BookingHistroy/RideHistoryScreen";
import InsightScreen from "../DrawerScreen/Insight/InsightScreen";
import FavoriteDriversScreen from "../DrawerScreen/FavouriteDriver/FavoriteDriversScreen";
import ReferFriendScreen from "../DrawerScreen/ReferAFriend/ReferFriendScreen";
import ReferDriverScreen from "../DrawerScreen/ReferDriver/ReferDriverScreen";
import SettingScreen from "../DrawerScreen/Setting/SettingScreen";
import ProfileScreen from "../DrawerScreen/Profile/ProfileScreen";
import LocationSearchScreen from "../Home/LocationSearchScreen";
import RidePaymentScreen from "../Home/RidePaymentScreen";
import TripSummaryScreen from "../Home/TripSummaryScreen";
import { bootstrapSessionRequest } from "../redux/Auth/sessionSlice";
import { resetAfterAuth, completeInitialSplash, isInitialSplashComplete } from "./navigationRef";
import type { OnboardingStep } from "../utils/onboardingProgress";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const [loaded] = useCustomFonts();
  const dispatch = useDispatch();
  const { bootstrapping, isAuthenticated, onboardingStep } = useSelector(
    (state: {
      session?: {
        bootstrapping?: boolean;
        isAuthenticated?: boolean;
        onboardingStep?: OnboardingStep | null;
      };
    }) => state.session ?? {},
  );
  const hasRoutedAuthenticatedUser = useRef(false);

  useEffect(() => {
    dispatch(bootstrapSessionRequest());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialSplashComplete()) {
      return;
    }

    if (
      !bootstrapping &&
      isAuthenticated &&
      !hasRoutedAuthenticatedUser.current
    ) {
      hasRoutedAuthenticatedUser.current = true;
      resetAfterAuth(onboardingStep ?? null);
    }

    if (!isAuthenticated) {
      hasRoutedAuthenticatedUser.current = false;
    }
  }, [bootstrapping, isAuthenticated, onboardingStep]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="SplashScreen"
    >
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen
        name="ProfileOnboardingScreen"
        component={ProfileOnboardingScreen}
      />
      {/* Step 2: Add New Address onboarding — commented out
      <Stack.Screen
        name="ProfileAddressOnboardingScreen"
        component={ProfileAddressOnboardingScreen}
      />
      */}
      {/* Step 3: Payment method onboarding — commented out
      <Stack.Screen
        name="ProfilePaymentOnboardingScreen"
        component={ProfilePaymentOnboardingScreen}
      />
      */}

      <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
      <Stack.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InsightScreen"
        component={InsightScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FavoriteDriversScreen"
        component={FavoriteDriversScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReferFriendScreen"
        component={ReferFriendScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReferDriverScreen"
        component={ReferDriverScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingScreen"
        component={SettingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompleteProfileScreen"
        component={CompleteProfileScreen}
      />
      <Stack.Screen name="AddressScreen" component={AddressScreen} />
      <Stack.Screen
        name="PaymentMethodScreen"
        component={PaymentMethodScreen}
      />
      <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
      <Stack.Screen
        name="RidePaymentScreen"
        component={RidePaymentScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TripSummaryScreen"
        component={TripSummaryScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
