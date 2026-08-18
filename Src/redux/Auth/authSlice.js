import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  user: null,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state, action) => {
      state.loading = true;
      state.error = null;
      console.log("Payload", action.payload);
      console.log("Dispatching loginRequest with phone:", action.payload);
    },

    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    authReset: () => initialState,
  },
});

export const { loginRequest, loginSuccess, loginFailure, authReset } =
  authSlice.actions;

export default authSlice.reducer;
