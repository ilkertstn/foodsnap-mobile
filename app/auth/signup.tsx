import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
import CustomAlertModal, { AlertType } from "../../components/CustomAlertModal";

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const { t, language, setLanguage } = useLanguage();

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

    const handleSignUp = async () => {
        if (!email || !password) {
            showCustomAlert("error", t('auth.error_generic'), t('auth.error_empty'));
            return;
        }

        setIsLoading(true);
        try {
            await signUp(email.trim(), password);
            // AuthContext will update, redirection happens automatically
        } catch (e: any) {
            showCustomAlert("error", t('auth.error_signup'), getAuthErrorMessage(e));
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

            <TouchableOpacity
                style={styles.langButton}
                onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            >
                <Text style={styles.langButtonText}>
                    {language === 'tr' ? 'TR 🇹🇷' : 'EN 🇬🇧'}
                </Text>
            </TouchableOpacity>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        source={require("../../assets/images/fitera-icon.png")}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>{t('auth.create_account')}</Text>
                    <Text style={styles.subtitle}>{t('auth.sign_up_subtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t('auth.email')}</Text>
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
                        <Text style={styles.label}>{t('auth.password')}</Text>
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
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.sign_up')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{t('auth.have_account')} </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>{t('auth.sign_in')}</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
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
    langButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    langButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
    },
});
