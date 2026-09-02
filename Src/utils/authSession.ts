import { authReset } from "../redux/Auth/authSlice";
import { verifyOtpReset } from "../redux/Auth/verifyOtpSlice";
import { sessionLogout } from "../redux/Auth/sessionSlice";
import SecureStorage from "./SecureStorage";
import { resetToLogin } from "../navigation/navigationRef";

type AppStore = {
  dispatch: (action: unknown) => void;
};

function getStore(): AppStore {
  // Lazy require breaks: store -> rootSaga -> authSaga -> authSession -> store
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../redux/store").default as AppStore;
}

export function clearAuthState() {
  const store = getStore();
  store.dispatch(sessionLogout());
  store.dispatch(authReset());
  store.dispatch(verifyOtpReset());
}

export async function clearAuthStateAndGoToLogin() {
  await SecureStorage.clearAuthData();
  clearAuthState();
  resetToLogin();
}
