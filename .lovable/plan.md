# Plan

## Ziel
In den Einstellungen kommt an dritter Stelle ein neuer Schalter hinzu. Er steuert, ob Extra-Zigaretten automatisch geplante Zigaretten aus dem Tagesablauf entfernen.

## Änderungen
- Der Extra-Knopf bleibt standardmäßig eingeschaltet.
- Die neue Einstellung ist ebenfalls standardmäßig eingeschaltet.
- Die neue Einstellung wird nur angezeigt/aktiv nutzbar, wenn der Extra-Knopf eingeschaltet ist.
- Wenn die neue Einstellung ausgeschaltet wird, werden durch Extra-Zigaretten entfernte geplante Zigaretten für den heutigen Tag wiederhergestellt.
- Wenn sie wieder eingeschaltet wird, gilt die bisherige Regel wieder: Extra-Zigaretten entfernen die spätesten offenen geplanten Zigaretten.

## Technische Details
- Die App speichert eine neue Einstellung für diese Regel dauerhaft mit den bestehenden Einstellungen.
- Entfernte geplante Zigaretten werden beim heutigen Tag anhand des Tagesplans neu berechnet, ohne das Tagesziel zu verändern.
- Bestehende Zustände bleiben erhalten: geraucht, übersprungen und Extra bleiben gespeichert.
- Es werden Regressionstests ergänzt für Standardwert, Ausschalten mit Wiederherstellung und erneutes Einschalten.

## Prüfung
- Zeitplan-Tests ausführen.
- TypeScript prüfen.
- Produktions-Build prüfen.
