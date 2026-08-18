// src/utils/SecureStorage.ts

import * as SecureStore from "expo-secure-store";

class SecureStorage {
  private static ACCESS_TOKEN = "ACCESS_TOKEN";
  private static REFRESH_TOKEN = "REFRESH_TOKEN";
  private static USER_ID = "USER_ID";

  // Access Token
  static async saveAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SecureStorage.ACCESS_TOKEN, token);
  }

  static async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(SecureStorage.ACCESS_TOKEN);
  }

  static async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SecureStorage.ACCESS_TOKEN);
  }

  // Refresh Token
  static async saveRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SecureStorage.REFRESH_TOKEN, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(SecureStorage.REFRESH_TOKEN);
  }

  static async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SecureStorage.REFRESH_TOKEN);
  }

  // User ID
  static async saveUserId(userId: string): Promise<void> {
    await SecureStore.setItemAsync(SecureStorage.USER_ID, userId);
  }

  static async getUserId(): Promise<string | null> {
    return await SecureStore.getItemAsync(SecureStorage.USER_ID);
  }

  static async removeUserId(): Promise<void> {
    await SecureStore.deleteItemAsync(SecureStorage.USER_ID);
  }

  // Logout
  static async clearAuthData(): Promise<void> {
    await Promise.all([
      SecureStorage.removeAccessToken(),
      SecureStorage.removeRefreshToken(),
      SecureStorage.removeUserId(),
    ]);
  }
}

export default SecureStorage;
