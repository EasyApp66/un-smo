
- Translations: inline pairs via `useT()`/`tr(de, en)` from src/lib/i18n.ts, language in store `language` — keeps German and English side by side without a key catalogue.
- Day boundary: "today" always comes from getLogicalDate()/logicalDay() in src/lib/logicalDate.ts (switch at 07:00), never from the raw calendar date — so late-night entries count for the previous day.
- Push schedules include only configured days; the sender requires a sync from the current logical day and never synthesizes missing days, so stale overnight plans cannot notify after the next day begins.
