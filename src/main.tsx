import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { recoverFromBackup } from "./lib/persistentStorage";
import { useAppStore } from "./store/appStore";

/** Startbildschirm ausblenden, sobald die App steht – frühestens nach 620ms,
    damit die kurze Einblendung sichtbar bleibt, und erst nach dem ersten
    vollständigen Zeichnen der App, damit nichts darunter aufblitzt. */
const hideBootSplash = (startedAt: number) => {
  const el = document.getElementById("boot-splash");
  if (!el) return;
  const wait = Math.max(0, 620 - (Date.now() - startedAt));
  setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add("out");
        setTimeout(() => el.remove(), 300);
      });
    });
  }, wait);
};

const start = async () => {
  const startedAt = Date.now();
  // Nur wenn der schnelle Speicher leer ist: einmalig aus der
  // Browser-Datenbank wiederherstellen, bevor die App sichtbar wird.
  const recovered = await recoverFromBackup('smoke-storage');
  if (recovered) {
    await useAppStore.persist.rehydrate();
  }
  createRoot(document.getElementById("root")!).render(<App />);
  hideBootSplash(startedAt);
};

void start();
