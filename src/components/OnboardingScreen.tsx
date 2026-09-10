import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import appIcon from '../assets/app-icon.png';

const EASE = [0.22, 1, 0.36, 1] as const;

const OnboardingScreen = () => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const initializeDay = useAppStore((state) => state.initializeDay);

  const handleGetStarted = () => {
    const today = formatLocalDate();
    initializeDay(today);
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE }}
        className="text-center max-w-md w-full"
      >
        <div className="flex flex-col items-center mb-8">
          <img
            src={appIcon}
            alt="UN-SMO Logo"
            width={112}
            height={112}
            className="w-28 h-28 rounded-card mb-6"
          />
          <span className="t-24 tracking-[0.14em] text-foreground">UN-SMO</span>
        </div>

        <div className="space-y-4 mb-8">
          <p className="t-20 text-foreground">Reduziere in deinem Tempo.</p>
          <p className="t-16 text-muted-foreground">
            Lege deine Wach-Zeiten fest → wähle dein Tagesziel → erhalte sanfte Erinnerungen.
          </p>
          <p className="t-16 font-medium text-foreground">
            Weniger Zigaretten = längere Pausen = mehr Erfolg.
          </p>
          <p className="t-16 text-muted-foreground">Du schaffst das.</p>
        </div>

        <button type="button" onClick={handleGetStarted} className="btn-pill btn-primary w-full">
          Los geht's
        </button>

        <button
          type="button"
          onClick={handleGetStarted}
          className="mt-6 t-14 text-subtle"
        >
          Überspringen
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingScreen;
