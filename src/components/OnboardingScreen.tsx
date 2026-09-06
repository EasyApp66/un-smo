import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import appIcon from '../assets/app-icon.png';

const OnboardingScreen = () => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const initializeDay = useAppStore((state) => state.initializeDay);

  const handleGetStarted = () => {
    const today = formatLocalDate();
    initializeDay(today);
    completeOnboarding();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 safe-top safe-bottom relative overflow-hidden">
      {/* Grüner Gradient Hintergrund */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
      
      {/* Overlay für besseren Kontrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md relative z-10"
      >
        {/* Logo / Brand */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center mb-8"
        >
          <img
            src={appIcon}
            alt="UN-SMO Logo"
            width={112}
            height={112}
            className="w-28 h-28 rounded-[28px] shadow-2xl mb-6"
          />
          <span className="text-brutal-xl text-white drop-shadow-lg tracking-tight">UN-SMO</span>
        </motion.h1>

        {/* Beschreibung */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4 mb-12"
        >
          <p className="text-brutal-md text-white/95">
            Reduziere in deinem Tempo.
          </p>
          <p className="text-white/80 text-lg leading-relaxed">
            Lege deine Wach-Zeiten fest → wähle dein Tagesziel → erhalte sanfte Erinnerungen.
          </p>
          <p className="text-brutal-sm text-white font-semibold">
            Weniger Zigaretten = längere Pausen = mehr Erfolg.
          </p>
          <p className="text-xl font-semibold text-white mt-6">
            Du schaffst das.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGetStarted}
          className="w-full py-5 px-8 rounded-2xl font-extrabold text-xl transition-all duration-300 bg-white text-primary shadow-2xl hover:shadow-3xl"
        >
          Los geht's
        </motion.button>

        {/* Skip Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          onClick={handleGetStarted}
          className="mt-6 text-white/70 hover:text-white transition-colors text-sm"
        >
          Überspringen
        </motion.button>
      </motion.div>

      {/* Hintergrund Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-white/15 to-transparent blur-3xl"
        />
      </div>
    </div>
  );
};

export default OnboardingScreen;
