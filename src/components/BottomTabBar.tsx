import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings, BarChart3, ArrowUp, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BottomTabBarProps {
  activeTab: 'home' | 'stats' | 'settings';
  onTabChange: (tab: 'home' | 'stats' | 'settings') => void;
  onAddExtra?: () => void;
}

const BottomTabBar = ({ activeTab, onTabChange, onAddExtra }: BottomTabBarProps) => {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'stats' as const, icon: BarChart3, label: 'Statistik' },
    { id: 'settings' as const, icon: Settings, label: 'Einstellungen' },
  ];

  // „Nach oben“-Knopf nur zeigen, wenn man weit unten auf der Seite ist
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setShowTop(scrollable > 200 && window.scrollY > scrollable - 160 && window.scrollY > 300);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
      style={{ bottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
    >
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="top"
            initial={{ opacity: 0, scale: 0.6, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 10 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Nach oben"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 rounded-full bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {onAddExtra && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onAddExtra}
          aria-label="Zusätzliche Zigarette eintragen"
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground border border-primary shadow-lg shadow-primary/40 flex items-center justify-center"
        >
          <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
        </motion.button>
      )}

      <div className="bg-card/95 backdrop-blur-xl rounded-full border border-border/50 shadow-lg px-1.5 py-1.5">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomTabBar;
