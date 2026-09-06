import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * Prüft regelmäßig (beim Öffnen, bei Rückkehr in die App und alle 5 Minuten),
 * ob eine neue Version der App online ist. Falls die installierte Home-Bildschirm-App
 * noch eine alte Version zeigt, erscheint ein Hinweis mit „Aktualisieren“.
 */
const CHECK_INTERVAL = 5 * 60 * 1000;

const fetchSignature = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/index.html?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    // Die Namen der eingebauten Skripte ändern sich bei jeder neuen Version
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).join('|');
    return scripts || html.length.toString();
  } catch {
    return null;
  }
};

const UpdateBanner = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [reloading, setReloading] = useState(false);
  const initialRef = useRef<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return; // Nur in der veröffentlichten App
    let cancelled = false;

    const check = async () => {
      const sig = await fetchSignature();
      if (cancelled || !sig) return;
      if (initialRef.current === null) {
        initialRef.current = sig;
        return;
      }
      if (sig !== initialRef.current) setUpdateAvailable(true);
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const handleReload = async () => {
    setReloading(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignorieren
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[60] px-3 safe-top"
        >
          <div className="max-w-md mx-auto bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-lg p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Neue Version verfügbar</p>
              <p className="text-xs text-muted-foreground">Bitte aktualisieren, um weiterzumachen.</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReload}
              disabled={reloading}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shrink-0 disabled:opacity-60"
            >
              {reloading ? '…' : 'Aktualisieren'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateBanner;
