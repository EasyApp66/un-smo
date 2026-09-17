# Plan für den Veröffentlichungs-Ausbau

## Wichtige Grenzen vorab
- **Zahlungen:** Die Bezahlfunktion kann in dieser Sitzung nicht direkt aktiviert werden. In Lovable muss zuerst die eingebaute Zahlungsintegration eingerichtet werden. Ich kann bis dahin die App-Logik, Sperrlogik und Platzhalter-/Statusführung vorbereiten, aber keine echten Zahlungssitzungen oder Webhooks produktiv anbinden.
- **Konto/Profile:** Du hast ausdrücklich eine `profiles`-Zeile pro Nutzer verlangt. Ich plane daher mit Profil-Daten, strikter Zugriffsbeschränkung und ohne öffentliche Auswertungen.
- **Bestehende Daten:** Bestehende lokale Tagesdaten bleiben erhalten. Wer die App schon nutzt, bekommt den neuen Ablauf einmal angezeigt, ohne bisherige Zähldaten zu verlieren.

## Reihenfolge der Umsetzung

### 1) Onboarding mit Ergebnisplan
- Den aktuell deaktivierten Startablauf durch einen neuen vierstufigen Ablauf ersetzen:
  1. Tagesmenge 1–60, Standard 20
  2. Aufsteh-/Schlafenszeit, Standard 06:00 / 23:00, Live-Abstand
  3. Senkungstempo mit Sanft / Empfohlen / Zügig / Selbst festlegen
  4. Ergebnisplan mit Wochenliste, geschätzter Ersparnis und zurückgewonnener Zeit
- Werte im bestehenden Speicher ablegen.
- `onboardingCompleted` ergänzen und alte Nutzer einmalig durch den neuen Ablauf führen.
- Übergänge mit 200 ms, nur Transform/Opacity, passend zum bestehenden VITAL-Stil.

### 2) Messwoche und automatischer Abbauplan
- Planstart, Messwoche, gemessenen Durchschnitt, Senkung pro Woche, Pausenwochen und automatisches Senken speichern.
- Woche 1 als nicht bindende Messwoche behandeln.
- Startseite zeigt während der Messwoche einen dezenten Hinweisstreifen mit Resttagen.
- Nach der Messwoche einen Ergebniszustand anzeigen: gemessener Schnitt und Startwert des Plans.
- Danach jeden Montag das Tagesziel automatisch senken, bis 0 erreicht ist.
- Wecker bei Zielsenkung neu über den Wachtag verteilen, bestehende Tageszustände stabil halten.
- Einstellungen erhalten einen Abschnitt „Abbauplan“ mit Ausgangswert, Senkung, Auto-Schalter, Pausieren und Wochenliste.

### 3) Gespartes Geld und Zeit
- Packungspreis, Packungsgröße und Währung in Einstellungen ergänzen.
- Startseite erhält eine neue Bento-Karte „Gespart“.
- Statistik erhält einen Wochenverlauf für Ersparnis.
- Berechnung nutzt Ausgangswert minus tatsächlich geraucht, mit Stückpreis aus den Einstellungen.
- Zurückgewonnene Zeit wird mit 11 Minuten pro Zigarette berechnet; der Hinweis zur Quelle steht in den Einstellungen.

### 4) Körper-Meilensteine
- Statistik bekommt oben den Abschnitt „Dein Körper“.
- Kurzfristige Meilensteine basieren auf der längsten je erreichten Pause und zeigen die laufende Pause klein daneben.
- Langfristige Meilensteine starten ab dem Tag, an dem 0 erreicht wurde.
- Darstellung als senkrechter Zeitstrahl mit Sand-Akzent, Border-Linie und dezentem Hinweistext.
- Pop-up erscheint einmalig pro neu erreichtem Meilenstein, nicht zwischen 23:00 und 07:00 und nicht während Eingaben.

### 5) Konto, Testzeit und Bezahlschranke
- E-Mail Magic Link und Apple-Anmeldung nach dem Onboarding vor dem Ergebnisbildschirm vorbereiten.
- Profil-Tabelle mit Zugriff nur auf die eigene Zeile anlegen.
- Bezahlstatus, Testzeit, Rolle und Löschlogik serverseitig modellieren.
- Admin-Rolle wird serverseitig geprüft und im Frontend nicht änderbar gemacht.
- Nach Testzeit bleiben heutiger Zähler, Wecker und Einstellungen zugänglich; Auswertungen werden gesperrt.
- Echte Zahlungssitzungen und Webhooks werden erst nach aktivierter Lovable-Zahlungsintegration fertig angebunden.

### 6) Kleine Korrekturen
- Kalender: heutigen Punkt entfernen, ausgewählte Zelle eckiger machen, heute nur mit 1.5px Akzent-Rand zeigen.
- Helles Theme: Hintergrund auf `250 24% 96%`, Kartenschatten wie vorgegeben verstärken; dunkles Theme unverändert lassen.

## Prüfungen
- Regressionstests für Plan, Messwoche, Senkung, Extra-Regel, Ersparnis und Meilensteine ergänzen.
- Bestehende Zeitplan-Tests weiter ausführen.
- TypeScript prüfen.
- Produktions-Build prüfen.
- Mobile Browserprüfung für Onboarding, Startseite, Einstellungen und Statistik.

## Entscheidungen/Blocker
- Für echte Zahlungen muss die Lovable-Zahlungsintegration zuerst im Editor aktiviert werden.
- Vor Auth-Code bestätige ich final, dass die gewünschte Profil-Tabelle personenbezogene Einstellungen und Zahlungsstatus speichern soll; das ist hier aus deiner Beschreibung bereits als Annahme eingetragen.
