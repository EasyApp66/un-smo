/**
 * Speicher, der die App-Daten doppelt ablegt: im schnellen localStorage und
 * zusätzlich in der Browser-Datenbank (IndexedDB). Falls der Browser nach einem
 * Update oder längerer Pause den localStorage leert, werden die Daten beim
 * nächsten Start automatisch aus der Datenbank zurückgeholt.
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

export const durableStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let local: string | null = null;
    try {
      local = localStorage.getItem(name);
    } catch {
      local = null;
    }
    const backup = await idbGet(name);
    if (local) {
      // Sicherungskopie auffrischen
      if (backup !== local) void idbSet(name, local);
      return local;
    }
    if (backup) {
      try {
        localStorage.setItem(name, backup);
      } catch {
        // ignorieren
      }
      return backup;
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignorieren
    }
    void idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignorieren
    }
    void idbDel(name);
  },
};
