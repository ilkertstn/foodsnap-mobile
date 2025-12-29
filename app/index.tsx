import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { user, isTrialExpired } = useAuth();
  const progress = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar to 100% over 2.5 seconds
    progress.value = withTiming(1, {
      duration: 2500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Navigate after animation
    const timeout = setTimeout(() => {
      if (user && !user.isAnonymous) {
        // Authenticated users skip the guest pass screen
        router.replace("/(tabs)/progress");
      } else if (user?.isAnonymous && isTrialExpired) {
        // Guest user with expired trial - force paywall
        router.replace("/paywall");
      } else {
        // New installs or active trial guests see the offer
        router.replace("/paywall");
      }
    }, 2800);

    return () => clearTimeout(timeout);
  }, [user, isTrialExpired]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Image
          source={require("../assets/images/foodsnap-logo.png")}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
        </View>

        <Text style={styles.appName}>FoodSnap</Text>
      </View>
    </View>
  );
}

import { Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 60,
  },
  progressContainer: {
    width: 200,
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#22c55e", // Plant app green-ish, or match brand color
    borderRadius: 3,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 0.5,
  }
});
