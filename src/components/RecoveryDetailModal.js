import Ionicons from "@expo/vector-icons/Ionicons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "../theme";
import { Card } from "./Card";
import { RecoveryFactorRow } from "./RecoveryFactorRow";
import { RecoveryHistory } from "./RecoveryHistory";

const factorLabels = {
  sleep: "Schlaf",
  subjectiveRecovery: "Subjektive Erholung",
  stress: "Stress",
  physicalReadiness: "Körperliche Bereitschaft",
  trainingLoad: "Trainingsbelastung",
};

export function RecoveryDetailModal({ visible, readiness, checkIn, history, onClose, onEdit }) {
  if (!readiness || !checkIn) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>RECOVERY</Text><Text style={styles.title}>Readiness im Detail</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Recovery-Details schließen" onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color={colors.textPrimary} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.scoreRow}><Text style={styles.score}>{readiness.score}</Text><View><Text style={styles.status}>{readiness.status.label}</Text><Text style={styles.caption}>von 100 Punkten</Text></View></View>
          <Text style={styles.recommendation}>{readiness.recommendation}</Text>

          <Card style={styles.factorCard}>
            <Text style={styles.sectionTitle}>Teilbewertungen</Text>
            {Object.entries(readiness.factors).map(([key, value]) => <RecoveryFactorRow key={key} label={factorLabels[key]} value={value} />)}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Heutiger Check-in</Text>
            <DetailRow label="Schlaf" value={`${Math.floor(checkIn.sleepDurationMinutes / 60)} h ${checkIn.sleepDurationMinutes % 60} min`} />
            <DetailRow label="Schlafqualität" value={`${checkIn.sleepQuality} / 5`} />
            <DetailRow label="Muskelkater" value={`${checkIn.soreness} / 5`} />
            <DetailRow label="Stress" value={`${checkIn.stress} / 5`} />
            <DetailRow label="Energie" value={`${checkIn.energy} / 5`} />
            <DetailRow label="Motivation" value={`${checkIn.motivation} / 5`} />
            {checkIn.restingHeartRate ? <DetailRow label="Ruhepuls" value={`${checkIn.restingHeartRate} bpm`} /> : null}
            {checkIn.hrv ? <DetailRow label="HRV" value={`${checkIn.hrv} ms`} /> : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Geschätzte Belastung</Text>
            <DetailRow label="Heute" value={String(readiness.load.today)} />
            <DetailRow label="Letzte 7 Tage" value={String(readiness.load.last7)} />
            <DetailRow label="Vorherige 7 Tage" value={String(readiness.load.previous7)} />
            <DetailRow label="Letzte 28 Tage" value={String(readiness.load.last28)} />
            <DetailRow label="Kurz-/Langzeit-Verhältnis" value={readiness.load.ratio === null ? "Noch keine Basis" : readiness.load.ratio.toFixed(2)} />
          </Card>

          <Card style={styles.card}><Text style={styles.sectionTitle}>Readiness · 7 Tage</Text><RecoveryHistory history={history} /></Card>
          <Text style={styles.explanation}>Der Score kombiniert Schlaf, subjektive Erholung, Stress, körperliche Signale und die geschätzte Trainingsbelastung. Ruhepuls und HRV werden erst mit mindestens sieben persönlichen Vergleichswerten berücksichtigt.</Text>
          <Text style={styles.disclaimer}>Diese Einschätzung unterstützt deine Trainingsplanung und ist keine medizinische Diagnose.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Heutigen Check-in bearbeiten" onPress={onEdit} style={styles.editButton}><Text style={styles.editText}>Check-in bearbeiten</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ label, value }) { return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 76, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, borderBottomWidth: 1, borderColor: colors.border },
  close: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  eyebrow: { ...typography.label, color: colors.textSecondary },
  title: { fontSize: 18, lineHeight: 23, fontWeight: "800", marginTop: spacing.xs, color: colors.textPrimary },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  score: { fontSize: 64, lineHeight: 68, fontWeight: "800", color: colors.textPrimary },
  status: { ...typography.title, color: colors.textPrimary },
  caption: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  recommendation: { ...typography.body, marginTop: spacing.md, color: colors.textSecondary },
  card: { gap: spacing.md, marginTop: spacing.lg },
  factorCard: { gap: spacing.lg, marginTop: spacing.xxl },
  sectionTitle: { ...typography.title, fontSize: 18, lineHeight: 23, color: colors.textPrimary },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  detailLabel: { ...typography.caption, color: colors.textSecondary },
  detailValue: { ...typography.caption, color: colors.textPrimary },
  explanation: { ...typography.body, marginTop: spacing.xl, color: colors.textSecondary },
  disclaimer: { ...typography.caption, marginTop: spacing.lg, color: colors.textMuted },
  editButton: { minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: spacing.xl, borderRadius: radius.pill, backgroundColor: colors.black },
  editText: { ...typography.caption, color: colors.white },
});
