import { createSlice } from "@reduxjs/toolkit";
import { resolveOnboardingStep } from "../../utils/onboardingProgress";

const initialState = {
  bootstrapping: true,
  isAuthenticated: false,
  user: null,
  profile: null,
  addresses: [],
  paymentMethods: [],
  onboardingStep: null,
  error: null,
};

function syncOnboardingStep(state) {
  state.onboardingStep = resolveOnboardingStep(
    state.profile,
    state.addresses,
    state.paymentMethods,
  );
}

function applySessionPayload(state, payload) {
  state.user = payload.user;
  state.profile = payload.profile;
  state.addresses = payload.addresses ?? [];
  state.paymentMethods = payload.paymentMethods ?? [];
  syncOnboardingStep(state);
}

function clearSession(state) {
  state.isAuthenticated = false;
  state.user = null;
  state.profile = null;
  state.addresses = [];
  state.paymentMethods = [];
  state.onboardingStep = null;
  state.error = null;
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    sessionBootstrapStart: (state) => {
      state.bootstrapping = true;
      state.error = null;
    },
    sessionBootstrapSuccess: (state, action) => {
      state.bootstrapping = false;
      state.isAuthenticated = true;
      applySessionPayload(state, action.payload);
      state.error = null;
    },
    sessionBootstrapFailure: (state) => {
      state.bootstrapping = false;
      clearSession(state);
    },
    sessionLogout: (state) => {
      state.bootstrapping = false;
      clearSession(state);
    },
    sessionSetAuthenticated: (state, action) => {
      state.bootstrapping = false;
      state.isAuthenticated = true;
      applySessionPayload(state, action.payload);
    },
    sessionUpdateProfile: (state, action) => {
      state.profile = action.payload;
      if (state.user && action.payload?.name) {
        state.user = { ...state.user, name: action.payload.name };
      }
      syncOnboardingStep(state);
    },
    sessionUpdateAddresses: (state, action) => {
      state.addresses = action.payload ?? [];
      syncOnboardingStep(state);
    },
    sessionUpdatePaymentMethods: (state, action) => {
      state.paymentMethods = action.payload ?? [];
      syncOnboardingStep(state);
    },
    bootstrapSessionRequest: (state) => {
      state.bootstrapping = true;
      state.error = null;
    },
    logoutRequest: () => {},
  },
});

export const {
  sessionBootstrapStart,
  sessionBootstrapSuccess,
  sessionBootstrapFailure,
  sessionLogout,
  sessionSetAuthenticated,
  sessionUpdateProfile,
  sessionUpdateAddresses,
  sessionUpdatePaymentMethods,
  bootstrapSessionRequest,
  logoutRequest,
} = sessionSlice.actions;

export default sessionSlice.reducer;
