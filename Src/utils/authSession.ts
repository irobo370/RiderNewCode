import { authReset } from "../redux/Auth/authSlice";
import { verifyOtpReset } from "../redux/Auth/verifyOtpSlice";
import { sessionLogout } from "../redux/Auth/sessionSlice";
import store from "../redux/store";
import SecureStorage from "./SecureStorage";
import { resetToLogin } from "../navigation/navigationRef";

export function clearAuthState() {
  store.dispatch(sessionLogout());
  store.dispatch(authReset());
  store.dispatch(verifyOtpReset());
}

export async function clearAuthStateAndGoToLogin() {
  await SecureStorage.clearAuthData();
  clearAuthState();
  resetToLogin();
}
