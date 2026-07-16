const DAY_IN_MS = 86400000;

export const sportMeta = {
  swim: { label: "Schwimmen", icon: "water-outline" },
  bike: { label: "Radfahren", icon: "bicycle-outline" },
  run: { label: "Laufen", icon: "walk-outline" },
  strength: { label: "Kraft", icon: "barbell-outline" },
  mobility: { label: "Mobilität", icon: "body-outline" },
  recovery: { label: "Regeneration", icon: "leaf-outline" },
};

export const statusMeta = {
  planned: { label: "Geplant" },
  completed: { label: "Erledigt" },
  skipped: { label: "Ausgelassen" },
};

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDates(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + distanceToMonday);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      isoDate: toISODate(date),
    };
  });
}

export function getCalendarWeek(date) {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / DAY_IN_MS + 1) / 7);
}

function session(day, data, weekDates) {
  return {
    id: data.id,
    date: weekDates[day].isoDate,
    sport: data.sport,
    title: data.title,
    durationMinutes: data.durationMinutes,
    intensity: data.intensity,
    status: data.status,
    source: data.source,
    description: data.description,
    blocks: data.blocks,
    notes: data.notes,
  };
}

export function createDemoTrainingPlan(referenceDate = new Date()) {
  const weekDates = getWeekDates(referenceDate);

  return [
    session(0, {
      id: "demo-swim-technique",
      sport: "swim",
      title: "Technik & Wasserlage",
      durationMinutes: 50,
      intensity: "Locker",
      status: "completed",
      source: "AthleteOS Demo",
      description: "Ruhige Technikeinheit mit Fokus auf Wasserlage, Zuglänge und kontrollierte Atmung.",
      blocks: [
        { title: "Einschwimmen", detail: "400 m locker" },
        { title: "Technik", detail: "8 × 50 m Drill, 20 s Pause" },
        { title: "Hauptserie", detail: "6 × 200 m GA1, 30 s Pause" },
        { title: "Ausschwimmen", detail: "200 m sehr locker" },
      ],
      notes: "Zugfrequenz ruhig halten und beidseitig atmen.",
    }, weekDates),
    session(0, {
      id: "demo-mobility-monday",
      sport: "mobility",
      title: "Hüfte & Sprunggelenke",
      durationMinutes: 20,
      intensity: "Sehr locker",
      status: "completed",
      source: "AthleteOS Demo",
      description: "Kurze Mobility-Routine zur Vorbereitung auf die Belastungen der Woche.",
      blocks: [
        { title: "Mobilisieren", detail: "Hüftbeuger, Adduktoren, Sprunggelenke" },
        { title: "Aktivieren", detail: "Glute Bridge und kontrollierte Kniebeugen" },
      ],
      notes: "Bewegungen langsam und ohne Druck ausführen.",
    }, weekDates),
    session(1, {
      id: "demo-bike-threshold",
      sport: "bike",
      title: "Schwellenintervalle",
      durationMinutes: 75,
      intensity: "Hoch",
      status: "completed",
      source: "AthleteOS Demo",
      description: "Kontrollierte Intervalle knapp unterhalb der funktionellen Schwellenleistung.",
      blocks: [
        { title: "Einrollen", detail: "15 min locker, 3 kurze Steigerungen" },
        { title: "Hauptserie", detail: "3 × 10 min Sweetspot, 5 min locker" },
        { title: "Ausrollen", detail: "15 min locker" },
      ],
      notes: "Trittfrequenz zwischen 85 und 95 U/min halten.",
    }, weekDates),
    session(2, {
      id: "demo-run-easy",
      sport: "run",
      title: "Lockerer Dauerlauf",
      durationMinutes: 45,
      intensity: "Locker",
      status: "completed",
      source: "AthleteOS Demo",
      description: "Entspannter Grundlagenlauf mit sauberer, ökonomischer Bewegung.",
      blocks: [
        { title: "Einlaufen", detail: "10 min sehr locker" },
        { title: "Dauerlauf", detail: "30 min Zone 2" },
        { title: "Auslaufen", detail: "5 min locker" },
      ],
      notes: "Nur nach Gefühl laufen, Tempo bewusst zurückhalten.",
    }, weekDates),
    session(2, {
      id: "demo-strength-upper-core",
      sport: "strength",
      title: "Oberkörper & Core",
      durationMinutes: 55,
      intensity: "Moderat",
      status: "completed",
      source: "AthleteOS Demo",
      description: "Calisthenics-orientierte Krafteinheit für Zug-, Druck- und Rumpfstabilität.",
      blocks: [
        { title: "Aktivierung", detail: "Scapula Pull-ups, Band Pull-aparts" },
        { title: "Zug", detail: "4 × 6 Pull-ups" },
        { title: "Druck", detail: "4 × 10 Dips oder Push-ups" },
        { title: "Core", detail: "3 Runden Hollow Hold, Side Plank, Dead Bug" },
      ],
      notes: "Zwei Wiederholungen im Tank lassen; Qualität vor Volumen.",
    }, weekDates),
    session(3, {
      id: "demo-swim-endurance",
      sport: "swim",
      title: "Ausdauer im Becken",
      durationMinutes: 60,
      intensity: "Moderat",
      status: "planned",
      source: "AthleteOS Demo",
      description: "Gleichmäßige Ausdauereinheit mit längeren Intervallen und stabilem Rhythmus.",
      blocks: [
        { title: "Einschwimmen", detail: "500 m gemischt" },
        { title: "Vorbereitung", detail: "6 × 50 m progressiv" },
        { title: "Hauptserie", detail: "4 × 400 m GA1, 45 s Pause" },
        { title: "Ausschwimmen", detail: "300 m locker" },
      ],
      notes: "Die letzten 100 m jedes Intervalls technisch sauber halten.",
    }, weekDates),
    session(4, {
      id: "demo-recovery-friday",
      sport: "recovery",
      title: "Aktive Regeneration",
      durationMinutes: 30,
      intensity: "Sehr locker",
      status: "planned",
      source: "AthleteOS Demo",
      description: "Bewusste Entlastung mit leichter Bewegung und ruhiger Atmung.",
      blocks: [
        { title: "Spaziergang", detail: "20 min entspannt" },
        { title: "Atmung", detail: "10 min ruhig und nasal" },
      ],
      notes: "Optional komplett pausieren, wenn Müdigkeit erhöht ist.",
    }, weekDates),
    session(5, {
      id: "demo-bike-long",
      sport: "bike",
      title: "Lange Grundlagenfahrt",
      durationMinutes: 150,
      intensity: "Moderat",
      status: "planned",
      source: "AthleteOS Demo",
      description: "Ruhige Ausdauerfahrt mit kurzen Abschnitten im geplanten Renntempo.",
      blocks: [
        { title: "Einrollen", detail: "20 min locker" },
        { title: "Grundlage", detail: "90 min Zone 2" },
        { title: "Renntempo", detail: "3 × 8 min, 4 min locker" },
        { title: "Ausrollen", detail: "15 min locker" },
      ],
      notes: "60 bis 80 g Kohlenhydrate pro Stunde einplanen.",
    }, weekDates),
    session(5, {
      id: "demo-brick-run",
      sport: "run",
      title: "Kurzer Koppellauf",
      durationMinutes: 25,
      intensity: "Moderat",
      status: "planned",
      source: "AthleteOS Demo",
      description: "Direkter Lauf nach dem Radtraining für einen kontrollierten Wechselreiz.",
      blocks: [
        { title: "Anlaufen", detail: "10 min locker" },
        { title: "Renntempo", detail: "10 min zügig und kontrolliert" },
        { title: "Auslaufen", detail: "5 min locker" },
      ],
      notes: "Kurze Schritte und hohe Frequenz in den ersten Minuten.",
    }, weekDates),
    session(6, {
      id: "demo-strength-full-body",
      sport: "strength",
      title: "Ganzkörper & Stabilität",
      durationMinutes: 60,
      intensity: "Moderat",
      status: "planned",
      source: "AthleteOS Demo",
      description: "Funktionelle Ganzkörpereinheit als Ergänzung zum Ausdauertraining.",
      blocks: [
        { title: "Warm-up", detail: "10 min dynamische Mobilität" },
        { title: "Beine", detail: "3 × 8 Split Squats und Romanian Deadlifts" },
        { title: "Oberkörper", detail: "3 × 8 Rows und Push-ups" },
        { title: "Core", detail: "3 × Farmer Carry und Pallof Press" },
      ],
      notes: "Keine Sätze bis zum Muskelversagen.",
    }, weekDates),
  ];
}
