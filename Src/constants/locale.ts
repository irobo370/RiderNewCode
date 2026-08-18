/**
 * Active market locale — derived from `ACTIVE_COUNTRY_ID` in `./countries`.
 * Prefer importing from here for existing call sites; change country in `countries.ts`.
 */

import { ACTIVE_COUNTRY } from "./countries";

export {
  ACTIVE_COUNTRY,
  ACTIVE_COUNTRY_ID,
  COUNTRIES,
  getCurrencyMeta,
} from "./countries";
export type {
  CountryConfig,
  CountryId,
  SampleAddress,
} from "./countries";

export const DEFAULT_CURRENCY = ACTIVE_COUNTRY.currency;
export const COUNTRY_CODE = ACTIVE_COUNTRY.dialCode;
/** ISO 3166-1 alpha-2 — used by Google Places region codes */
export const PLACES_COUNTRY = ACTIVE_COUNTRY.placesCountry;
/** Local mobile digits after dial code (no leading 0). */
export const PHONE_LOCAL_DIGITS = ACTIVE_COUNTRY.phoneLocalDigits;

export const DEFAULT_MAP_REGION = ACTIVE_COUNTRY.mapRegion;
export const DEFAULT_COORDS = ACTIVE_COUNTRY.defaultCoords;
export const DEFAULT_DEV_ADDRESS = ACTIVE_COUNTRY.defaultDevAddress;
export const SUPPORT_PHONE = ACTIVE_COUNTRY.supportPhone;
export const SAMPLE_ADDRESSES = ACTIVE_COUNTRY.sampleAddresses;
export const APP_COUNTRY_NAME = ACTIVE_COUNTRY.name;
export const APP_CITY = ACTIVE_COUNTRY.city;
