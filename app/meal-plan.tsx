
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { useLanguage } from "../context/LanguageContext";
import { useMeals } from "../context/MealContext";
import {
    generateMealPlan,
    generateShoppingList,
    MealPlan,
    MealPlanDay,
    ShoppingListItem
} from "../lib/mealPlan";
import { Recipe } from "../lib/recipes";

export const getDayKey = (date: string) => {
    const day = new Date(date).getDay();

    const map = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ];

    return map[day];
};


export default function MealPlanScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { goals, profile } = useMeals();
    const { t } = useLanguage();

    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<MealPlanDay | null>(null);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [loadingText, setLoadingText] = useState("");


    useEffect(() => {
        loadMealPlan();
    }, []);

    const loadMealPlan = async () => {
        setLoading(true);
        try {
            const plan = await generateMealPlan(goals, {
                dietType: profile.dietType,
                allergies: profile.allergies,
                mealsPerDay: profile.mealsPerDay
            });
            setMealPlan(plan);
            setShoppingList(generateShoppingList(plan));
            if (plan.days.length > 0) {
                setSelectedDay(plan.days[0]);
            }
        } catch (e) {
            console.error("Error generating meal plan:", e);
        } finally {
            setLoading(false);
        }
    };

    const regeneratePlan = async () => {
        setLoading(true);
        setLoadingText(t('meal_plan.loading_analyze'));
        try {
            // AI Simulation Steps
            await new Promise(resolve => setTimeout(resolve, 800));
            setLoadingText(t('meal_plan.loading_scan'));
            await new Promise(resolve => setTimeout(resolve, 800));
            setLoadingText(t('meal_plan.loading_optimize'));
            await new Promise(resolve => setTimeout(resolve, 800));

            // Capture the currently viewed date
            const distinctDate = selectedDay?.date || (mealPlan && mealPlan.days.length > 0 ? mealPlan.days[0].date : null);

            const plan = await generateMealPlan(goals, {
                dietType: profile.dietType,
                allergies: profile.allergies,
                mealsPerDay: profile.mealsPerDay
            });
            setMealPlan(plan);
            setShoppingList(generateShoppingList(plan));


            if (distinctDate) {
                const newDay = plan.days.find(d => d.date === distinctDate);
                if (newDay) {
                    setSelectedDay(newDay);
                } else {
                    setSelectedDay(plan.days[0]);
                }
            } else {

                setSelectedDay(plan.days[0]);
            }

        } catch (e) {
            console.error("Error regenerating meal plan:", e);
        } finally {
            setLoading(false);

            setTimeout(() => setLoadingText(t('meal_plan.loading_gen')), 500);
        }
    };

    const renderMealCard = (meal: Recipe | null, mealType: string, icon: string) => {
        if (!meal) return null;

        return (
            <View style={styles.mealCard}>
                <Image
                    source={{ uri: meal.image }}
                    style={styles.mealImage}
                    contentFit="cover"
                />
                <View style={styles.mealInfo}>
                    <View style={styles.mealTypeRow}>
                        <Ionicons name={icon as any} size={16} color="#8b5cf6" />
                        <Text style={styles.mealType}>{mealType}</Text>
                    </View>
                    <Text style={styles.mealTitle} numberOfLines={2}>{meal.title}</Text>
                    <View style={styles.mealStats}>
                        <Text style={styles.mealCalories}>{Math.round(meal.calories)} kcal</Text>
                        <Text style={styles.mealMacros}>
                            P: {meal.protein} • C: {meal.carbs} • F: {meal.fat}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const getCategoryIcon = (category: ShoppingListItem['category']) => {
        switch (category) {
            case 'protein': return 'fish';
            case 'produce': return 'leaf';
            case 'dairy': return 'water';
            case 'grains': return 'nutrition';
            default: return 'basket';
        }
    };

    const getCategoryColor = (category: ShoppingListItem['category']) => {
        switch (category) {
            case 'protein': return '#ef4444';
            case 'produce': return '#22c55e';
            case 'dairy': return '#3b82f6';
            case 'grains': return '#f59e0b';
            default: return '#8b5cf6';
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={["#ecfdf5", "#d1fae5", "#a7f3d0"]}
                style={StyleSheet.absoluteFill}
            />


            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </Pressable>
                <Text style={styles.headerTitle}>{t('meal_plan.title')}</Text>
                <Pressable onPress={() => setShowShoppingList(true)} style={styles.cartButton}>
                    <Ionicons name="cart" size={24} color="#1e293b" />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>{loadingText}</Text>
                </View>
            ) : mealPlan ? (
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.goalsCard}>
                        <Text style={styles.goalsTitle}>{t('meal_plan.daily_target')}</Text>
                        <View style={styles.goalsRow}>
                            <View style={styles.goalItem}>
                                <Text style={styles.goalValue}>{goals.calories}</Text>
                                <Text style={styles.goalLabel}>kcal</Text>
                            </View>
                            <View style={styles.goalDivider} />
                            <View style={styles.goalItem}>
                                <Text style={[styles.goalValue, { color: "#ef4444" }]}>{goals.protein}g</Text>
                                <Text style={styles.goalLabel}>{t('dashboard.protein')}</Text>
                            </View>
                            <View style={styles.goalDivider} />
                            <View style={styles.goalItem}>
                                <Text style={[styles.goalValue, { color: "#f59e0b" }]}>{goals.carbs}g</Text>
                                <Text style={styles.goalLabel}>{t('dashboard.carbs')}</Text>
                            </View>
                            <View style={styles.goalDivider} />
                            <View style={styles.goalItem}>
                                <Text style={[styles.goalValue, { color: "#8b5cf6" }]}>{goals.fat}g</Text>
                                <Text style={styles.goalLabel}>{t('dashboard.fat')}</Text>
                            </View>
                        </View>
                    </View>


                    <View style={styles.weekContainer}>
                        <Text style={styles.sectionTitle}>{t('meal_plan.this_week')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
                            {mealPlan.days.map((day, index) => {
                                const isToday = day.date === new Date().toISOString().split('T')[0];
                                return (
                                    <Pressable
                                        key={day.date}
                                        style={[
                                            styles.dayChip,
                                            isToday && styles.dayChipToday,
                                            selectedDay?.date === day.date && styles.dayChipSelected,
                                        ]}
                                        onPress={() => setSelectedDay(day)}
                                    >
                                        <Text style={[
                                            styles.dayChipText,
                                            isToday && styles.dayChipTextToday,
                                            selectedDay?.date === day.date && styles.dayChipTextSelected,
                                        ]}>
                                            {t(`meal_plan.short_days.${getDayKey(day.date)}`)}
                                        </Text>
                                        <Text style={[
                                            styles.dayChipCals,
                                            selectedDay?.date === day.date && styles.dayChipTextSelected,
                                        ]}>
                                            {day.totalCalories} kcal
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Selected Day Meals */}
                    {selectedDay && (
                        <View style={styles.dayMeals}>
                            <Text style={styles.sectionTitle}>
                                {t("meal_plan.meals_of_day", {
                                    day: t(`meal_plan.days.${getDayKey(selectedDay.date)}`)
                                })}
                            </Text>

                            <View style={styles.daySummary}>
                                <Text style={styles.daySummaryText}>
                                    {t("meal_plan.total_summary", {
                                        cal: selectedDay.totalCalories,
                                        p: selectedDay.totalProtein,
                                        c: selectedDay.totalCarbs,
                                        f: selectedDay.totalFat
                                    })}
                                </Text>
                            </View>

                            {renderMealCard(selectedDay.breakfast, t('common.breakfast'), 'sunny')}
                            {renderMealCard(selectedDay.lunch, t('common.lunch'), 'restaurant')}
                            {renderMealCard(selectedDay.dinner, t('common.dinner'), 'moon')}
                            {selectedDay.snacks.map((snack, i) => (
                                <React.Fragment key={`snack-${i}`}>
                                    {renderMealCard(snack, `${t('common.snack')} ${i + 1}`, 'cafe')}
                                </React.Fragment>
                            ))}
                        </View>
                    )}


                    {!selectedDay && mealPlan.days.length > 0 && (
                        <View style={styles.dayMeals}>
                            <Text style={styles.sectionTitle}>
                                {t("meal_plan.meals_of_day", {
                                    day: t(`meal_plan.days.${getDayKey(mealPlan.days[0].date)}`)
                                })}
                            </Text>

                            <View style={styles.daySummary}>
                                <Text style={styles.daySummaryText}>
                                    {t("meal_plan.total_summary", {
                                        cal: mealPlan.days[0].totalCalories,
                                        p: mealPlan.days[0].totalProtein,
                                        c: mealPlan.days[0].totalCarbs,
                                        f: mealPlan.days[0].totalFat
                                    })}
                                </Text>
                            </View>

                            {renderMealCard(mealPlan.days[0].breakfast, t('common.breakfast'), 'sunny')}
                            {renderMealCard(mealPlan.days[0].lunch, t('common.lunch'), 'restaurant')}
                            {renderMealCard(mealPlan.days[0].dinner, t('common.dinner'), 'moon')}
                            {mealPlan.days[0].snacks.map((snack, i) => (
                                <React.Fragment key={`snack-0-${i}`}>
                                    {renderMealCard(snack, `${t('common.snack')} ${i + 1}`, 'cafe')}
                                </React.Fragment>
                            ))}
                        </View>
                    )}

                    {/* Regenerate Button */}
                    <Pressable style={styles.regenerateButton} onPress={regeneratePlan}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.regenerateButtonText}>{t('meal_plan.generate_new')}</Text>
                    </Pressable>
                </ScrollView>
            ) : null}


            <Modal
                visible={showShoppingList}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('meal_plan.shopping_list')}</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setShowShoppingList(false)}
                        >
                            <Ionicons name="close" size={24} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={styles.shoppingContent}>
                        {['protein', 'produce', 'dairy', 'grains', 'other'].map(cat => {
                            const items = shoppingList.filter(i => i.category === cat);
                            if (items.length === 0) return null;

                            return (
                                <View key={cat} style={styles.shoppingCategory}>
                                    <View style={styles.categoryHeader}>
                                        <Ionicons
                                            name={getCategoryIcon(cat as ShoppingListItem['category']) as any}
                                            size={20}
                                            color={getCategoryColor(cat as ShoppingListItem['category'])}
                                        />
                                        <Text style={styles.categoryTitle}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </View>
                                    {items.map((item, idx) => (
                                        <View key={idx} style={styles.shoppingItem}>
                                            <Text style={styles.shoppingItemName}>{item.ingredient}</Text>
                                            <Text style={styles.shoppingItemAmount}>{item.amount}</Text>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    cartButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    goalsCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    goalsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 12,
        textAlign: "center",
    },
    goalsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    goalItem: {
        alignItems: "center",
    },
    goalValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#10b981",
    },
    goalLabel: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    goalDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#e2e8f0",
    },
    weekContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
    },
    daysRow: {
        gap: 10,
        paddingRight: 20,
    },
    dayChip: {
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: "center",
        minWidth: 80,
        borderWidth: 2,
        borderColor: "transparent",
    },
    dayChipToday: {
        borderColor: "#10b981",
    },
    dayChipSelected: {
        backgroundColor: "#10b981",
    },
    dayChipText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
    },
    dayChipTextToday: {
        color: "#10b981",
    },
    dayChipTextSelected: {
        color: "white",
    },
    dayChipCals: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 4,
    },
    dayMeals: {
        marginBottom: 24,
    },
    daySummary: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    daySummaryText: {
        fontSize: 13,
        color: "#10b981",
        fontWeight: "600",
        textAlign: "center",
    },
    mealCard: {
        backgroundColor: "white",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
        flexDirection: "row",
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mealImage: {
        width: 100,
        height: 100,
    },
    mealInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
    mealTypeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    mealType: {
        fontSize: 12,
        fontWeight: "600",
        color: "#8b5cf6",
    },
    mealTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 6,
    },
    mealStats: {
        gap: 2,
    },
    mealCalories: {
        fontSize: 13,
        fontWeight: "700",
        color: "#10b981",
    },
    mealMacros: {
        fontSize: 11,
        color: "#64748b",
    },
    regenerateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#10b981",
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
    },
    regenerateButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingTop: 24,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    closeButton: {
        padding: 8,
    },
    shoppingContent: {
        padding: 16,
    },
    shoppingCategory: {
        marginBottom: 24,
    },
    categoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    shoppingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    shoppingItemName: {
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "500",
    },
    shoppingItemAmount: {
        fontSize: 14,
        color: "#64748b",
    },
});
