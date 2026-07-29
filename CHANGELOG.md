# Changelog

Alle relevanten Änderungen am Hesselink Daily Coach werden hier dokumentiert.

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
