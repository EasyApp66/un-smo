import { useAppStore } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import StatisticsScreen from '../components/StatisticsScreen';
import SettingsSheet from '../components/SettingsSheet';
import BottomTabBar from '../components/BottomTabBar';
import { useEffect, useState } from 'react';

const Index = () => {
  const { hasCompletedOnboarding, isDarkMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle tab change
  const handleTabChange = (tab: 'home' | 'stats' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  // When settings closes, go back to home
  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    setActiveTab('home');
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background">
      {activeTab === 'home' && (
        <HomeScreen onOpenSettings={() => setIsSettingsOpen(true)} />
      )}
      
      {activeTab === 'stats' && (
        <StatisticsScreen />
      )}
      
      {/* Bottom Navigation */}
      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Einstellungen Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
    </div>
  );
};

export default Index;
