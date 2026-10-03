import { ChevronRight, ChevronDown, AlertTriangle, Sun, Moon, Smartphone, Bell, BellOff, RotateCcw, ShieldCheck, Clock, TrendingDown, Sparkles, Palette, User, Database, Info, type LucideIcon } from 'lucide-react';
import { useT, useLocale, tr } from '@/lib/i18n';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from './ui/button';
import { useAppStore, resolveIsDark } from '../store/appStore';
import { tap } from '../lib/haptics';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';
import { ODD_GOAL_VALUES } from '@/lib/reductionPlan';

import { enablePush, disablePush, sendTestPush } from '../lib/push';
import { formatMoney, weeklyActuals, type CurrencyCode, weekKey } from '@/lib/reductionPlan';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';
import { supabase } from '@/integrations/supabase/client';
import EmailCodeSignIn from './EmailCodeSignIn';
import { APP_VERSION } from '@/lib/appVersion';
import { goTo } from '@/lib/navigate';
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

const SettingsGroup = ({ id, icon: Icon, title, summary, open, onToggle, children }: { id: string; icon: LucideIcon; title: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => {
  const header = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    onToggle();
    if (!open) requestAnimationFrame(() => header.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
  };
  const ease = '[transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1),border-color_180ms_cubic-bezier(0.22,1,0.36,1),color_180ms_cubic-bezier(0.22,1,0.36,1)]';
  return <section>
    <Button
      ref={header}
      variant="ghost"
      aria-expanded={open}
      aria-controls={`settings-${id}`}
      onClick={toggle}
      className={`surface-card w-full min-h-16 h-auto p-4 flex items-center justify-between gap-3 text-left whitespace-normal scroll-mt-6 ${ease} ${open ? 'sticky z-20 border border-primary/40 hover:bg-transparent' : 'hover:bg-card'}`}
      style={open ? { top: 'max(env(safe-area-inset-top), 8px)', background: 'linear-gradient(hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1)), hsl(var(--card))' } : undefined}
    >
      <Icon className="w-5 h-5 shrink-0 text-primary" strokeWidth={1.75} />
      <span className="min-w-0 flex-1"><span className="block t-16 text-foreground">{title}</span><span className="block t-12 text-subtle font-normal break-words">{summary}</span></span>
      <ChevronDown className={`w-5 h-5 shrink-0 [transition:transform_180ms_cubic-bezier(0.22,1,0.36,1),color_180ms_cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180 text-primary' : 'text-subtle'}`} strokeWidth={1.75} />
    </Button>
    <div id={`settings-${id}`} className={`grid [transition:grid-template-rows_180ms_cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} aria-hidden={!open} {...(!open ? { inert: '' } : {})}>
      <div className="min-h-0 overflow-hidden">
        <div className="ml-3 pl-3 border-l-2 border-primary/30 space-y-[10px] pt-[10px]">
          {children}
          <button type="button" onClick={toggle} className="w-full h-11 t-14 text-subtle text-center">{tr('Zuklappen', 'Collapse')}</button>
        </div>
      </div>
    </div>
  </section>;
};

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

const SettingsSheet = () => {
  const t = useT();
  const locale = useLocale();
  const {
    wakeTime,
    sleepTime,
    dailyCigarettes,
    themeMode,
    applyScheduleToAllDays,
    pushEnabled,
    pushToken,
    extraButtonEnabled,
    extraReductionEnabled,
    homeSavingsEnabled,
    reductionPlan,
    days,
    language,
    setLanguage,
    setWakeTime,
    setSleepTime,
    setDailyCigarettes,
    setThemeMode,
    resetOnboarding,
    setPlanMoney,
    updateReductionPlan,
    toggleAutomaticReduction,
    togglePauseThisWeek,
    setPushEnabled,
    toggleExtraButtonEnabled,
    toggleExtraReductionEnabled,
    toggleHomeSavingsEnabled,
    toggleApplyScheduleToAllDays,
    deleteAllData,
  } = useAppStore();
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update);
    update();
    return () => query.removeEventListener('change', update);
  }, []);
  const isDark = themeMode === 'system' ? systemDark : resolveIsDark(themeMode);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [versionTaps, setVersionTaps] = useState(0);
  const [account, setAccount] = useState<AccountStatus>(defaultAccountStatus);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [showAccountDelete, setShowAccountDelete] = useState(false);
  const [deleteWord, setDeleteWord] = useState('');
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);
  const [subBusy, setSubBusy] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('un-smo-settings-groups') || '[]') as string[]; }
    catch { return []; }
  });
  const toggleGroup = (id: string) => setOpenGroups((current) => {
    const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
    sessionStorage.setItem('un-smo-settings-groups', JSON.stringify(next));
    return next;
  });


  useEffect(() => {
    fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const actualRows = useMemo(() => weeklyActuals(days, reductionPlan).slice(0, 12), [days, reductionPlan]);
  const thisWeekPaused = reductionPlan.pausedWeekKeys.includes(weekKey(new Date().toISOString().slice(0, 10)));

  const isLifetime = account.paymentStatus === 'lifetime';
  const isPaying = account.paymentStatus === 'active' || isLifetime;
  const purchasedAt = account.paidSince ? new Date(account.paidSince).toLocaleDateString(locale) : null;
  const planLabel = isLifetime
    ? t(
        `Lebenslang — einmalig bezahlt${purchasedAt ? ` am ${purchasedAt}` : ''}. Es fallen keine weiteren Kosten an.`,
        `Lifetime — paid once${purchasedAt ? ` on ${purchasedAt}` : ''}. No further costs.`,
      )
    : t('Abonnement, laufend', 'Subscription, ongoing');
  const renewalLabel = account.trialEndsAt
    ? t(`Nächste Abbuchung: ${new Date(account.trialEndsAt).toLocaleDateString(locale)}`, `Next charge: ${new Date(account.trialEndsAt).toLocaleDateString(locale)}`)
    : t('Nächste Abbuchung: wird nach der Zahlung angezeigt', 'Next charge: shown after payment');



  const handleDeleteAllData = async () => {
    if (pushToken) await disablePush(pushToken).catch(() => undefined);
    deleteAllData();
    setShowDeleteConfirm(false);
  };

  const handleTestPush = async () => {
    if (!pushToken) return;
    setPushBusy(true);
    setPushMessage(null);
    try {
      await sendTestPush(pushToken);
      setPushMessage(t('Test gesendet – die Meldung sollte in wenigen Sekunden erscheinen.', 'Test sent – the notification should appear in a few seconds.'));
    } catch {
      setPushMessage(t('Test fehlgeschlagen. Bitte Push aus- und wieder einschalten.', 'Test failed. Please turn push off and on again.'));
    } finally {
      setPushBusy(false);
    }
  };

  const handleSignedIn = () => {
    setAccountMessage(t('Angemeldet.', 'Signed in.'));
    fetchAccountStatus().then(setAccount).catch(() => undefined);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccount(defaultAccountStatus);
  };

  const handleDeleteAccount = async () => {
    setAccountBusy(true);
    setAccountMessage(null);
    try {
      if (account.signedIn) {
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) throw error;
      }
      if (pushToken) await disablePush(pushToken).catch(() => undefined);
      deleteAllData();
      setAccount(defaultAccountStatus);
      setShowAccountDelete(false);
      setDeleteWord('');
      setAccountMessage(t('Konto und Daten wurden gelöscht.', 'Account and data have been deleted.'));
    } catch {
      setAccountMessage(t('Konto konnte nicht gelöscht werden.', 'The account could not be deleted.'));
    } finally {
      setAccountBusy(false);
    }
  };

  const handleExport = () => {
    const state = useAppStore.getState();
    const payload = {
      exportiertAm: new Date().toISOString(),
      wakeTime: state.wakeTime,
      sleepTime: state.sleepTime,
      dailyCigarettes: state.dailyCigarettes,
      reductionPlan: state.reductionPlan,
      days: state.days,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `un-smo-daten-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const notReady = t(
    'Zahlungen sind noch nicht freigeschaltet. Sobald der Zahlungsanbieter aktiv ist, öffnet sich hier das Kundenportal.',
    'Payments are not enabled yet. Once the payment provider is active, the customer portal will open here.',
  );

  const handleOpenPortal = async () => {
    setSubBusy(true);
    setSubMessage(notReady);
    setSubBusy(false);
  };

  const handleCancelInApp = async () => {
    setSubBusy(true);
    setSubMessage(notReady);
    setSubBusy(false);
  };

  const handleRestore = async () => {
    setSubBusy(true);
    setSubMessage(null);
    try {
      const status = await fetchAccountStatus();
      setAccount(status);
      setSubMessage(status.access ? t('Kauf wiederhergestellt.', 'Purchase restored.') : t('Kein aktiver Kauf gefunden.', 'No active purchase found.'));
    } catch {
      setSubMessage(t('Wiederherstellen hat nicht geklappt. Bitte später erneut versuchen.', 'Restoring did not work. Please try again later.'));
    } finally {
      setSubBusy(false);
    }
  };


  const handleTogglePush = async () => {
    setPushBusy(true);
    setPushMessage(null);
    try {
      if (pushEnabled) {
        if (pushToken) await disablePush(pushToken);
        setPushEnabled(false);
        setPushMessage(t('Push-Meldungen sind aus.', 'Push notifications are off.'));
      } else {
        const result = await enablePush({ wakeTime, sleepTime, dailyCigarettes });
        if (result.status === 'registered') {
          setPushEnabled(true, result.token);
          setPushMessage(t('Aktiv. Du erhältst zu jeder Erinnerungszeit eine Meldung.', 'Active. You will get a notification at every reminder time.'));
        } else if (result.status === 'open-in-new-tab') {
          setPushMessage(t('Bitte die App in einem eigenen Tab oder vom Home-Bildschirm öffnen – in der Vorschau geht das nicht.', 'Please open the app in its own tab or from the home screen – this does not work in the preview.'));
        } else if (result.status === 'denied') {
          setPushMessage(t('Erlaubnis abgelehnt. Bitte in den iPhone-Einstellungen unter Mitteilungen erlauben.', 'Permission denied. Please allow it under Notifications in your iPhone settings.'));
        } else if (result.status === 'unsupported') {
          setPushMessage(t('Auf diesem Gerät nur möglich, wenn die App zum Home-Bildschirm hinzugefügt wurde (Safari → Teilen → Zum Home-Bildschirm).', 'On this device this only works if the app was added to the home screen (Safari → Share → Add to Home Screen).'));
        } else {
          setPushMessage(t('Push ist noch nicht eingerichtet (Verbindung fehlt).', 'Push is not set up yet (connection missing).'));
        }
      }
    } catch (e) {
      console.error(e);
      setPushMessage(t('Das hat nicht geklappt. Bitte später erneut versuchen.', 'That did not work. Please try again later.'));
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 pb-32 safe-top">
      <div className="pt-3 pb-5 flex items-center justify-between gap-4">
        <h2 className="t-24 text-foreground">{t('Einstellungen', 'Settings')}</h2>
        <Button
          type="button"
          variant="ghost"
          role="switch"
          aria-label={t('Dunkelmodus', 'Dark mode')}
          aria-checked={isDark}
          onClick={() => { setThemeMode(isDark ? 'light' : 'dark'); tap(); }}
          className="relative w-16 h-8 shrink-0 rounded-pill border border-border bg-muted p-0 hover:bg-muted"
        >
          <Sun className="absolute left-[9px] top-[8px] w-[14px] h-[14px] text-subtle" strokeWidth={1.75} />
          <Moon className="absolute right-[9px] top-[8px] w-[14px] h-[14px] text-subtle" strokeWidth={1.75} />
          <span className={`absolute left-[2px] top-[2px] w-[26px] h-[26px] rounded-pill bg-primary text-primary-foreground flex items-center justify-center [transition:transform_200ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isDark ? 'translate-x-8' : 'translate-x-0'}`}>
            {isDark ? <Moon className="w-[14px] h-[14px]" strokeWidth={1.75} /> : <Sun className="w-[14px] h-[14px]" strokeWidth={1.75} />}
          </span>
        </Button>
      </div>

       <div className="space-y-[10px]">
         <SettingsGroup id="schedule" icon={Clock} title={t('Tagesablauf', 'Daily routine')} summary={`${wakeTime} – ${sleepTime} · ${t('Ziel', 'Goal')} ${dailyCigarettes}`} open={openGroups.includes('schedule')} onToggle={() => toggleGroup('schedule')}>
              {/* Aufsteh- & Schlafenszeiten */}
              <section>
                <div className="grid grid-cols-2 gap-[10px]">
                  <TimePicker value={wakeTime} onChange={setWakeTime} label={t('Aufstehzeit', 'Wake-up time')} compact />
                  <TimePicker value={sleepTime} onChange={setSleepTime} label={t('Schlafenszeit', 'Bedtime')} compact />
                </div>
                <p className="t-12 text-subtle mt-3 px-1">
                  {applyScheduleToAllDays
                    ? t('Gilt für alle Tage.', 'Applies to all days.')
                    : t('Standard für neue Tage. Bereits eingerichtete Tage änderst du direkt auf der Startseite.', 'Default for new days. You can change already set up days directly on the home screen.')}
                </p>
              </section>
              {/* Tagesziel Zigaretten */}
              <section>
                <div className="surface-card p-5">
                  <WheelPicker
                    value={dailyCigarettes}
                    min={0}
                    max={60}
                    values={ODD_GOAL_VALUES}
                    onChange={setDailyCigarettes}
                    label={t('Zigaretten pro Tag', 'Cigarettes per day')}
                    compact
                  />
                  <p className="text-center t-12 text-subtle mt-3">
                    {t('Weniger = längere Pausen = mehr Stärke', 'Less = longer breaks = more strength')}
                  </p>
                  <p className="text-center t-12 text-subtle mt-1">
                    {applyScheduleToAllDays
                      ? t('Gilt für alle Tage.', 'Applies to all days.')
                      : t('Standard für neue Tage.', 'Default for new days.')}
                  </p>
                </div>
              </section>
              {/* Zeitplan für alle Tage */}
              <section>
                <button
                  onClick={toggleApplyScheduleToAllDays}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">{t('Zeitplan für alle Tage', 'Schedule for all days')}</span>
                    <span className="t-12 text-subtle">{t('Änderungen auf alle Tage anwenden', 'Apply changes to all days')}</span>
                  </span>
                  <Toggle on={applyScheduleToAllDays} />
                </button>
              </section>
         </SettingsGroup>
         <SettingsGroup id="plan" icon={TrendingDown} title={t('Abbauplan', 'Reduction plan')} summary={`${reductionPlan.automaticReductionEnabled ? t('Automatisch', 'Automatic') : t('Manuell', 'Manual')} · −${reductionPlan.reductionPerWeek} ${t('pro Woche', 'per week')}`} open={openGroups.includes('plan')} onToggle={() => toggleGroup('plan')}>
              {/* Abbauplan */}
              <section>
                <div className="surface-card p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <WheelPicker
                      value={reductionPlan.baselineCigarettes}
                      min={0}
                      max={60}
                      values={ODD_GOAL_VALUES}
                      onChange={(value) => updateReductionPlan({ baselineCigarettes: value })}
                      label={t('Ausgangswert', 'Starting value')}
                      compact
                    />
                    <WheelPicker
                      value={reductionPlan.reductionPerWeek}
                      min={1}
                      max={5}
                      onChange={(value) => updateReductionPlan({ reductionPerWeek: value })}
                      label={t('Pro Woche', 'Per week')}
                      compact
                    />
                  </div>
                  <button
                    onClick={toggleAutomaticReduction}
                    className="rounded-inner bg-muted w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                  >
                    <span>
                      <span className="t-16 block text-foreground">{t('Automatisch senken', 'Reduce automatically')}</span>
                      <span className="t-12 text-subtle">{t('Jeden Montag um den gewählten Wert', 'Every Monday by the chosen amount')}</span>
                    </span>
                    <Toggle on={reductionPlan.automaticReductionEnabled} />
                  </button>
                  <button
                    onClick={togglePauseThisWeek}
                    className="rounded-inner bg-muted w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                  >
                    <span>
                      <span className="t-16 block text-foreground">{t('Diese Woche pausieren', 'Pause this week')}</span>
                      <span className="t-12 text-subtle">{t('Ziel bleibt für diese Woche gleich', 'Target stays the same this week')}</span>
                    </span>
                    <Toggle on={thisWeekPaused} />
                  </button>
                  <div className="max-h-64 overflow-y-auto hide-scrollbar space-y-2">
                    {actualRows.map((row) => (
                      <div key={row.week} className="rounded-inner bg-muted px-4 py-3 flex items-center justify-between">
                        <span>
                          <span className="t-14 text-foreground block">{row.label}</span>
                          <span className="t-12 text-subtle">Ø {row.actual ?? '–'} {t('tatsächlich', 'actual')}</span>
                        </span>
                        <span className="t-18 num text-foreground">{row.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              {/* Plan neu erstellen */}
              <section>
                <button onClick={resetOnboarding} className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left">
                  <span className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    <span>
                      <span className="t-16 block text-foreground">{t('Plan neu erstellen', 'Recreate plan')}</span>
                      <span className="t-12 text-subtle">{t('Onboarding erneut durchlaufen', 'Go through onboarding again')}</span>
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                </button>
              </section>
         </SettingsGroup>
         <SettingsGroup id="push" icon={Bell} title={t('Benachrichtigungen', 'Notifications')} summary={pushEnabled ? t('An', 'On') : t('Aus', 'Off')} open={openGroups.includes('push')} onToggle={() => toggleGroup('push')}>
              {/* Push-Meldungen */}
              <section>
                <div className="surface-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {pushEnabled ? (
                        <Bell className="w-5 h-5 text-primary" strokeWidth={1.75} />
                      ) : (
                        <BellOff className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                      )}
                      <div>
                        <span className="t-16 block text-foreground">{t('Push-Meldungen', 'Push notifications')}</span>
                        <span className="t-12 text-subtle">{t('Auch bei geschlossener App', 'Even when the app is closed')}</span>
                      </div>
                    </div>
                    <button
                      disabled={pushBusy}
                      onClick={handleTogglePush}
                      aria-label={t('Push-Meldungen umschalten', 'Toggle push notifications')}
                      className={`shrink-0 flex items-center ${pushBusy ? 'opacity-60' : ''}`}
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
                      {t('Test-Meldung senden', 'Send test notification')}
                    </button>
                  )}
                  {pushMessage && <p className="t-12 text-subtle mt-3">{pushMessage}</p>}
                </div>
              </section>
         </SettingsGroup>
         <SettingsGroup id="extras" icon={Sparkles} title={t('Zusätzliche Funktionen', 'Additional features')} summary={`${extraButtonEnabled ? t('Extras an', 'Extras on') : t('Extras aus', 'Extras off')} · ${reductionPlan.currency}`} open={openGroups.includes('extras')} onToggle={() => toggleGroup('extras')}>
              {/* Extra-Knopf */}
              <section>
                <button
                  onClick={toggleExtraButtonEnabled}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">{t('Extra-Knopf anzeigen', 'Show extra button')}</span>
                    <span className="t-12 text-subtle">{t('Zusätzliche Zigaretten unten eintragen', 'Log extra cigarettes below')}</span>
                  </span>
                  <Toggle on={extraButtonEnabled} />
                </button>
              </section>


              <section>
                <button
                  onClick={toggleHomeSavingsEnabled}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">{t('Gespartes auf Startseite', 'Savings on home screen')}</span>
                    <span className="t-12 text-subtle">{t('Geld und Zeit auf der Startseite anzeigen', 'Show money and time saved on the home screen')}</span>
                  </span>
                  <Toggle on={homeSavingsEnabled} />
                </button>
              </section>
              {/* Geld & Zeit */}
              <section>
                <div className="surface-card p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="t-12 text-subtle">{t('Packungspreis', 'Pack price')}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.10"
                        value={reductionPlan.packPrice}
                        onChange={(e) => setPlanMoney({ packPrice: Number(e.target.value), packSize: reductionPlan.packSize, currency: reductionPlan.currency })}
                        className="mt-2 w-full h-12 rounded-pill bg-muted px-4 t-16 text-foreground outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="t-12 text-subtle">{t('Packungsgröße', 'Pack size')}</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={reductionPlan.packSize}
                        onChange={(e) => setPlanMoney({ packPrice: reductionPlan.packPrice, packSize: Number(e.target.value), currency: reductionPlan.currency })}
                        className="mt-2 w-full h-12 rounded-pill bg-muted px-4 t-16 text-foreground outline-none"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['CHF', 'EUR', 'USD', 'GBP'] as CurrencyCode[]).map((currency) => (
                      <button
                        key={currency}
                        onClick={() => setPlanMoney({ packPrice: reductionPlan.packPrice, packSize: reductionPlan.packSize, currency })}
                        className={`h-10 rounded-pill t-12 ${reductionPlan.currency === currency ? 'bg-primary text-primary-foreground' : 'bg-muted text-subtle'}`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                  <p className="t-12 text-subtle">{t('Zeitgewinn: 11 Minuten pro Zigarette. Quellenhinweis: WHO/NHS.', 'Time gained: 11 minutes per cigarette. Source: WHO/NHS.')}</p>
                </div>
              </section>
         </SettingsGroup>
         <SettingsGroup id="appearance" icon={Palette} title={t('Darstellung & Sprache', 'Appearance & language')} summary={`${t(themeMode === 'dark' ? 'Dunkel' : themeMode === 'light' ? 'Hell' : 'System', themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'System')} · ${language === 'de' ? 'Deutsch' : 'English'}`} open={openGroups.includes('appearance')} onToggle={() => toggleGroup('appearance')}>
              {/* Darstellung */}
              <section>
                <div className="surface-card p-1.5 grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'light', label: t('Hell', 'Light'), Icon: Sun },
                      { id: 'dark', label: t('Dunkel', 'Dark'), Icon: Moon },
                      { id: 'system', label: t('System', 'System'), Icon: Smartphone },
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

              {/* Sprache-Umschalter */}
              <section>
                <div className="surface-card p-1.5 grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: 'de', label: 'Deutsch' },
                      { id: 'en', label: 'English' },
                    ] as const
                  ).map(({ id, label }) => {
                    const active = language === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setLanguage(id)}
                        className={`h-12 rounded-md flex items-center justify-center gap-1.5 t-14 font-medium [transition:background-color_180ms_cubic-bezier(0.22,1,0.36,1),color_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                          active ? 'bg-primary text-primary-foreground' : 'text-subtle'
                        }`}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
         </SettingsGroup>
         <SettingsGroup id="account" icon={User} title={t('Konto & Pläne', 'Account & plans')} summary={account.signedIn ? account.userEmail ?? t('Angemeldet', 'Signed in') : t('Ohne Anmeldung', 'Not signed in')} open={openGroups.includes('account')} onToggle={() => toggleGroup('account')}>
              {/* Konto & Premium */}
              <section>
                <div className="surface-card p-5 space-y-3">
                  <p className="t-12 text-subtle">{t('Optional — für Sicherung und mehrere Geräte', 'Optional — for backup and multiple devices')}</p>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    <div>
                      <p className="t-16 text-foreground">{account.signedIn ? account.userEmail : t('Nicht angemeldet', 'Not signed in')}</p>
                      <p className="t-12 text-subtle">
                        {account.role === 'admin'
                          ? t('Admin dauerhaft freigeschaltet', 'Admin, permanently unlocked')
                          : account.access
                            ? t(`${account.trialDaysRemaining} Tage Testzeit übrig`, `${account.trialDaysRemaining} days of trial left`)
                            : t('Testzeit abgelaufen', 'Trial expired')}
                      </p>
                    </div>
                  </div>
                  {!account.signedIn ? (
                    <EmailCodeSignIn onSignedIn={handleSignedIn} />
                  ) : (
                    <>
                      <button onClick={handleLogout} className="btn-pill btn-secondary w-full">{t('Abmelden', 'Sign out')}</button>
                    </>

                  )}
                  {accountMessage && <p className="t-12 text-subtle">{accountMessage}</p>}
                </div>
              </section>

              {/* Abonnement – nur für Zahlende */}
              {isPaying && (
                <section>
                  <div className="surface-card p-5 space-y-3">
                    <div>
                      <p className="t-16 text-foreground">{planLabel}</p>
                      {!isLifetime && <p className="t-12 text-subtle">{renewalLabel}</p>}
                    </div>
                    {!isLifetime && (
                      <>
                        <button onClick={handleOpenPortal} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                          {t('Abonnement kündigen', 'Cancel subscription')}
                        </button>
                        <button onClick={handleCancelInApp} disabled={subBusy} className="btn-pill w-full text-destructive disabled:opacity-60">
                          {t('Direkt in der App kündigen', 'Cancel directly in the app')}
                        </button>
                      </>
                    )}
                    <button onClick={handleOpenPortal} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                      {isLifetime ? t('Rechnung herunterladen', 'Download invoice') : t('Rechnungen', 'Invoices')}
                    </button>
                    <button onClick={handleRestore} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                      {t('Kauf wiederherstellen', 'Restore purchase')}
                    </button>
                    {subMessage && <p className="t-12 text-subtle">{subMessage}</p>}
                  </div>
                </section>
              )}


              {!isPaying && (
              <section>
                <div className="space-y-[10px]">
                  <button className="surface-card w-full p-5 text-left">
                    <p className="t-16 font-medium text-foreground">{t('Monatlich', 'Monthly')}</p>
                    <p className="t-12 text-subtle">{t('CHF 4.90 / Monat', 'CHF 4.90 / month')}</p>
                  </button>

                  <button className="surface-card w-full p-5 text-left">
                    <p className="t-16 font-medium text-foreground">{t('Jährlich', 'Yearly')}</p>
                    <p className="t-12 text-subtle">{t('CHF 29 / Jahr', 'CHF 29 / year')}</p>
                  </button>

                  <button className="w-full p-5 rounded-card bg-primary text-left">
                    <p className="t-16 font-medium text-primary-foreground">{t('Lebenslang', 'Lifetime')}</p>
                    <p className="t-12 text-primary-foreground/70">{formatMoney(79, 'CHF')}</p>
                    <p className="t-14 text-primary-foreground mt-1">{t('Einmal bezahlen. Nie wieder. Kein Abo, keine Verlängerung.', 'Pay once. Never again. No subscription, no renewal.')}</p>

                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="t-12 text-subtle">{t('Verlängert sich automatisch. Jederzeit kündbar.', 'Renews automatically. Cancel anytime.')}</p>
                  <p className="t-12 text-subtle">
                    <button type="button" onClick={() => goTo('/agb')} className="underline">{t('AGB', 'Terms')}</button>
                    {' · '}
                    <button type="button" onClick={() => goTo('/datenschutz')} className="underline">{t('Datenschutzerklärung', 'Privacy policy')}</button>
                  </p>
                  <label className="flex items-start gap-2 t-12 text-foreground">
                    <input
                      type="checkbox"
                      checked={withdrawalConsent}
                      onChange={(e) => setWithdrawalConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>{t('Ich verlange die sofortige Bereitstellung und weiss, dass mein Widerrufsrecht damit erlischt.', 'I request immediate provision and understand that my right of withdrawal expires as a result.')}</span>
                  </label>
                  {!withdrawalConsent && <p className="t-12 text-subtle">{t('Ohne dieses Häkchen ist kein Kauf möglich.', 'A purchase is not possible without this checkbox.')}</p>}
                </div>
              </section>
              )}
         </SettingsGroup>
         <SettingsGroup id="data" icon={Database} title={t('Deine Daten', 'Your data')} summary={t('Exportieren & löschen', 'Export & delete')} open={openGroups.includes('data')} onToggle={() => toggleGroup('data')}>
              {/* Daten exportieren */}
              <section>
                <div className="surface-card p-5 space-y-3">
                  <button onClick={handleExport} className="btn-pill btn-secondary w-full">{t('Daten exportieren', 'Export data')}</button>
                  <p className="t-12 text-subtle">{t('Alle Angaben als Datei zum Mitnehmen (Art. 20 DSGVO).', 'All your data as a file to take with you (Art. 20 GDPR).')}</p>
                  <button
                    onClick={() => setShowAccountDelete(true)}
                    className="btn-pill w-full text-destructive"
                  >
                    {t('Konto und alle Daten löschen', 'Delete account and all data')}
                  </button>
                  {showAccountDelete && (
                    <div className="space-y-2">
                      <p className="t-12 text-subtle">{t('Zum Bestätigen bitte das Wort LÖSCHEN eintippen. Ein laufendes Abonnement wird dabei gekündigt.', 'To confirm, please type the word LÖSCHEN. Any running subscription will be cancelled.')}</p>
                      <input
                        value={deleteWord}
                        onChange={(e) => setDeleteWord(e.target.value)}
                        placeholder="LÖSCHEN"
                        className="w-full rounded-pill bg-muted px-4 py-3 t-16 text-foreground outline-none"
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteWord.trim().toUpperCase() !== 'LÖSCHEN' || accountBusy}
                        className="btn-pill w-full text-destructive disabled:opacity-40"
                      >
                        {t('Endgültig löschen', 'Delete permanently')}
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Gefahrenzone */}
              <section className="pb-6">
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <button className="btn-pill w-full text-destructive gap-2">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
                      {t('Alle Daten löschen', 'Delete all data')}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm mx-4 rounded-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="t-20">{t('Wirklich alle Daten löschen?', 'Really delete all data?')}</AlertDialogTitle>
                      <AlertDialogDescription className="t-14 text-subtle">
                        {t(
                          'Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Einstellungen, Erinnerungen und Fortschritte werden dauerhaft gelöscht.',
                          'This action cannot be undone. All your settings, reminders and progress will be permanently deleted.',
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-pill">{t('Abbrechen', 'Cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllData}
                        className="rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('Ja, alle löschen', 'Yes, delete all')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
         </SettingsGroup>
         <SettingsGroup id="help" icon={Info} title={t('Hilfe & Rechtliches', 'Help & legal')} summary={t('Funktionen · Support · Rechtliches', 'Features · Support · legal')} open={openGroups.includes('help')} onToggle={() => toggleGroup('help')}>
              {/* Rechtliches */}
              <section>
                <div className="surface-card overflow-hidden">
                  {[
                    { slug: 'funktionen', label: t('Funktionen', 'Features') },
                    { slug: 'support', label: t('Support', 'Support') },
                    { slug: 'impressum', label: t('Impressum', 'Imprint') },
                    { slug: 'datenschutz', label: t('Datenschutzerklärung', 'Privacy policy') },
                    { slug: 'agb', label: t('Allgemeine Geschäftsbedingungen', 'Terms and conditions') },
                    { slug: 'gesundheitshinweis', label: t('Gesundheitshinweis', 'Health notice') },
                  ].map((item, index, list) => (
                    <button
                      key={item.slug}
                      onClick={() => goTo(`/${item.slug}`)}
                      className={`w-full px-4 min-h-[56px] flex items-center justify-between ${index < list.length - 1 ? 'border-b border-border/60' : ''}`}
                    >
                      <span className="t-16 text-foreground text-left">{item.label}</span>
                      <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                    </button>
                  ))}
                </div>
                {account.role === 'admin' && (
                  <button onClick={() => goTo('/rechtliches-check')} className="btn-pill btn-secondary w-full mt-3">
                    {t('Offene Stellen prüfen', 'Check open items')}
                  </button>
                )}
              </section>
         </SettingsGroup>

              {/* Version – siebenmal antippen öffnet die Freischaltung */}
              <section className="pb-10">
                <button
                  type="button"
                  onClick={() => {
                    const next = versionTaps + 1;
                    if (next >= 7) {
                      setVersionTaps(0);
                      goTo('/unlock');
                      return;
                    }
                    setVersionTaps(next);
                  }}
                  className="w-full py-3 t-12 text-subtle text-center"
                >
                  {t('Version', 'Version')} {APP_VERSION}
                </button>
              </section>
      </div>
    </div>
  );
};

export default SettingsSheet;
