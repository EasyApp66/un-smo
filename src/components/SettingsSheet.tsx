import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, AlertTriangle, Globe } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

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
    applyScheduleToAllDays,
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
    toggleDarkMode,
    toggleApplyScheduleToAllDays,
    deleteAllData,
  } = useAppStore();

  const handleLogout = () => {
    // Reset hasCompletedOnboarding to show welcome screen
    useAppStore.setState({ hasCompletedOnboarding: false });
    onClose();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAllData = () => {
    deleteAllData();
    setShowDeleteConfirm(false);
    onClose();
  };

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
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-xl font-bold">Einstellungen</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto px-4 py-4 space-y-5 max-h-[70vh] hide-scrollbar safe-bottom">
              {/* NEU: Zeitplan für alle Tage Toggle */}
              <section>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleApplyScheduleToAllDays}
                  className="w-full flex items-center justify-between p-3 bg-card rounded-xl border border-primary/20"
                >
                  <div className="text-left">
                    <span className="text-sm font-semibold block">
                      Zeitplan für alle Tage
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Änderungen auf alle Tage anwenden
                    </span>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
                      applyScheduleToAllDays ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <motion.div
                      animate={{ x: applyScheduleToAllDays ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-background shadow-lg"
                    />
                  </div>
                </motion.button>
              </section>

              {/* Aufsteh- & Schlafenszeiten */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Dein Zeitplan
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <TimePicker
                    value={wakeTime}
                    onChange={setWakeTime}
                    label="Aufstehzeit"
                    compact
                  />
                  <TimePicker
                    value={sleepTime}
                    onChange={setSleepTime}
                    label="Schlafenszeit"
                    compact
                  />
                </div>
              </section>
              
              {/* Tagesziel Zigaretten */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Tagesziel
                </h3>
                <div className="bg-card rounded-xl p-4">
                  <WheelPicker
                    value={dailyCigarettes}
                    min={0}
                    max={60}
                    step={1}
                    onChange={setDailyCigarettes}
                    label="Zigaretten pro Tag"
                    compact
                  />
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Weniger = längere Pausen = mehr Stärke
                  </p>
                </div>
              </section>
              
              {/* Theme Umschalter */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Darstellung
                </h3>
                <div className="bg-card rounded-xl p-1.5 grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'light', label: 'Hell', Icon: Sun },
                      { id: 'dark', label: 'Dunkel', Icon: Moon },
                      { id: 'system', label: 'System', Icon: Smartphone },
                    ] as const
                  ).map(({ id, label, Icon }) => {
                    const active = themeMode === id;
                    return (
                      <motion.button
                        key={id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setThemeMode(id)}
                        className={`relative h-11 rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors ${
                          active ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="theme-pill"
                            className="absolute inset-0 rounded-lg bg-primary"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Icon className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Push-Meldungen */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Erinnerungen
                </h3>
                <div className="bg-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pushEnabled ? (
                        <Bell className="w-4 h-4 text-primary" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <span className="text-base font-semibold block">Push-Meldungen</span>
                        <span className="text-xs text-muted-foreground">
                          Auch bei geschlossener App
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      disabled={pushBusy}
                      onClick={handleTogglePush}
                      aria-label="Push-Meldungen umschalten"
                      className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
                        pushEnabled ? 'bg-primary' : 'bg-muted'
                      } ${pushBusy ? 'opacity-60' : ''}`}
                    >
                      <motion.div
                        animate={{ x: pushEnabled ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-background shadow-lg"
                      />
                    </motion.button>
                  </div>
                  {pushMessage && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{pushMessage}</p>
                  )}
                </div>
              </section>

              {/* Sicherheit */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Sicherheit
                </h3>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPinChange(true)}
                  className="w-full bg-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    <span className="text-base font-semibold">PIN ändern</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </section>

              {/* Sprache */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Sprache
                </h3>
                <div className="bg-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-base font-semibold">Deutsch</span>
                  </div>
                  <span className="text-xs text-primary font-medium">Aktiv</span>
                </div>
              </section>
              
              {/* Premium */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Mehr freischalten
                </h3>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 bg-gradient-to-r from-primary to-secondary rounded-xl"
                  >
                    <div className="text-left">
                      <p className="text-base font-bold text-primary-foreground">
                        Lebenslanger Zugang
                      </p>
                      <p className="text-xs text-primary-foreground/80">
                        Einmaliger Kauf • 20 CHF
                      </p>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 bg-card border border-secondary/30 rounded-xl"
                  >
                    <div className="text-left">
                      <p className="text-base font-bold">
                        Abonnieren
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 CHF / Monat • Eigene Themes, Statistiken & mehr
                      </p>
                    </div>
                  </motion.button>
                </div>
              </section>

              {/* Abmelden */}
              <section>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full p-3 bg-card rounded-xl text-foreground text-center font-semibold flex items-center justify-center gap-2"
                >
                  Abmelden
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </section>

              {/* Rechtliches */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Rechtliches
                </h3>
                <div className="bg-card rounded-xl overflow-hidden">
                  <button className="w-full p-3 flex items-center justify-between border-b border-border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">AGB</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="w-full p-3 flex items-center justify-between border-b border-border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Datenschutzerklärung</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Nutzungsbedingungen</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </section>
              
              {/* Gefahrenzone */}
              <section className="pb-4">
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 text-destructive text-center font-semibold flex items-center justify-center gap-2 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Alle Daten löschen
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Wirklich alle Daten löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Einstellungen, 
                        Erinnerungen und Fortschritte werden dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Ja, alle löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsSheet;
