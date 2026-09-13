import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { recoverFromBackup } from "./lib/persistentStorage";
import { useAppStore } from "./store/appStore";

const start = async () => {
  // Nur wenn der schnelle Speicher leer ist: einmalig aus der
  // Browser-Datenbank wiederherstellen, bevor die App sichtbar wird.
  const recovered = await recoverFromBackup('smoke-storage');
  if (recovered) {
    await useAppStore.persist.rehydrate();
  }
  createRoot(document.getElementById("root")!).render(<App />);
};

void start();
