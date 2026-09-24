import { useAppStore, applyTheme, formatLocalDate } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import BottomTabBar from '../components/BottomTabBar';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
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
    extraButtonEnabled,
    completeMeasurementIfNeeded,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [extraFeedback, setExtraFeedback] = useState<number | null>(null);

  // Theme anwenden (Hell / Dunkel / System)
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    completeMeasurementIfNeeded(formatLocalDate());
  }, [completeMeasurementIfNeeded, days]);


  // Zeitplan-Änderungen an den Push-Server übertragen (entprellt)
  useEffect(() => {
    if (!pushToken) return;
    const t = setTimeout(() => {
      syncPushSchedule(pushToken, { wakeTime, sleepTime, dailyCigarettes })
        .then(() => { pushSyncFailed.current = false; })
        .catch((e) => {
          pushSyncFailed.current = true;
          console.warn('Push-Sync fehlgeschlagen', e);
        });
    }, 1500);
    return () => clearTimeout(t);
  }, [pushToken, wakeTime, sleepTime, dailyCigarettes, days]);

  // Fehlgeschlagenen Abgleich (z. B. offline) beim nächsten Online-/Sichtbar-Ereignis nachholen
  const pushSyncFailed = useRef(false);
  useEffect(() => {
    if (!pushToken) return;
    const retry = () => {
      if (!pushSyncFailed.current) return;
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      const s = useAppStore.getState();
      syncPushSchedule(pushToken, { wakeTime: s.wakeTime, sleepTime: s.sleepTime, dailyCigarettes: s.dailyCigarettes })
        .then(() => { pushSyncFailed.current = false; })
        .catch((e) => console.warn('Push-Sync fehlgeschlagen', e));
    };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, [pushToken]);

  const handleTabChange = (tab: 'home' | 'stats' | 'settings') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nur beim allerersten Start: kein Kennzeichen und keine lokalen Daten.
  if (!hasCompletedOnboarding && Object.keys(days).length === 0) {
    return <OnboardingScreen />;
  }


  return (
    <div className="max-w-md mx-auto min-h-[100dvh] bg-background">
      {activeTab === 'home' && <HomeScreen />}

      {activeTab === 'stats' && (
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
          <StatisticsScreen />
        </Suspense>
      )}

      {activeTab === 'settings' && (
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
          <SettingsSheet />
        </Suspense>
      )}

      {/* Kleines Feedback für Extra-Zigaretten */}
      <AnimatePresence>
        {extraFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 z-[60]"
            style={{ top: 'max(env(safe-area-inset-top), 12px)' }}
          >
            <div className="surface-float -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-pill backdrop-blur-xl">
              <span className="w-5 h-5 rounded-pill bg-primary flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="text-primary-foreground">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="t-16 font-medium num text-foreground leading-none">{extraFeedback}</span>
                <span className="t-14 text-subtle leading-none">
                  Extra-Zigarette{extraFeedback !== 1 ? 'n' : ''}
                </span>
              </div>
            </div>
          </motion.div>

        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddExtra={
          extraButtonEnabled
            ? () => {
                addExtraCigarette(formatLocalDate());
                if ('vibrate' in navigator) navigator.vibrate(12);
                const extraCount =
                  useAppStore.getState().days[formatLocalDate()]?.reminders.filter((r) => r.extra).length || 0;
                setExtraFeedback(extraCount);
                setTimeout(() => setExtraFeedback(null), 2200);
              }
            : undefined
        }
      />

    </div>
  );
};

export default Index;
