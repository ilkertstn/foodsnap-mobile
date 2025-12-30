import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useLanguage } from "../context/LanguageContext";

interface DaySummaryModalProps {
    visible: boolean;
    onClose: () => void;
    date: string;
    consumed: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    goals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export default function DaySummaryModal({ visible, onClose, date, consumed, goals }: DaySummaryModalProps) {
    const { t, language } = useLanguage();
    if (!visible) return null;

    const caloriePercent = Math.round((consumed.calories / goals.calories) * 100);
    const proteinPercent = Math.round((consumed.protein / goals.protein) * 100);
    const carbsPercent = Math.round((consumed.carbs / goals.carbs) * 100);
    const fatPercent = Math.round((consumed.fat / goals.fat) * 100);

    const isWithinRange = (percent: number) => percent >= 90 && percent <= 110;
    const overallSuccess = isWithinRange(caloriePercent);

    const getMessage = () => {
        if (caloriePercent < 70) {
            return {
                title: t("day_summary.title_complete"),
                message: t("day_summary.msg_under"),
                emoji: "💪",
                color: "#f59e0b"
            };
        } else if (caloriePercent > 130) {
            return {
                title: t("day_summary.title_complete"),
                message: t("day_summary.msg_over"),
                emoji: "🌅",
                color: "#3b82f6"
            };
        } else {
            return {
                title: t("day_summary.title_great"),
                message: t("day_summary.msg_success"),
                emoji: "✨",
                color: "#22c55e"
            };
        }
    };

    const feedback = getMessage();
    const formattedDate = new Date(date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const StatRow = ({ label, consumed, goal, percent, icon, color }: any) => (
        <View style={styles.statRow}>
            <View style={styles.statLeft}>
                <Ionicons name={icon} size={20} color={color} />
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            <View style={styles.statRight}>
                <Text style={styles.statValue}>
                    {Math.round(consumed)} / {Math.round(goal)}
                </Text>
                <View style={[styles.badge, { backgroundColor: isWithinRange(percent) ? "#dcfce7" : "#fef3c7" }]}>
                    <Text style={[styles.badgeText, { color: isWithinRange(percent) ? "#22c55e" : "#f59e0b" }]}>
                        {isWithinRange(percent) ? "✓" : percent > 110 ? "↑" : "↓"} {percent}%
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
                    <LinearGradient
                        colors={[feedback.color + "15", "#ffffff"]}
                        style={StyleSheet.absoluteFill}
                    />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={styles.emoji}>{feedback.emoji}</Text>
                            <Text style={styles.title}>{feedback.title}</Text>
                            <Text style={styles.subtitle}>{formattedDate}</Text>
                            <Text style={styles.message}>{feedback.message}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statsSection}>
                            <Text style={styles.sectionTitle}>{t("day_summary.summary_title")}</Text>

                            <StatRow
                                label={t("dashboard.calories")}
                                consumed={consumed.calories}
                                goal={goals.calories}
                                percent={caloriePercent}
                                icon="flame"
                                color="#ef4444"
                            />

                            <StatRow
                                label={t("dashboard.protein")}
                                consumed={consumed.protein}
                                goal={goals.protein}
                                percent={proteinPercent}
                                icon="fitness"
                                color="#3b82f6"
                            />

                            <StatRow
                                label={t("dashboard.carbs")}
                                consumed={consumed.carbs}
                                goal={goals.carbs}
                                percent={carbsPercent}
                                icon="leaf"
                                color="#10b981"
                            />

                            <StatRow
                                label={t("dashboard.fat")}
                                consumed={consumed.fat}
                                goal={goals.fat}
                                percent={fatPercent}
                                icon="water"
                                color="#f59e0b"
                            />
                        </View>

                        <Pressable onPress={onClose} style={[styles.button, { backgroundColor: feedback.color }]}>
                            <Text style={styles.buttonText}>{t("day_summary.button_awesome")}</Text>
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                        </Pressable>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    container: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 400,
        maxHeight: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
        overflow: "hidden",
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: "#475569",
        textAlign: "center",
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 20,
    },
    statsSection: {
        gap: 12,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 12,
    },
    statLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1e293b",
    },
    statRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});
