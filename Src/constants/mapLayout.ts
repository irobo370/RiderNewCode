import { Dimensions } from "react-native";

/** Map / bottom-panel split for every ride-lifecycle screen that shows a map. */
export const MAP_LIFECYCLE_PANEL_RATIO = 0.5;

export function getMapLifecycleMapHeight(): number {
  return Math.round(
    Dimensions.get("window").height * MAP_LIFECYCLE_PANEL_RATIO,
  );
}

export function getMapLifecyclePanelHeight(): number {
  return getMapLifecycleMapHeight();
}

/** In-map edge inset when the map band is already constrained to half the screen. */
export const MAP_LIFECYCLE_MAP_EDGE_INSET = 48;
