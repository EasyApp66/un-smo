import { useAppStore, applyTheme, formatLocalDate } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import StatisticsScreen from '../components/StatisticsScreen';
import SettingsSheet from '../components/SettingsSheet';
import BottomTabBar from '../components/BottomTabBar';
import PinLockScreen from '../components/PinLockScreen';
import { useEffect, useState } from 'react';
import { syncPushSchedule } from '../lib/push';

const Index = () => {
  const {
    hasCompletedOnboarding,
    themeMode,
    pinHash,
    isLocked,
    lock,
    pushToken,
    wakeTime,
    sleepTime,
    dailyCigarettes,
    addExtraCigarette,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme anwenden (Hell / Dunkel / System)
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // App sperren, wenn sie in den Hintergrund geht (iPhone: Home-Bildschirm-App)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') lock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [lock]);

  // Zeitplan-Änderungen an den Push-Server übertragen (entprellt)
  useEffect(() => {
    if (!pushToken) return;
    const t = setTimeout(() => {
      syncPushSchedule(pushToken, { wakeTime, sleepTime, dailyCigarettes }).catch((e) =>
        console.warn('Push-Sync fehlgeschlagen', e)
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [pushToken, wakeTime, sleepTime, dailyCigarettes]);

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

  // Erster Start: PIN festlegen
  if (!pinHash) {
    return <PinLockScreen mode="setup" />;
  }

  if (isLocked) {
    return <PinLockScreen mode="unlock" />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background">
      {activeTab === 'home' && <HomeScreen />}

      {activeTab === 'stats' && <StatisticsScreen />}

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
      <SettingsSheet isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </div>
  );
};

export default Index;
