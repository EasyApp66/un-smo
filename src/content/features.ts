export type Feature = { title: [string, string]; description: [string, string] };
export type FeatureSection = { title: [string, string]; items: Feature[] };

export const featureSections: FeatureSection[] = [
  { title: ['Startseite', 'Home'], items: [
    { title: ['Dein Tag', 'Your day'], description: ['Sieh dein Tagesziel, die bereits gerauchte Anzahl und den nächsten Zeitpunkt auf einen Blick.', 'See your daily goal, how many you smoked and the next scheduled time at a glance.'] },
    { title: ['Countdown', 'Countdown'], description: ['Die verbleibende Zeit bis zum nächsten Wecker läuft direkt auf der Startseite.', 'The time until your next reminder counts down on the home screen.'] },
    { title: ['Gespartes', 'Savings'], description: ['Auf Wunsch zeigt die Startseite gespartes Geld und gewonnene Zeit gegenüber deiner ursprünglichen Rauchmenge.', 'Optionally see money saved and time gained compared with your original smoking amount.'] },
  ] },
  { title: ['Kalender', 'Calendar'], items: [
    { title: ['Wochen wechseln', 'Browse weeks'], description: ['Wische durch vergangene Wochen und tippe auf einen Tag, um dessen Ablauf zu sehen.', 'Swipe through previous weeks and tap a day to see its schedule.'] },
    { title: ['Farben und Vergleich', 'Colors and comparison'], description: ['Grün: im Ziel. Orange: eine oder zwei darüber. Rot: mehr als zwei darüber. Der Wochenpfeil vergleicht mit dem gleichen Zeitraum der Vorwoche.', 'Green: on target. Orange: one or two over. Red: more than two over. The week arrow compares the same period of the previous week.'] },
  ] },
  { title: ['Wecker', 'Reminders'], items: [
    { title: ['Gleichmässige Zeiten', 'Evenly spaced times'], description: ['Die geplanten Zeiten verteilen sich gleichmässig zwischen Aufstehen und Schlafen, auch über Mitternacht.', 'Scheduled times are evenly spaced between waking and sleeping, including overnight.'] },
    { title: ['Geraucht oder übersprungen', 'Smoked or skipped'], description: ['Markiere einen Wecker als geraucht oder übersprungen. Vergangene Einträge bleiben im Tagesverlauf sichtbar.', 'Mark a reminder as smoked or skipped. Past entries remain visible in your daily history.'] },
  ] },
  { title: ['Extras', 'Extras'], items: [
    { title: ['Zusätzliche Einträge', 'Extra entries'], description: ['Trage eine ungeplante Zigarette mit dem Plus-Knopf ein. Du kannst einstellen, ob dafür ein offener Wecker entfällt.', 'Log an unplanned cigarette with the plus button. Choose whether it removes one pending reminder.'] },
    { title: ['Verlauf öffnen', 'Open history'], description: ['Klappe Extras und übersprungene Wecker aus; die neuesten Einträge werden direkt sichtbar.', 'Expand extra and skipped entries to jump straight to the latest ones.'] },
  ] },
  { title: ['Zeitplan', 'Schedule'], items: [
    { title: ['Eigene Tage', 'Individual days'], description: ['Ändere Aufstehzeit, Schlafenszeit und Ziel für einzelne Tage. Der Standard in den Einstellungen gilt für neue Tage.', 'Change wake time, bedtime and goal for individual days. Settings provide the default for new days.'] },
    { title: ['Alle Tage', 'All days'], description: ['Mit „Zeitplan für alle Tage“ übernimmst du Änderungen auch für bereits eingerichtete Tage.', 'Use “Schedule for all days” to apply changes to days already set up.'] },
  ] },
  { title: ['Messwoche und Abbauplan', 'Measurement week and reduction plan'], items: [
    { title: ['Messwoche', 'Measurement week'], description: ['Die erste Woche misst deinen tatsächlichen Verbrauch und legt daraus einen Ausgangswert fest.', 'The first week measures your actual smoking and establishes a starting value.'] },
    { title: ['Schrittweise weniger', 'Gradual reduction'], description: ['Ein automatischer Plan kann dein Ziel wöchentlich senken. Du bestimmst die Schritte und kannst eine Woche pausieren.', 'An automatic plan can lower your goal each week. Choose the step size and pause a week if needed.'] },
  ] },
  { title: ['Benachrichtigungen', 'Notifications'], items: [
    { title: ['Meldungen und Test', 'Notifications and test'], description: ['Aktiviere Meldungen für offene Wecker und sende eine Test-Meldung. Auf dem iPhone muss die App dafür zum Home-Bildschirm hinzugefügt sein.', 'Enable notifications for pending reminders and send a test notification. On iPhone, add the app to the Home Screen first.'] },
    { title: ['Nach dem Tagesziel', 'After your daily goal'], description: ['Ist dein Tagesziel bereits erreicht, werden für diesen Tag keine weiteren Meldungen geplant.', 'Once you have reached your daily goal, no more notifications are scheduled for that day.'] },
  ] },
  { title: ['Statistik', 'Statistics'], items: [
    { title: ['Woche und Tagesziele', 'Week and daily goals'], description: ['Vergleiche die letzten sieben Tage, deinen Durchschnitt und die Vorwoche; darunter siehst du Ziel und Ergebnis je Tag.', 'Compare the last seven days, your average and the previous week; below, see each day’s goal and result.'] },
    { title: ['Monats-Memory', 'Monthly memory'], description: ['Suche Monate und sieh gerauchte, zusätzliche und übersprungene Zigaretten.', 'Search months and see smoked, extra and skipped cigarettes.'] },
  ] },
  { title: ['Körper-Meilensteine', 'Body milestones'], items: [
    { title: ['Pausen und Etappen', 'Breaks and milestones'], description: ['Sieh deine aktuelle und längste Rauchpause sowie gesundheitliche Etappen. Diese Hinweise ersetzen keine medizinische Beratung.', 'See your current and longest smoke-free break and health milestones. These notes are not medical advice.'] },
  ] },
  { title: ['Belohnung', 'Reward'], items: [
    { title: ['Tagesabschluss', 'End of day'], description: ['Sind keine Wecker mehr offen oder ist die Schlafenszeit vorbei, erscheint eine Rückmeldung zu deinem Tag.', 'Once no reminders remain or bedtime has passed, you receive feedback on your day.'] },
  ] },
  { title: ['Einstellungen', 'Settings'], items: [
    { title: ['Deine Auswahl', 'Your preferences'], description: ['Passe Zeitplan, Extras, Packungspreis, Währung, helles oder dunkles Design und die Sprache an.', 'Adjust the schedule, extras, pack price, currency, light or dark appearance and language.'] },
  ] },
  { title: ['Konto und Daten', 'Account and data'], items: [
    { title: ['Ohne Anmeldung starten', 'Start without signing in'], description: ['Deine Tagesdaten bleiben lokal nutzbar. Ein Konto per E-Mail-Code ist optional.', 'Your daily records can be used locally. An account with an email code is optional.'] },
    { title: ['Export und Löschung', 'Export and deletion'], description: ['Exportiere deine Daten als Datei oder lösche Konto und lokale Daten mit Sicherheitsabfrage.', 'Export your data as a file or delete your account and local data with confirmation.'] },
  ] },
  { title: ['Hilfe', 'Help'], items: [
    { title: ['Support und Rechtliches', 'Support and legal'], description: ['In den Einstellungen findest du Support, Impressum, Datenschutz, AGB und Gesundheitshinweis.', 'Find support, imprint, privacy policy, terms and health notice in Settings.'] },
  ] },
];