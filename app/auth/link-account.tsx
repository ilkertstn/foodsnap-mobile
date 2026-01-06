import CustomAlertModal, { AlertType } from "@/components/CustomAlertModal";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/utils/authErrors";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";

export default function LinkAccountScreen() {
    const router = useRouter();
    const { linkAccount } = useAuth();
    const { t } = useLanguage();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        type: AlertType;
        title: string;
        message: string;
        primaryText?: string;
        onPrimary: () => void;
    }>({
        type: "error",
        title: "",
        message: "",
        onPrimary: () => { },
    });

    const showCustomAlert = (type: AlertType, title: string, message: string, onPrimary?: () => void) => {
        setAlertConfig({
            type,
            title,
            message,
            primaryText: "OK",
            onPrimary: () => {
                setAlertVisible(false);
                if (onPrimary) onPrimary();
            },
        });
        setAlertVisible(true);
    };

    const handleLink = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
            showCustomAlert("error", t("auth.error_generic"), t("auth.enter_email_pass"));
            return;
        }

        setIsLoading(true);
        try {
            await linkAccount(cleanEmail, password);
            showCustomAlert("success", t("auth.link_success_title") || "Success", t("auth.link_success"), () => {
                router.replace("/(tabs)/profile");
            });
        } catch (error: any) {
            showCustomAlert("error", t("auth.link_failed"), getAuthErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <LinearGradient
                colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        source={require("../../assets/images/fitera-icon.png")}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>{t("auth.save_progress")}</Text>
                    <Text style={styles.subtitle}>{t("auth.save_progress_desc")}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t("auth.email")}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t("auth.email_placeholder")}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t("auth.password")}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t("auth.create_pass_placeholder")}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLink}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{t("auth.link_account")}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ghostButton} onPress={() => router.back()}>
                        <Text style={styles.ghostButtonText}>{t("common.cancel")}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CustomAlertModal
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                primaryButtonText={alertConfig.primaryText}
                onPrimaryPress={alertConfig.onPrimary}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
    },
    input: {
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: "#1e293b",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    button: {
        backgroundColor: "#2563eb",
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    ghostButton: {
        alignItems: "center",
        padding: 16,
    },
    ghostButtonText: {
        color: "#64748b",
        fontSize: 16,
        fontWeight: "600",
    },
});
