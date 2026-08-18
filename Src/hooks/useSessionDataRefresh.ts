import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { getProfile } from "../service/profileService/profileService";
import { listAddresses } from "../service/addressService/addressService";
import { listPaymentMethods } from "../service/paymentMethodService/paymentMethodService";
import {
  sessionUpdateAddresses,
  sessionUpdatePaymentMethods,
  sessionUpdateProfile,
} from "../redux/Auth/sessionSlice";

export function useSessionDataRefresh() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [profile, addresses, paymentMethods] = await Promise.all([
        getProfile(),
        listAddresses().catch(() => []),
        listPaymentMethods().catch(() => []),
      ]);

      dispatch(sessionUpdateProfile(profile));
      dispatch(sessionUpdateAddresses(addresses));
      dispatch(sessionUpdatePaymentMethods(paymentMethods));
    } catch {
      // Keep cached session data if refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  return { refresh, refreshing };
}
