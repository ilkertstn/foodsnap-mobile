import Constants from "expo-constants";

type Extra = { API_BASE?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const API_BASE =
    extra.API_BASE ||
    process.env.EXPO_PUBLIC_API_BASE ||
    "http://localhost:3000";
