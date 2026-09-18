import { ChevronRight, AlertTriangle, Globe, Sun, Moon, Smartphone, Bell, BellOff, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import TimePicker from './TimePicker';
import WheelPicker from './WheelPicker';

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

const SettingsSheet = () => {
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


  useEffect(() => {
    fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
    const { data } = supabase.auth.onAuthStateChange(() => {
      fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const actualRows = useMemo(() => weeklyActuals(days, reductionPlan).slice(0, 12), [days, reductionPlan]);
  const thisWeekPaused = reductionPlan.pausedWeekKeys.includes(weekKey(new Date().toISOString().slice(0, 10)));

  const isPaying = account.paymentStatus === 'active' || account.paymentStatus === 'lifetime';
  const planLabel = account.paymentStatus === 'lifetime' ? 'Lebenslang, CHF 79.00' : 'Abonnement, laufend';
  const renewalLabel =
    account.paymentStatus === 'lifetime'
      ? 'Einmalig bezahlt, keine weiteren Kosten'
      : account.trialEndsAt
        ? `Nächste Abbuchung: ${new Date(account.trialEndsAt).toLocaleDateString('de-CH')}`
        : 'Nächste Abbuchung: wird nach der Zahlung angezeigt';


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
      setPushMessage('Test gesendet – die Meldung sollte in wenigen Sekunden erscheinen.');
    } catch {
      setPushMessage('Test fehlgeschlagen. Bitte Push aus- und wieder einschalten.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleSignedIn = () => {
    setAccountMessage('Angemeldet.');
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
      setAccountMessage('Konto und Daten wurden gelöscht.');
    } catch {
      setAccountMessage('Konto konnte nicht gelöscht werden.');
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

  const notReady = 'Zahlungen sind noch nicht freigeschaltet. Sobald der Zahlungsanbieter aktiv ist, öffnet sich hier das Kundenportal.';

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
      setSubMessage(status.access ? 'Kauf wiederhergestellt.' : 'Kein aktiver Kauf gefunden.');
    } catch {
      setSubMessage('Wiederherstellen hat nicht geklappt. Bitte später erneut versuchen.');
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
    <div className="min-h-[100dvh] bg-background px-4 pb-32 safe-top">
      <div className="pt-3 pb-5">
        <h2 className="t-24 text-foreground">Einstellungen</h2>
      </div>

      <div className="space-y-6">
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

              {/* Extra-Knopf */}
              <section>
                <button
                  onClick={toggleExtraButtonEnabled}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">Extra-Knopf anzeigen</span>
                    <span className="t-12 text-subtle">Zusätzliche Zigaretten unten eintragen</span>
                  </span>
                  <Toggle on={extraButtonEnabled} />
                </button>
              </section>

              {/* Extra-Regel */}
              <section>
                <button
                  onClick={toggleExtraReductionEnabled}
                  disabled={!extraButtonEnabled}
                  aria-disabled={!extraButtonEnabled}
                  className={`surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left ${
                    extraButtonEnabled ? '' : 'opacity-45'
                  }`}
                >
                  <span>
                    <span className="t-16 block text-foreground">Wecker bei Extras entfernen</span>
                    <span className="t-12 text-subtle">Geklickte Extras kürzen den heutigen Ablauf</span>
                  </span>
                  <Toggle on={extraButtonEnabled && extraReductionEnabled} />
                </button>
              </section>

              <section>
                <button
                  onClick={toggleHomeSavingsEnabled}
                  className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                >
                  <span>
                    <span className="t-16 block text-foreground">Gespartes auf Startseite</span>
                    <span className="t-12 text-subtle">Geld und Zeit auf der Startseite anzeigen</span>
                  </span>
                  <Toggle on={homeSavingsEnabled} />
                </button>
              </section>

              {/* Aufsteh- & Schlafenszeiten */}
              <section>
                <GroupTitle>Dein Zeitplan</GroupTitle>
                <div className="grid grid-cols-2 gap-[10px]">
                  <TimePicker value={wakeTime} onChange={setWakeTime} label="Aufstehzeit" compact />
                  <TimePicker value={sleepTime} onChange={setSleepTime} label="Schlafenszeit" compact />
                </div>
                <p className="t-12 text-subtle mt-3 px-1">
                  {applyScheduleToAllDays
                    ? 'Gilt für alle Tage.'
                    : 'Standard für neue Tage. Bereits eingerichtete Tage änderst du direkt auf der Startseite.'}
                </p>
              </section>

              {/* Abbauplan */}
              <section>
                <GroupTitle>Abbauplan</GroupTitle>
                <div className="surface-card p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <WheelPicker
                      value={reductionPlan.baselineCigarettes}
                      min={0}
                      max={60}
                      onChange={(value) => updateReductionPlan({ baselineCigarettes: value })}
                      label="Ausgangswert"
                      compact
                    />
                    <WheelPicker
                      value={reductionPlan.reductionPerWeek}
                      min={1}
                      max={5}
                      onChange={(value) => updateReductionPlan({ reductionPerWeek: value })}
                      label="Pro Woche"
                      compact
                    />
                  </div>
                  <button
                    onClick={toggleAutomaticReduction}
                    className="rounded-inner bg-muted w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                  >
                    <span>
                      <span className="t-16 block text-foreground">Automatisch senken</span>
                      <span className="t-12 text-subtle">Jeden Montag um den gewählten Wert</span>
                    </span>
                    <Toggle on={reductionPlan.automaticReductionEnabled} />
                  </button>
                  <button
                    onClick={togglePauseThisWeek}
                    className="rounded-inner bg-muted w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left"
                  >
                    <span>
                      <span className="t-16 block text-foreground">Diese Woche pausieren</span>
                      <span className="t-12 text-subtle">Ziel bleibt für diese Woche gleich</span>
                    </span>
                    <Toggle on={thisWeekPaused} />
                  </button>
                  <div className="max-h-64 overflow-y-auto hide-scrollbar space-y-2">
                    {actualRows.map((row) => (
                      <div key={row.week} className="rounded-inner bg-muted px-4 py-3 flex items-center justify-between">
                        <span>
                          <span className="t-14 text-foreground block">{row.label}</span>
                          <span className="t-12 text-subtle">Ø {row.actual ?? '–'} tatsächlich</span>
                        </span>
                        <span className="t-18 num text-foreground">{row.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Geld & Zeit */}
              <section>
                <GroupTitle>Gespartes</GroupTitle>
                <div className="surface-card p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="t-12 text-subtle">Packungspreis</span>
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
                      <span className="t-12 text-subtle">Packungsgröße</span>
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
                  <p className="t-12 text-subtle">Zeitgewinn: 11 Minuten pro Zigarette. Quellenhinweis: WHO/NHS.</p>
                </div>
              </section>

              {/* Plan neu erstellen */}
              <section>
                <button onClick={resetOnboarding} className="surface-card w-full flex items-center justify-between px-4 min-h-[56px] py-3 text-left">
                  <span className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    <span>
                      <span className="t-16 block text-foreground">Plan neu erstellen</span>
                      <span className="t-12 text-subtle">Onboarding erneut durchlaufen</span>
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-subtle" strokeWidth={1.75} />
                </button>
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
                  <p className="text-center t-12 text-subtle mt-1">
                    {applyScheduleToAllDays
                      ? 'Gilt für alle Tage.'
                      : 'Standard für neue Tage.'}
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

              {/* Konto & Premium */}
              <section>
                <GroupTitle>Konto</GroupTitle>
                <div className="surface-card p-5 space-y-3">
                  <p className="t-12 text-subtle">Optional — für Sicherung und mehrere Geräte</p>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={1.75} />
                    <div>
                      <p className="t-16 text-foreground">{account.signedIn ? account.userEmail : 'Nicht angemeldet'}</p>
                      <p className="t-12 text-subtle">
                        {account.role === 'admin'
                          ? 'Admin dauerhaft freigeschaltet'
                          : account.access
                            ? `${account.trialDaysRemaining} Tage Testzeit übrig`
                            : 'Testzeit abgelaufen'}
                      </p>
                    </div>
                  </div>
                  {!account.signedIn ? (
                    <EmailCodeSignIn onSignedIn={handleSignedIn} />
                  ) : (
                    <>
                      <button onClick={handleLogout} className="btn-pill btn-secondary w-full">Abmelden</button>
                    </>

                  )}
                  {accountMessage && <p className="t-12 text-subtle">{accountMessage}</p>}
                </div>
              </section>

              {/* Abonnement – nur für Zahlende */}
              {isPaying && (
                <section>
                  <GroupTitle>Abonnement</GroupTitle>
                  <div className="surface-card p-5 space-y-3">
                    <div>
                      <p className="t-16 text-foreground">{planLabel}</p>
                      <p className="t-12 text-subtle">{renewalLabel}</p>
                    </div>
                    {account.paymentStatus !== 'lifetime' && (
                      <>
                        <button onClick={handleOpenPortal} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                          Abonnement kündigen
                        </button>
                        <button onClick={handleCancelInApp} disabled={subBusy} className="btn-pill w-full text-destructive disabled:opacity-60">
                          Direkt in der App kündigen
                        </button>
                      </>
                    )}
                    <button onClick={handleRestore} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                      Kauf wiederherstellen
                    </button>
                    <button onClick={handleOpenPortal} disabled={subBusy} className="btn-pill btn-secondary w-full disabled:opacity-60">
                      Rechnungen
                    </button>
                    {subMessage && <p className="t-12 text-subtle">{subMessage}</p>}
                  </div>
                </section>
              )}

              {!isPaying && (
              <section>
                <GroupTitle>Mehr freischalten</GroupTitle>
                <div className="space-y-[10px]">
                  <button className="surface-card w-full p-5 text-left">
                    <p className="t-16 font-medium text-foreground">Monatlich</p>
                    <p className="t-12 text-subtle">CHF 4.90 / Monat</p>
                  </button>

                  <button className="surface-card w-full p-5 text-left">
                    <p className="t-16 font-medium text-foreground">Jährlich</p>
                    <p className="t-12 text-subtle">CHF 29 / Jahr</p>
                  </button>

                  <button className="w-full p-5 rounded-card bg-primary text-left">
                    <p className="t-16 font-medium text-primary-foreground">Lebenslang</p>
                    <p className="t-12 text-primary-foreground/70">{formatMoney(79, 'CHF')}</p>
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="t-12 text-subtle">Verlängert sich automatisch. Jederzeit kündbar.</p>
                  <p className="t-12 text-subtle">
                    <button type="button" onClick={() => goTo('/agb')} className="underline">AGB</button>
                    {' · '}
                    <button type="button" onClick={() => goTo('/datenschutz')} className="underline">Datenschutzerklärung</button>
                  </p>
                  <label className="flex items-start gap-2 t-12 text-foreground">
                    <input
                      type="checkbox"
                      checked={withdrawalConsent}
                      onChange={(e) => setWithdrawalConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Ich verlange die sofortige Bereitstellung und weiss, dass mein Widerrufsrecht damit erlischt.</span>
                  </label>
                  {!withdrawalConsent && <p className="t-12 text-subtle">Ohne dieses Häkchen ist kein Kauf möglich.</p>}
                </div>
              </section>
              )}

              {/* Daten exportieren */}
              <section>
                <GroupTitle>Deine Daten</GroupTitle>
                <div className="surface-card p-5 space-y-3">
                  <button onClick={handleExport} className="btn-pill btn-secondary w-full">Daten exportieren</button>
                  <p className="t-12 text-subtle">Alle Angaben als Datei zum Mitnehmen (Art. 20 DSGVO).</p>
                  <button
                    onClick={() => setShowAccountDelete(true)}
                    className="btn-pill w-full text-destructive"
                  >
                    Konto und alle Daten löschen
                  </button>
                  {showAccountDelete && (
                    <div className="space-y-2">
                      <p className="t-12 text-subtle">Zum Bestätigen bitte das Wort LÖSCHEN eintippen. Ein laufendes Abonnement wird dabei gekündigt.</p>
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
                        Endgültig löschen
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Rechtliches */}
              <section>
                <GroupTitle>Rechtliches</GroupTitle>
                <div className="surface-card overflow-hidden">
                  {[
                    { slug: 'impressum', label: 'Impressum' },
                    { slug: 'datenschutz', label: 'Datenschutzerklärung' },
                    { slug: 'agb', label: 'Allgemeine Geschäftsbedingungen' },
                    { slug: 'gesundheitshinweis', label: 'Gesundheitshinweis' },
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
                    Offene Stellen prüfen
                  </button>
                )}
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
                  Version {APP_VERSION}
                </button>
              </section>
      </div>
    </div>
  );
};

export default SettingsSheet;
