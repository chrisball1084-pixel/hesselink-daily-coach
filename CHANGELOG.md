# Changelog

Alle relevanten Änderungen am Hesselink Daily Coach werden hier dokumentiert.

## [1.0.0-beta.2] - 2026-07-29

Beta-Verbesserungen aus dem ersten iPhone-Praxistest.

### Bedienung

- beim erneuten Öffnen oder Zurückkehren wird immer der aktuelle Tag ausgewählt
- kompakte, standardmäßig eingeklappte Trainingskarte hält die Daily Checklist
  im Vordergrund
- Day 1/Day 2, Tagesstatus und Wochenstand bleiben auch eingeklappt sichtbar
- Übungen stehen nach dem Aufklappen direkt beim vorgeschlagenen Workout
- klarer Abschlusstext „Workout Day 1/Day 2 abgeschlossen.“
- Wochenfortschritt ersetzt den missverständlichen Gesamt-Meilenstein in der
  Heute-Ansicht; Personal Records und Gesamtmeilensteine bleiben im Rückblick
- Serien erscheinen auf „Heute“ erst ab drei aufeinanderfolgenden Tagen; ohne
  aktive Serie bleibt die Ansicht frei
- beim Wechsel zwischen Day 1 und Day 2 bleibt die geöffnete Trainingskarte
  offen und zeigt sofort die passenden Übungen

### Gewohnheiten und Daten

- „Protein Shake“ als neunte tägliche, score-relevante
  Performance-Standardgewohnheit ergänzt
- bestehende Installationen erhalten die neue Gewohnheit nur für heute und
  zukünftige Tage der offenen Woche
- vergangene Tage und abgeschlossene Wochen bleiben durch die Migration
  unverändert

### Qualitätssicherung

- 27 automatisierte Logik- und PWA-Tests
- zusätzliche Tests für Tagesrückkehr, Standard-Migration und kompakte
  Trainingskarte

## [1.0.0-beta.1] - 2026-07-29

Erste öffentliche Beta-Version.

### Produkt

- mobile Tages-, Wochen-, Rückblick- und Einstellungsansichten
- acht konfigurierbare Standardgewohnheiten mit dynamischem Score
- unveränderliche Tages- und Wochen-Snapshots
- Wochenziel als Freitext und Wochenfokus aus der aktiven Daily Checklist
- fortlaufende Day-1-/Day-2-Rotation mit anpassbaren Trainingsvorschlägen
- zusätzliche Kraft- und Cardio-Einheiten mit Cardio-Dauer
- Gewohnheitsserien, persönliche Bestwerte und Trainingsmeilensteine
- regelbasierter Wochenrückblick mit Reflexionsfeldern
- lokaler, versionierter JSON-Export und validierter Import

### PWA und Deployment

- Vite-Production-Build mit Basis `/hesselink-daily-coach/`
- Manifest, Icons und Service Worker für die GitHub-Pages-Unteradresse
- dynamisches Pre-Caching der von Vite erzeugten JavaScript- und CSS-Assets
- installierbare Offline-App für unterstützte iPhone- und Android-Browser
- GitHub-Actions-Workflow für Tests, Build und GitHub-Pages-Deployment
- separate Prüfung der fertigen `dist/`-Ausgabe
- `.gitignore` zum Ausschluss lokaler Daten, Backups und PDF-Arbeitsreferenzen

### Qualitätssicherung

- 23 automatisierte Logik- und PWA-Tests
- 2 zusätzliche Prüfungen der Production-Build-Ausgabe
- GitHub-Pages-Routen für App, Manifest, Service Worker und Icons lokal mit
  HTTP-Status 200 geprüft
