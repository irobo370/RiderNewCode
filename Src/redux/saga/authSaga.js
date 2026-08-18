import { call, put, takeLatest } from "redux-saga/effects";
import {
  loginFailure,
  loginRequest,
  loginSuccess,
} from "../Auth/authSlice";
import {
  verifyOtpFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
} from "../Auth/verifyOtpSlice";
import {
  sessionBootstrapStart,
  sessionBootstrapSuccess,
  sessionBootstrapFailure,
  sessionSetAuthenticated,
  bootstrapSessionRequest,
  logoutRequest,
} from "../Auth/sessionSlice";
import SecureStorage from "../../utils/SecureStorage";
import { clearAuthStateAndGoToLogin } from "../../utils/authSession";
import {
  requestOtpService,
  verifyOtpService,
  refreshTokenService,
  logoutService,
  getMeService,
} from "../../service/authService/authService";
import { getProfile } from "../../service/profileService/profileService";
import { listAddresses } from "../../service/addressService/addressService";
import { listPaymentMethods } from "../../service/paymentMethodService/paymentMethodService";
import { resolveOnboardingStep } from "../../utils/onboardingProgress";

function* loadSessionData() {
  const user = yield call(getMeService);

  let profile = null;
  try {
    profile = yield call(getProfile);
  } catch (error) {
    profile = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: null,
      avatar_url: null,
      role: user.role,
    };
  }

  let addresses = [];
  try {
    addresses = yield call(listAddresses);
  } catch (error) {
    addresses = [];
  }

  let paymentMethods = [];
  try {
    paymentMethods = yield call(listPaymentMethods);
  } catch (error) {
    paymentMethods = [];
  }

  const onboardingStep = resolveOnboardingStep(
    profile,
    addresses,
    paymentMethods,
  );

  return {
    user,
    profile,
    addresses,
    paymentMethods,
    onboardingStep,
  };
}

function* loginSaga(action) {
  try {
    const data = yield call(requestOtpService, action.payload);
    yield put(
      loginSuccess({
        success: true,
        message: "OTP sent",
        data,
      }),
    );
  } catch (error) {
    yield put(loginFailure(error.message || "Failed to send OTP"));
  }
}

function* verifyOtpSaga(action) {
  try {
    const tokenData = yield call(verifyOtpService, action.payload);
    const { access_token, refresh_token, user_id } = tokenData;

    yield call(SecureStorage.saveAccessToken, access_token);
    yield call(SecureStorage.saveRefreshToken, refresh_token);
    yield call(SecureStorage.saveUserId, user_id);

    const sessionData = yield call(loadSessionData);
    yield put(sessionSetAuthenticated(sessionData));
    yield put(
      verifyOtpSuccess({
        success: true,
        message: "OTP verified",
        data: tokenData,
        onboardingStep: sessionData.onboardingStep,
      }),
    );
  } catch (error) {
    yield put(verifyOtpFailure(error.message || "OTP verification failed"));
  }
}

function* sessionBootstrapSaga() {
  try {
    yield put(sessionBootstrapStart());
    const refreshToken = yield call(SecureStorage.getRefreshToken);

    if (!refreshToken) {
      yield put(sessionBootstrapFailure());
      return;
    }

    const tokenData = yield call(refreshTokenService, refreshToken);
    const { access_token, refresh_token, user_id } = tokenData;

    yield call(SecureStorage.saveAccessToken, access_token);
    yield call(SecureStorage.saveRefreshToken, refresh_token);
    if (user_id) {
      yield call(SecureStorage.saveUserId, user_id);
    }

    const sessionData = yield call(loadSessionData);
    yield put(sessionBootstrapSuccess(sessionData));
  } catch (error) {
    yield call(SecureStorage.clearAuthData);
    yield put(sessionBootstrapFailure());
  }
}

function* logoutSaga() {
  try {
    const refreshToken = yield call(SecureStorage.getRefreshToken);
    if (refreshToken) {
      yield call(logoutService, refreshToken);
    }
  } catch (error) {
    // Best-effort logout; still clear local session.
  } finally {
    yield call(clearAuthStateAndGoToLogin);
  }
}

export function* watchAuthSaga() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(verifyOtpRequest.type, verifyOtpSaga);
  yield takeLatest(bootstrapSessionRequest.type, sessionBootstrapSaga);
  yield takeLatest(logoutRequest.type, logoutSaga);
}
