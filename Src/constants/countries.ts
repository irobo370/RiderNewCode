/**
 * App country / market configuration.
 *
 * Switch the whole app (phone, currency, Places, map fallback, samples)
 * by changing `ACTIVE_COUNTRY_ID` only — do not hardcode country values elsewhere.
 */

export type CountryId = "drc" | "india";

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type Coords = {
  latitude: number;
  longitude: number;
};

export type SampleAddress = {
  id: string;
  label: string;
  address: string;
  type: "home" | "work" | "other";
};

export type CountryConfig = {
  id: CountryId;
  /** Human-readable market name */
  name: string;
  /** Primary city used in copy / fallbacks */
  city: string;
  /** ISO 4217 */
  currency: string;
  currencySymbol: string;
  /** Intl.NumberFormat locale for fares */
  numberLocale: string;
  /** E.164 dial prefix, e.g. "+243" */
  dialCode: string;
  /** Digits only, e.g. "243" — used when stripping/detecting country code */
  dialCodeDigits: string;
  /** ISO 3166-1 alpha-2 for Google Places includedRegionCodes */
  placesCountry: string;
  /** BCP-47 language hint for Places / UI */
  languageCode: string;
  /** Local mobile length after dial code (no leading trunk 0) */
  phoneLocalDigits: number;
  /**
   * How to group local digits for display after dial code.
   * DRC: [2, 3, 4] → +243 81 234 5678
   * India: [5, 5] → +91 98765 43210
   */
  phoneDisplayGroups: number[];
  mapRegion: MapRegion;
  defaultCoords: Coords;
  defaultDevAddress: string;
  supportPhone: string;
  sampleAddresses: SampleAddress[];
};

export const COUNTRIES: Record<CountryId, CountryConfig> = {
  drc: {
    id: "drc",
    name: "Democratic Republic of the Congo",
    city: "Kinshasa",
    currency: "CDF",
    currencySymbol: "FC ",
    numberLocale: "fr-CD",
    dialCode: "+243",
    dialCodeDigits: "243",
    placesCountry: "cd",
    languageCode: "fr",
    phoneLocalDigits: 9,
    phoneDisplayGroups: [2, 3, 4],
    mapRegion: {
      latitude: -4.3276,
      longitude: 15.3136,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    },
    defaultCoords: {
      latitude: -4.3276,
      longitude: 15.3136,
    },
    defaultDevAddress: "Boulevard du 30 Juin, Gombe, Kinshasa, DRC",
    supportPhone: "+243812345678",
    sampleAddresses: [
      {
        id: "1",
        label: "Home",
        address: "Avenue de la Liberation, Lingwala, Kinshasa",
        type: "home",
      },
      {
        id: "2",
        label: "Work",
        address: "Boulevard du 30 Juin, Gombe, Kinshasa",
        type: "work",
      },
      {
        id: "3",
        label: "Grand Marche",
        address: "Grand Marche, Kinshasa",
        type: "other",
      },
      {
        id: "4",
        label: "Airport",
        address: "N'djili International Airport, Kinshasa",
        type: "other",
      },
    ],
  },

  india: {
    id: "india",
    name: "India",
    city: "New Delhi",
    currency: "INR",
    currencySymbol: "₹",
    numberLocale: "en-IN",
    dialCode: "+91",
    dialCodeDigits: "91",
    placesCountry: "in",
    languageCode: "en",
    phoneLocalDigits: 10,
    phoneDisplayGroups: [5, 5],
    mapRegion: {
      latitude: 28.6139,
      longitude: 77.209,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    },
    defaultCoords: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    defaultDevAddress: "Connaught Place, New Delhi, India",
    supportPhone: "+919876543210",
    sampleAddresses: [
      {
        id: "1",
        label: "Home",
        address: "Connaught Place, New Delhi",
        type: "home",
      },
      {
        id: "2",
        label: "Work",
        address: "Cyber Hub, Gurugram, Haryana",
        type: "work",
      },
      {
        id: "3",
        label: "Mall",
        address: "Select Citywalk, Saket, New Delhi",
        type: "other",
      },
      {
        id: "4",
        label: "Airport",
        address: "Indira Gandhi International Airport, New Delhi",
        type: "other",
      },
    ],
  },
};

/**
 * ⚠️ Single switch for the whole app market.
 * Use `"drc"` for Kinshasa / DRC, or `"india"` for India.
 */
export const ACTIVE_COUNTRY_ID: CountryId = "india";

export const ACTIVE_COUNTRY: CountryConfig = COUNTRIES[ACTIVE_COUNTRY_ID];

/** Resolve currency display metadata (active country + common extras). */
export function getCurrencyMeta(currency: string): {
  symbol: string;
  locale: string;
} {
  const fromCountry = Object.values(COUNTRIES).find(
    (country) => country.currency === currency,
  );
  if (fromCountry) {
    return {
      symbol: fromCountry.currencySymbol,
      locale: fromCountry.numberLocale,
    };
  }

  if (currency === "USD") {
    return { symbol: "$", locale: "en-US" };
  }

  return { symbol: `${currency} `, locale: "en-US" };
}
