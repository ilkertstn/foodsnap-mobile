import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    const insets = useSafeAreaInsets();
    const { weightHistory, logs, goals } = useMeals();

    // Prepare Weight Data (Last 7 Days with Fill-Forward)
    const weightData = useMemo(() => {
        if (weightHistory.length === 0) return null;

        const labels = [];
        const data = [];
        const today = new Date();

        // Sort history by date just in case
        const sortedHistory = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Find last known weight before the 7-day window starts
        let lastKnownWeight = sortedHistory[0].weight;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // Optimization: Find the most recent weight before or on sevenDaysAgo
        const preWindowEntry = sortedHistory.findLast(e => new Date(e.date) < sevenDaysAgo);
        if (preWindowEntry) lastKnownWeight = preWindowEntry.weight;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            labels.push(`${d.getDate()}/${d.getMonth() + 1}`);

            // Check if we have an entry for this exact day
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
    }, [weightHistory]);


    const { calorieData, weeklyAverage } = useMemo(() => {
        const labels = [];
        const data = [];
        let totalWeekCalories = 0;
        let daysWithData = 0;

        // Show Today first, then go backwards
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            labels.push(`${d.getDate()}`);

            const dayLog = logs[dateStr];
            let totalCals = 0;
            if (dayLog) {
                Object.values(dayLog.meals).flat().forEach(meal => {
                    totalCals += meal.calories_kcal;
                });
                if (totalCals > 0) daysWithData++;
            }
            totalWeekCalories += totalCals;
            data.push(totalCals);
        }

        const avg = daysWithData > 0 ? Math.round(totalWeekCalories / daysWithData) : 0;

        return {
            calorieData: {
                labels, // [20, 21, ..., Today]
                datasets: [{ data }]
            },
            weeklyAverage: avg
        };
    }, [logs]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={["#f8fafc", "#eff6ff", "#e0f2fe"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Progress</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Weight Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="body" size={20} color="#3b82f6" />
                            <Text style={styles.cardTitle}>Weight Trend</Text>
                        </View>
                        {weightData && (
                            <Text style={styles.subtitle}>Last 7 Days</Text>
                        )}
                    </View>

                    {weightData ? (
                        <LineChart
                            data={weightData}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withDots={true}
                            withInnerLines={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No weight data yet.</Text>
                            <Text style={styles.emptySubtext}>Update your weight in Profile to track progress.</Text>
                        </View>
                    )}
                </View>

                {/* Calorie Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="flame" size={20} color="#f97316" />
                            <Text style={styles.cardTitle}>Calorie Intake</Text>
                        </View>
                        <View style={styles.avgBadge}>
                            <Text style={styles.avgLabel}>Weekly Avg:</Text>
                            <Text style={styles.avgValue}>{weeklyAverage} kcal</Text>
                        </View>
                    </View>
                    <BarChart
                        data={calorieData}
                        width={screenWidth - 80}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                            propsForDots: { r: "4", stroke: "#f97316" },
                            barPercentage: 0.7,
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                        withInnerLines={false}
                    />
                    <View style={styles.goalLine}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.goalText}>Daily Goal: {goals.calories} kcal</Text>
                            <Text style={styles.goalText}>Vs Avg: {weeklyAverage - goals.calories > 0 ? '+' : ''}{weeklyAverage - goals.calories}</Text>
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
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1e293b",
    },
    content: {
        padding: 24,
        gap: 24,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 16, // reduced padding for charts
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        alignItems: "center",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
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
        marginLeft: 'auto',
    },
    avgBadge: {
        marginLeft: 'auto',
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
