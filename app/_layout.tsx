import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { UpgradePrompt } from "../components/UpgradePrompt";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { HealthProvider } from "../context/HealthContext";
import { MealProvider, useMeals } from "../context/MealContext";

function RootLayoutNav() {
  const { user, isLoading: isAuthLoading, signInGuest } = useAuth();
  const { showBackupPrompt, dismissBackupPrompt } = useMeals();
  const segments = useSegments() as string[];
  const router = useRouter();
  // Routing Effect
  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inPaywall = segments[0] === "paywall";
    const inWelcome = segments.length === 0 || segments[0] === "index";

    // 1. Splash Screen (index): Let it run.
    if (inWelcome) return;

    // 2. Paywall: Let user interact with it.
    if (inPaywall) return;

    // 3. Authenticated User Logic
    if (user) {
      const inLinkAccount = segments[0] === "auth" && segments[1] === "link-account";
      const inLogin = segments[0] === "auth" && segments[1] === "login";
      const inSignup = segments[0] === "auth" && segments[1] === "signup";

      // If user is NOT anonymous (Meaning they are fully logged in), they shouldn't be in Auth group
      if (!user.isAnonymous && inAuthGroup) {
        router.replace("/(tabs)/progress");
        return;
      }

      // If user IS Anonymous, they can be in these screens to upgrade/switch
      const allowedAuthRoutes = inLinkAccount || inLogin || inSignup;

      // Only redirect if they are in an auth flow they don't need to be in (and not covered above)
      if (inAuthGroup && !allowedAuthRoutes) {
        router.replace("/(tabs)/progress");
      }
    }
  }, [user, isAuthLoading, segments]);

  // Ensure Guest User
  useEffect(() => {
    if (!isAuthLoading && !user) {
      signInGuest().catch(console.error);
    }
  }, [isAuthLoading, user]);

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="paywall" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <UpgradePrompt visible={showBackupPrompt} onClose={dismissBackupPrompt} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MealProvider>
        <HealthProvider>
          <RootLayoutNav />
        </HealthProvider>
      </MealProvider>
    </AuthProvider>
  );
}
