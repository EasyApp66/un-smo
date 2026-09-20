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

  // Leiste am sichtbaren Ansichtsfenster ausrichten (Safari-Werkzeugleiste, Tastatur)
  const [offset, setOffset] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0;
    // Grösste bisher gesehene sichtbare Höhe merken – beim App-Start meldet iOS
    // manchmal kurz eine zu kleine Höhe, die sonst fälschlich als geöffnete
    // Tastatur gedeutet und das Menü ausgeblendet wird.
    let maxSeen = Math.max(window.innerHeight, vv.height);
    const update = () => {
      frame = 0;
      const visible = vv.height + vv.offsetTop;
      maxSeen = Math.max(maxSeen, window.innerHeight, visible);
      const bottomGap = window.innerHeight - visible;
      setOffset(Math.max(0, bottomGap));
      // Tastatur nur als geöffnet werten, wenn die sichtbare Höhe deutlich
      // unter dem bisherigen Maximum liegt – nie anhand des aktuellen Fensters.
      setKeyboardOpen(vv.height < maxSeen * 0.72 && vv.height < window.innerHeight * 0.9);
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  // „Nach oben“-Knopf nur zeigen, wenn man weit unten auf der Seite ist
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    let frame = 0;
    let scrollHeight = document.documentElement.scrollHeight;
    let viewport = window.innerHeight;

    const evaluate = () => {
      frame = 0;
      const scrollable = scrollHeight - viewport;
      setShowTop(scrollable > 200 && window.scrollY > scrollable * 0.5 && window.scrollY > 200);
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
      className="fixed left-1/2 z-50"
      style={{
        bottom: 'max(env(safe-area-inset-bottom), 12px)',
        transform: `translate3d(-50%, ${-offset}px, 0)`,
        visibility: keyboardOpen ? 'hidden' : 'visible',
      }}
    >
      <div className="relative flex items-center">
        {/* Linker Steckplatz */}
        <div className="absolute inset-y-0 right-full mr-[10px] flex items-center pointer-events-none">
          <AnimatePresence>
            {showTop && (
              <motion.button
                key="top"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.94 }}
                aria-label="Nach oben"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="glass pointer-events-auto w-16 h-16 rounded-pill flex items-center justify-center text-subtle"
              >
                <ArrowUp className="w-5 h-5" strokeWidth={1.75} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Rechter Steckplatz */}
        {onAddExtra && (
          <div className="absolute inset-y-0 left-full ml-[10px] flex items-center pointer-events-none">
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={onAddExtra}
              aria-label="Zusätzliche Zigarette eintragen"
              className="glass-tint pointer-events-auto w-16 h-16 rounded-pill flex items-center justify-center"
            >
              <Plus className="w-6 h-6" strokeWidth={1.75} />
            </motion.button>
          </div>
        )}

        <div className="glass rounded-pill h-16 px-1 flex items-center">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  className={`flex items-center justify-center w-14 h-14 rounded-[24px] [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1),color_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                    isActive ? 'glass-tint-flat' : 'text-subtle'
                  }`}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2 : 1.75} />
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
