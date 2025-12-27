import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMeals } from "../context/MealContext";

type AddExerciseModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (exercise: { type: string; durationMinutes: number; caloriesBurned: number }) => void;
};

const EXERCISE_TYPES = [
    { label: "Walking", met: 3.5, icon: "walk" },
    { label: "Running", met: 8.0, icon: "footsteps" },
    { label: "Cycling", met: 6.0, icon: "bicycle" },
    { label: "Custom", met: 0, icon: "barbell" },
];

export default function AddExerciseModal({ visible, onClose, onAdd }: AddExerciseModalProps) {
    const { profile } = useMeals();
    const [selectedType, setSelectedType] = useState(EXERCISE_TYPES[0]);
    const [duration, setDuration] = useState("");
    const [calories, setCalories] = useState("");

    const calculateCalories = (minutes: number, type: typeof EXERCISE_TYPES[0]) => {
        if (type.label === "Custom" || !minutes) return;
        // Formula: MET * Weight(kg) * (Duration/60)
        const burned = Math.round(type.met * profile.weightKg * (minutes / 60));
        setCalories(String(burned));
    };

    const handleDurationChange = (text: string) => {
        setDuration(text);
        calculateCalories(Number(text), selectedType);
    };

    const handleTypeSelect = (type: typeof EXERCISE_TYPES[0]) => {
        setSelectedType(type);
        if (duration) {
            if (type.label === "Custom") {
                setCalories(""); // Clear for custom
            } else {
                calculateCalories(Number(duration), type);
            }
        }
    };

    const handleAdd = () => {
        if (!duration || !calories) return;
        onAdd({
            type: selectedType.label,
            durationMinutes: Number(duration),
            caloriesBurned: Number(calories),
        });
        // Reset
        setDuration("");
        setCalories("");
        setSelectedType(EXERCISE_TYPES[0]);
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

                    <View style={styles.typesGrid}>
                        {EXERCISE_TYPES.map((type) => (
                            <Pressable
                                key={type.label}
                                style={[
                                    styles.typeButton,
                                    selectedType.label === type.label && styles.typeButtonSelected
                                ]}
                                onPress={() => handleTypeSelect(type)}
                            >
                                <Ionicons
                                    name={type.icon as any}
                                    size={24}
                                    color={selectedType.label === type.label ? "white" : "#64748b"}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    selectedType.label === type.label && styles.typeLabelSelected
                                ]}>
                                    {type.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Duration (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={handleDurationChange}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Calories Burned (kcal)</Text>
                        <TextInput
                            style={styles.input}
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="150"
                            keyboardType="numeric"
                            editable={selectedType.label === "Custom"} // Auto-calc implies read-only for presets, but user might want to override? Let's make it editable always actually, but maybe grayed out hint.
                        />
                        {selectedType.label !== "Custom" && (
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
    typesGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
        justifyContent: "space-between",
    },
    typeButton: {
        flex: 1,
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#f1f5f9",
        gap: 8,
    },
    typeButtonSelected: {
        backgroundColor: "#3b82f6",
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
    },
    typeLabelSelected: {
        color: "white",
    },
    inputContainer: {
        marginBottom: 16,
        gap: 8,
    },
    inputLabel: {
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
    helperText: {
        fontSize: 12,
        color: "#94a3b8",
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
