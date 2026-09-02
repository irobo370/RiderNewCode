import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getActiveCountry,
  subscribeActiveCountry,
  type CountryConfig,
  type CountryId,
} from "../constants/countries";
import {
  loadSavedMarketCountry,
  selectMarketCountry,
  type MarketSource,
} from "../utils/marketCountry";

type CountryMarketContextValue = {
  country: CountryConfig;
  countryId: CountryId;
  isReady: boolean;
  source: MarketSource | null;
  /** Persist user country choice — drives dial code, Places search, map defaults. */
  selectCountry: (countryId: CountryId) => Promise<void>;
  refresh: () => Promise<void>;
};

const CountryMarketContext = createContext<CountryMarketContextValue | null>(
  null,
);

export function CountryMarketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [country, setCountry] = useState<CountryConfig>(() => getActiveCountry());
  const [isReady, setIsReady] = useState(false);
  const [source, setSource] = useState<MarketSource | null>(null);

  useEffect(() => {
    return subscribeActiveCountry((next) => {
      setCountry(next);
    });
  }, []);

  const refresh = useCallback(async () => {
    const result = await loadSavedMarketCountry();
    setCountry(getActiveCountry());
    setSource(result.source);
    setIsReady(true);
  }, []);

  const selectCountry = useCallback(async (countryId: CountryId) => {
    const next = await selectMarketCountry(countryId);
    setCountry(next);
    setSource("user");
    setIsReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await loadSavedMarketCountry();
      if (cancelled) {
        return;
      }
      setCountry(getActiveCountry());
      setSource(result.source);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CountryMarketContextValue>(
    () => ({
      country,
      countryId: country.id,
      isReady,
      source,
      selectCountry,
      refresh,
    }),
    [country, isReady, refresh, selectCountry, source],
  );

  return (
    <CountryMarketContext.Provider value={value}>
      {children}
    </CountryMarketContext.Provider>
  );
}

export function useCountryMarket(): CountryMarketContextValue {
  const value = useContext(CountryMarketContext);
  if (!value) {
    const country = getActiveCountry();
    return {
      country,
      countryId: country.id,
      isReady: true,
      source: "default",
      selectCountry: async () => {},
      refresh: async () => {},
    };
  }
  return value;
}
