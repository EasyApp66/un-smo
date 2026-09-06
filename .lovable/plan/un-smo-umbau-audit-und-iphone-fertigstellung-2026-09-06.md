# UN-SMO – Umbau, Audit und iPhone-Fertigstellung

Ziel: Die App heisst ab jetzt **UN-SMO**, läuft sauber auf dem iPhone (Home-Bildschirm-App), hat einen richtigen Dunkelmodus, eine PIN-Sperre, echte Push-Erinnerungen und ein neues Blatt-Logo. Alles wird in Deutsch umgesetzt und Schritt für Schritt geprüft.

## 1. Umbenennung und neues Logo (Blatt / Frische)

- App-Name überall auf **UN-SMO** ändern (Titel, Willkommensbildschirm, Einstellungen, Beschreibungstexte – aktuell steht dort noch "easySmoke"/"Smoke").
- Neues Logo generieren: weiches, minimalistisches Blatt in frischem Grün-Verlauf mit sanftem Neon-Glow, Apple-typische runde Ecken, kein Zigaretten-Symbol.
- Daraus erzeugen: Home-Bildschirm-Icon fürs iPhone (180px), Browser-Tab-Icon, Icons für die App-Installation (192/512px), Logo auf dem Willkommensbildschirm.

## 2. iPhone-tauglich machen (installierbare App)

- Web-App-Manifest mit Name UN-SMO, Grün als Farbe, Vollbild-Modus, neuen Icons.
- Sichere Ränder (Notch, Home-Balken) für Kalenderleiste, Menü und Einstellungen einhalten.
- Kein Zoom beim Tippen in Felder, weiche Scrollbereiche, Touch-Flächen mindestens 44px.
- Anleitung am Ende: Safari → Teilen → "Zum Home-Bildschirm" (nötig für Push auf dem iPhone).

## 3. Kalenderleiste nach unten verschieben

- Die 5-Tage-Leiste wandert vom oberen Rand direkt über das schwebende Menü (fixiert am unteren Rand).
- Der Zähler (z. B. 3/20) bleibt oben als feste Kopfzeile.
- Die Erinnerungsliste bekommt unten genug Platz, damit nichts hinter Kalender und Menü verschwindet.

## 4. Dunkelmodus: System + manueller Schalter

- In den Einstellungen: Auswahl **Hell / Dunkel / System** (statt nur Ein/Aus). Standard: System (folgt dem iPhone).
- Dunkle Farben überarbeiten: Karten, Trennlinien, Zeitwähler, Statistik-Balken und abgelaufene (graue) Wecker auf gute Lesbarkeit prüfen.
- Statusleisten-Farbe des iPhones passt sich mit an.

## 5. PIN-Code-Sperre (nur du kommst rein)

- Beim ersten Start nach dem Willkommensbildschirm: 4-stellige PIN festlegen und bestätigen.
- Bei jedem Öffnen der App: PIN-Eingabe mit grossem Ziffernblock, Vibration bei Fehleingabe.
- In den Einstellungen: PIN ändern. Der Punkt "Abmelden" sperrt die App wieder (zurück zur PIN-Eingabe), "Alle Daten löschen" entfernt auch die PIN.
- Kein Konto, keine Registrierung – Daten bleiben nur auf deinem Handy.

## 6. Echte Push-Erinnerungen (auch bei geschlossener App)

Damit Meldungen zur Wecker-Zeit ankommen, braucht es einen Server, der sie verschickt:

- Lovable Cloud aktivieren und die Firebase-Push-Verbindung (mit Web-Push) verknüpfen – dazu erscheint eine Karte im Chat, die du bestätigst.
- In den Einstellungen: Schalter "Push-Meldungen" → fragt die Erlaubnis ab und speichert dein Gerät zusammen mit deinem Zeitplan (Aufstehzeit, Schlafenszeit, Tagesziel, Zeitzone Zürich) in der Cloud.
- Jede Minute prüft der Server, ob eine Erinnerung fällig ist, und schickt "Zeit für deine nächste Zigarette" (bzw. am Tagesende eine kleine Erfolgsmeldung).
- Zeitplan-Änderungen in der App werden automatisch an den Server übertragen.
- Klare Hinweise in der App, wenn Push auf dem Gerät nicht möglich ist (z. B. App nicht auf dem Home-Bildschirm installiert, Erlaubnis abgelehnt, Vorschau im Editor).

Wichtig fürs Testen morgen: Push funktioniert auf dem iPhone nur in der **veröffentlichten** App, die auf dem Home-Bildschirm installiert ist (iOS 16.4 oder neuer) – nicht in der Vorschau.

## 7. Komplettes Audit – gefundene Fehler und Korrekturen

Bereits beim Prüfen entdeckte Probleme, die behoben werden:

- **Falscher Tag nach 22 Uhr / vor 02 Uhr**: Das Datum wird aktuell in Weltzeit berechnet. In Zürich zeigt die App darum abends und nach Mitternacht den falschen "heutigen" Tag. Wird auf lokale Zeit umgestellt (Kalender, Startbildschirm, Statistik, Tages-Einrichtung, Speicher).
- **Zeitplan-Schalter "für alle Tage"** wendet die Änderung erst beim nächsten Umschalten an (Reihenfolge-Fehler) – wird korrigiert.
- **Sprache**: Seitentitel, Beschreibung und einzelne Texte sind noch Englisch – alles auf Deutsch.
- Statistik: Wochenwerte, Durchschnitt, Trend und leere Tage prüfen; Balken im Dunkelmodus; Woche beginnt am Montag; Tage ohne Einrichtung werden korrekt als "kein Eintrag" gezeigt.
- Einstellungen: alle Schalter, Zeitwähler, Rechtliches-Bereich, "Alle Daten löschen" mit Rückfrage, PIN, Push und Darstellung prüfen.
- Abschliessender Test im iPhone-Format mit Screenshots (Hell + Dunkel), inklusive PIN-Ablauf, Tag einrichten, Wecker abhaken/löschen, Statistik.

## 8. Ablauf und Feedback

Reihenfolge, mit kurzer Rückmeldung nach jedem Block:

1. Logo, Name, Icons, Manifest
2. Kalender nach unten, iPhone-Anpassungen
3. Dunkelmodus (System/Hell/Dunkel)
4. PIN-Sperre
5. Fehlerkorrekturen aus dem Audit, Statistik + Einstellungen
6. Lovable Cloud + Firebase-Push (du bestätigst die Verbindungskarte)
7. Gesamttest, danach Veröffentlichen für den Test auf deinem iPhone

## Technische Details

- Store (Zustand, persist): `themeMode: 'light' | 'dark' | 'system'` ersetzt `isDarkMode` (mit Migration); `pinHash`, `isLocked`, `pushEnabled`, `deviceToken`. `getTodayString` und alle `toISOString().split('T')[0]`-Stellen durch eine lokale `formatLocalDate()`-Hilfe ersetzen. `toggleApplyScheduleToAllDays`: Neuberechnung nach dem `set` mit dem neuen Wert.
- Theme: `matchMedia('(prefers-color-scheme: dark)')`-Listener in `Index.tsx`; `theme-color`-Meta dynamisch setzen.
- Layout: `MiniCalendar` in einen `fixed bottom-[72px]` Container mit `safe-bottom`; `HomeScreen` Spacer erhöhen; `BottomTabBar` bleibt.
- PIN: neue `PinLockScreen.tsx` (Setup + Entsperren), PIN als SHA-256-Hash (Web Crypto) gespeichert, Sperre bei App-Start und über "Abmelden".
- PWA: `public/manifest.webmanifest` (display standalone, Icons 192/512, maskable), `apple-touch-icon`, Meta-Tags in `index.html`. Kein App-Shell-Service-Worker (nur der Firebase-Messaging-Worker `public/firebase-messaging-sw.js`).
- Push: Lovable Cloud aktivieren; Firebase-Messaging-Connector verknüpfen; Tabelle `push_devices` (token, wake_time, sleep_time, daily_cigarettes, timezone, last_sent_slot, created_at) mit Grants + RLS (Insert/Update per Token, Service-Role Vollzugriff); Edge Function `send-reminders` per Cron jede Minute: berechnet fällige Erinnerungsslots in der Gerätezeitzone und sendet über das Connector-Gateway (`v1/projects/_/messages:send`); ungültige Tokens werden gelöscht. Client: `firebase` Paket, `enablePush()` mit Status-Fällen (not-configured / unsupported / open-in-new-tab / denied).
- Logo: Generierung via Bildtool, Ableitung von Favicon (64px), Apple-Touch-Icon (180px), PWA-Icons (192/512px) mit `magick`; alte `favicon.ico` entfernen.
- Meta: `<title>UN-SMO – Rauchen sanft reduzieren</title>`, deutsche Beschreibung, `lang="de"`.
