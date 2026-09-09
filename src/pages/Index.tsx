import { useAppStore, applyTheme, formatLocalDate } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import BottomTabBar from '../components/BottomTabBar';
import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StatisticsScreen = lazy(() => import('../components/StatisticsScreen'));
const SettingsSheet = lazy(() => import('../components/SettingsSheet'));
import { syncPushSchedule } from '../lib/push';

const Index = () => {
  const {
    hasCompletedOnboarding,
    themeMode,
    pushToken,
    wakeTime,
    sleepTime,
    dailyCigarettes,
    days,
    addExtraCigarette,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extraFeedback, setExtraFeedback] = useState<string | null>(null);

  // Theme anwenden (Hell / Dunkel / System)
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);


  // Zeitplan-Änderungen an den Push-Server übertragen (entprellt)
  useEffect(() => {
    if (!pushToken) return;
    const t = setTimeout(() => {
      syncPushSchedule(pushToken, { wakeTime, sleepTime, dailyCigarettes }).catch((e) =>
        console.warn('Push-Sync fehlgeschlagen', e)
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [pushToken, wakeTime, sleepTime, dailyCigarettes, days]);

  const handleTabChange = (tab: 'home' | 'stats' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    setActiveTab('home');
  };

  // Startseite vorübergehend ausgeblendet (nicht gelöscht) – direkt zur PIN-Seite
  const SHOW_ONBOARDING = false;
  if (SHOW_ONBOARDING && !hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }


  return (
    <div className="max-w-md mx-auto min-h-screen bg-background">
      {activeTab === 'home' && <HomeScreen />}

      {activeTab === 'stats' && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <StatisticsScreen />
        </Suspense>
      )}

      {/* Kleines Feedback für Extra-Zigaretten */}
      <AnimatePresence>
        {extraFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 z-[60]"
            style={{ top: 'max(env(safe-area-inset-top), 0.5rem)' }}
          >
            <div
              className="-translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-xl border border-primary/40 shadow-md"
              style={{ boxShadow: '0 0 0 2px hsl(var(--primary) / 0.06), 0 6px 20px hsl(150 15% 8% / 0.06)' }}
            >
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-primary-foreground">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[12px] font-semibold text-foreground whitespace-nowrap">{extraFeedback}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddExtra={() => {
          addExtraCigarette(formatLocalDate());
          if ('vibrate' in navigator) navigator.vibrate(12);
          setExtraFeedback('Zusätzliche Zigarette eingetragen');
          setTimeout(() => setExtraFeedback(null), 2200);
        }}
      />

      {/* Einstellungen Sheet */}
      <Suspense fallback={null}>
        {isSettingsOpen && <SettingsSheet isOpen={isSettingsOpen} onClose={handleSettingsClose} />}
      </Suspense>
    </div>
  );
};

export default Index;
