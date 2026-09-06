import { motion } from 'framer-motion';
import { Home, Settings, BarChart3 } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: 'home' | 'stats' | 'settings';
  onTabChange: (tab: 'home' | 'stats' | 'settings') => void;
}

const BottomTabBar = ({ activeTab, onTabChange }: BottomTabBarProps) => {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'stats' as const, icon: BarChart3, label: 'Statistik' },
    { id: 'settings' as const, icon: Settings, label: 'Einstellungen' },
  ];

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50" style={{ bottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}>
      <div className="bg-card/95 backdrop-blur-xl rounded-full border border-border/50 shadow-lg px-1 py-1">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center p-2.5 rounded-full transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomTabBar;
