# Hesselink Daily Coach - Produktspezifikation

Status: Verbindlich für Version 1.0 Beta  
Stand: 29. Juli 2026

## 1. Produktziel

Hesselink Daily Coach ist eine mobile-first Progressive Web App für einen einzelnen
Beta-Nutzer. Sie ergänzt die physische „Hesselink Daily Checklist“ um tägliche
Interaktion, lokale Auswertungen, Trainingsrotation und Wochenrückblicke.

Die App optimiert auf konsequente Umsetzung statt maximale Anzahl von Aufgaben.
Sie funktioniert ohne Konto, Backend, Tracking oder externe Datenübertragung.

## 2. Technischer Rahmen

- Statische App aus HTML, CSS und modernem JavaScript ohne Build-Schritt.
- Installierbare PWA für iPhone und Android.
- Offlinefähig nach dem ersten erfolgreichen Laden.
- Relative Pfade für GitHub-Pages-Projekt-URLs.
- Sämtliche Nutzerdaten liegen ausschließlich im `localStorage` des Geräts.
- Import und Export erfolgen als versionierte JSON-Datei.
- Keine externen Schriften, Bibliotheken, APIs, Analyse- oder Trackingdienste.
- Datenformat Version 1; unbekannte neuere Datenversionen werden nicht importiert.

## 3. Informationsarchitektur

Die Hauptnavigation besteht aus vier Bereichen:

1. Heute
2. Woche
3. Rückblick
4. Einstellungen

Beim App-Start wird immer „Heute“ geöffnet. Die Navigation ist auf kleinen
Displays dauerhaft erreichbar und besitzt ausreichend große Touchflächen.

## 4. Visuelle Leitidee

Die Gestaltung übernimmt die Identität der Druckvorlage, nicht deren
Tabellenlayout:

- dunkles Navy und Schwarz als Basis,
- Weiß für starke Kontraste,
- Cyan als funktionaler Akzent,
- kondensierte, kräftige Systemtypografie,
- technische Linien, ruhige Flächen und klare Hierarchie,
- keine Cartoon-Elemente und keine übertriebene Gamification.

Die Kategorien Foundation, Performance und Discipline bleiben als inhaltliche
Struktur erhalten.

## 5. Standardgewohnheiten

### Foundation

- Morning Routine erledigt
- High-Protein-Frühstück

Persönliche Standardbeschreibungen:

- Morning Routine: „Longevity Mix“
- High-Protein-Frühstück: „min. 25g“

### Performance

- 20 Minuten Bewegung oder mindestens 7.000 Schritte
- Supplements
- Protein Shake

Persönliche Standardbeschreibung Supplements:
„Magnesium, Kreatin, Omega3, B-Komplex“

### Discipline

- 2-3 Liter Wasser
- Proteinziel erreicht
- No Bullshit
- 3-2-1-Abendroutine erledigt

Persönliche Standardbeschreibungen:

- Proteinziel: „1.5g pro kg Körpergewicht“
- 3-2-1-Abendroutine: „3h vor Bett keine Mahlzeit, 1h vor Bett kein Handy“

Alle neun Gewohnheiten sind standardmäßig täglich aktiv und score-relevant.

## 6. Gewohnheitszustände und Bedienung

Eine Gewohnheit besitzt pro aktivem Tag zwei Zustände:

- offen
- erledigt

Ein Tap schaltet zwischen beiden Zuständen um. Die Änderung wird unmittelbar
lokal gespeichert. Erfolgreiches Abhaken erhält eine dezente visuelle Animation
und - sofern unterstützt und vom Nutzer aktiviert - ein kurzes Vibrationssignal.

Die Heute-Ansicht bietet eine Tagesauswahl für Montag bis Sonntag der aktuellen
Woche. Dadurch können vergangene Tage der laufenden Woche korrigiert werden.
Zukünftige Tage sind sichtbar, aber noch nicht abhakbar.

## 7. Konfiguration und historische Stabilität

Gewohnheiten besitzen:

- stabile ID,
- Name,
- optionale persönliche Beschreibung,
- Kategorie: Foundation, Performance oder Discipline,
- aktiv/inaktiv,
- Reihenfolge,
- aktive Wochentage,
- score-relevant ja/nein.

Hesselink kann Gewohnheiten umbenennen, beschreiben, hinzufügen, deaktivieren,
reaktivieren, sortieren, kategorisieren und hinsichtlich Wochentagen und Score
anpassen.

Jede Woche besitzt für jeden Kalendertag einen eigenen Plan-Snapshot. Änderungen
an Gewohnheiten aktualisieren nur den heutigen und zukünftige Tage der laufenden
Woche sowie kommende Wochen. Bereits vergangene Tage und abgeschlossene Wochen
bleiben unverändert. Dadurch bleiben historische Namen, Kategorien,
Score-Relevanz und Maximalwerte stabil.

Ab mehr als zehn aktuell aktiven Gewohnheiten erscheint ein freundlicher
Fokushinweis. Weitere Gewohnheiten bleiben möglich.

## 8. Score-Logik

- Eine erledigte, score-relevante Gewohnheit ergibt genau einen Punkt.
- Nicht score-relevante Gewohnheiten werden angezeigt, zählen aber nicht.
- Training zählt nie in den Daily Score.
- Der mögliche Tageswert entspricht allen score-relevanten Gewohnheiten, die
  laut Tages-Snapshot an diesem Wochentag aktiv sind.
- Der mögliche Wochenwert ist die Summe der möglichen Tageswerte von Montag bis
  Sonntag.
- Angezeigt werden stets erreichte Punkte, mögliche Punkte und Prozentwert.
- Bei null möglichen Punkten beträgt der Prozentwert 0.
- Gerundet wird auf ganze Prozentwerte.

## 9. Trainingslogik

Standard-Trainingstage sind Montag, Mittwoch und Freitag. Diese Auswahl ist
global anpassbar und wird beim Wochenstart bestätigt oder überschrieben.

Es existieren zwei Workouts:

### Day 1

1. Beinpresse - 10 bis 15 Wiederholungen
2. Brust Maschine - 8 bis 12 Wiederholungen
3. Latzug weiter Griff - 8 bis 12 Wiederholungen
4. Bizeps Curl Maschine - 10 bis 12 Wiederholungen
5. Trizeps Push am Seilzug - 10 bis 12 Wiederholungen

### Day 2

1. Squats - 10 bis 15 Wiederholungen
2. Butterfly - 8 bis 12 Wiederholungen
3. Rudern am Kabel - 8 bis 12 Wiederholungen
4. Beinheben für den Bauch
5. Hyperextensions für den Core

Das nächste Workout wird aus dem zuletzt tatsächlich abgeschlossenen Workout
abgeleitet:

- kein abgeschlossenes Workout: Day 1,
- zuletzt Day 1: als Nächstes Day 2,
- zuletzt Day 2: als Nächstes Day 1.

Ein versäumtes, verschobenes oder als „heute kein Training“ markiertes Training
ändert die Rotation nicht. Ein abgeschlossenes zusätzliches Training ändert die
Rotation genauso wie ein geplantes. Eine manuelle Korrektur in den Einstellungen
überschreibt genau das nächste Workout; nach dessen Abschluss läuft die Rotation
normal weiter.

Für die Wochenplanung erhält jeder geplante Trainingstag zusätzlich einen
konkreten Vorschlag. Ausgehend vom nächsten tatsächlich anstehenden Workout
wechselt die Vorschlagsfolge automatisch:

- Montag Day 1
- Mittwoch Day 2
- Freitag Day 1

Wird Day 1 tatsächlich abgeschlossen, bleibt Day 2 der nächste Vorschlag. Wird
Day 1 ausgelassen, schaltet die tatsächliche Rotation nicht weiter und die noch
offenen Vorschläge werden ab dem nächsten Trainingstag neu aufgebaut. Dadurch
bleibt dort Day 1 an der Reihe.

Jeder geplante Trainingstag kann unabhängig davon manuell auf Day 1 oder Day 2
gestellt werden. Diese Tagesauswahl bleibt gespeichert und dient beim Abschluss
als tatsächlich absolviertes Workout. Nach diesem Abschluss wird die weitere
Vorschlagsfolge passend fortgesetzt. Über „Automatischen Vorschlag verwenden“
kann der Tag jederzeit wieder in die dynamische Folge zurückgeführt werden.

Auf geplanten Trainingstagen erscheint eine hervorgehobene, standardmäßig
eingeklappte Trainingskarte. Eingeklappt zeigt sie das nächste Workout,
Tagesstatus und den Wochenstand der geplanten Krafttrainings. Nach dem Aufklappen
bietet sie:

- Workout abschließen bzw. Abschluss rückgängig machen,
- Training auf einen anderen Tag derselben Woche verschieben,
- heute kein Training,
- Übungen direkt beim vorgeschlagenen Day-1-/Day-2-Workout,
- Workout-Auswahl und Trainingsaktionen.

Auf ungeplanten Tagen kann eine zusätzliche Einheit abgeschlossen werden.
Gewichte, Sätze und einzelne Wiederholungen werden in Version 1.0 nicht erfasst.

### Cardio- und Zusatztraining

Cardio kann an jedem bearbeitbaren Tag zusätzlich erfasst werden. Der Nutzer
wählt „Cardio-Training“ und hinterlegt einen kurzen Aktivitätsnamen sowie die
Dauer. Fahrradfahren, Schwimmen und Laufen stehen als Schnellauswahl bereit; ein
eigener Name mit maximal 60 Zeichen ist möglich.

Für die Dauer gibt es touchfreundliche Schnelloptionen mit 30, 40, 45 und 60
Minuten. Zusätzlich kann die Dauer in 5-Minuten-Schritten zwischen 10 und 120
Minuten gewählt werden. Gespeichert wird die Dauer als ganze Minutenzahl.

Eine Cardio-Einheit:

- kann am selben Tag neben einem Day-1-/Day-2-Workout bestehen,
- wird separat als abgeschlossene Einheit angezeigt,
- kann wieder entfernt werden,
- verändert die Day-1-/Day-2-Rotation nicht,
- zählt nicht in den Daily Score.

Ein zusätzliches Day-1-/Day-2-Krafttraining bleibt als eigene Option möglich und
schaltet die Rotation wie jedes tatsächlich abgeschlossene Krafttraining weiter.

## 10. Wochenstart

Eine Woche beginnt montags. Beim ersten Öffnen einer noch nicht vorhandenen
Woche wird ein Wochenstart-Dialog angeboten mit:

- persönlichem Wochenziel,
- Ziel-Prozentwert,
- Fokus der Woche als Auswahl aus den aktuell aktiven Gewohnheiten der Daily
  Checklist,
- geplanten Trainingstagen.

Vorgabewerte können direkt übernommen werden. Der Dialog kann später in der
Wochenansicht erneut geöffnet werden, solange die Woche nicht abgeschlossen ist.
Das persönliche Wochenziel bleibt frei formulierbar. Für den Wochenfokus werden
Gewohnheits-ID und damaliger Name als Snapshot gespeichert, damit spätere
Umbenennungen historische Wochen nicht verändern.

Beim ersten Öffnen einer neuen Woche werden ältere offene Wochen abgeschlossen.
Abgeschlossene Wochen sind in ihrer Konfiguration unveränderlich; nur die
optionalen Reflexionsfelder bleiben editierbar.

## 11. Wochenansicht

Die Wochenansicht zeigt:

- Montag bis Sonntag als touchfreundliche Karten,
- Status der jeweiligen Gewohnheiten,
- Tagespunkte,
- Wochenpunkte und Prozentwert,
- geplante und abgeschlossene Trainingseinheiten,
- Wochenziel und Wochenfokus.

Auf Smartphones wird keine Desktop-Tabelle vorausgesetzt. Ein Tap auf einen
Tag wechselt zur Heute-Ansicht dieses Tages.

## 12. Wochenrückblick

Für jede abgeschlossene Woche wird regelbasiert berechnet:

- erreichte und mögliche Punkte,
- Prozentwert,
- absolvierte und geplante Workouts,
- stärkste Gewohnheit nach Erfüllungsquote,
- schwächste Gewohnheit nach Erfüllungsquote,
- Differenz zur Vorwoche in Prozentpunkten,
- Kennzeichnung als bisher beste Woche,
- genau eine Empfehlung für die nächste Woche.

Bei Gleichstand werden Gewohnheiten in Planreihenfolge ausgewählt. Gewohnheiten
ohne möglichen Termin in der Woche werden nicht bewertet.

Die Empfehlung basiert auf der schwächsten Gewohnheit. Sie nennt die erreichten
Tage, die möglichen Tage und ein realistisches nächstes Ziel. Bei einer perfekten
Woche empfiehlt sie, das System stabil zu halten statt neue Aufgaben zu ergänzen.

Optionale Reflexionsfelder:

- Was lief gut?
- Was war schwierig?
- Worauf möchtest du dich nächste Woche konzentrieren?

## 13. Tonalität

Die Texte sind direkt, motivierend und erwachsen. Sie vermeiden Belehrung und
übertriebene Belohnungsmechaniken. Leitidee: „Konstanz schlägt Perfektion.“

## 13a. Serien, Rekorde und Meilensteine

Fortschritt wird aus den bereits lokal gespeicherten Check-ins und
Trainingseinheiten abgeleitet. Es wird kein separates Tracking benötigt.

### Gewohnheitsserien

- Eine Serie zählt aufeinanderfolgende aktive Termine einer Gewohnheit.
- Ein noch nicht abgeschlossener heutiger Tag beendet die Serie nicht vorzeitig.
- Ein verpasster vergangener aktiver Termin setzt die aktuelle Serie zurück.
- Der höchste bisherige Wert bleibt als persönlicher Bestwert erhalten.
- Ab drei aufeinanderfolgenden Treffern wird die Serie sichtbar.
- Erreicht die aktuelle Serie den bisherigen Bestwert, erscheint „Personal
  Record“.

### Trainingsmeilensteine

Abgeschlossene Day-1-/Day-2-Einheiten werden über alle Wochen gezählt. Sichtbare
Meilensteine sind 5, 10, 15, 25, 50, 75 und 100 Krafttrainings. Danach folgen
weitere Schritte in 25er-Abständen. Cardio-Einheiten und Cardio-Minuten werden
separat summiert.

### Darstellung

Die Heute-Ansicht zeigt ab drei aufeinanderfolgenden Treffern die stärkste
aktuelle Serie und weitere aktive Serien kompakt. Ohne aktive Serie wird kein
Platzhalter angezeigt. Persönliche Bestwerte, die Gesamtzahl der Krafttrainings und der
Fortschritt zum nächsten Trainingsmeilenstein erscheinen im Wochenrückblick mit
dem Stand am Ende der ausgewählten Woche.

## 14. Datenschema

Der lokale Hauptdatensatz enthält:

- `schemaVersion`
- `profile`
- `settings`
- `habits`
- `weeks`
- `training`
- `ui`
- `meta`

Eine Woche enthält:

- ISO-Wochenschlüssel und Datum Montag/Sonntag,
- Status offen/abgeschlossen,
- Wochenziel, Fokus und Ziel-Prozentwert,
- geplante Trainingstage,
- sieben Tages-Snapshots der Gewohnheiten,
- Check-ins,
- Trainingsstatus und abgeschlossene Sessions,
- Reflexionen.

Exportdateien enthalten den vollständigen Hauptdatensatz plus Exportzeitpunkt.
Beim Import werden Struktur, Datenversion und zentrale Feldtypen geprüft. Vor
dem Überschreiben ist eine ausdrückliche Bestätigung erforderlich.

## 15. Datenschutz und Sicherheit

- Kein Netzwerkzugriff außer dem Laden der statischen App-Dateien.
- Keine externen Ressourcen in der Oberfläche.
- Keine personenbezogene Anmeldung.
- Kein Tracking, keine Cookies, keine Telemetrie.
- Zurücksetzen aller Daten nur nach zweistufiger Bestätigung.

## 16. PWA-Verhalten

- Manifest mit Name, Kurzname, Start-URL, Scope, Farben und Icons.
- Service Worker mit App-Shell-Cache und Navigation-Fallback.
- Offline-Nutzung nach erstem vollständigem Laden.
- Aktualisierte App-Dateien werden mit neuer Cache-Version übernommen.
- iPhone-Metadaten und Apple-Touch-Icon sind vorhanden.
- Installationshinweis wird nur gezeigt, wenn der Browser die Installation
  anbietet; iOS erhält eine kurze manuelle Anleitung.

## 17. Abnahmekriterien

Version 1.0 Beta gilt als fertig, wenn:

1. Ein Haken nach Neuladen erhalten bleibt.
2. Ein Haken wieder entfernt werden kann.
3. Vergangene Tage der laufenden Woche korrigierbar sind.
4. Der Wochen-Maximalwert dynamisch korrekt berechnet wird.
5. Deaktivierungen alte Tage und abgeschlossene Wochen nicht verändern.
6. Die Day-1-/Day-2-Rotation über Wochen hinweg fortläuft.
7. Ein verpasstes Training die Rotation nicht weiterschaltet.
8. Die Rotation manuell korrigiert werden kann.
9. Stärkste und schwächste Gewohnheit korrekt ermittelt werden.
10. Export und Import den vollständigen Datensatz wiederherstellen.
11. Die App nach dem ersten Laden offline funktioniert.
12. Alle Ressourcen unter einer GitHub-Pages-Unteradresse funktionieren.
13. Die Kernbedienung auf 320 bis 430 Pixel breiten Displays funktioniert.
14. Keine Nutzerdaten an externe Dienste gesendet werden.
15. Cardio-Einheiten mit individuellem Namen gespeichert werden, neben
    Krafttraining bestehen können und die Kraftrotation nicht verändern.
16. Geplante Trainingstage automatisch alternierende Day-1-/Day-2-Vorschläge
    erhalten und pro Tag manuell anpassbar sind.
17. Cardio-Dauer gespeichert und als Minutenwert ausgewertet wird.
18. Gewohnheitsserien über Wochen hinweg korrekt fortlaufen und persönliche
    Bestwerte sowie Trainingsmeilensteine sichtbar sind.
