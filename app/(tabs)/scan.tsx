import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMeals } from "../../context/MealContext";
import { FoodResult, MealType } from "../../types";
import { getAdjustedDate } from "../../utils/date";


const { width } = Dimensions.get("window");

const API_BASE = "http://192.168.1.10:3000";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

import BarcodeScanner from "../../components/BarcodeScanner";
import SuccessModal from "../../components/SuccessModal";

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addEntry, recentScans, addRecentScan, getTotalMealCount } = useMeals();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [gramsText, setGramsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MealType>("lunch");
  const [navigating, setNavigating] = useState(false);


  const [isScanning, setIsScanning] = useState(false);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  useFocusEffect(
    useCallback(() => {

      setNavigating(false);

      return () => {

        setShowSuccessModal(false);
        setLoading(false);
        setIsScanning(false);
      };
    }, [])
  );



  const grams = useMemo(() => {
    const n = Number(gramsText.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [gramsText]);

  const takePhoto = async () => {
    setError(null);
    setResult(null);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      setError("Camera permission not granted.");
      return;
    }

    if (user?.isAnonymous && getTotalMealCount() >= 10) {
      Alert.alert("Limit Reached", "You have used your 10 free guest scans. Please sign up to continue tracking!", [
        { text: "View Offers", onPress: () => router.push("/paywall") },
        { text: "Cancel", style: "cancel" }
      ]);
      return;
    }

    const shot = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

    if (shot.canceled) return;

    const asset = shot.assets[0];
    if (!asset?.base64) {
      setError("Could not get photo base64 (try again).");
      return;
    }

    setImageUri(asset.uri);
    setImageBase64(asset.base64);
  };

  const analyze = async () => {
    if (!imageBase64) {
      setError("You must take a photo first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/food/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          grams,
        }),
      });

      const raw = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
      }

      let data;
      try {
        data = JSON.parse(raw);
        // Default the selector to the AI's guess
        if (data.category && MEAL_TYPES.includes(data.category)) {
          setSelectedCategory(data.category);
        }
      } catch {
        throw new Error(`Not JSON: ${raw.slice(0, 200)}`);
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate displayed values based on weight input
  const displayedResult = useMemo(() => {
    if (!result) return null;

    // If it's a barcode scan (per 100g) and we have a custom weight
    if (result.quantity_basis === "100g" && grams) {
      const ratio = grams / 100;
      return {
        ...result,
        calories_kcal: result.calories_kcal * ratio,
        macros_g: {
          protein: result.macros_g.protein * ratio,
          carbs: result.macros_g.carbs * ratio,
          fat: result.macros_g.fat * ratio,
        }
      };
    }

    return result;
  }, [result, grams]);

  const handleSaveToLog = () => {
    if (!displayedResult) return;

    const today = getAdjustedDate();

    addEntry(today, selectedCategory, {
      meal_name: displayedResult.meal_name,
      category: selectedCategory,
      calories_kcal: displayedResult.calories_kcal, // Use scaled values
      macros_g: displayedResult.macros_g,
      ingredients: displayedResult.ingredients,
      confidence: displayedResult.confidence,
      notes: displayedResult.notes,
      grams: grams,
      imageUri: imageUri || undefined,
    });

    if (result) addRecentScan(result);
    setShowSuccessModal(true);
  };


  const handleModalClose = () => {
    if (navigating) return;
    setNavigating(true);

    setShowSuccessModal(false);

    // 1 frame bekle: Modal unmount/anim bitsin
    requestAnimationFrame(() => {
      // İstersen state temizliği navigation sonrası bile olabilir
      router.replace("/(tabs)/dashboard");

      // Eğer Scan screen tekrar focus alıyorsa zaten resetliyorsun.
      // Ama yine de burada temizlemek istersen:
      setResult(null);
      setImageUri(null);
      setImageBase64(null);
      setError(null);
      setGramsText("");
    });
  };




  const handleBarcodeResult = (scannedResult: FoodResult) => {
    setResult(scannedResult);
    setIsScanning(false);
    setImageUri(null); // Clear image if any
  };

  if (isScanning) {
    return (
      <BarcodeScanner
        onResult={handleBarcodeResult}
        onCancel={() => setIsScanning(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#f8fafc", "#eff6ff", "#e0f2fe"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Meal</Text>
          <Text style={styles.headerSubtitle}>
            Snap a photo for instant analysis
          </Text>
          {user?.isAnonymous && (
            <Text style={styles.guestLimitText}>
              Free Guest Scans: {10 - getTotalMealCount()}/10 Remaining
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.actionRow}>
            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.actionButton,
                styles.cameraButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.cameraButtonText}>Take Photo</Text>
            </Pressable>

            <Pressable
              onPress={analyze}
              disabled={loading}
              style={({ pressed }) => [
                styles.actionButton,
                styles.analyzeButton,
                (loading || !imageUri) && styles.disabledButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={24} color="white" />
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={{ marginTop: 12 }}>
            <Pressable
              onPress={() => setIsScanning(true)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.barcodeButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="barcode-outline" size={24} color="#1e293b" />
              <Text style={styles.barcodeButtonText}>Scan Barcode</Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Weight (optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={gramsText}
                onChangeText={setGramsText}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
              <Text style={styles.inputUnit}>grams</Text>
            </View>
          </View>
        </View>

        {/* Recent Scans */}
        {!imageUri && !result && recentScans.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {recentScans.map((scan, index) => (
                <Pressable
                  key={index}
                  style={styles.recentCard}
                  onPress={() => {
                    setResult(scan);
                    setSelectedCategory(scan.category);
                  }}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name="fast-food" size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={styles.recentName} numberOfLines={1}>{scan.meal_name}</Text>
                    <Text style={styles.recentCals}>{Math.round(scan.calories_kcal)} kcal</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {imageUri && (
          <Animated.View entering={FadeInDown.springify()} style={styles.imageCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="image-outline" size={20} color="white" />
              <Text style={styles.imageOverlayText}>Ready to analyze</Text>
            </View>
          </Animated.View>
        )}

        {error && (
          <Animated.View entering={FadeIn} style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {displayedResult && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.mealName}>{displayedResult.meal_name}</Text>
                {/* Category Selector */}
                <View style={styles.categorySelector}>
                  {MEAL_TYPES.map(type => (
                    <Pressable
                      key={type}
                      onPress={() => setSelectedCategory(type)}
                      style={[
                        styles.categoryChip,
                        selectedCategory === type && styles.categoryChipActive
                      ]}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        selectedCategory === type && styles.categoryChipTextActive
                      ]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {result?.quantity_basis === "100g" && (
                  <Text style={styles.servingHint}>
                    {grams ? `Calculated for ${grams}g` : "Values per 100g"}
                  </Text>
                )}
              </View>
              <View style={styles.caloriesContainer}>
                <Text style={[styles.caloriesValue, { fontSize: Math.round(displayedResult.calories_kcal).toString().length > 4 ? 24 : 32 }]}>
                  {Math.round(displayedResult.calories_kcal)}
                </Text>
                <Text style={styles.caloriesLabel}>kcal</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.macrosRow}>
              <MacroItem
                label="Protein"
                value={displayedResult.macros_g.protein}
                color="#3b82f6"
              />
              <MacroItem
                label="Carbs"
                value={displayedResult.macros_g.carbs}
                color="#10b981"
              />
              <MacroItem
                label="Fat"
                value={displayedResult.macros_g.fat}
                color="#f59e0b"
              />
            </View>

            <Pressable
              onPress={handleSaveToLog}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>Add to {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</Text>
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.bodyText}>
                {displayedResult.ingredients.join(", ")}
              </Text>

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Notes</Text>
              <Text style={styles.bodyText}>{displayedResult.notes}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Analyzing your food...</Text>
          </View>
        </View>
      )}
      <SuccessModal
        visible={showSuccessModal}
        title="Meal Logged!"
        message={`${result?.meal_name || 'Food'} has been added to your ${selectedCategory}.`}
        buttonText="Go to Dashboard"
        onClose={handleModalClose}
      />
    </View>
  );
}

const MacroItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={styles.macroItem}>
    <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  guestLimitText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "700",
    marginTop: 8,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cameraButton: {
    backgroundColor: "#1e293b",
  },
  analyzeButton: {
    backgroundColor: "#3b82f6",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cameraButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  barcodeButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  barcodeButtonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    paddingTop: 8
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
  },
  inputUnit: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  imageCard: {
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#e2e8f0",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "500",
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    textTransform: "capitalize",
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284c7",
    textTransform: "uppercase",
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  servingHint: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 4,
  },
  caloriesContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  caloriesValue: {
    fontWeight: "800",
    color: "#3b82f6",
    lineHeight: 32,
  },
  caloriesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 20,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  detailsSection: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  loadingCard: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  recentCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 160,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  recentCals: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  }
});
