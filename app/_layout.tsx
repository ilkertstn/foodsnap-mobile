import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { UpgradePrompt } from "../components/UpgradePrompt";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { MealProvider, useMeals } from "../context/MealContext";

function RootLayoutNav() {
  const { user, isLoading, signInGuest } = useAuth();
  const { showBackupPrompt, dismissBackupPrompt } = useMeals();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const inWelcome = segments.length === 0 || segments[0] === "index";

    if (!user) {
      // Auto-login as guest
      signInGuest().catch((err) => {
        console.error("Failed to sign in anonymously:", err);
      });
    } else {
      // User is logged in (guest or real)
      const inLinkAccount = segments[0] === "auth" && segments[1] === "link-account";
      const inLogin = segments[0] === "auth" && segments[1] === "login";

      // Allow guests to be in link-account or login, otherwise redirect auth/welcome to tabs
      const allowedAuthRoutes = user.isAnonymous && (inLinkAccount || inLogin);

      if ((inAuthGroup && !allowedAuthRoutes) || inWelcome) {
        router.replace("/(tabs)/progress");
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
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
        <RootLayoutNav />
      </MealProvider>
    </AuthProvider>
  );
}
