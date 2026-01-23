import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const OnboardingScreen = () => {
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const initializeDay = useAppStore((state) => state.initializeDay);

  const handleGetStarted = () => {
    const today = new Date().toISOString().split('T')[0];
    initializeDay(today);
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md"
      >
        {/* Logo / Brand */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-brutal-display mb-8 bg-gradient-to-r from-primary via-secondary to-violet bg-clip-text text-transparent"
        >
          easy
          <br />
          Smoke
        </motion.h1>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4 mb-12"
        >
          <p className="text-brutal-md text-foreground">
            Reduce at your pace.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Set your wake hours → choose daily cigarettes → get gentle timed reminders.
          </p>
          <p className="text-brutal-sm text-primary text-glow-cyan">
            Fewer cigarettes = longer wins.
          </p>
          <p className="text-xl font-semibold text-foreground mt-6">
            You got this.
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
          className="w-full py-5 px-8 rounded-2xl font-extrabold text-xl transition-all duration-300 hover:opacity-90 bg-gradient-to-r from-neon-cyan to-violet text-foreground shadow-lg"
          style={{
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.5)',
          }}
        >
          Get Started
        </motion.button>

        {/* Skip Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          onClick={handleGetStarted}
          className="mt-6 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Skip intro
        </motion.button>
      </motion.div>

      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
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
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
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
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-secondary/20 to-transparent blur-3xl"
        />
      </div>
    </div>
  );
};

export default OnboardingScreen;
