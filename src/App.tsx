import { useEffect, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Unlock from "./pages/Unlock";
import UpdateBanner from "./components/UpdateBanner";

const LegalRoute = lazy(() => import("./pages/LegalRoute"));
const LegalCheck = lazy(() => import("./pages/LegalCheck"));

const LEGAL_SLUGS = ['impressum', 'datenschutz', 'agb', 'gesundheitshinweis'];

/**
 * Kurzer Startbildschirm mit dem Zeichen: erscheint sofort beim Öffnen,
 * blendet nach weniger als einer Sekunde sanft aus. Verhindert den schwarzen
 * bzw. leeren Bildschirm, während die App lädt.
 */
const Splash = () => {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 620);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
          aria-hidden
        >
          <motion.img
            src="/mark.svg"
            alt=""
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20"
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const usePath = () => {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return path;
};

const App = () => {
  const path = usePath().replace(/\/+$/, '');
  const slug = path.replace(/^\//, '');

  const screen = LEGAL_SLUGS.includes(slug) ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <LegalRoute slug={slug} />
    </Suspense>
  ) : slug === 'rechtliches-check' ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <LegalCheck />
    </Suspense>
  ) : slug === 'unlock' ? (
    <Unlock />
  ) : (
    <Index />
  );

  return (
    <TooltipProvider>
      <Sonner />
      <UpdateBanner />
      <Splash />
      {screen}
    </TooltipProvider>
  );
};

export default App;
