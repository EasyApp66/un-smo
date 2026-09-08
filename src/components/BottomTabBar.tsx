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
    let frame = 0;
    let scrollHeight = document.documentElement.scrollHeight;
    let viewport = window.innerHeight;

    const evaluate = () => {
      frame = 0;
      const scrollable = scrollHeight - viewport;
      setShowTop(scrollable > 200 && window.scrollY > scrollable - 160 && window.scrollY > 300);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(evaluate);
    };
    const remeasure = () => {
      scrollHeight = document.documentElement.scrollHeight;
      viewport = window.innerHeight;
      onScroll();
    };

    remeasure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.documentElement);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasure);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
    >
      <div className="relative flex items-center">
        {/* Linker Steckplatz – ohne Transform, per Flex zentriert */}
        <div className="absolute inset-y-0 right-full mr-2 flex items-center pointer-events-none">
          <AnimatePresence>
            {showTop && (
              <motion.button
                key="top"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.9 }}
                aria-label="Nach oben"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="pointer-events-auto w-12 h-12 rounded-full bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground"
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Rechter Steckplatz */}
        {onAddExtra && (
          <div className="absolute inset-y-0 left-full ml-2 flex items-center pointer-events-none">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onAddExtra}
              aria-label="Zusätzliche Zigarette eintragen"
              className="pointer-events-auto w-12 h-12 rounded-full bg-primary text-primary-foreground border border-primary shadow-lg shadow-primary/40 flex items-center justify-center"
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </motion.button>
          </div>
        )}

        <div
          className="bg-card/95 backdrop-blur-xl rounded-full px-1.5 py-1.5"
          style={{
            border: '1.5px solid hsl(var(--primary) / 0.45)',
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.06), 0 8px 24px hsl(var(--primary) / 0.12)',
          }}
        >
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
                  className={`flex items-center justify-center w-12 h-12 rounded-full [transition:background-color_180ms_ease,color_180ms_ease] ${
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
    </div>
  );
};

export default BottomTabBar;
