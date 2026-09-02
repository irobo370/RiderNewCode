import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ExpoSplashScreen from "expo-splash-screen";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import store from "./Src/redux/store";
import Toast from "react-native-toast-message";
import { queryClient } from "./Src/service/api/queryClient";
import { ActiveRideProvider } from "./Src/context/ActiveRideContext";
import { CountryMarketProvider } from "./Src/context/CountryMarketContext";
import SessionWatcher from "./Src/components/SessionWatcher";
import RideWebSocketWatcher from "./Src/components/RideWebSocketWatcher";
import PermissionsResumeGate from "./Src/components/PermissionsResumeGate";
import { navigationRef } from "./Src/navigation/navigationRef";

import AuthNavigator from "./Src/navigation/AuthNavigator";

export default function App() {
  useEffect(() => {
    ExpoSplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryMarketProvider>
          <ActiveRideProvider>
            <SessionWatcher />
            <RideWebSocketWatcher />
            <PermissionsResumeGate />
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <BottomSheetModalProvider>
                  <NavigationContainer ref={navigationRef}>
                    <StatusBar style="auto" />
                    <AuthNavigator />
                  </NavigationContainer>
                  <Toast />
                </BottomSheetModalProvider>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </ActiveRideProvider>
        </CountryMarketProvider>
      </QueryClientProvider>
    </Provider>
  );
}
