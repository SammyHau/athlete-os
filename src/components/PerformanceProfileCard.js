import { StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "./Card";
import { colors, radius, spacing, typography } from "../theme";

export function PerformanceProfileCard({ performance, suggestions = [] }) {
  if (!performance.profile) return <Card><Text style={styles.hint}>Leistungsprofil wird geladen.</Text></Card>;
  const { profile } = performance;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Leistungsprofil</Text>
      <Text style={styles.hint}>Nur bestätigte manuelle Werte werden für präzise Zielvorgaben verwendet.</Text>
      <View style={styles.grid}>
        <Metric label="5-km-Zeit (s)" value={profile.run.fiveKmSeconds} onChange={(value) => performance.updateMetric("run", "fiveKmSeconds", value)} />
        <Metric label="10-km-Zeit (s)" value={profile.run.tenKmSeconds} onChange={(value) => performance.updateMetric("run", "tenKmSeconds", value)} />
        <Metric label="Halbmarathonzeit (s)" value={profile.run.halfMarathonSeconds} onChange={(value) => performance.updateMetric("run", "halfMarathonSeconds", value)} />
        <Metric label="Schwellenpace (s/km)" value={profile.run.thresholdPaceSecondsPerKm} onChange={(value) => performance.updateMetric("run", "thresholdPaceSecondsPerKm", value)} />
        <Metric label="Lauf-Schwellenpuls" value={profile.run.thresholdHeartRate} onChange={(value) => performance.updateMetric("run", "thresholdHeartRate", value)} />
        <Metric label="Maximalpuls Laufen" value={profile.run.maxHeartRate} onChange={(value) => performance.updateMetric("run", "maxHeartRate", value)} />
        <Metric label="FTP (W)" value={profile.bike.ftpWatts} onChange={(value) => performance.updateMetric("bike", "ftpWatts", value)} />
        <Metric label="Rad-Schwellenpuls" value={profile.bike.thresholdHeartRate} onChange={(value) => performance.updateMetric("bike", "thresholdHeartRate", value)} />
        <Metric label="Maximalpuls Rad" value={profile.bike.maxHeartRate} onChange={(value) => performance.updateMetric("bike", "maxHeartRate", value)} />
        <Metric label="CSS (s/100 m)" value={profile.swim.cssSecondsPer100m} onChange={(value) => performance.updateMetric("swim", "cssSecondsPer100m", value)} />
        <Metric label="400-m-Test (s)" value={profile.swim.test400mSeconds} onChange={(value) => performance.updateMetric("swim", "test400mSeconds", value)} />
        <Metric label="200-m-Test (s)" value={profile.swim.test200mSeconds} onChange={(value) => performance.updateMetric("swim", "test200mSeconds", value)} />
      </View>
      {!profile.bike.ftpWatts ? <Text style={styles.notice}>Für Wattvorgaben fehlt eine bestätigte FTP. Trage einen Wert ein oder führe einen FTP-Test durch.</Text> : null}
      {!profile.run.thresholdPaceSecondsPerKm ? <Text style={styles.notice}>Ohne bestätigte Schwellenpace verwendet AthleteOS zunächst RPE und Herzfrequenz.</Text> : null}
      {suggestions.map((suggestion) => <Text key={`${suggestion.section}.${suggestion.field}`} style={styles.notice}>{suggestion.message}</Text>)}
    </Card>
  );
}

function Metric({ label, value, onChange }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} keyboardType="number-pad" placeholder="Nicht gesetzt" placeholderTextColor={colors.textMuted} defaultValue={value ? String(value) : ""} onEndEditing={(event) => onChange(event.nativeEvent.text)} style={styles.input} /></View>; }

const styles = StyleSheet.create({
  card: { gap: spacing.md }, title: { ...typography.title, color: colors.textPrimary }, hint: { ...typography.caption, color: colors.textSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, field: { width: "47%", flexGrow: 1, minWidth: 130 }, label: { fontSize: 11, lineHeight: 15, marginBottom: spacing.xs, color: colors.textSecondary },
  input: { minHeight: 46, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.textPrimary, backgroundColor: colors.background },
  notice: { ...typography.caption, paddingTop: spacing.sm, color: colors.warning },
});
