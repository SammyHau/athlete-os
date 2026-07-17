# Recovery Core V1

## Ziel

Ein täglicher manueller Check-in ersetzt statische Recovery-Werte. Readiness und geschätzte Trainingsbelastung werden lokal, transparent und ohne medizinische Aussage berechnet.

## Architektur

- `RecoveryProvider` hält Check-ins, Einstellungen sowie immutable Operationen und persistiert über einen eigenen Service.
- Check-ins und Einstellungen werden zentral validiert; pro ISO-Tag ist höchstens ein Check-in zulässig.
- Reine Recovery-Analytics kombinieren Check-ins mit den Sessions aus dem bestehenden TrainingContext, ohne Trainingsdaten zu kopieren.
- Home, Fortschritt und Profil konsumieren denselben Recovery-Zustand.

## Berechnung

- Readiness: Schlaf 30 %, subjektive Erholung 25 %, Stress 15 %, körperliche Bereitschaft 15 % und Trainingsbelastung 15 %.
- Ruhepuls und HRV beeinflussen die körperliche Teilbewertung erst ab sieben persönlichen Vergleichswerten.
- Belastung ist eine Schätzung aus Dauer, Sportart und Intensität abgeschlossener Einheiten.

## Persistenz

- Eigener versionierter AsyncStorage-Umschlag für Check-ins und Einstellungen.
- Leerer oder beschädigter Storage fällt auf eine leere Historie und ein Schlafziel von 7 h 30 min zurück.
- Die Versionsprüfung bildet den Einstiegspunkt für spätere Migrationen.

## Grenzen

- Keine medizinische Bewertung oder Verletzungsprognose.
- Keine automatische Sensor- oder Cloud-Synchronisation.
- Belastung basiert ohne RPE und Leistungsdaten auf zentralen Schätzwerten.

## Garmin-Erweiterung

Check-ins unterstützen eine Quelle. Später können Garmin-Daten als alternative Quelle normalisiert werden, ohne UI oder Score-Vertrag zu ändern.

## Meilensteine

- [x] Architektur und Datenverträge
- [x] Modell, Storage und Context
- [x] Recovery-Komponenten
- [x] Home, Fortschritt und Profil
- [x] Logiktests und Dokumentation
- [x] Expo- und Bundle-Prüfungen
- [x] Abschließendes Review
