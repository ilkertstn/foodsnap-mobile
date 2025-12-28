import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AchievementModal from "../../components/AchievementModal";
import AddExerciseModal from "../../components/AddExerciseModal";
import DaySummaryModal from "../../components/DaySummaryModal";
import SuccessModal from "../../components/SuccessModal";
import WaterTracker from "../../components/WaterTracker";
import { useMeals } from "../../context/MealContext";
import { FoodEntry, MealType } from "../../types";
import { formatDate, getAdjustedDate, isAdjustedToday } from "../../utils/date";


const MacroBar = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
    const widthPercent = Math.min(100, (value / total) * 100);

    return (
        <View style={styles.macroContainer}>
            <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>{label}</Text>
                <Text style={styles.macroValue}>{Math.round(value)} / {total}g</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${widthPercent}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

// Helper for Meal Section
const MealSection = ({ title, meals, onDelete }: { title: string, meals: FoodEntry[] | undefined, onDelete: (id: string) => void }) => {
    if (!meals || meals.length === 0) {
        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No meals logged</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {meals.map((meal, index) => (
                <View
                    key={meal.id}
                    style={styles.mealItem}
                >
                    <View style={styles.mealContent}>
                        <Text style={styles.mealName}>{meal.meal_name}</Text>
                        <Text style={styles.mealCalories}>{Math.round(meal.calories_kcal)} kcal</Text>
                    </View>
                    <Pressable onPress={() => onDelete(meal.id)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </Pressable>
                </View>
            ))}
        </View>
    );
};



export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { getDailySummary, logs, removeEntry, goals, addExercise, removeExercise, streaks } = useMeals();


    const [selectedDate, setSelectedDate] = useState(getAdjustedDate());
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDaySummaryModal, setShowDaySummaryModal] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const { newlyUnlockedBadge, clearNewBadge } = useMeals();

    const summary = getDailySummary(selectedDate);
    const dayLog = logs[selectedDate];

    const handleDelete = (mealType: MealType, id: string) => {
        removeEntry(selectedDate, mealType, id);
    };

    const changeDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split("T")[0]);
    };

    const handleEndDay = () => {
        setShowDaySummaryModal(true);
    };

    const handleDaySummaryClose = () => {
        setShowDaySummaryModal(false);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>

            <LinearGradient
                colors={["#f8fafc", "#eff6ff", "#e0f2fe"]}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header with Date Nav */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>Daily Overview</Text>
                        <View style={styles.dateNav}>
                            <Pressable onPress={() => changeDate(-1)} style={styles.navArrow}>
                                <Ionicons name="chevron-back" size={20} color="#64748b" />
                            </Pressable>
                            <Text style={styles.headerTitle}>{isAdjustedToday(selectedDate) ? "Today" : formatDate(selectedDate)}</Text>
                            <Pressable onPress={() => changeDate(1)} style={[styles.navArrow, isAdjustedToday(selectedDate) && styles.disabledArrow]} disabled={isAdjustedToday(selectedDate)}>
                                <Ionicons name="chevron-forward" size={20} color={isAdjustedToday(selectedDate) ? "#cbd5e1" : "#64748b"} />
                            </Pressable>
                        </View>
                    </View>
                    <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.profileButton}>
                        <Ionicons name="person-circle-outline" size={32} color="#3b82f6" />
                    </Pressable>
                </View>


                <View style={styles.summaryCard}>
                    <View style={styles.caloriesRow}>
                        <View>
                            <Text style={styles.caloriesLabel}>Calories</Text>
                            <Text style={styles.caloriesValue}>
                                {Math.round(summary.consumed.calories)}
                                <Text style={styles.caloriesTotal}> / {goals.calories}</Text>
                            </Text>
                        </View>
                        <View style={styles.ringPlaceholder}>

                            <Text style={[styles.ringText, { color: summary.remaining.calories < 0 ? "#ef4444" : "#10b981" }]}>
                                {summary.remaining.calories} left
                            </Text>
                        </View>
                    </View>

                    <View style={styles.macrosContainer}>
                        <MacroBar label="Protein" value={summary.consumed.protein} total={goals.protein} color="#3b82f6" />
                        <MacroBar label="Carbs" value={summary.consumed.carbs} total={goals.carbs} color="#10b981" />
                        <MacroBar label="Fat" value={summary.consumed.fat} total={goals.fat} color="#f59e0b" />
                    </View>
                </View>


                {/* Streak Banner */}
                <View style={styles.streakContainer}>
                    <View style={styles.streakItem}>
                        <Ionicons name="flame" size={20} color="#f59e0b" />
                        <Text style={styles.streakText}>
                            {streaks.log} Day Log Streak
                        </Text>
                    </View>
                    {/* Progress Hint (if logs < 2 today) */}
                    {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const log = logs[today];
                        const mealCount = log ? (log.meals.breakfast.length + log.meals.lunch.length + log.meals.dinner.length + log.meals.snack.length) : 0;
                        if (mealCount < 2) {
                            return (
                                <Text style={styles.streakHint}>
                                    Logging {2 - mealCount} more meal{2 - mealCount > 1 ? 's' : ''} keeps it going!
                                </Text>
                            );
                        }
                        return <Text style={styles.streakHint}>Streak safe for today! ✅</Text>;
                    })()}
                </View>

                {/* Active Calories Card */}
                <View style={styles.activeCard}>
                    <View style={styles.activeHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="flame" size={24} color="#f59e0b" />
                            <Text style={styles.activeTitle}>Active Calories</Text>
                        </View>
                        <Pressable onPress={() => setShowExerciseModal(true)} style={styles.addExerciseButton}>
                            <Ionicons name="add" size={20} color="white" />
                        </Pressable>
                    </View>
                    <View style={styles.activeContent}>
                        <Text style={styles.activeValue}>{Math.round(summary.burned)} <Text style={styles.activeUnit}>kcal burned</Text></Text>
                        {dayLog?.exercises && dayLog.exercises.length > 0 && (
                            <View style={{ marginTop: 12, gap: 8 }}>
                                {dayLog.exercises.map(exercise => (
                                    <View key={exercise.id} style={styles.exerciseItem}>
                                        <View>
                                            <Text style={styles.exerciseName}>{exercise.type}</Text>
                                            <Text style={styles.exerciseDetail}>{exercise.durationMinutes} mins</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.exerciseCalories}>{Math.round(exercise.caloriesBurned)} kcal</Text>
                                            <Pressable onPress={() => removeExercise(selectedDate, exercise.id)}>
                                                <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Water Tracker */}
                <WaterTracker />


                <MealSection
                    title="Breakfast"
                    meals={dayLog?.meals.breakfast}
                    onDelete={(id) => handleDelete("breakfast", id)}
                />
                <MealSection
                    title="Lunch"
                    meals={dayLog?.meals.lunch}
                    onDelete={(id) => handleDelete("lunch", id)}
                />
                <MealSection
                    title="Dinner"
                    meals={dayLog?.meals.dinner}
                    onDelete={(id) => handleDelete("dinner", id)}
                />
                <MealSection
                    title="Snacks"
                    meals={dayLog?.meals.snack}
                    onDelete={(id) => handleDelete("snack", id)}
                />

                {
                    isAdjustedToday(selectedDate) && (
                        <Pressable style={styles.endDayButton} onPress={handleEndDay}>
                            <Text style={styles.endDayText}>Complete Day</Text>
                        </Pressable>
                    )
                }

                <SuccessModal
                    visible={showSuccessModal}
                    title="Day Completed!"
                    message="Good job tracking today! Your logs are saved. See you tomorrow!"
                    onClose={() => setShowSuccessModal(false)}
                />

                <DaySummaryModal
                    visible={showDaySummaryModal}
                    onClose={handleDaySummaryClose}
                    date={selectedDate}
                    consumed={summary.consumed}
                    goals={goals}
                />

                <AddExerciseModal
                    visible={showExerciseModal}
                    onClose={() => setShowExerciseModal(false)}
                    onAdd={(exercise) => addExercise(selectedDate, exercise)}
                />

                <AchievementModal
                    badge={newlyUnlockedBadge}
                    onClose={clearNewBadge}
                />

                <View style={{ height: 40 }} />
            </ScrollView >
        </View >
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
    streakContainer: {
        backgroundColor: "#fff7ed",
        marginHorizontal: 0, // content has padding 20
        marginBottom: 24,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ffedd5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    streakItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    streakText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#d97706",
    },
    streakHint: {
        fontSize: 12,
        color: "#d97706",
        fontWeight: "500",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    headerSub: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navArrow: {
        padding: 4,
    },
    disabledArrow: {
        opacity: 0.3,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
    },
    profileButton: {
        padding: 4,
    },
    endDayButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginVertical: 20,
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    endDayText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    summaryCard: {
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
    caloriesRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    caloriesLabel: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600",
    },
    caloriesValue: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1e293b",
    },
    caloriesTotal: {
        fontSize: 16,
        color: "#94a3b8",
        fontWeight: "600",
    },
    ringPlaceholder: {
        alignItems: "flex-end",
    },
    ringText: {
        fontSize: 16,
        fontWeight: "700",
    },
    macrosContainer: {
        gap: 12,
    },
    macroContainer: {
        gap: 6,
    },
    macroHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    macroLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
    },
    macroValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1e293b",
    },
    progressBarBg: {
        height: 8,
        backgroundColor: "#f1f5f9",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
    },
    emptyState: {
        backgroundColor: "rgba(255,255,255,0.5)",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
    },
    emptyStateText: {
        color: "#94a3b8",
        fontWeight: "500",
    },
    mealItem: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mealContent: {
        gap: 2,
    },
    mealName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    mealCalories: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
    deleteButton: {
        padding: 8,
    },
    activeCard: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    activeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    activeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    addExerciseButton: {
        backgroundColor: "#f59e0b",
        padding: 8,
        borderRadius: 12,
    },
    activeContent: {
        gap: 4,
    },
    activeValue: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1e293b",
    },
    activeUnit: {
        fontSize: 16,
        color: "#f59e0b",
        fontWeight: "600",
    },
    exerciseItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
    },
    exerciseDetail: {
        fontSize: 12,
        color: "#64748b",
    },
    exerciseCalories: {
        fontSize: 14,
        fontWeight: "700",
        color: "#f59e0b",
    },
});
