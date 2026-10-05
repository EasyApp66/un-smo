
- Translations: inline pairs via `useT()`/`tr(de, en)` from src/lib/i18n.ts, language in store `language` — keeps German and English side by side without a key catalogue.
- Day boundary: "today" comes from getLogicalDate()/logicalDay() with the earlier of 07:00 and configured wake time, initialized and refreshed by the store; targets use targetForDay(dateKey, time, wakeMin) — so selected dates and early wake-ups cannot borrow today's timestamp.
- Push schedules include only configured days; the sender requires a sync from the current logical day and never synthesizes missing days, so stale overnight plans cannot notify after the next day begins.
