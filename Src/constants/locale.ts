/**
 * Active market locale — derived from phone-location detection in `./countries`.
 * Prefer getActiveCountry() / useCountryMarket() so values stay in sync.
 */

import { getActiveCountry } from "./countries";

export {
  ACTIVE_COUNTRY,
  AVAILABLE_COUNTRY_IDS,
  COUNTRIES,
  DEFAULT_COUNTRY_ID,
  getActiveCountry,
  getActiveCountryId,
  getCurrencyMeta,
  isCountryId,
  listMarketCountries,
  resolveCountryIdFromIso,
  setActiveCountryId,
  subscribeActiveCountry,
} from "./countries";
export type {
  CountryConfig,
  CountryId,
  SampleAddress,
} from "./countries";

export function getDefaultCurrency() {
  return getActiveCountry().currency;
}

export function getCountryCode() {
  return getActiveCountry().dialCode;
}

export function getPlacesCountry() {
  return getActiveCountry().placesCountry;
}

export function getPhoneLocalDigits() {
  return getActiveCountry().phoneLocalDigits;
}

export function getDefaultMapRegion() {
  return getActiveCountry().mapRegion;
}

export function getDefaultCoords() {
  return getActiveCountry().defaultCoords;
}

export function getDefaultDevAddress() {
  return getActiveCountry().defaultDevAddress;
}

export function getSupportPhone() {
  return getActiveCountry().supportPhone;
}

export function getSampleAddresses() {
  return getActiveCountry().sampleAddresses;
}

export function getAppCountryName() {
  return getActiveCountry().name;
}

export function getAppCity() {
  return getActiveCountry().city;
}

/**
 * Compatibility snapshots (initial default until detection runs).
 * Prefer getActiveCountry() / useCountryMarket() for live values.
 */
export const DEFAULT_CURRENCY = getActiveCountry().currency;
export const COUNTRY_CODE = getActiveCountry().dialCode;
export const PLACES_COUNTRY = getActiveCountry().placesCountry;
export const PHONE_LOCAL_DIGITS = getActiveCountry().phoneLocalDigits;
export const DEFAULT_MAP_REGION = getActiveCountry().mapRegion;
export const DEFAULT_COORDS = getActiveCountry().defaultCoords;
export const DEFAULT_DEV_ADDRESS = getActiveCountry().defaultDevAddress;
export const SUPPORT_PHONE = getActiveCountry().supportPhone;
export const SAMPLE_ADDRESSES = getActiveCountry().sampleAddresses;
export const APP_COUNTRY_NAME = getActiveCountry().name;
export const APP_CITY = getActiveCountry().city;
