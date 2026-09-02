import {
  DEFAULT_COUNTRY_ID,
  getActiveCountry,
  getActiveCountryId,
  isCountryId,
  setActiveCountryId,
  type CountryConfig,
  type CountryId,
} from "../constants/countries";
import SecureStorage from "./SecureStorage";

export type MarketSource = "user" | "cache" | "default";

export type MarketLoadResult = {
  countryId: CountryId;
  source: MarketSource;
};

/**
 * Restore the user's saved market (from country picker).
 * Does not use GPS — market is chosen with the phone country code.
 */
export async function loadSavedMarketCountry(): Promise<MarketLoadResult> {
  const cached = await SecureStorage.getMarketCountryId();
  if (isCountryId(cached)) {
    setActiveCountryId(cached);
    return { countryId: cached, source: "cache" };
  }

  const fallback = getActiveCountryId() || DEFAULT_COUNTRY_ID;
  setActiveCountryId(fallback);
  return { countryId: fallback, source: "default" };
}

/**
 * User picked a country (login / settings).
 * Updates dial code, Places region, map fallback, and currency market.
 */
export async function selectMarketCountry(
  countryId: CountryId,
): Promise<CountryConfig> {
  if (!isCountryId(countryId)) {
    return getActiveCountry();
  }

  setActiveCountryId(countryId);
  await SecureStorage.saveMarketCountryId(countryId);
  return getActiveCountry();
}
