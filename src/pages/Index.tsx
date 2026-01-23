import { useAppStore } from '../store/appStore';
import OnboardingScreen from '../components/OnboardingScreen';
import HomeScreen from '../components/HomeScreen';
import { useEffect } from 'react';

const Index = () => {
  const { hasCompletedOnboarding, isDarkMode } = useAppStore();

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return <HomeScreen />;
};

export default Index;
