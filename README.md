# Hesselink Daily Coach

Mobile-first Progressive Web App für Gewohnheiten, Training, Wochenplanung und
regelbasierte Rückblicke.

## Release

- Produktname: Hesselink Daily Coach v1.0 Beta
- technische Version: `v1.0.0-beta.1`
- geplanter Repository-Name: `hesselink-daily-coach`
- geplante URL:
  `https://BENUTZERNAME.github.io/hesselink-daily-coach/`

Die Veröffentlichung auf GitHub Pages erfolgt erst nach ausdrücklicher
Freigabe. Der Production-Build und der Deployment-Workflow sind vorbereitet.

## Datenschutz und technische Leitplanken

- keine Anmeldung und kein Backend
- alle Nutzerdaten ausschließlich im lokalen Browser-Speicher
- kein Tracking, keine Analyse- und keine externen Datendienste
- lokaler JSON-Export und validierter Import
- offlinefähig und als PWA installierbar
- Vite-Build ohne Frontend-Framework
- GitHub-Pages-Basis: `/hesselink-daily-coach/`

Browserdaten sind an die jeweilige Adresse gebunden. Daten der lokalen
Entwicklungsadresse werden daher nicht automatisch auf die öffentliche
GitHub-Pages-Adresse übertragen. Vor dem Wechsel sollte in der lokalen App ein
JSON-Backup exportiert und anschließend in der öffentlichen App importiert
werden.

## Funktionen

- acht tägliche Standardgewohnheiten mit persönlichen Beschreibungen
- Tageskorrektur innerhalb der aktuellen Woche
- dynamischer Tages- und Wochenscore
- unveränderliche historische Tages- und Wochen-Snapshots
- frei konfigurierbare Gewohnheiten
- fortlaufende Day-1-/Day-2-Trainingsrotation
- automatische und manuell anpassbare Workout-Vorschläge
- Cardio mit Aktivität und Dauer
- Gewohnheitsserien, persönliche Bestwerte und Trainingsmeilensteine
- Wochenstart, mobile Wochenübersicht und regelbasierter Rückblick
- lokaler JSON-Export und validierter Import
- installierbare PWA mit Offline-App-Shell

## Voraussetzungen

- Node.js 22.12 oder neuer
- pnpm 11.9

## Lokale Entwicklung

```powershell
pnpm install
pnpm dev
```

Vite zeigt anschließend die lokale Adresse an. Wegen der konfigurierten
GitHub-Pages-Basis liegt die App unter:

`http://localhost:5173/hesselink-daily-coach/`

## Tests und Production-Build

```powershell
pnpm test
pnpm build
pnpm test:dist
```

Der fertige statische Build befindet sich in `dist/`. Zur lokalen Kontrolle:

```powershell
pnpm preview
```

Danach ist der Preview-Build unter
`http://127.0.0.1:4173/hesselink-daily-coach/` erreichbar.

## GitHub Pages

Der Workflow `.github/workflows/deploy.yml` wird bei jedem Push auf `main`
ausgeführt:

1. Abhängigkeiten mit unverändertem Lockfile installieren
2. Logik- und PWA-Tests ausführen
3. Production-Build erstellen
4. `dist/` separat prüfen
5. `dist/` als GitHub-Pages-Artefakt veröffentlichen

In GitHub muss unter **Settings → Pages → Build and deployment** als Quelle
**GitHub Actions** gewählt werden.

## Nicht im öffentlichen Repository

Die `.gitignore` schließt insbesondere folgende lokale Inhalte aus:

- `node_modules/` und `dist/`
- `.env`-Dateien und lokale Konfiguration
- JSON-Backups und Exportordner
- die beiden lokalen PDF-Arbeitsreferenzen
- Editor-, Betriebssystem- und Logdateien

## Dokumentation

- `SPEC.md`: verbindliche Produkt- und Datenlogik
- `TASKS.md`: Umsetzungs- und Prüfplan
- `CHANGELOG.md`: Release-Historie

## Bekannte Einschränkungen

- keine geräteübergreifende Synchronisierung
- bei Browserdaten-Löschung gehen Daten ohne vorheriges JSON-Backup verloren
- Installation und Offline-Neustart müssen zusätzlich auf einem echten iPhone
  geprüft werden
- GitHub Pages benötigt HTTPS und einen erfolgreichen ersten Seitenaufruf,
  bevor die Offline-Nutzung zuverlässig verfügbar ist
