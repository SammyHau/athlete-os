# AthleteOS Connected Core V1

## Ziel

Home, Training, Plan und Progress verwenden eine gemeinsame, lokal persistente Trainingsquelle. Änderungen werden ohne erneutes Laden sofort in allen Tabs sichtbar.

## Analysierter Ist-Zustand

- Training Planner V2 besitzt vollständiges lokales CRUD und versioniertes AsyncStorage.
- `useTrainingPlan` wird bisher direkt im TrainingScreen instanziert.
- Home verwendet statische Trainings-Mockdaten.
- Plan und Progress sind Platzhalter.
- Bottom Tabs sind vorhanden, verarbeiten aber noch keine tabübergreifenden Datums- oder Session-Anfragen.
- Der Arbeitsbaum war zu Beginn sauber.

## Geplante Architektur

- `TrainingProvider` instanziert `useTrainingPlan` genau einmal oberhalb der Navigation.
- `useTraining` stellt Sessions, CRUD, Laden, Fehler, Reload und Reset bereit.
- Reine Selektoren und Analytics aggregieren Tages-, Wochen- und Zeitraumdaten.
- Navigationsanfragen enthalten Datum, optionale Session-ID und eine eindeutige Request-ID.
- Screens enthalten nur lokalen Ansichtsstate wie Filter, Zeitraum oder aufgeklappte Woche.

## Risiken

- Navigation in denselben Tab darf alte Parameter nicht erneut ausführen.
- Lokale Datumswerte dürfen nicht über UTC in den Vortag verschoben werden.
- Leere Wochen und Zeiträume dürfen keine NaN- oder irreführenden Werte erzeugen.
- Context-Updates sollen keine zweite Storage-Instanz auslösen.
- Informationsdichte muss auf kleinen Smartphones kontrolliert bleiben.

## Validierungsplan

- Dependency-freie Assertions für Selektoren, Analytics, Datumsgrenzen und Navigation.
- Bestehende CRUD-/Storage-Prüfungen weiterführen.
- Imports, UTF-8, `git diff --check`, `npm ls`, Expo Doctor und Android-Produktionsbundle prüfen.
- Vollständigen Diff nach jedem größeren Integrationsschritt und abschließend reviewen.

## Meilensteine

- [x] 1. Repository- und Architekturprüfung
- [x] 2. App-weite Trainingszustandsarchitektur
- [x] 3. Home-Integration
- [x] 4. Plan-Integration
- [x] 5. Progress-Integration
- [x] 6. Tab-übergreifende Navigation
- [x] 7. Fehler-, Lade- und Leerzustände
- [x] 8. Logiktests
- [x] 9. Bundle- und Qualitätsprüfungen
- [x] 10. Abschließendes Code-Review
