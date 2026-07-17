import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createRecoveryDraft, validateRecoveryDraft } from "../data/recovery";
import { colors, radius, spacing, typography } from "../theme";
import { RatingSelector } from "./RatingSelector";

const ratings = [
  { key: "sleepQuality", label: "Schlafqualität", low: "Schlecht", high: "Sehr gut" },
  { key: "soreness", label: "Muskelkater", low: "Keiner", high: "Stark" },
  { key: "stress", label: "Stress", low: "Niedrig", high: "Hoch" },
  { key: "energy", label: "Energie", low: "Niedrig", high: "Hoch" },
  { key: "motivation", label: "Motivation", low: "Niedrig", high: "Hoch" },
];

export function RecoveryCheckInModal({ visible, checkIn, date, onSave, onClose }) {
  const initial = useMemo(() => checkIn ? toDraft(checkIn) : createRecoveryDraft(date), [checkIn, date]);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      setDraft(initial);
      setErrors({});
    }
  }, [initial, visible]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const hours = Math.floor(Number(draft.sleepDurationMinutes || 0) / 60);
  const minutes = Number(draft.sleepDurationMinutes || 0) % 60;

  function requestClose() {
    if (!dirty) return onClose();
    Alert.alert("Änderungen verwerfen?", "Deine Eingaben wurden noch nicht gespeichert.", [
      { text: "Weiter bearbeiten", style: "cancel" },
      { text: "Verwerfen", style: "destructive", onPress: onClose },
    ]);
  }

  function save() {
    const nextErrors = validateRecoveryDraft(draft);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length && onSave(draft)) onClose();
  }

  function setSleep(part, value) {
    const numeric = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    const nextHours = part === "hours" ? Math.min(24, numeric) : hours;
    const nextMinutes = part === "minutes" ? Math.min(59, numeric) : minutes;
    setDraft((current) => ({ ...current, sleepDurationMinutes: nextHours * 60 + nextMinutes }));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestClose}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Check-in abbrechen" onPress={requestClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>TÄGLICHER CHECK-IN</Text>
              <Text style={styles.title}>{checkIn ? "Check-in bearbeiten" : "Wie geht es dir?"}</Text>
            </View>
            <View style={styles.iconButton} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text style={styles.sectionLabel}>SCHLAFDAUER</Text>
            <View style={styles.sleepRow}>
              <NumberField label="Stunden" value={String(hours)} onChange={(value) => setSleep("hours", value)} />
              <NumberField label="Minuten" value={String(minutes)} onChange={(value) => setSleep("minutes", value)} />
            </View>
            {errors.sleepDurationMinutes ? <Text style={styles.error}>{errors.sleepDurationMinutes}</Text> : null}

            <View style={styles.ratings}>
              {ratings.map((item) => (
                <RatingSelector
                  key={item.key}
                  label={item.label}
                  value={draft[item.key]}
                  lowLabel={item.low}
                  highLabel={item.high}
                  error={errors[item.key]}
                  onChange={(value) => setDraft((current) => ({ ...current, [item.key]: value }))}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>OPTIONALE KÖRPERWERTE</Text>
            <View style={styles.sleepRow}>
              <NumberField label="Ruhepuls" value={String(draft.restingHeartRate ?? "")} onChange={(value) => setDraft((current) => ({ ...current, restingHeartRate: value }))} />
              <NumberField label="HRV in ms" value={String(draft.hrv ?? "")} onChange={(value) => setDraft((current) => ({ ...current, hrv: value }))} />
            </View>
            {errors.restingHeartRate ? <Text style={styles.error}>{errors.restingHeartRate}</Text> : null}
            {errors.hrv ? <Text style={styles.error}>{errors.hrv}</Text> : null}

            <Text style={styles.fieldLabel}>Notiz</Text>
            <TextInput
              accessibilityLabel="Optionale Check-in-Notiz"
              multiline
              value={draft.notes}
              onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
              placeholder="Was beeinflusst deinen Tag?"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.notes]}
            />

            <Pressable accessibilityRole="button" accessibilityLabel="Check-in speichern" onPress={save} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
              <Text style={styles.saveText}>Check-in speichern</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput accessibilityLabel={label} keyboardType="number-pad" value={value} onChangeText={onChange} style={styles.input} />
    </View>
  );
}

function toDraft(checkIn) {
  return { ...checkIn, restingHeartRate: checkIn.restingHeartRate ?? "", hrv: checkIn.hrv ?? "" };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 76, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
  headerText: { flex: 1, alignItems: "center" },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  eyebrow: { ...typography.label, color: colors.textSecondary },
  title: { fontSize: 18, lineHeight: 23, fontWeight: "800", marginTop: spacing.xs, color: colors.textPrimary },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  sectionLabel: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.md, color: colors.textSecondary },
  sleepRow: { flexDirection: "row", gap: spacing.md },
  numberField: { flex: 1, minWidth: 0 },
  fieldLabel: { ...typography.caption, marginBottom: spacing.sm, color: colors.textPrimary },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary },
  notes: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: "top" },
  ratings: { gap: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.lg },
  error: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.danger },
  saveButton: { minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: spacing.xxl, borderRadius: radius.pill, backgroundColor: colors.black },
  saveText: { ...typography.caption, color: colors.white },
  pressed: { opacity: 0.68 },
});
