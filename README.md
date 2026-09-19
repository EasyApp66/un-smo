# Breathe Easy

Erstelle eine komplette iOS-App namens "easySmoke" mit SwiftUI (oder React Native, falls du Web bevorzugst – aber bevorzuge natives iOS-Feeling). Die App hilft Menschen, das Rauchen schrittweise und sanft zu reduzieren oder komplett aufzuhören – ohne Druck, ohne Moralpredigt, sehr motivierend und spielerisch durch kleine tägliche Erfolge.

**Kernkonzept (extrem wichtig):**
Die App verteilt die erlaubte Anzahl an Zigaretten gleichmäßig über den Wach-Zeitraum des Users. Beispiel: User ist von 06:00 bis 23:00 wach und stellt 12 Zigaretten ein → die App erstellt automatisch 12 gleichmäßige Zeitpunkte (alle ~1 Stunde 25 Minuten), zu denen eine sanfte Vibration + Notification kommt: „Jetzt ist Zeit für deine nächste Zigarette – du schaffst das!“. Ziel ist Durchhaltevermögen zwischen den Momenten zu trainieren. Je weniger Zigaretten eingestellt, desto länger die Pausen → desto leichter der Weg zum Aufhören.

**Wichtigste Regeln für das Design:**
- Sehr moderner iOS 2025/2026 Stil: extreme Minimalismus + Neubrutalismus/Futurismus-Mix
- Dicke, fette, fast grotesk große Sans-Serif Schrift (ähnlich SF Pro Bold/Black, aber noch stärker betont, teils leicht verzerrt oder mit brutalistischen Cuts)
- Helles Theme als Default: sehr helle, fast grell-weiße Hintergründe (#FAFAFF oder #F8F9FF), futuristische Akzentfarben wie Electric Cyan (#00F0FF), Magenta-Pink (#FF00AA), Neon-Lime (#CCFF00), Soft Violet (#A78BFA)
- Sehr hoher Kontrast, große Typografie (Überschriften 48–72 pt, Zahlen bis 96 pt)
- Flüssige, hochwertige Custom-Animationen (keine Stock-Lottie, alles nativ): sanfte Scale/Bounce beim Tippen, flüssiger Scroll mit Parallax, Farb-Shift-Transitions, micro-vibrations bei Interaktion
- Unterstützung für Light ↔ Dark Mode (Umschalt-Option in Settings, Dark ist tiefes Near-Black #0A0A0F mit denselben Neon-Akzenten)
- Kein Login, kein Onboarding-Account – App startet sofort nutzbar (erster Start → kurzer Erklär-Screen)
- App komplett auf Englisch (kein Deutsch in UI, nur intern falls nötig)

**Struktur – nur 2 Haupt-Screens + ein initialer Explanation-Screen:**

1. Erster Start: Onboarding/Explanation Screen (einmalig)
   - Ganz minimalistisch, zentriert, große Schrift
   - Text etwa:  
     „easySmoke  
     Reduce at your pace.  
     Set your wake hours → choose daily cigarettes → get gentle timed reminders.  
     Fewer cigarettes = longer wins.  
     You got this.“
   - Großer „Get Started“ Button (futuristisch, mit Glow/Neon-Rand)
   - Unten kleiner „Skip“ Link

2. Haupt-Screen (Home – Cigarette Timer View)
   - Ganz oben (very top safe area): kleiner horizontal scrollbarer Mini-Kalender – zeigt nur 2 Tage zurück + Heute + 2 Tage voraus (5 Tage total in einer Zeile). Heute hervorgehoben mit Neon-Ring. Tage als große fette Zahlen (z.B. 23), Wochentag klein darunter.
   - Direkt darunter (prominent, riesig): Heutige Zigaretten-Zähler  
     „8 / 12“ oder „23 / 40“ in brutal-großer Schrift (96–120 pt), animierter Counter bei Änderung
   - Darunter: Horizontale oder vertikale (besser vertikal für iPhone) scrollbare Liste aller heutigen Reminder-Times (Wecker)
     - Jeder Eintrag: große Zeit (z.B. „14:37“ in 60 pt), daneben kleiner Text „in 12 min“ oder „next in 1h 8min – hold strong“
     - Rechts ein großer Kreis-Button: leer → angeklickt = gefüllter Haken + Farbwechsel (von Grau zu Neon-Cyan)
     - Nach abgelaufener Zeit: Entry wird leicht transparent + Text „missed – reset?“ oder auto-next
     - Swipe left auf Entry → Delete (roter Hintergrund)
     - Flüssige Scroll-Physik, sticky header mit Zähler

3. Settings / Profile Screen (zweiter Tab oder Sheet von oben)
   - Oben wieder der große Zähler „Cigarettes today“ aber kleiner
   - Große Sections (iOS-Settings-Style aber brutalistisch vergrößert):
     - Wake & Sleep Time (zwei nebeneinander große Wheels/Scroller wie iOS Uhrzeit-Wähler)
       Links: Wake up   06:00 ↑↓ Scrollrad
       Rechts: Bedtime  23:00 ↑↓ Scrollrad
     - Daily Cigarettes Goal: großer horizontal oder vertikal scrollbarer Picker (0 – 60, große Zahlen, Snap-Effekt, 5er-Schritte markiert)
       Aktuelle Zahl riesig hervorgehoben
     - Theme: Light / Dark Toggle (große futuristische Switches mit Neon-Glow)
     - Language: English (vorerst fix, evtl. später mehr)
     - Premium / Support:
       „Unlock more“  
       One-time purchase – 20 CHF (Button mit Preis)
       OR Subscribe – 1 CHF / month (mit Vorteilen: custom themes, stats, no ads etc.)
     - Unten: „Delete all data“ (rot, vorsichtig)
     - „Log out / Reset progress“ (falls je relevant)

**Zusätzliche Features & Feinschliff:**
- Notifications & Haptics: genaue, sanfte Vibration + kurze Notification bei jedem Reminder
- Automatische Neuberechnung: ändert man Cigarettes oder Wake-Zeiten → alle Reminder-Times werden sofort neu verteilt (gleichmäßige Intervalle)
- Animation-Highlights: beim Erreichen eines Reminders leichter Puls-Effekt auf dem Zähler, Confetti bei neuem Tiefstwert des Tages (sehr dezent)
- Icon-Vorschlag (generiere bitte ein passendes App-Icon im Apple-Stil): Kein Zigarette-Symbol! Stattdessen etwas Abstraktes, Modernes, Positives – z.B. stilisiertes minimalistisches Sanduhr-ähnliches Symbol (für Zeit & Pausen), oder ein futuristischer Kreis mit aufsteigender Kurve (Fortschritt), oder ein simpler, dicker „S“-Buchstabe mit Neon-Glow in Cyan/Magenta. Mach es quadratisch, rounded corners, depth mit soft shadow, very Apple-like (kein Realismus, clean vector)

Erstelle die App mit höchster Liebe zum Detail, butter-smooth Animationen, perfekter Typografie und einem sehr premium, futuristischen Look & Feel. Zeige mir zuerst das App-Icon-Konzept, dann die beiden Haupt-Screens als Mockups und dann den vollen Code.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://un-smo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dedc5c2d-e10c-4585-b501-f611b0d11aa4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
