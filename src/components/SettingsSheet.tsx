import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsSheet = ({ isOpen, onClose }: SettingsSheetProps) => {
  const {
    wakeTime,
    sleepTime,
    dailyCigarettes,
    isDarkMode,
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
    toggleDarkMode,
  } = useAppStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 max-h-[90vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-brutal-md">Settings</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto px-6 py-6 space-y-8 max-h-[70vh] hide-scrollbar safe-bottom">
              {/* Wake & Sleep Times */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Your Schedule
                </h3>
                <div className="flex justify-around">
                  <TimePicker
                    value={wakeTime}
                    onChange={setWakeTime}
                    label="Wake Up"
                  />
                  <TimePicker
                    value={sleepTime}
                    onChange={setSleepTime}
                    label="Bedtime"
                  />
                </div>
              </section>
              
              {/* Daily Cigarettes */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Daily Goal
                </h3>
                <div className="bg-card rounded-2xl p-6">
                  <WheelPicker
                    value={dailyCigarettes}
                    min={0}
                    max={60}
                    step={1}
                    onChange={setDailyCigarettes}
                    label="Cigarettes per day"
                  />
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Lower = longer breaks = stronger you
                  </p>
                </div>
              </section>
              
              {/* Theme Toggle */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Appearance
                </h3>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between p-5 bg-card rounded-2xl"
                >
                  <span className="text-lg font-semibold">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <div
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-primary glow-cyan' : 'bg-muted'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isDarkMode ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-7 h-7 rounded-full bg-background shadow-lg"
                    />
                  </div>
                </motion.button>
              </section>
              
              {/* Premium */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Unlock More
                </h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-5 bg-gradient-to-r from-primary to-violet rounded-2xl glow-cyan"
                  >
                    <div className="text-left">
                      <p className="text-lg font-bold text-primary-foreground">
                        Lifetime Access
                      </p>
                      <p className="text-sm text-primary-foreground/80">
                        One-time purchase • 20 CHF
                      </p>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-5 bg-card border-2 border-secondary/30 rounded-2xl"
                  >
                    <div className="text-left">
                      <p className="text-lg font-bold">
                        Subscribe
                      </p>
                      <p className="text-sm text-muted-foreground">
                        1 CHF / month • Custom themes, stats & more
                      </p>
                    </div>
                  </motion.button>
                </div>
              </section>
              
              {/* Danger Zone */}
              <section className="pt-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 text-destructive text-center font-semibold"
                >
                  Delete All Data
                </motion.button>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsSheet;
