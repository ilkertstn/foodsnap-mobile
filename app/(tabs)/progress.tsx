import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";
import { useMeals } from "../../context/MealContext";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForDots: {
        r: "4",
        strokeWidth: "2",
        stroke: "#3b82f6"
    }
};

export default function ProgressScreen() {
    const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const { weightHistory, logs, goals } = useMeals();
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly'); // New state

    const daysToShow = viewMode === 'weekly' ? 7 : 30;

    const weightData = useMemo(() => {
        if (weightHistory.length === 0) return null;

        const labels = [];
        const data = [];

        const sortedHistory = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let lastKnownWeight = sortedHistory[0].weight;
        const windowStartDate = new Date();
        windowStartDate.setDate(windowStartDate.getDate() - (daysToShow - 1));

        const preWindowEntry = sortedHistory.findLast(e => new Date(e.date) < windowStartDate);
        if (preWindowEntry) lastKnownWeight = preWindowEntry.weight;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // For monthly view, show fewer labels to avoid crowding
            if (viewMode === 'weekly') {
                labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
            } else {
                if (i % 3 === 0) { // Show label every 3 days for scrollable view
                    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
                } else {
                    labels.push("");
                }
            }

            const exactEntry = sortedHistory.find(e => e.date === dateStr);
            if (exactEntry) {
                lastKnownWeight = exactEntry.weight;
            }

            data.push(lastKnownWeight);
        }

        return {
            labels,
            datasets: [{ data }]
        };
    }, [weightHistory, viewMode, daysToShow]);


    const { calorieData, averageIntake } = useMemo(() => {
        const labels = [];
        const data = [];
        let totalCalories = 0;
        let daysWithData = 0;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // For monthly view, show fewer labels to avoid crowding
            if (viewMode === 'weekly') {
                labels.push(`${d.getDate()}`);
            } else {
                if (i % 3 === 0) { // Show label every 3 days for scrollable view
                    labels.push(`${d.getDate()}`);
                } else {
                    labels.push("");
                }
            }

            const dayLog = logs[dateStr];
            let totalCals = 0;
            if (dayLog) {
                Object.values(dayLog.meals).flat().forEach(meal => {
                    totalCals += meal.calories_kcal;
                });
                if (totalCals > 0) daysWithData++;
            }
            totalCalories += totalCals;
            data.push(totalCals);
        }

        const avg = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;

        return {
            calorieData: {
                labels,
                datasets: [{ data }]
            },
            averageIntake: avg
        };
    }, [logs, viewMode, daysToShow]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={["#f8fafc", "#eff6ff", "#e0f2fe"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('progress.title')}</Text>

                {/* View Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'weekly' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('weekly')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
                            {t('progress.view_weekly')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('monthly')}
                    >
                        <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                            {t('progress.view_monthly')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Weight Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="body" size={20} color="#3b82f6" />
                            <Text style={styles.cardTitle}>{t('progress.weight')}</Text>
                        </View>
                        {weightData && (
                            <Text style={styles.subtitle}>
                                {viewMode === 'weekly' ? t('progress.last_7_days') : t('progress.last_30_days')}
                            </Text>
                        )}
                    </View>

                    {weightData ? (
                        <ScrollView horizontal={viewMode === 'monthly'} showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={weightData}
                                width={viewMode === 'monthly' ? Math.max(screenWidth - 80, 500) : screenWidth - 80}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    propsForDots: { r: viewMode === 'monthly' ? "3" : "4" }
                                }}
                                bezier
                                style={styles.chart}
                                withDots={true}
                                withInnerLines={false}
                            />
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('progress.no_weight_data')}</Text>
                            <Text style={styles.emptySubtext}>{t('progress.update_weight')}</Text>
                        </View>
                    )}
                </View>

                {/* Calorie Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="flame" size={20} color="#f97316" />
                            <Text style={styles.cardTitle}>{t('progress.calorie_intake')}</Text>
                        </View>
                        <View style={styles.avgBadge}>
                            <Text style={styles.avgLabel}>
                                {viewMode === 'weekly' ? t('progress.weekly_avg') : t('progress.monthly_avg')}:
                            </Text>
                            <Text style={styles.avgValue}>{averageIntake} kcal</Text>
                        </View>
                    </View>
                    <ScrollView horizontal={viewMode === 'monthly'} showsHorizontalScrollIndicator={false}>
                        <BarChart
                            data={calorieData}
                            width={viewMode === 'monthly' ? Math.max(screenWidth - 80, 600) : screenWidth - 80}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                                propsForDots: { r: "4", stroke: "#f97316" },
                                barPercentage: viewMode === 'weekly' ? 0.7 : 0.5,
                            }}
                            style={styles.chart}
                            showValuesOnTopOfBars={viewMode === 'weekly'}
                            withInnerLines={false}
                        />
                    </ScrollView>
                    <View style={styles.goalLine}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.goalText}>{t('progress.daily_goal')} {goals.calories} {t('progress.kcal')}</Text>
                            <Text style={styles.goalText}> {t('progress.vs_avg')} {averageIntake - goals.calories > 0 ? '+' : ''}{averageIntake - goals.calories} {t('progress.kcal')}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: 16, // Added spacing
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 16, // Space for toggle
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        padding: 4,
        alignSelf: 'flex-start', // Or stretch if you want full width
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    toggleTextActive: {
        color: '#3b82f6',
        fontWeight: '700',
    },
    content: {
        padding: 24,
        gap: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 16,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        alignItems: "center",
        width: '100%', // Ensure card fills width
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "stretch", // Stretch to fill card width
        justifyContent: 'space-between', // Push subtitle/badge to right
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
    },
    chart: {
        borderRadius: 16,
    },
    emptyState: {
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    emptySubtext: {
        fontSize: 13,
        color: "#94a3b8",
        marginTop: 4,
    },
    goalLine: {
        marginTop: 8,
        padding: 8,
        backgroundColor: "#fff7ed",
        borderRadius: 8,
        alignSelf: 'stretch',
    },
    goalText: {
        color: "#f97316",
        fontSize: 12,
        fontWeight: "600",
    },
    subtitle: {
        fontSize: 12,
        color: "#94a3b8",
    },
    avgBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    avgLabel: {
        fontSize: 11,
        color: '#f97316',
        fontWeight: '500',
    },
    avgValue: {
        fontSize: 13,
        color: '#c2410c',
        fontWeight: '700',
    },
});
