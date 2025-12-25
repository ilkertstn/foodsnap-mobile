import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

type TutorialStep = {
  image: any;
  title: string;
  description: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    image: require("../assets/images/tutorial-1.png"),
    title: "Capture Your Meal",
    description: "Snap a photo of your food to instantly analyze nutrition.",
  },
  {
    image: require("../assets/images/tutorial-2.png"),
    title: "Track Nutrition",
    description: "Get detailed insights into calories, macros, and more.",
  },
  {
    image: require("../assets/images/tutorial-3.png"),
    title: "Achieve Goals",
    description: "Stay on top of your diet and reach your fitness targets.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const scrollX = useSharedValue(0);

  const handleSplashTap = () => {
    setShowSplash(false);
  };

  const handleGetStarted = () => {
    router.replace("/(tabs)/scan");
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={showSplash ? "light-content" : "dark-content"} />


      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#ffffff", "#f0f9ff", "#e0f2fe"]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {tutorialSteps.map((step, index) => {
            return (
              <TutorialItem
                key={index}
                step={step}
                index={index}
                scrollX={scrollX}
              />
            );
          })}
        </Animated.ScrollView>

        {!showSplash && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800)}
            style={styles.footer}
          >
            <Pagination data={tutorialSteps} scrollX={scrollX} />
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Splash Screen Overlay */}
      {showSplash && (
        <Pressable onPress={handleSplashTap} style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.splashContainer]}
            exiting={FadeOut.duration(800)}
          >
            <LinearGradient
              colors={["#0f172a", "#1e3a8a", "#172554"]}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View
              entering={FadeInDown.duration(1000)}
              style={styles.splashContent}
            >
              <Image
                source={require("../assets/images/welcome.png")}
                style={styles.splashImage}
                contentFit="cover"
              />
              <View style={styles.splashOverlay} />
              <View style={styles.splashTextContainer}>

              </View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const TutorialItem = ({ step, index, scrollX }: { step: TutorialStep, index: number, scrollX: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image
          source={step.image}
          style={styles.stepImage}
          contentFit="contain"
        />
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>
    </View>
  );
};

const Pagination = ({ data, scrollX }: { data: TutorialStep[], scrollX: SharedValue<number> }) => {
  return (
    <View style={styles.paginationContainer}>
      {data.map((_, index) => {
        const animatedDotStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const widthVal = interpolate(
            scrollX.value,
            inputRange,
            [8, 20, 8],
            Extrapolation.CLAMP
          );

          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
          );

          return {
            width: widthVal,
            opacity,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, animatedDotStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  splashContainer: {
    zIndex: 100,
  },
  splashContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splashImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  splashTextContainer: {
    position: "absolute",
    bottom: 180, // Moved up to avoid overlapping with footer
    alignItems: "center",
    width: "100%",
  },
  appName: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: "#e2e8f0",
    marginBottom: 40,
    fontWeight: "500",
  },
  tapToContinue: {
    fontSize: 14,
    color: "#cbd5e1",
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100, // Space for footer
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "white",
    borderRadius: 40,
  },
  stepImage: {
    width: "80%",
    height: "80%",
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

