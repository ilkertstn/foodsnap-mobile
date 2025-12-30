import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useMeals } from "../context/MealContext";

type AddExerciseModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (exercise: { type: string; durationMinutes: number; caloriesBurned: number }) => void;
};



const EXERCISE_DATA = [
    { id: "walking_brisk", met: 3.8 },
    { id: "running_jog", met: 7.0 },
    { id: "running_fast", met: 11.0 },
    { id: "cycling_leisure", met: 4.0 },
    { id: "cycling_vigorous", met: 8.0 },
    { id: "swimming", met: 6.0 },
    { id: "weight_lifting", met: 3.5 },
    { id: "yoga", met: 2.5 },
    { id: "hiit", met: 8.0 },
];

export default function AddExerciseModal({ visible, onClose, onAdd }: AddExerciseModalProps) {
    const { profile } = useMeals();
    const [duration, setDuration] = useState("");
    const [calories, setCalories] = useState("");
    const { t } = useLanguage();


    const [manual, setManual] = useState(false);
    const [selectedId, setSelectedId] = useState(EXERCISE_DATA[0].id);
    const [customName, setCustomName] = useState("");

    useEffect(() => {
        if (!manual) {
            const weight = profile.weightKg || 70;
            const hours = (parseInt(duration) || 0) / 60;
            const exercise = EXERCISE_DATA.find(e => e.id === selectedId);
            const met = exercise?.met || 4;

            if (hours > 0) {
                const burned = Math.round(met * weight * hours);
                setCalories(burned.toString());
            } else {
                setCalories("");
            }
        }
    }, [duration, selectedId, manual, profile.weightKg]);

    const handleAdd = () => {
        if (!duration || !calories) return;

        const exerciseName = manual ? (customName || "Exercise") : t(`exercises.${selectedId}`);

        onAdd({
            type: exerciseName,
            durationMinutes: Number(duration),
            caloriesBurned: Number(calories),
        });
        setDuration("");
        setCalories("");
        setCustomName("");

        onClose();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t("add_exercise.title")}</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close-circle" size={24} color="#94a3b8" />
                        </Pressable>
                    </View>


                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t("add_exercise.exercise_name")}</Text>
                        {!manual ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                                {EXERCISE_DATA.map((ex) => (
                                    <Pressable
                                        key={ex.id}
                                        style={[styles.chip, selectedId === ex.id && styles.chipActive]}
                                        onPress={() => setSelectedId(ex.id)}
                                    >
                                        <Text style={[styles.chipText, selectedId === ex.id && styles.chipTextActive]}>
                                            {t(`exercises.${ex.id}`)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        ) : (
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Running, Yoga"
                                value={customName}
                                onChangeText={setCustomName}
                            />
                        )}
                        <Pressable onPress={() => {
                            setManual(!manual);
                            if (!manual) setCustomName("");
                            else setSelectedId(EXERCISE_DATA[0].id);
                            setCalories("");
                        }}>
                            <Text style={styles.switchModeText}>
                                {manual ? t("add_exercise.switch_to_auto") : t("add_exercise.switch_to_manual")}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t("add_exercise.duration")}</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t("add_exercise.calories_burned")}</Text>
                        <TextInput
                            style={styles.input}
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="150"
                            keyboardType="numeric"
                            editable={manual}
                        />
                        {!manual && duration && (
                            <Text style={styles.helperText}>{t("add_exercise.calories_helper")}</Text>
                        )}
                    </View>

                    <Pressable style={styles.addButton} onPress={handleAdd}>
                        <Text style={styles.addButtonText}>{t("add_exercise.add_activity")}</Text>
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
