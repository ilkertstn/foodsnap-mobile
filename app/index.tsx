import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type TutorialStep = {
  image: any;
  title: string;
  description: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    image: require("../assets/images/tutorial-1.png"),
    title: "Take a Photo",
    description: "Capture your meal with the camera to get started",
  },
  {
    image: require("../assets/images/tutorial-2.png"),
    title: "Enter Weight (Optional)",
    description: "Add portion size in grams for better accuracy",
  },
  {
    image: require("../assets/images/tutorial-3.png"),
    title: "Get Instant Results",
    description: "AI analyzes your food and provides calories & macros",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const handleGetStarted = () => {
    router.replace("/main");
  };

  const handleSplashTap = () => {
    setShowSplash(false);
  };

  const scrollToNext = () => {
    if (currentPage < tutorialSteps.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentPage + 1),
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  // Full-screen splash screen
  if (showSplash) {
    return (
      <Pressable
        onPress={handleSplashTap}
        style={{
          flex: 1,
          backgroundColor: "#1e3a8a",
        }}
      >
        <Image
          source={require("../assets/images/welcome.png")}
          style={{ 
            width: "100%", 
            height: "100%",
          }}
          contentFit="cover"
        />
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            Tap to continue
          </Text>
        </View>
      </Pressable>
    );
  }

  // Tutorial carousel
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Tutorial Steps */}
      <View style={{ flex: 1, paddingTop: 60 }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {tutorialSteps.map((step, index) => (
            <View
              key={index}
              style={{
                width,
                alignItems: "center",
                paddingHorizontal: 30,
              }}
            >
              <Image
                source={step.image}
                style={{ width: width * 0.7, height: width * 0.7 }}
                contentFit="contain"
              />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  marginTop: 30,
                  textAlign: "center",
                  color: "#1a1a1a",
                }}
              >
                {step.title}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  marginTop: 12,
                  textAlign: "center",
                  color: "#666",
                  lineHeight: 24,
                  paddingHorizontal: 20,
                }}
              >
                {step.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Page Indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 20,
            gap: 8,
          }}
        >
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={{
                width: currentPage === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentPage === index ? "#3b82f6" : "#ddd",
              }}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 30, paddingBottom: 30 }}>
          <Pressable
            onPress={scrollToNext}
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
              {currentPage === tutorialSteps.length - 1
                ? "Get Started"
                : "Next"}
            </Text>
          </Pressable>

          {currentPage < tutorialSteps.length - 1 && (
            <Pressable
              onPress={handleGetStarted}
              style={{
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#666", fontSize: 16, fontWeight: "600" }}>
                Skip
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
