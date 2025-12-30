import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useMeals } from "../context/MealContext";
import { getAdjustedDate } from "../utils/date";

export default function WaterTracker() {
    const { getDailySummary, addWater, logs, goals } = useMeals();
    const { t } = useLanguage();

    const today = getAdjustedDate();
    const summary = getDailySummary(today);

    const current = summary.consumed.water;
    const goal = current + summary.remaining.water;
    const percentage = Math.min(100, Math.round((current / goal) * 100));
    const remaining = Math.max(0, goal - current);

    // Calculate Streak
    const streak = React.useMemo(() => {
        let count = 0;
        const todayDate = new Date();
        // Check past 30 days
        for (let i = 1; i <= 30; i++) {
            const d = new Date(todayDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const log = logs[dateStr];
            if (log && log.water_ml >= (goals.water || 2500)) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }, [logs, goals]);

    const [showCustom, setShowCustom] = React.useState(false);
    const [customAmount, setCustomAmount] = React.useState("");

    const handleAddWater = (amount: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addWater(today, amount);
    };

    const handleCustomAdd = () => {
        const amount = parseInt(customAmount);
        if (amount && !isNaN(amount)) {
            handleAddWater(amount);
            setCustomAmount("");
            setShowCustom(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.titleRow}>
                        <Ionicons name="water" size={20} color="#3b82f6" />
                        <Text style={styles.title}>{t('dashboard.water_intake')}</Text>
                    </View>
                    {streak > 0 && (
                        <View style={styles.streakBadge}>
                            <Ionicons name="flame" size={14} color="#f97316" />
                            <Text style={styles.streakText}>{streak} Day Streak</Text>
                        </View>
                    )}
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.value}>
                        <Text style={styles.current}>{current}</Text>
                        <Text style={styles.goal}>/{goal} ml</Text>
                    </Text>
                    {remaining > 0 ? (
                        <Text style={styles.remainingText}>{remaining} ml to go</Text>
                    ) : (
                        <Text style={styles.completedText}>Goal Reached! 🎉</Text>
                    )}
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>

            {showCustom ? (
                <View style={styles.customRow}>
                    <TextInput
                        style={styles.customInput}
                        placeholder="Amount (ml)"
                        keyboardType="numeric"
                        value={customAmount}
                        onChangeText={setCustomAmount}
                        autoFocus
                    />
                    <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={handleCustomAdd}
                    >
                        <Ionicons name="checkmark" size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => setShowCustom(false)}
                    >
                        <Ionicons name="close" size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.controls}>
                    <View style={styles.controlGroup}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.removeButton]}
                            onPress={() => handleAddWater(-200)}
                        >
                            <Ionicons name="remove" size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.addButton]}
                            onPress={() => handleAddWater(200)}
                        >
                            <Ionicons name="add" size={16} color="#3b82f6" />
                            <Text style={styles.buttonText}>200ml</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.controlGroup}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.removeButton]}
                            onPress={() => handleAddWater(-500)}
                        >
                            <Ionicons name="remove" size={16} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.addButton]}
                            onPress={() => handleAddWater(500)}
                        >
                            <Ionicons name="add" size={16} color="#3b82f6" />
                            <Text style={styles.buttonText}>500ml</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.customButton}
                        onPress={() => setShowCustom(true)}
                    >
                        <Ionicons name="ellipsis-horizontal" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        marginBottom: 12,
        gap: 8,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
    },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#fff7ed",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ffedd5",
    },
    streakText: {
        fontSize: 12,
        color: "#ca8a04",
        fontWeight: "700",
    },
    remainingText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
    completedText: {
        fontSize: 13,
        color: "#16a34a",
        fontWeight: "600",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    value: {
        fontSize: 14,
    },
    current: {
        fontWeight: "800",
        color: "#3b82f6",
        fontSize: 18,
    },
    goal: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "500",
    },
    progressContainer: {
        height: 8,
        backgroundColor: "#eff6ff",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 16,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#3b82f6",
        borderRadius: 4,
    },
    controls: {
        flexDirection: "row",
        gap: 12,
    },
    controlGroup: {
        flex: 1,
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        gap: 4,
    },
    addButton: {
        flex: 1,
        backgroundColor: "#eff6ff",
    },
    removeButton: {
        width: 44,
        backgroundColor: "#fef2f2",
    },
    buttonText: {
        color: "#3b82f6",
        fontWeight: "600",
        fontSize: 14,
    },
    customButton: {
        width: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eff6ff",
        borderRadius: 12,
    },
    customRow: {
        flexDirection: "row",
        gap: 8,
        height: 44,
    },
    customInput: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#1e293b",
    },
    confirmButton: {
        width: 44,
        backgroundColor: "#3b82f6",
    },
    cancelButton: {
        width: 44,
        backgroundColor: "#f1f5f9",
    },
});
