import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FoodResult } from "../types";

type Props = {
    onResult: (result: FoodResult) => void;
    onCancel: () => void;
};

export default function BarcodeScanner({ onResult, onCancel }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
            const json = await response.json();

            if (json.status === 1) {
                const product = json.product;
                const result: FoodResult = {
                    meal_name: product.product_name || "Unknown Product",
                    category: "snack", // Default
                    calories_kcal: product.nutriments["energy-kcal_100g"] || 0,
                    macros_g: {
                        protein: product.nutriments.proteins_100g || 0,
                        carbs: product.nutriments.carbohydrates_100g || 0,
                        fat: product.nutriments.fat_100g || 0,
                    },
                    ingredients: product.ingredients_text ? product.ingredients_text.split(",").map((i: string) => i.trim()) : [],
                    confidence: "high",
                    notes: `Scanned from barcode: ${data}`,
                    quantity_basis: "100g",
                };
                onResult(result);
            } else {
                alert("Product not found");
                setScanned(false);
            }
        } catch (error) {
            alert("Error fetching product");
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanArea} />
                    <Text style={styles.instructionText}>Scan a barcode</Text>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Fetching info...</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                    <Ionicons name="close-circle" size={48} color="white" />
                </TouchableOpacity>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    camera: {
        flex: 1,
    },
    text: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#3b82f6",
        padding: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: "white",
        backgroundColor: "transparent",
        borderRadius: 20,
    },
    instructionText: {
        color: "white",
        fontSize: 16,
        marginTop: 20,
        fontWeight: "600",
    },
    closeButton: {
        position: "absolute",
        bottom: 50,
        alignSelf: "center",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },
});
