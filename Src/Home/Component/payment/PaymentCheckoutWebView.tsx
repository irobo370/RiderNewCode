import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../../../components/ui/PrimaryButton";
import { isPaymentReturnUrl } from "../../../constants/paymentGateway";
import { COLORS } from "../../../utils/colors";
import { FONTS } from "../../../utils/fonts";
import { TYPO } from "../../../utils/typography";
import { SPACING } from "../../../utils/spacing";

type WebViewNavigation = { url?: string };

type WebViewComponent = React.ComponentType<{
  source: { uri: string };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onNavigationStateChange?: (nav: WebViewNavigation) => void;
  onShouldStartLoadWithRequest?: (request: { url: string }) => boolean;
  startInLoadingState?: boolean;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
}>;

function isNativeWebViewLinked(): boolean {
  try {
    return TurboModuleRegistry.get("RNCWebViewModule") != null;
  } catch {
    return false;
  }
}

function loadNativeWebView(): WebViewComponent | null {
  if (!isNativeWebViewLinked()) {
    return null;
  }

  try {
    // Lazy require so missing native binaries do not crash app startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-webview") as {
      WebView?: WebViewComponent;
      default?: WebViewComponent;
    };
    return mod.WebView ?? mod.default ?? null;
  } catch {
    return null;
  }
}

type PaymentCheckoutWebViewProps = {
  visible: boolean;
  checkoutUrl: string;
  onReturnUrlReached: () => void;
  onClose: () => void;
};

export function PaymentCheckoutWebView({
  visible,
  checkoutUrl,
  onReturnUrlReached,
  onClose,
}: PaymentCheckoutWebViewProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const handledRef = useRef(false);
  const WebView = useMemo(() => loadNativeWebView(), []);

  useEffect(() => {
    handledRef.current = false;
    setLoading(true);
  }, [checkoutUrl, visible]);

  const handleNavigation = (nav: WebViewNavigation) => {
    if (!nav.url || handledRef.current) {
      return;
    }

    if (isPaymentReturnUrl(nav.url)) {
      handledRef.current = true;
      onReturnUrlReached();
    }
  };

  const openExternalCheckout = async () => {
    try {
      await Linking.openURL(checkoutUrl);
      onReturnUrlReached();
    } catch {
      // Keep modal open; user can close and retry.
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Card payment</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close card checkout"
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.webWrap}>
          {visible && WebView ? (
            <WebView
              source={{ uri: checkoutUrl }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={handleNavigation}
              onShouldStartLoadWithRequest={(request) => {
                handleNavigation(request);
                return !isPaymentReturnUrl(request.url);
              }}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
            />
          ) : null}

          {visible && !WebView ? (
            <View style={styles.fallback}>
              <Ionicons name="card-outline" size={40} color={COLORS.primary} />
              <Text style={styles.fallbackTitle}>Native rebuild required</Text>
              <Text style={styles.fallbackBody}>
                In-app card checkout needs a fresh native build that includes
                WebView. Until then you can open checkout externally; payment
                still confirms from the backend.
              </Text>
              <PrimaryButton
                label="Open card checkout"
                onPress={() => {
                  void openExternalCheckout();
                }}
              />
            </View>
          ) : null}

          {loading && WebView ? (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPO.h3,
    color: COLORS.dark,
    fontFamily: FONTS.bold,
  },
  webWrap: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  fallback: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  fallbackTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.dark,
    textAlign: "center",
  },
  fallbackBody: {
    ...TYPO.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
});
