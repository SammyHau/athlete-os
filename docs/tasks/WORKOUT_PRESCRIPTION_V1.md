# Workout Prescription V1

## Leistungsprofil

Das lokale `PerformanceProfile` enthält Laufzeiten und Schwellenwerte, FTP und Rad-Herzfrequenz sowie CSS- und optionale Schwimmtestwerte. Metadaten halten Quelle, Ermittlungsdatum, Bestätigung und Veralterung. Automatische Schätzungen sind Vorschläge und werden erst nach Nutzerbestätigung als Zielbasis verwendet.

## Zonen

`src/utils/trainingZones.js` erzeugt zentral Lauf-Pace-, Lauf-Herzfrequenz-, Rad-Leistungs-, Rad-Herzfrequenz-, Schwimm-Pace- und RPE-Zonen. Die Faktoren sind reine Domainlogik ohne UI-Abhängigkeit. Manuelle Overrides bleiben im Profil vorgesehen.

Ohne bestätigte FTP entstehen keine Wattziele. Ohne Schwellenpace oder CSS entstehen keine präzisen Pace-Zonen. Workouts verwenden dann Dauer, RPE oder vorhandene Herzfrequenzbasis und zeigen eine Testempfehlung.

## Strukturierte Schritte

Jeder Schritt besitzt ID, Reihenfolge, Name, Phase, Dauerart und -wert, Zielart und -bereich, Einheit, Wiederholungen, Recovery-Markierung und Anweisung. Unterstützte Phasen sind Warm-up, Belastung, Erholung, Cool-down und frei; Dauerarten sind Zeit, Distanz, Wiederholungen und offen.

Das Trainingsformular kann Schritte hinzufügen, bearbeiten, duplizieren, entfernen sowie per Auf-/Ab-Tasten verschieben. Bestehende einfache Blöcke werden rückwärtskompatibel als freie Schritte normalisiert. Eine kompakte Zielaussage wird nur gezeigt, wenn ein vollständiger Zielbereich vorliegt.

## Grenzen

- AthleteOS ändert keinen Plan autonom.
- Zonen sind Trainingshilfen und keine medizinische Diagnose.
- Intervalltreue benötigt zeitlich passende Streams; ohne sie bleibt die Strukturwertung leer.
- Export zu Garmin- oder Strava-Workouts ist nicht Bestandteil von V1.
