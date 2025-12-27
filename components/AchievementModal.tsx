import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { Badge } from "../types";

type AchievementModalProps = {
    badge: Badge | null;
    onClose: () => void;
};

export default function AchievementModal({ badge, onClose }: AchievementModalProps) {
    const scale = useSharedValue(0);

    useEffect(() => {
        if (badge) {
            scale.value = withSequence(
                withSpring(1.2),
                withSpring(1)
            );
        } else {
            scale.value = 0;
        }
    }, [badge]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    if (!badge) return null;

    return (
        <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Animated.View style={[styles.iconContainer, animatedStyle]}>
                        <Ionicons name={badge.icon as any} size={64} color="#f59e0b" />
                    </Animated.View>

                    <Text style={styles.title}>Badge Unlocked!</Text>
                    <Text style={styles.badgeTitle}>{badge.title}</Text>
                    <Text style={styles.description}>{badge.description}</Text>

                    <Pressable style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Awesome!</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        width: "100%",
        maxWidth: 340,
        gap: 16,
    },
    iconContainer: {
        width: 120,
        height: 120,
        backgroundColor: "#fef3c7",
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        borderWidth: 4,
        borderColor: "#fcd34d",
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    badgeTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 24,
    },
    button: {
        backgroundColor: "#3b82f6",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        marginTop: 16,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
});
