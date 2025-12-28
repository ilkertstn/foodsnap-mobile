import { useRouter } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type UpgradePromptProps = {
    visible: boolean;
    onClose: () => void;
};

export const UpgradePrompt = ({ visible, onClose }: UpgradePromptProps) => {
    const router = useRouter();

    if (!visible) return null;

    const handleUpgrade = () => {
        onClose();
        // Navigate to a dedicated upgrade/link page.
        // We can reuse the login page or a new one. 
        // For now let's assume /auth/login handles generic auth which we will adapt, 
        // or we create /auth/link. 
        // Let's us /auth/signup maybe? Or create a specialized flow.
        // The requirement says "Profile -> Link". 
        // Let's send them to /auth/link-account (we need to create this route).
        router.push("/auth/link-account");
    };

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>☁️ Cloud Backup</Text>
                    <Text style={styles.message}>
                        You've made great progress! Create a free account to backup your data and sync across devices.
                    </Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleUpgrade}>
                        <Text style={styles.primaryButtonText}>Backup My Data</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                        <Text style={styles.secondaryButtonText}>Not Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 12,
        color: "#1a1a1a",
    },
    message: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    primaryButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
        marginBottom: 12,
    },
    primaryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    secondaryButton: {
        paddingVertical: 12,
    },
    secondaryButtonText: {
        color: "#666",
        fontSize: 16,
    },
});
