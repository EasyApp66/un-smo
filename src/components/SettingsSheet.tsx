import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, AlertTriangle, Globe, Sun, Moon, Smartphone, Bell, BellOff } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

import { enablePush, disablePush, sendTestPush } from '../lib/push';
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

const EASE = [0.22, 1, 0.36, 1] as const;

const GroupTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="t-12 font-medium uppercase tracking-[0.08em] text-subtle mb-3">{children}</h3>
);

const Toggle = ({ on }: { on: boolean }) => (
  <span
    className={`w-12 h-7 rounded-pill p-1 shrink-0 [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1)] ${
      on ? 'bg-primary' : 'bg-border'
    }`}
  >
    <span
      className="block w-5 h-5 rounded-pill bg-card [transition:transform_180ms_cubic-bezier(0.22,1,0.36,1)]"
      style={{ transform: on ? 'translateX(20px)' : 'none' }}
    />
  </span>
);

const SettingsSheet = ({ isOpen, onClose }: SettingsSheetProps) => {
  const {
    wakeTime,
    sleepTime,
    dailyCigarettes,
    themeMode,
    applyScheduleToAllDays,
    pushEnabled,
    pushToken,
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
    setThemeMode,
    setPushEnabled,
    toggleApplyScheduleToAllDays,
    deleteAllData,
  } = useAppStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  const handleDeleteAllData = async () => {
    if (pushToken) await disablePush(pushToken).catch(() => undefined);
    deleteAllData();
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleTestPush = async () => {
    if (!pushToken) return;
    setPushBusy(true);
    setPushMessage(null);
    try {
      await sendTestPush(pushToken);
      setPushMessage('Test gesendet – die Meldung sollte in wenigen Sekunden erscheinen.');
    } catch {
      setPushMessage('Test fehlgeschlagen. Bitte Push aus- und wieder einschalten.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleTogglePush = async () => {
    setPushBusy(true);
    setPushMessage(null);
    try {
      if (pushEnabled) {
        if (pushToken) await disablePush(pushToken);
        setPushEnabled(false);
        setPushMessage('Push-Meldungen sind aus.');
      } else {
        const result = await enablePush({ wakeTime, sleepTime, dailyCigarettes });
        if (result.status === 'registered') {
          setPushEnabled(true, result.token);
          setPushMessage('Aktiv. Du erhältst zu jeder Erinnerungszeit eine Meldung.');
        } else if (result.status === 'open-in-new-tab') {
          setPushMessage('Bitte die App in einem eigenen Tab oder vom Home-Bildschirm öffnen – in der Vorschau geht das nicht.');
        } else if (result.status === 'denied') {
          setPushMessage('Erlaubnis abgelehnt. Bitte in den iPhone-Einstellungen unter Mitteilungen erlauben.');
        } else if (result.status === 'unsupported') {
          setPushMessage('Auf diesem Gerät nur möglich, wenn die App zum Home-Bildschirm hinzugefügt wurde (Safari → Teilen → Zum Home-Bildschirm).');
        } else {
          setPushMessage('Push ist noch nicht eingerichtet (Verbindung fehlt).');
        }
      }
    } catch (e) {
      console.error(e);
      setPushMessage('Das hat nicht geklappt. Bitte später erneut versuchen.');
    } finally {
      setPushBusy(false);
    }
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
            transition={{ duration: 0.2, ease: EASE }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[32px] z-50 max-h-[90vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-subtle/40 rounded-pill" />
            </div>

            {/* Kopfbereich */}
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="t-24 text-foreground">Einstellungen</h2>
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="w-12 h-12 rounded-md bg-card flex items-center justify-center text-subtle"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Inhalt */}
            <div className="overflow-y-auto px-4 py-4 space-y-6 max-h-[70vh] hide-scrollbar safe-bottom">
              {/* Zeitplan für alle Tage */}
              <section>
                <button
                  onClick={toggleApplyScheduleToAllDays}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">Zeitplan für alle Tage</span>
                    <span className="t-12 text-subtle">Änderungen auf alle Tage anwenden</span>
                  </span>
                  <Toggle on={applyScheduleToAllDays} />
                </button>
              </section>

              {/* Aufsteh- & Schlafenszeiten */}
              <section>
                <GroupTitle>Dein Zeitplan</GroupTitle>
                <div className="grid grid-cols-2 gap-[10px]">
                  <TimePicker value={wakeTime} onChange={setWakeTime} label="Aufstehzeit" compact />
                  <TimePicker value={sleepTime} onChange={setSleepTime} label="Schlafenszeit" compact />
                </div>
              </section>

              {/* Tagesziel Zigaretten */}
              <section>
                <GroupTitle>Tagesziel</GroupTitle>
                <div className="surface-card p-5">
                  <WheelPicker
                    value={dailyCigarettes}
                    min={0}
                    max={60}
                    step={1}
                    onChange={setDailyCigarettes}
                    label="Zigaretten pro Tag"
                    compact
                  />
                  <p className="text-center t-12 text-subtle mt-3">
                    Weniger = längere Pausen = mehr Stärke
                  </p>
                </div>
              </section>

              {/* Darstellung */}
              <section>
                <GroupTitle>Darstellung</GroupTitle>
                <div className="surface-card p-1.5 grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'light', label: 'Hell', Icon: Sun },
                      { id: 'dark', label: 'Dunkel', Icon: Moon },
                      { id: 'system', label: 'System', Icon: Smartphone },
                    ] as const
                  ).map(({ id, label, Icon }) => {
                    const active = themeMode === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setThemeMode(id)}
                        className={`h-12 rounded-md flex items-center justify-center gap-1.5 t-14 font-medium [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1),color_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                          active ? 'bg-primary text-primary-foreground' : 'text-subtle'
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Push-Meldungen */}
              <section>
                <GroupTitle>Erinnerungen</GroupTitle>
                <div className="surface-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {pushEnabled ? (
                        <Bell className="w-5 h-5 text-primary" strokeWidth={1.75} />
                      ) : (
                        <BellOff className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                      )}
                      <div>
                        <span className="t-16 block text-foreground">Push-Meldungen</span>
                        <span className="t-12 text-subtle">Auch bei geschlossener App</span>
                      </div>
                    </div>
                    <button
                      disabled={pushBusy}
                      onClick={handleTogglePush}
                      aria-label="Push-Meldungen umschalten"
                      className={pushBusy ? 'opacity-60' : ''}
                    >
                      <Toggle on={pushEnabled} />
                    </button>
                  </div>
                  {pushEnabled && pushToken && (
                    <button
                      disabled={pushBusy}
                      onClick={handleTestPush}
                      className="btn-pill btn-secondary w-full mt-4 disabled:opacity-60"
                    >
                      Test-Meldung senden
                    </button>
                  )}
                  {pushMessage && <p className="t-12 text-subtle mt-3">{pushMessage}</p>}
                </div>
              </section>

              {/* Sprache */}
              <section>
                <GroupTitle>Sprache</GroupTitle>
                <div className="surface-card px-4 min-h-[56px] flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                    <span className="t-16 text-foreground">Deutsch</span>
                  </span>
                  <span className="t-12 text-primary">Aktiv</span>
                </div>
              </section>

              {/* Premium */}
              <section>
                <GroupTitle>Mehr freischalten</GroupTitle>
                <div className="space-y-[10px]">
                  <button className="w-full p-5 rounded-card bg-primary text-left">
                    <p className="t-16 font-medium text-primary-foreground">Lebenslanger Zugang</p>
                    <p className="t-12 text-primary-foreground/70">Einmaliger Kauf • 20 CHF</p>
                  </button>

                  <button className="surface-card w-full p-5 text-left">
                    <p className="t-16 font-medium text-foreground">Abonnieren</p>
                    <p className="t-12 text-subtle">
                      1 CHF / Monat • Eigene Themes, Statistiken &amp; mehr
                    </p>
                  </button>
                </div>
              </section>

              {/* Rechtliches */}
              <section>
                <GroupTitle>Rechtliches</GroupTitle>
                <div className="surface-card overflow-hidden">
                  <button className="w-full px-4 min-h-[56px] flex items-center justify-between border-b border-border/60">
                    <span className="t-16 text-foreground">AGB</span>
                    <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                  </button>
                  <button className="w-full px-4 min-h-[56px] flex items-center justify-between border-b border-border/60">
                    <span className="t-16 text-foreground">Datenschutzerklärung</span>
                    <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                  </button>
                  <button className="w-full px-4 min-h-[56px] flex items-center justify-between">
                    <span className="t-16 text-foreground">Nutzungsbedingungen</span>
                    <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                  </button>
                </div>
              </section>

              {/* Gefahrenzone */}
              <section className="pb-6">
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <button className="btn-pill w-full text-destructive gap-2">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
                      Alle Daten löschen
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm mx-4 rounded-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="t-20">Wirklich alle Daten löschen?</AlertDialogTitle>
                      <AlertDialogDescription className="t-14 text-subtle">
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Einstellungen,
                        Erinnerungen und Fortschritte werden dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-pill">Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllData}
                        className="rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
