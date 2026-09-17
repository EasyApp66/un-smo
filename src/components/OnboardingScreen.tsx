import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore, type ReductionSpeed } from '../store/appStore';
import Mark from './Mark';
import WheelPicker from './WheelPicker';
import TimePicker from './TimePicker';
import { buildReductionPlan, formatMoney, formatSavedTime, MINUTES_PER_CIGARETTE, unitPrice } from '@/lib/reductionPlan';


const EASE = [0.22, 1, 0.36, 1] as const;
const steps = 3;

const awakeText = (wakeTime: string, sleepTime: string, count: number) => {
  const [wh, wm] = wakeTime.split(':').map(Number);
  const [sh, sm] = sleepTime.split(':').map(Number);
  const wake = wh * 60 + wm;
  let sleep = sh * 60 + sm;
  if (sleep <= wake) sleep += 1440;
  const awake = sleep - wake;
  const hours = Math.floor(awake / 60);
  const minutes = awake % 60;
  const every = count > 0 ? Math.round(awake / count) : 0;
  return `${hours}${minutes ? `.${Math.round(minutes / 6)}` : ''} Stunden wach · alle ${every} Minuten eine`;
};

const planState = (daily: number, reduction: number) => ({
  planStartedAt: new Date().toISOString().slice(0, 10),
  measurementCompletedAt: null,
  baselineCigarettes: daily,
  onboardingEstimate: daily,
  reductionPerWeek: reduction,
  automaticReductionEnabled: true,
  pausedWeekKeys: [],
  packPrice: 9,
  packSize: 20,
  currency: 'CHF' as const,
  zeroReachedAt: null,
});

const OnboardingScreen = () => {
  const completeWithPlan = useAppStore((state) => state.completeOnboardingWithPlan);
  const [step, setStep] = useState(0);
  const [daily, setDaily] = useState(20);
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [speed, setSpeed] = useState<ReductionSpeed>(2);
  const [customSpeed, setCustomSpeed] = useState(2);

  const selectedSpeed = speed === 4 ? customSpeed : speed;
  const previewState = useMemo(() => planState(daily, selectedSpeed), [daily, selectedSpeed]);
  const planRows = useMemo(() => buildReductionPlan(previewState).slice(0, 12), [previewState]);
  const zeroWeeks = Math.ceil(daily / Math.max(1, selectedSpeed));
  const totalSaved = planRows.reduce((sum, row) => sum + Math.max(0, daily - row.target) * 7, 0);

  // Kein Konto nötig – der Plan bleibt lokal gespeichert.
  const finish = () => {
    completeWithPlan({ dailyCigarettes: daily, wakeTime, sleepTime, reductionPerWeek: selectedSpeed as ReductionSpeed });
  };

  const next = () => {
    if (step < 3) setStep((s) => s + 1);
    else finish();
  };

  const buttonLabel = step < 2 ? 'Weiter' : step === 2 ? 'Plan berechnen' : 'Los geht\u2019s';

  return (
    <div className="min-h-[100dvh] bg-background safe-top safe-bottom flex flex-col px-5 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between h-12">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="w-11 h-11 rounded-pill flex items-center justify-center text-foreground" aria-label="Zurück">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.6} />
          </button>
        ) : <span className="w-11" />}
        <Mark size={28} />
        <span className="w-11" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5" aria-label="Fortschritt">
        {Array.from({ length: steps }).map((_, i) => (
          <span key={i} className={`h-1 rounded-pill ${i <= Math.min(step, 2) ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute inset-0 flex flex-col"
          >
            {step === 0 && (
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="t-24 text-foreground mb-12">Wie viele rauchst du am Tag?</h1>
                <WheelPicker value={daily} min={1} max={60} onChange={setDaily} horizontal viewportWidth={340} formatValue={(v) => `${v}`} />
                <p className="mt-6 text-center text-[64px] leading-none font-light num text-foreground">{daily}</p>
                <p className="mt-5 t-14 text-subtle text-center">Schätze ehrlich. In der ersten Woche misst du den echten Wert.</p>
              </div>
            )}

            {step === 1 && (
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="t-24 text-foreground mb-10">Wann bist du wach?</h1>
                <div className="grid grid-cols-2 gap-3">
                  <TimePicker value={wakeTime} onChange={setWakeTime} label="Aufstehen" compact />
                  <TimePicker value={sleepTime} onChange={setSleepTime} label="Schlafen" compact />
                </div>
                <p className="mt-8 t-16 text-subtle text-center">{awakeText(wakeTime, sleepTime, daily)}</p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="t-24 text-foreground mb-6">Wie schnell willst du runter?</h1>
                <div className="space-y-3">
                  {([
                    { id: 1, title: 'Sanft', text: '1 Zigarette weniger pro Woche', badge: null },
                    { id: 2, title: 'Empfohlen', text: '2 weniger pro Woche', badge: 'Empfohlen' },
                    { id: 3, title: 'Zügig', text: '3 weniger pro Woche', badge: null },
                  ] as const).map((item) => (
                    <button key={item.id} type="button" onClick={() => setSpeed(item.id)} className={`surface-card w-full p-4 text-left border ${speed === item.id ? 'border-primary' : 'border-transparent'}`}>
                      <span className="flex items-center justify-between">
                        <span className="t-18 text-foreground">{item.title}</span>
                        {item.badge && <span className="t-12 text-primary">{item.badge}</span>}
                      </span>
                      <span className="t-14 text-subtle">{item.text}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => setSpeed(4)} className={`surface-card w-full p-4 text-left border ${speed === 4 ? 'border-primary' : 'border-transparent'}`}>
                    <span className="t-18 text-foreground">Selbst festlegen</span>
                    <WheelPicker value={customSpeed} min={1} max={5} onChange={setCustomSpeed} compact horizontal viewportWidth={230} formatValue={(v) => `${v}`} />
                  </button>
                </div>
                <p className="mt-5 t-14 text-subtle text-center">Bei {daily} pro Tag und {selectedSpeed} weniger pro Woche bist du in {zeroWeeks} Wochen bei null.</p>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 overflow-y-auto hide-scrollbar pb-2">
                <h1 className="t-24 text-foreground mb-2">Der Plan</h1>
                <p className="t-14 text-subtle mb-5">Dein Plan bleibt auf diesem Gerät gespeichert.</p>
                <div className="surface-card p-4 mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="t-12 text-subtle">Gespart bis dahin</p>
                    <p className="t-24 num text-foreground">{formatMoney(totalSaved * unitPrice(previewState), previewState.currency)}</p>
                  </div>
                  <div>
                    <p className="t-12 text-subtle">Zeit zurückgewonnen</p>
                    <p className="t-24 num text-foreground">{formatSavedTime(totalSaved * MINUTES_PER_CIGARETTE)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {planRows.map((row) => (
                    <div key={row.week} className="rounded-inner bg-muted px-4 py-3 flex items-center justify-between">
                      <span>
                        <span className="t-14 text-foreground block">{row.label}</span>
                        <span className="t-12 text-subtle">{row.isMeasurement ? 'Messwoche' : row.isSmokeFree ? 'Null erreicht' : 'Abbauplan'}</span>
                      </span>
                      <span className="t-24 num text-foreground">{row.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <button type="button" onClick={next} disabled={authBusy} className="btn-pill btn-primary w-full mb-2 disabled:opacity-60">
        {buttonLabel}
      </button>
    </div>
  );
};

export default OnboardingScreen;
