
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

export type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertModalProps {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryPress: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
}

const ALERT_CONFIG: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
    success: { icon: "checkmark-circle", color: "#22c55e", bg: "#dcfce7" },
    error: { icon: "alert-circle", color: "#ef4444", bg: "#fee2e2" },
    warning: { icon: "warning", color: "#f59e0b", bg: "#fef3c7" },
    info: { icon: "information-circle", color: "#3b82f6", bg: "#dbeafe" },
};

export default function CustomAlertModal({
    visible,
    type,
    title,
    message,
    primaryButtonText = "OK",
    onPrimaryPress,
    secondaryButtonText,
    onSecondaryPress
}: CustomAlertModalProps) {
    if (!visible) return null;

    const config = ALERT_CONFIG[type];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
                    <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={48} color={config.color} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        {secondaryButtonText && (
                            <Pressable
                                onPress={onSecondaryPress}
                                style={[styles.button, styles.secondaryButton]}
                            >
                                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                            </Pressable>
                        )}
                        <Pressable
                            onPress={onPrimaryPress}
                            style={[styles.button, { backgroundColor: config.color, flex: secondaryButtonText ? 1 : 0, width: secondaryButtonText ? undefined : "100%" }]}
                        >
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </Pressable>
                    </View>
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
        padding: 32,
        width: "100%",
        maxWidth: 320,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 50,
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 15,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
        justifyContent: "center",
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        flex: 1,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    secondaryButtonText: {
        color: "#64748b",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});
