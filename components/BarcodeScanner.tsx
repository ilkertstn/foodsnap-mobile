import { useLanguage } from "@/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
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
    const { t } = useLanguage();


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

    const onScanned = async ({ data }: BarcodeScanningResult) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);

        try {
            const res = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${data}.json`
            );
            const json = await res.json();

            if (!json.product) throw new Error("Product not found");

            const product = json.product;

            const mappedResult: FoodResult = {
                meal_name: product.product_name || "Unknown product",
                calories_kcal: Number(product.nutriments?.["energy-kcal_100g"] || 0),
                macros_g: {
                    protein: Number(product.nutriments?.proteins_100g || 0),
                    carbs: Number(product.nutriments?.carbohydrates_100g || 0),
                    fat: Number(product.nutriments?.fat_100g || 0),
                },
                ingredients: product.ingredients_text ? String(product.ingredients_text).split(",") : [],
                notes: product.brands || "",
                confidence: "high",
                quantity_basis: "100g",
                category: "snack",
            };

            onResult(mappedResult);
        } catch (e) {
            setScanned(false);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : onScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanArea} />
                    <Text style={styles.instructionText}>{t("scan.scan_barcode")}</Text>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>{t("scan.loading_info")}</Text>
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
