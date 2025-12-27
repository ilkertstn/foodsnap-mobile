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

    // Prepare Weight Data
    const weightData = useMemo(() => {
        if (weightHistory.length === 0) return null;

        // Get last 6 entries
        const recentHistory = weightHistory.slice(-6);

        return {
            labels: recentHistory.map(e => {
                const date = new Date(e.date);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets: [{
                data: recentHistory.map(e => e.weight)
            }]
        };
    }, [weightHistory]);


    const calorieData = useMemo(() => {
        const labels = [];
        const data = [];

        // Show Today first, then go backwards
        for (let i = 0; i <= 6; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            labels.push(i === 0 ? "Today" : `${d.getDate()}`);

            const dayLog = logs[dateStr];
            let totalCals = 0;
            if (dayLog) {
                Object.values(dayLog.meals).flat().forEach(meal => {
                    totalCals += meal.calories_kcal;
                });
            }
            data.push(totalCals);
        }

        return {
            labels, // [Today, 26, 25...]
            datasets: [{ data }]
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
                        <Ionicons name="body" size={20} color="#3b82f6" />
                        <Text style={styles.cardTitle}>Weight Trend</Text>
                    </View>

                    {weightData ? (
                        <LineChart
                            data={weightData}
                            width={screenWidth - 64}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
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
                        <Ionicons name="flame" size={20} color="#f97316" />
                        <Text style={styles.cardTitle}>Calorie Intake</Text>
                    </View>
                    <BarChart
                        data={calorieData}
                        width={screenWidth - 64}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                            propsForDots: { r: "4", stroke: "#f97316" }
                        }}
                        style={styles.chart}
                        showValuesOnTopOfBars
                    />
                    <View style={styles.goalLine}>
                        <Text style={styles.goalText}>Daily Goal: {goals.calories} kcal</Text>
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
        marginRight: 8, // slight adjustment for chart labels
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
    },
    goalText: {
        color: "#f97316",
        fontSize: 12,
        fontWeight: "600",
    }
});
