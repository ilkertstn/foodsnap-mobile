import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMeals } from "../context/MealContext";

type AddExerciseModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (exercise: { type: string; durationMinutes: number; caloriesBurned: number }) => void;
};



const EXERCISES = [
    { name: "Walking (Brisk)", met: 3.8 },
    { name: "Running (Jog)", met: 7.0 },
    { name: "Running (Fast)", met: 11.0 },
    { name: "Cycling (Leisure)", met: 4.0 },
    { name: "Cycling (Vigorous)", met: 8.0 },
    { name: "Swimming", met: 6.0 },
    { name: "Weight Lifting", met: 3.5 },
    { name: "Yoga", met: 2.5 },
    { name: "HIIT", met: 8.0 },
];

export default function AddExerciseModal({ visible, onClose, onAdd }: AddExerciseModalProps) {
    const { profile } = useMeals();
    const [duration, setDuration] = useState("");
    const [calories, setCalories] = useState("");


    const [manual, setManual] = useState(false);
    const [name, setName] = useState(EXERCISES[0].name);



    useEffect(() => {
        if (!manual) {
            const weight = profile.weightKg || 70;
            const hours = (parseInt(duration) || 0) / 60;
            const met = EXERCISES.find(e => e.name === name)?.met || 4;

            if (hours > 0) {
                const burned = Math.round(met * weight * hours);
                setCalories(burned.toString());
            } else {
                setCalories("");
            }
        }
    }, [duration, name, manual, profile.weightKg]);




    const handleAdd = () => {
        if (!duration || !calories) return;
        onAdd({
            type: manual ? (name || "Exercise") : name,
            durationMinutes: Number(duration),
            caloriesBurned: Number(calories),
        });
        setDuration("");
        setCalories("");

        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Exercise</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close-circle" size={24} color="#94a3b8" />
                        </Pressable>
                    </View>


                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Exercise Name</Text>
                        {!manual ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                                {EXERCISES.map((ex) => (
                                    <Pressable
                                        key={ex.name}
                                        style={[styles.chip, name === ex.name && styles.chipActive]}
                                        onPress={() => setName(ex.name)}
                                    >
                                        <Text style={[styles.chipText, name === ex.name && styles.chipTextActive]}>
                                            {ex.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        ) : (
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Running, Yoga"
                                value={name}
                                onChangeText={setName}
                            />
                        )}
                        <Pressable onPress={() => {
                            setManual(!manual);
                            if (!manual) setName("");
                            else setName(EXERCISES[0].name);
                            setCalories("");
                        }}>
                            <Text style={styles.switchModeText}>
                                {manual ? "Switch to Auto-Calculate" : "Switch to Manual Input (Custom)"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Duration (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Calories Burned (kcal)</Text>
                        <TextInput
                            style={styles.input}
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="150"
                            keyboardType="numeric"
                            editable={manual}
                        />
                        {!manual && duration && (
                            <Text style={styles.helperText}>Calculated based on your weight ({profile.weightKg}kg)</Text>
                        )}
                    </View>

                    <Pressable style={styles.addButton} onPress={handleAdd}>
                        <Text style={styles.addButtonText}>Add Activity</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
    },
    inputContainer: {
        marginBottom: 16,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    input: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#1e293b",
    },
    chipContainer: {
        marginBottom: 12,
        height: 50,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        marginRight: 8,
        height: 36,
        justifyContent: "center",
    },
    chipActive: {
        backgroundColor: "#3b82f6",
    },
    chipText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    chipTextActive: {
        color: "white",
    },
    helperText: {
        fontSize: 12,
        color: "#94a3b8",
    },
    switchModeText: {
        fontSize: 14,
        color: "#3b82f6",
        fontWeight: "600",
        marginTop: 4,
    },
    addButton: {
        backgroundColor: "#3b82f6",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 8,
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});
