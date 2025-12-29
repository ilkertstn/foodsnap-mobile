import CustomAlertModal, { AlertType } from "@/components/CustomAlertModal";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/utils/authErrors";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
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

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, signInGuest, user } = useAuth();

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

    const showCustomAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({
            type,
            title,
            message,
            primaryText: "OK",
            onPrimary: () => setAlertVisible(false),
        });
        setAlertVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showCustomAlert("error", "Error", "Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            await signIn(email.trim(), password);
            // Explicitly redirect to tabs on success
            router.replace("/(tabs)/progress");
        } catch (e: any) {
            showCustomAlert("error", "Login Failed", getAuthErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = async () => {
        if (user) {
            router.replace("/(tabs)/progress");
            return;
        }

        setIsLoading(true);
        try {
            await signInGuest();
            router.replace("/(tabs)/progress");
        } catch (e: any) {
            showCustomAlert("error", "Error", getAuthErrorMessage(e));
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
                        source={require("../../assets/images/foodsnap-logo.png")}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue your journey</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="hello@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/auth/signup" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.ghostButton]}
                        onPress={handleGuest}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.ghostButtonText]}>Continue as Guest</Text>
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
        </KeyboardAvoidingView >
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
        width: 120,
        height: 120,
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
    ghostButton: {
        backgroundColor: "transparent",
        marginTop: 0,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 0,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    ghostButtonText: {
        color: "#2563eb",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 16,
    },
    footerText: {
        color: "#64748b",
        fontSize: 14,
    },
    link: {
        color: "#2563eb",
        fontSize: 14,
        fontWeight: "700",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginVertical: 12,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#e2e8f0",
    },
    orText: {
        color: "#94a3b8",
        fontWeight: "600",
        fontSize: 14,
    },
});


