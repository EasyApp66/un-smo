/**
 * Speicher, der die App-Daten doppelt ablegt: im schnellen localStorage und
 * zusätzlich in der Browser-Datenbank (IndexedDB). Der normale Lauf bleibt
 * komplett synchron auf localStorage, damit beim App-Start keine leeren
 * Standardwerte aufblitzen. Nur wenn der Browser den localStorage geleert hat
 * (z. B. nach einem Update oder längerer Pause), wird beim Start einmalig aus
 * der Datenbank wiederhergestellt.
 */

const DB_NAME = 'unsmo-store';
const STORE = 'kv';

const openDb = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

const idbGet = async (key: string): Promise<string | null> => {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const idbSet = async (key: string, value: string): Promise<void> => {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
  } catch {
    // ignorieren
  }
};

const idbDel = async (key: string): Promise<void> => {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
  } catch {
    // ignorieren
  }
};

/**
 * Synchroner Speicher für den Store: liest/schreibt sofort auf localStorage
 * und spiegelt jede Änderung im Hintergrund in die Browser-Datenbank.
 */
export const durableStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignorieren
    }
    void idbSet(name, value);
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignorieren
    }
    void idbDel(name);
  },
};

/**
 * Notfall-Wiederherstellung: nur nötig, wenn localStorage leer ist.
 * Gibt true zurück, wenn Daten aus der Datenbank zurückgeholt wurden.
 */
export const recoverFromBackup = async (name: string): Promise<boolean> => {
  try {
    if (localStorage.getItem(name)) return false;
  } catch {
    // localStorage blockiert – trotzdem versuchen
  }
  const backup = await idbGet(name);
  if (!backup) return false;
  try {
    localStorage.setItem(name, backup);
  } catch {
    // ignorieren
  }
  return true;
};
