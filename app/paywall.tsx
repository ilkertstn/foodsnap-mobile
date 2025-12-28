import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Paywall() {
    const router = useRouter();

    const handleStartGuest = () => {
        // Start waiting period logic is handled by backend timestamp on first install
        router.replace("/(tabs)/progress");
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#ffffff", "#f8fafc", "#f1f5f9"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <Image
                    source={require("../assets/images/foodsnap-logo.png")}
                    style={styles.logo}
                    contentFit="contain"
                />

                <Text style={styles.title}>Welcome to FoodSnap</Text>

                <View style={styles.infoContainer}>
                    <Text style={styles.description}>
                        Start your nutrition journey today.
                    </Text>

                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🗓️</Text>
                        <Text style={styles.featureText}>
                            Use freely for <Text style={styles.highlight}>3 Days</Text> with <Text style={styles.highlight}>10 Scans</Text> limit.
                        </Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📊</Text>
                        <Text style={styles.featureText}>Track calories, macros, and water.</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🔒</Text>
                        <Text style={styles.featureText}>Sign up later to save your progress permanently.</Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleStartGuest}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>Start 3-Day Guest Pass</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/auth/login")}
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryButtonText}>I already have an account</Text>
                    </TouchableOpacity>
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
});
