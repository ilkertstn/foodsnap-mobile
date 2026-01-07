
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";
import { useMeals } from "../../context/MealContext";
import { DEMO_RECIPES, getRecipeDetails, isApiConfigured, Recipe, RecipeDetail, searchRecipesByNutrients } from "../../lib/recipes";
import { getAdjustedDate } from "../../utils/date";

export default function RecipesScreen() {
    const insets = useSafeAreaInsets();
    const { getDailySummary, goals, profile } = useMeals();
    const { t } = useLanguage();

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [loadingText, setLoadingText] = useState("");

    const today = getAdjustedDate();
    const summary = getDailySummary(today);


    const remainingCalories = Math.max(0, goals.calories - summary.consumed.calories);
    const remainingProtein = Math.max(0, goals.protein - summary.consumed.protein);
    const remainingCarbs = Math.max(0, goals.carbs - summary.consumed.carbs);
    const remainingFat = Math.max(0, goals.fat - summary.consumed.fat);

    useEffect(() => {
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        setLoading(true);
        setLoadingText(t('recipes.loading_check'));

        try {
            await new Promise(r => setTimeout(r, 600));
            setLoadingText(t('recipes.loading_scan'));
            await new Promise(r => setTimeout(r, 600));


            const results = await searchRecipesByNutrients({
                maxCalories: Math.min(remainingCalories, 800),
                maxCarbs: Math.min(remainingCarbs, 100),
                maxProtein: Math.min(remainingProtein + 20, 60),
                minProtein: 10,
                number: 10,
                dietType: profile.dietType,
                allergies: profile.allergies
            });

            await new Promise(r => setTimeout(r, 400));
            setRecipes(results.length > 0 ? results : DEMO_RECIPES);
        } catch (error) {
            console.error("Load recipes error:", error);
            setRecipes(DEMO_RECIPES);
        } finally {
            setLoading(false);
            setLoadingText(t('recipes.loading_find'));
        }
    };

    const handleRecipePress = async (recipe: Recipe) => {
        if (!isApiConfigured()) {

            setSelectedRecipe({
                ...recipe,
                summary: "This is a delicious and healthy recipe that fits perfectly within your remaining macros for the day.",
                instructions: "1. Prepare all ingredients\n2. Cook according to recipe\n3. Serve and enjoy!",
                extendedIngredients: [
                    { original: "200g main ingredient", name: "main ingredient", amount: 200, unit: "g" },
                    { original: "1 cup vegetables", name: "vegetables", amount: 1, unit: "cup" },
                    { original: "2 tbsp olive oil", name: "olive oil", amount: 2, unit: "tbsp" },
                ],
            });
            return;
        }

        setLoadingDetail(true);
        const detail = await getRecipeDetails(recipe.id);
        setLoadingDetail(false);

        if (detail) {
            setSelectedRecipe(detail);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={["#faf5ff", "#f3e8ff", "#e9d5ff"]}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('recipes.title')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {t('recipes.subtitle')}
                    </Text>
                </View>


                <View style={styles.macroCard}>
                    <Text style={styles.macroCardTitle}>{t('recipes.remaining_today')}</Text>
                    <View style={styles.macroRow}>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroValue}>{Math.round(remainingCalories)}</Text>
                            <Text style={styles.macroLabel}>kcal</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: "#ef4444" }]}>{Math.round(remainingProtein)}g</Text>
                            <Text style={styles.macroLabel}>{t('dashboard.protein')}</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: "#f59e0b" }]}>{Math.round(remainingCarbs)}g</Text>
                            <Text style={styles.macroLabel}>{t('dashboard.carbs')}</Text>
                        </View>
                        <View style={styles.macroDivider} />
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: "#8b5cf6" }]}>{Math.round(remainingFat)}g</Text>
                            <Text style={styles.macroLabel}>{t('dashboard.fat')}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>{t('recipes.suggested')}</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                        <Text style={styles.loadingText}>{loadingText}</Text>
                    </View>
                ) : (
                    <View style={styles.recipesGrid}>
                        {recipes.map((recipe) => (
                            <Pressable
                                key={recipe.id}
                                style={({ pressed }) => [
                                    styles.recipeCard,
                                    pressed && styles.recipeCardPressed,
                                ]}
                                onPress={() => handleRecipePress(recipe)}
                            >
                                <Image
                                    source={{ uri: recipe.image }}
                                    style={styles.recipeImage}
                                    contentFit="cover"
                                />
                                <View style={styles.recipeInfo}>
                                    <Text style={styles.recipeTitle} numberOfLines={2}>
                                        {recipe.title}
                                    </Text>
                                    <View style={styles.recipeStats}>
                                        <View style={styles.recipeStat}>
                                            <Ionicons name="flame" size={14} color="#ef4444" />
                                            <Text style={styles.recipeStatText}>{Math.round(recipe.calories)} kcal</Text>
                                        </View>
                                        {recipe.readyInMinutes && (
                                            <View style={styles.recipeStat}>
                                                <Ionicons name="time" size={14} color="#64748b" />
                                                <Text style={styles.recipeStatText}>{recipe.readyInMinutes} min</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.recipeMacros}>
                                        <Text style={styles.recipeMacro}>P: {recipe.protein}</Text>
                                        <Text style={styles.recipeMacro}>C: {recipe.carbs}</Text>
                                        <Text style={styles.recipeMacro}>F: {recipe.fat}</Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}


                <Pressable style={styles.refreshButton} onPress={loadRecipes}>
                    <Ionicons name="refresh" size={20} color="#8b5cf6" />
                    <Text style={styles.refreshButtonText}>{t('recipes.load_more')}</Text>
                </Pressable>
            </ScrollView>


            <Modal
                visible={!!selectedRecipe}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                {selectedRecipe && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={2}>
                                {selectedRecipe.title}
                            </Text>
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setSelectedRecipe(null)}
                            >
                                <Ionicons name="close" size={24} color="#64748b" />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Image
                                source={{ uri: selectedRecipe.image }}
                                style={styles.modalImage}
                                contentFit="cover"
                            />

                            <View style={styles.modalMacros}>
                                <View style={styles.modalMacroItem}>
                                    <Text style={styles.modalMacroValue}>{Math.round(selectedRecipe.calories)}</Text>
                                    <Text style={styles.modalMacroLabel}>kcal</Text>
                                </View>
                                <View style={styles.modalMacroItem}>
                                    <Text style={styles.modalMacroValue}>{selectedRecipe.protein}</Text>
                                    <Text style={styles.modalMacroLabel}>{t('dashboard.protein')}</Text>
                                </View>
                                <View style={styles.modalMacroItem}>
                                    <Text style={styles.modalMacroValue}>{selectedRecipe.carbs}</Text>
                                    <Text style={styles.modalMacroLabel}>{t('dashboard.carbs')}</Text>
                                </View>
                                <View style={styles.modalMacroItem}>
                                    <Text style={styles.modalMacroValue}>{selectedRecipe.fat}</Text>
                                    <Text style={styles.modalMacroLabel}>{t('dashboard.fat')}</Text>
                                </View>
                            </View>

                            {selectedRecipe.summary && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>{t('recipes.detail_about')}</Text>
                                    <Text style={styles.modalText}>{selectedRecipe.summary}</Text>
                                </View>
                            )}

                            {selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.length > 0 && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>{t('recipes.detail_ingredients')}</Text>
                                    {selectedRecipe.extendedIngredients.map((ing, idx) => (
                                        <Text key={idx} style={styles.ingredientText}>
                                            • {ing.original}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {selectedRecipe.instructions && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>{t('recipes.detail_instructions')}</Text>
                                    <Text style={styles.modalText}>{selectedRecipe.instructions}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </Modal>

            {/* Loading Detail Overlay */}
            {loadingDetail && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
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
    macroCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    macroCardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 12,
        textAlign: "center",
    },
    macroRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    macroItem: {
        alignItems: "center",
    },
    macroValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#3b82f6",
    },
    macroLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    macroDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#e2e8f0",
    },
    demoWarning: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    demoWarningText: {
        flex: 1,
        fontSize: 13,
        color: "#d97706",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    recipesGrid: {
        gap: 16,
    },
    recipeCard: {
        backgroundColor: "white",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    recipeCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    recipeImage: {
        width: "100%",
        height: 160,
    },
    recipeInfo: {
        padding: 16,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8,
    },
    recipeStats: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    recipeStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    recipeStatText: {
        fontSize: 13,
        color: "#64748b",
    },
    recipeMacros: {
        flexDirection: "row",
        gap: 12,
    },
    recipeMacro: {
        fontSize: 12,
        color: "#8b5cf6",
        fontWeight: "600",
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 24,
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#8b5cf6",
    },
    refreshButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#8b5cf6",
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 16,
        paddingTop: 24,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginRight: 16,
    },
    closeButton: {
        padding: 8,
    },
    modalContent: {
        padding: 16,
    },
    modalImage: {
        width: "100%",
        height: 200,
        borderRadius: 16,
        marginBottom: 20,
    },
    modalMacros: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    modalMacroItem: {
        alignItems: "center",
    },
    modalMacroValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#8b5cf6",
    },
    modalMacroLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    modalSection: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
    },
    modalText: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 22,
    },
    ingredientText: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 24,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
});
