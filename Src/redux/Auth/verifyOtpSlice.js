import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  data: null,
  error: null,
};

const verifyOtpSlice = createSlice({
  name: "verifyOtp",
  initialState,
  reducers: {
    verifyOtpRequest: (state, action) => {
      state.loading = true;
      state.error = null;
      console.log("Payload", action.payload);
    },

    verifyOtpSuccess: (state, action) => {
      state.loading = false;
      state.data = action.payload;
    },

    verifyOtpFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    verifyOtpReset: () => initialState,
  },
});

export const {
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  verifyOtpReset,
} = verifyOtpSlice.actions;

export default verifyOtpSlice.reducer;
