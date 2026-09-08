import { useAppStore, applyTheme, formatLocalDate } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import BottomTabBar from '../components/BottomTabBar';
import { useEffect, useState, lazy, Suspense } from 'react';

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

      {/* Bottom Navigation */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAddExtra={() => {
          addExtraCigarette(formatLocalDate());
          if ('vibrate' in navigator) navigator.vibrate(12);
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
