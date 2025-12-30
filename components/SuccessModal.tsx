import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useLanguage } from "../context/LanguageContext";

interface SuccessModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
}

export default function SuccessModal({
    visible,
    onClose,
    title,
    message,
    buttonText,
}: SuccessModalProps) {
    const scale = useSharedValue(0.92);
    const opacity = useSharedValue(0);
    const { t } = useLanguage();

    const resolvedButtonText = buttonText ?? t("success_modal.button_ok");

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 160 });
            scale.value = withTiming(1, { duration: 220 });
        } else {
            // kapanış animasyonu (istersen)
            opacity.value = withTiming(0, { duration: 120 });
            scale.value = withTiming(0.98, { duration: 120 });
        }
    }, [visible, opacity, scale]);

    const cardStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none" // <- önemli
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, cardStyle]}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <Pressable onPress={onClose} style={styles.button}>
                        <Text style={styles.buttonText}>{resolvedButtonText}</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
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
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 16,
        backgroundColor: "#dcfce7",
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
    button: {
        backgroundColor: "#22c55e",
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: "100%",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
});
