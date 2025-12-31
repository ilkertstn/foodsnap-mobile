import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { UpgradePrompt } from "../components/UpgradePrompt";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { HealthProvider } from "../context/HealthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { MealProvider, useMeals } from "../context/MealContext";

function RootLayoutNav() {
  const { user, isLoading: isAuthLoading, signInGuest } = useAuth();
  const { showBackupPrompt, dismissBackupPrompt, profile } = useMeals();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inPaywall = segments[0] === "paywall";
    const inWelcome = segments.length === 0 || segments[0] === "index";


    if (inWelcome) return;


    if (inPaywall) return;


    if (user) {
      const inLinkAccount = segments[0] === "auth" && segments[1] === "link-account";
      const inLogin = segments[0] === "auth" && segments[1] === "login";
      const inSignup = segments[0] === "auth" && segments[1] === "signup";

      const inOnboarding = segments[0] === "onboarding";


      if (!profile.isOnboardingCompleted) {
        if (!inOnboarding) {
          router.replace("/onboarding");
        }
        return;
      }


      if (inOnboarding && profile.isOnboardingCompleted) {
        router.replace("/(tabs)/progress");
        return;
      }

      if (!user.isAnonymous && inAuthGroup) {
        router.replace("/(tabs)/progress");
        return;
      }

      const allowedAuthRoutes = inLinkAccount || inLogin || inSignup;

      if (inAuthGroup && !allowedAuthRoutes) {
        router.replace("/(tabs)/progress");
      }
    }
  }, [user, isAuthLoading, segments, profile.isOnboardingCompleted]);

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
    <LanguageProvider>
      <AuthProvider>
        <MealProvider>
          <HealthProvider>
            <RootLayoutNav />
          </HealthProvider>
        </MealProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

