import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Paywall() {
    const router = useRouter();
    const { user, isTrialExpired, signInGuest } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    // Check if this is an expired guest user
    const isExpiredGuest = user?.isAnonymous && isTrialExpired;

    const handleStartGuest = async () => {
        if (!user) {
            // New user - sign in as guest first
            await signInGuest();
        }
        router.replace("/(tabs)/progress");
    };

    return (
        <View style={styles.container}>
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
                <Image
                    source={require("../assets/images/fitera-icon.png")}
                    style={styles.logo}
                    contentFit="contain"
                />

                <Text style={styles.title}>
                    {isExpiredGuest ? t('paywall.trial_expired') : t('paywall.welcome')}
                </Text>

                <View style={styles.infoContainer}>
                    {isExpiredGuest ? (
                        <>
                            <Text style={styles.description}>
                                {t('paywall.guest_desc')}
                            </Text>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>✨</Text>
                                <Text style={styles.featureText}>
                                    <Text style={styles.highlight}>{t('paywall.feature_unlimited')}</Text>
                                </Text>
                            </View>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>💾</Text>
                                <Text style={styles.featureText}>{t('paywall.feature_keep_data')}</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📱</Text>
                                <Text style={styles.featureText}>{t('paywall.feature_access')}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.description}>
                                {t('paywall.start_desc')}
                            </Text>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>🗓️</Text>
                                <Text style={styles.featureText}>
                                    {t('paywall.feature_scan_limit')}
                                </Text>
                            </View>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📊</Text>
                                <Text style={styles.featureText}>{t('paywall.feature_track')}</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>🔒</Text>
                                <Text style={styles.featureText}>{t('paywall.feature_signup_later')}</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    {isExpiredGuest ? (
                        <>
                            <TouchableOpacity
                                onPress={() => router.push("/auth/signup")}
                                style={styles.primaryButton}
                            >
                                <Text style={styles.primaryButtonText}>{t('paywall.btn_signup')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/auth/login")}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.secondaryButtonText}>{t('paywall.btn_login')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={handleStartGuest}
                                style={styles.primaryButton}
                            >
                                <Text style={styles.primaryButtonText}>{t('paywall.btn_guest')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/auth/login")}
                                style={styles.secondaryButton}
                            >
                                <Text style={styles.secondaryButtonText}>{t('paywall.btn_login')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
    },
    infoContainer: {
        marginBottom: 48,
        width: "100%",
        paddingHorizontal: 12,
    },
    description: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    featureIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: "#334155",
        flex: 1,
        lineHeight: 22,
    },
    highlight: {
        fontWeight: "700",
        color: "#2563eb",
    },
    buttonContainer: {
        width: "100%",
        gap: 16,
    },
    primaryButton: {
        backgroundColor: "#2563eb",
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    secondaryButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        backgroundColor: "transparent",
    },
    secondaryButtonText: {
        color: "#2563eb",
        fontSize: 16,
        fontWeight: "600",
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
