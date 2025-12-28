import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LinkAccountScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const router = useRouter();
    const { linkAccount } = useAuth(); // We added this earlier

    const handleLink = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }

        setIsLinking(true);
        try {
            await linkAccount(cleanEmail, password);
            Alert.alert("Success", "Your account has been linked!", [
                { text: "OK", onPress: () => router.replace("/(tabs)/profile") }
            ]);
        } catch (error: any) {
            let msg = "Failed to link account.";
            if (error.code === 'auth/email-already-in-use') {
                msg = "This email is already in use. Please sign in (not yet implemented in this flow).";
            } else if (error.code === 'auth/credential-already-in-use') {
                msg = "This email is already associated with another account.";
            } else if (error.code === 'auth/weak-password') {
                msg = "Password should be at least 6 characters.";
            } else if (error.code === 'auth/requires-recent-login') {
                msg = "This operation requires a recent login. Please restart the app.";
            } else if (error.code === 'auth/invalid-email') {
                msg = "The email address is invalid. Please check for typos.";
            } else {
                msg = `Error: ${error.message} (${error.code})`;
            }
            Alert.alert("Link Failed", msg);
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Backup Your Data</Text>
            <Text style={styles.subtitle}>Create an account to save your progress permanently.</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLink} disabled={isLinking}>
                {isLinking ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
                <Text style={styles.skipText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#1a1a1a",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 32,
    },
    input: {
        backgroundColor: "#f5f5f5",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    skipButton: {
        padding: 12,
        alignItems: "center",
    },
    skipText: {
        color: "#666",
        fontSize: 16,
    },
});
