import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const API_BASE = "http://192.168.1.41:3000";

type FoodResult = {
  meal_name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  calories_kcal: number;
  macros_g: { protein: number; carbs: number; fat: number };
  ingredients: string[];
  confidence: "low" | "medium" | "high";
  notes: string;
};

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [gramsText, setGramsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>FoodSnap</Text>
      <Text style={{ marginTop: 6, color: "#666" }}>
        Take a photo, enter weight (optional), get calorie/macro estimates.
      </Text>

      <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={takePhoto}
          style={{
            flex: 1,
            backgroundColor: "black",
            padding: 12,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            📸 Take Photo
          </Text>
        </Pressable>

        <Pressable
          onPress={analyze}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: loading ? "#999" : "#3b82f6",
            padding: 12,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {loading ? "Analyzing..." : "✨ Analyze"}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>
          Weight (optional)
        </Text>
        <TextInput
          value={gramsText}
          onChangeText={setGramsText}
          keyboardType="numeric"
          placeholder="e.g. 250"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
          }}
        />
        <Text style={{ marginTop: 6, color: "#666" }}>
          Enter weight for more accurate estimates. If left blank, "1 serving"
          is assumed.
        </Text>
      </View>

      {imageUri && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>
            Selected Photo
          </Text>
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: 220, borderRadius: 18 }}
          />
        </View>
      )}

      {loading && (
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ActivityIndicator />
          <Text>Analyzing...</Text>
        </View>
      )}

      {error && (
        <Text style={{ marginTop: 14, color: "#b91c1c", fontWeight: "700" }}>
          {error}
        </Text>
      )}

      {result && (
        <ScrollView
          style={{ marginTop: 14 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 18,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800" }}>
              {result.meal_name}
            </Text>
            <Text style={{ marginTop: 4, color: "#666" }}>
              Category: {result.category} • Confidence: {result.confidence}
            </Text>

            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#666" }}>~ Calories</Text>
                <Text style={{ fontSize: 18, fontWeight: "800" }}>
                  {Math.round(result.calories_kcal)} kcal
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#666" }}>Macros (g)</Text>
                <Text style={{ fontWeight: "800" }}>
                  P {Math.round(result.macros_g.protein)} • C{" "}
                  {Math.round(result.macros_g.carbs)} • F{" "}
                  {Math.round(result.macros_g.fat)}
                </Text>
              </View>
            </View>

            <Text style={{ marginTop: 12, fontWeight: "800" }}>
              Ingredients
            </Text>
            <Text style={{ marginTop: 4, color: "#333" }}>
              {result.ingredients.join(", ")}
            </Text>

            <Text style={{ marginTop: 12, fontWeight: "800" }}>Notes</Text>
            <Text style={{ marginTop: 4, color: "#333" }}>{result.notes}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
