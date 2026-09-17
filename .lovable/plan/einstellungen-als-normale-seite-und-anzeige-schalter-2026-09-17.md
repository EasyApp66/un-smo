# Einstellungen als normale Seite und Anzeige-Schalter

## Änderungen
- Einstellungen nicht mehr als hochgeschobenes Fenster öffnen, sondern als normale, vollständig scrollbarere Seite innerhalb der App anzeigen.
- Die untere Menüleiste auch auf der Einstellungsseite sichtbar und bedienbar halten; „Einstellungen“ bleibt dort markiert.
- In den Einstellungen einen Schalter ergänzen, der nur die Geld-/Zeit-Karte auf der Startseite ein- oder ausblendet.
- Geld- und Zeitersparnis auf der Statistikseite unabhängig von diesem Schalter immer anzeigen.
- Die Einstellung lokal speichern und für bestehende Nutzer standardmäßig eingeschaltet lassen.
- Den Außenrand des Extra-Knopfs in Hell und Dunkel mit der Akzentfarbe etwas deutlicher darstellen.

## Technische Umsetzung
- Die Einstellungsansicht von einer überlagernden Sheet-Struktur zu normalem Seiteninhalt umbauen; Schließen-Knopf, Hintergrundabdunklung und Einschubanimation entfernen.
- Navigation in `Index` direkt über den aktiven Tab steuern.
- Einen persistierten Sichtbarkeitswert samt Umschaltfunktion im bestehenden App-Speicher ergänzen und bei alten Speicherständen migrieren.
- Die Startseitenkarte an diesen Wert koppeln; die Statistikberechnung bleibt unverändert.

## Prüfung
- Auf dem mobilen App-Format zwischen Startseite, Statistik und Einstellungen wechseln und prüfen, dass das Menü stets sichtbar bleibt.
- Schalter aus/ein prüfen: Karte verschwindet nur auf der Startseite und bleibt in der Statistik erhalten.
- Extra-Knopf in heller und dunkler Darstellung auf klar sichtbaren Akzent-Rand prüfen.
- Tests und aktuellen App-Start auf Fehler kontrollieren.
