/**
 * Food Search Modal
 * Search and add food items from OpenFoodFacts database
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { FoodResult, MealType } from "../types";

interface FoodSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (food: FoodResult, category: MealType) => void;
    defaultCategory?: MealType;
}

interface SearchResult {
    code: string;
    product_name: string;
    brands?: string;
    nutriments: {
        "energy-kcal_100g"?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
    };
    serving_size?: string;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodSearchModal({
    visible,
    onClose,
    onSelect,
    defaultCategory = "lunch"
}: FoodSearchModalProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<MealType>(defaultCategory);
    const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
    const [grams, setGrams] = useState("100");

    const searchFoods = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=20`
            );

            if (!response.ok) {
                throw new Error(t("food_search.search_failed"));
            }

            const data = await response.json();
            const products = (data.products || []).filter(
                (p: any) => p.product_name && p.nutriments?.["energy-kcal_100g"]
            );
            setResults(products);
        } catch (e: any) {
            setError(e.message || t("food_search.search_failed"));
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (text: string) => {
        setQuery(text);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => searchFoods(text), 500));
    };

    const handleSelectFood = (food: SearchResult) => {
        setSelectedFood(food);
        setGrams("100");
    };

    const handleAddFood = () => {
        if (!selectedFood) return;

        const gramsNum = Number(grams) || 100;
        const ratio = gramsNum / 100;

        const foodResult: FoodResult = {
            meal_name: selectedFood.product_name + (selectedFood.brands ? ` (${selectedFood.brands})` : ""),
            calories_kcal: Math.round((selectedFood.nutriments["energy-kcal_100g"] || 0) * ratio),
            macros_g: {
                protein: Math.round((selectedFood.nutriments.proteins_100g || 0) * ratio),
                carbs: Math.round((selectedFood.nutriments.carbohydrates_100g || 0) * ratio),
                fat: Math.round((selectedFood.nutriments.fat_100g || 0) * ratio),
            },
            ingredients: [],
            confidence: "high",
            category: selectedCategory,
            quantity_basis: "100g",
            notes: "",
        };

        onSelect(foodResult, selectedCategory);
        handleClose();
    };

    const handleClose = () => {
        setQuery("");
        setResults([]);
        setSelectedFood(null);
        setError(null);
        onClose();
    };

    const renderFoodItem = ({ item }: { item: SearchResult }) => (
        <Pressable
            style={({ pressed }) => [
                styles.foodItem,
                pressed && styles.foodItemPressed
            ]}
            onPress={() => handleSelectFood(item)}
        >
            <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                    {item.product_name}
                </Text>
                {item.brands && (
                    <Text style={styles.foodBrand} numberOfLines={1}>
                        {item.brands}
                    </Text>
                )}
            </View>
            <View style={styles.foodCalories}>
                <Text style={styles.caloriesValue}>
                    {Math.round(item.nutriments["energy-kcal_100g"] || 0)}
                </Text>
                <Text style={styles.caloriesUnit}>{t("food_search.kcal_unit")}</Text>
            </View>
        </Pressable>
    );

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t("food_search.title")}</Text>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#64748b" />
                    </Pressable>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t("food_search.placeholder")}
                        placeholderTextColor="#94a3b8"
                        value={query}
                        onChangeText={handleSearchChange}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <Pressable onPress={() => { setQuery(""); setResults([]); }}>
                            <Ionicons name="close-circle" size={20} color="#94a3b8" />
                        </Pressable>
                    )}
                </View>

                {/* Category Selector */}
                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryContainer}
                    >
                        {MEAL_TYPES.map((type) => (
                            <Pressable
                                key={type}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === type && styles.categoryButtonActive
                                ]}
                                onPress={() => setSelectedCategory(type)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === type && styles.categoryTextActive
                                ]}>
                                    {t(`common.${type}`)}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                {selectedFood ? (
                    <View style={styles.selectedContainer}>
                        <View style={styles.selectedCard}>
                            <Text style={styles.selectedName}>{selectedFood.product_name}</Text>
                            {selectedFood.brands && (
                                <Text style={styles.selectedBrand}>{selectedFood.brands}</Text>
                            )}

                            <View style={styles.nutritionRow}>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionValue}>
                                        {Math.round((selectedFood.nutriments["energy-kcal_100g"] || 0) * (Number(grams) / 100))}
                                    </Text>
                                    <Text style={styles.nutritionLabel}>kcal</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionValue}>
                                        {Math.round((selectedFood.nutriments.proteins_100g || 0) * (Number(grams) / 100))}g
                                    </Text>
                                    <Text style={styles.nutritionLabel}>Protein</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionValue}>
                                        {Math.round((selectedFood.nutriments.carbohydrates_100g || 0) * (Number(grams) / 100))}g
                                    </Text>
                                    <Text style={styles.nutritionLabel}>Carbs</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <Text style={styles.nutritionValue}>
                                        {Math.round((selectedFood.nutriments.fat_100g || 0) * (Number(grams) / 100))}g
                                    </Text>
                                    <Text style={styles.nutritionLabel}>Fat</Text>
                                </View>
                            </View>

                            <View style={styles.gramsContainer}>
                                <Text style={styles.gramsLabel}>{t("food_search.amount_g")}</Text>
                                <TextInput
                                    style={styles.gramsInput}
                                    value={grams}
                                    onChangeText={setGrams}
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                />
                            </View>
                        </View>

                        <View style={styles.buttonRow}>
                            <Pressable
                                style={styles.backButton}
                                onPress={() => setSelectedFood(null)}
                            >
                                <Text style={styles.backButtonText}>{t("common.back")}</Text>
                            </Pressable>
                            <Pressable
                                style={styles.addButton}
                                onPress={handleAddFood}
                            >
                                <Text style={styles.addButtonText}>{t("food_search.add_to_log")}</Text>
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <>
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {!loading && !error && results.length === 0 && query.length >= 2 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search" size={48} color="#94a3b8" />
                                <Text style={styles.emptyText}>{t("food_search.no_results")}</Text>
                            </View>
                        )}

                        {!loading && !error && results.length === 0 && query.length < 2 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="restaurant" size={48} color="#94a3b8" />
                                <Text style={styles.emptyText}>{t("food_search.search_prompt_title")}</Text>
                                <Text style={styles.emptySubtext}>
                                    {t("food_search.search_prompt_subtitle")}
                                </Text>
                            </View>
                        )}

                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.code}
                            renderItem={renderFoodItem}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                        />
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingTop: 24,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        paddingBottom: 8

    },
    closeButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        margin: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#1e293b",
    },
    categoryContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    categoryButtonActive: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    categoryText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    categoryTextActive: {
        color: "white",
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
    },
    foodItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    foodItemPressed: {
        backgroundColor: "#f1f5f9",
    },
    foodInfo: {
        flex: 1,
        marginRight: 12,
    },
    foodName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    foodBrand: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 2,
    },
    foodCalories: {
        alignItems: "flex-end",
    },
    caloriesValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3b82f6",
    },
    caloriesUnit: {
        fontSize: 12,
        color: "#94a3b8",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: "#ef4444",
        marginTop: 12,
        textAlign: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        color: "#64748b",
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 4,
    },
    // Selected food view
    selectedContainer: {
        flex: 1,
        padding: 16,
    },
    selectedCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    selectedName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4,
    },
    selectedBrand: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 20,
    },
    nutritionRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    nutritionItem: {
        alignItems: "center",
    },
    nutritionValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3b82f6",
    },
    nutritionLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
    },
    gramsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
    },
    gramsLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    gramsInput: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        width: 100,
        textAlign: "center",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 20,
    },
    backButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    addButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#22c55e",
        alignItems: "center",
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
});
