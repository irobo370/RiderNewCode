import React, { useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoSplashScreen from "expo-splash-screen";
import { COLORS } from "../utils/colors";

type SplashPhase = "photo" | "map";

type Props = {
  phase?: SplashPhase;
};

export type { SplashPhase };

/** Figma splash screen 1 — 393×852 */
const PHOTO_SPLASH = {
  frameWidth: 393,
  frameHeight: 852,
  imageWidth: 413,
  imageHeight: 892,
  gradientHeight: 317,
  logo: { width: 165, height: 61, left: 114, top: 121 },
};

/** Figma splash screen 2 — 393×852 */
const MAP_SPLASH = {
  frameWidth: 393,
  frameHeight: 852,
  mapFrameHeight: 402,
  mapImage: { width: 842, height: 685, left: -87, top: -285 },
  logo: { width: 165, height: 61 },
  cars: [
    { left: 142, top: 181, width: 36, height: 65.55, rotate: "-15deg" },
    { left: 310, top: 166, width: 36, height: 65.55, rotate: "129.55deg" },
    { left: 250, top: 19, width: 36, height: 65.55, rotate: "29.65deg" },
  ],
  location: { left: 197, top: 119, width: 48, height: 48 },
};

function LocationPinMarker({
  left,
  top,
  size,
}: {
  left: number;
  top: number;
  size: number;
}) {
  const dot = size * (16 / 48);
  const border = Math.max(2, size * (4 / 48));

  return (
    <View
      style={[
        styles.pinWrap,
        {
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <View
        style={[
          styles.pinDot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            borderWidth: border,
            left: size * (16 / 48),
            top: size * (16 / 48),
          },
        ]}
      />
      <View
        style={[
          styles.pinNeedle,
          {
            width: border,
            height: size * 0.28,
            left: size / 2 - border / 2,
            top: size * 0.14,
          },
        ]}
      />
    </View>
  );
}

function MapSplashScreen({
  screenWidth,
  screenHeight,
}: {
  screenWidth: number;
  screenHeight: number;
}) {
  const scaleX = screenWidth / MAP_SPLASH.frameWidth;
  const scaleY = screenHeight / MAP_SPLASH.frameHeight;

  const mapFrameHeight = MAP_SPLASH.mapFrameHeight * scaleY;
  const mapWidth = MAP_SPLASH.mapImage.width * scaleX;
  const mapHeight = MAP_SPLASH.mapImage.height * scaleY;
  const mapLeft = MAP_SPLASH.mapImage.left * scaleX;
  const mapTop = MAP_SPLASH.mapImage.top * scaleY;

  const logoWidth = MAP_SPLASH.logo.width * scaleX;
  const logoHeight = MAP_SPLASH.logo.height * scaleX;

  return (
    <View style={styles.mapRoot}>
      <View
        style={[styles.mapFrame, { width: screenWidth, height: mapFrameHeight }]}
      >
        <Image
          source={require("../../assets/splash-map.png")}
          style={{
            position: "absolute",
            width: mapWidth,
            height: mapHeight,
            left: mapLeft,
            top: mapTop,
          }}
          resizeMode="cover"
        />

        {MAP_SPLASH.cars.map((car, index) => (
          <Image
            key={index}
            source={require("../../assets/car.png")}
            style={{
              position: "absolute",
              width: car.width * scaleX,
              height: car.height * scaleY,
              left: car.left * scaleX,
              top: car.top * scaleY,
              transform: [{ rotate: car.rotate }],
            }}
            resizeMode="contain"
          />
        ))}

        <LocationPinMarker
          left={MAP_SPLASH.location.left * scaleX}
          top={MAP_SPLASH.location.top * scaleY}
          size={MAP_SPLASH.location.width * scaleX}
        />

        <LinearGradient
          colors={[
            "#FFFFFF",
            "#FFFFFF",
            "rgba(255,255,255,0.8)",
            "rgba(255,255,255,0)",
          ]}
          locations={[0, 0.5914, 0.7538, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={styles.mapLogoWrap} pointerEvents="none">
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: logoWidth, height: logoHeight }}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.loader}
        />
      </View>
    </View>
  );
}

export function SplashBrandView({ phase = "map" }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  if (phase === "photo") {
    const scaleX = screenWidth / PHOTO_SPLASH.frameWidth;
    const scaleY = screenHeight / PHOTO_SPLASH.frameHeight;

    const imageWidth = PHOTO_SPLASH.imageWidth * scaleX;
    const imageHeight = PHOTO_SPLASH.imageHeight * scaleY;
    const gradientHeight = PHOTO_SPLASH.gradientHeight * scaleY;
    const logoWidth = PHOTO_SPLASH.logo.width * scaleX;
    const logoHeight = PHOTO_SPLASH.logo.height * scaleX;
    const logoLeft = PHOTO_SPLASH.logo.left * scaleX;
    const logoTop = PHOTO_SPLASH.logo.top * scaleY;

    return (
      <View style={styles.photoRoot}>
        <Image
          source={require("../../assets/splash-photo-bg.png")}
          style={[
            styles.photoImage,
            {
              width: imageWidth,
              height: imageHeight,
              left: (screenWidth - imageWidth) / 2,
              top: (screenHeight - imageHeight) / 2,
            },
          ]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["#FFFFFF", "#FFFFFF", "rgba(255,255,255,0)"]}
          locations={[0, 0.5015, 1]}
          style={[styles.photoGradient, { height: gradientHeight }]}
          pointerEvents="none"
        />
        <Image
          source={require("../../assets/logo.png")}
          style={{
            position: "absolute",
            width: logoWidth,
            height: logoHeight,
            left: logoLeft,
            top: logoTop,
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <MapSplashScreen screenWidth={screenWidth} screenHeight={screenHeight} />
  );
}

const styles = StyleSheet.create({
  photoRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  photoImage: {
    position: "absolute",
  },
  photoGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  mapRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  pinWrap: {
    position: "absolute",
    backgroundColor: "rgba(21, 21, 19, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: {
    position: "absolute",
    backgroundColor: COLORS.white,
    borderColor: "#151513",
  },
  pinNeedle: {
    position: "absolute",
    backgroundColor: "#151513",
    borderRadius: 1,
  },
  mapLogoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginTop: 28,
  },
});
