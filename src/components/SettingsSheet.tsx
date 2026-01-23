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
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
    toggleDarkMode,
    deleteAllData,
  } = useAppStore();

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-brutal-md">Einstellungen</h2>
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
              {/* Aufsteh- & Schlafenszeiten */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Dein Zeitplan
                </h3>
                <div className="flex justify-around">
                  <TimePicker
                    value={wakeTime}
                    onChange={setWakeTime}
                    label="Aufstehzeit"
                  />
                  <TimePicker
                    value={sleepTime}
                    onChange={setSleepTime}
                    label="Schlafenszeit"
                  />
                </div>
              </section>
              
              {/* Tagesziel Zigaretten */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Tagesziel
                </h3>
                <div className="bg-card rounded-2xl p-6">
                  <WheelPicker
                    value={dailyCigarettes}
                    min={0}
                    max={60}
                    step={1}
                    onChange={setDailyCigarettes}
                    label="Zigaretten pro Tag"
                  />
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Weniger = längere Pausen = mehr Stärke
                  </p>
                </div>
              </section>
              
              {/* Theme Umschalter */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Darstellung
                </h3>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between p-5 bg-card rounded-2xl"
                >
                  <span className="text-lg font-semibold">
                    {isDarkMode ? 'Dunkelmodus' : 'Hellmodus'}
                  </span>
                  <div
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 ${
                      isDarkMode ? 'bg-primary glow-green' : 'bg-muted'
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

              {/* Sprache */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Sprache
                </h3>
                <div className="bg-card rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">Deutsch</span>
                  </div>
                  <span className="text-sm text-primary font-medium">Aktiv</span>
                </div>
              </section>
              
              {/* Premium */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Mehr freischalten
                </h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-5 bg-gradient-to-r from-primary to-secondary rounded-2xl glow-green"
                  >
                    <div className="text-left">
                      <p className="text-lg font-bold text-primary-foreground">
                        Lebenslanger Zugang
                      </p>
                      <p className="text-sm text-primary-foreground/80">
                        Einmaliger Kauf • 20 CHF
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
                        Abonnieren
                      </p>
                      <p className="text-sm text-muted-foreground">
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
                  className="w-full p-4 bg-card rounded-2xl text-foreground text-center font-semibold flex items-center justify-center gap-2"
                >
                  Abmelden
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </section>

              {/* Rechtliches */}
              <section>
                <h3 className="text-brutal-sm text-muted-foreground mb-4">
                  Rechtliches
                </h3>
                <div className="bg-card rounded-2xl overflow-hidden">
                  <button className="w-full p-4 flex items-center justify-between border-b border-border hover:bg-muted/50 transition-colors">
                    <span className="font-medium">AGB</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between border-b border-border hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Datenschutzerklärung</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-medium">Nutzungsbedingungen</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </section>
              
              {/* Gefahrenzone */}
              <section className="pt-4">
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 text-destructive text-center font-semibold flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Alle Daten löschen
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
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
