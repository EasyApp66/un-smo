import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore, type ReductionSpeed } from '../store/appStore';
import Mark from './Mark';
import WheelPicker from './WheelPicker';
import TimePicker from './TimePicker';
import { buildReductionPlan, formatMoney, formatSavedTime, MINUTES_PER_CIGARETTE, unitPrice } from '@/lib/reductionPlan';
import { useT, tr } from '@/lib/i18n';


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
  const h = `${hours}${minutes ? `.${Math.round(minutes / 6)}` : ''}`;
  return tr(`${h} Stunden wach · alle ${every} Minuten eine`, `${h} hours awake · one every ${every} minutes`);
};

const planState = (daily: number, reduction: number) => ({
  planStartedAt: new Date().toISOString().slice(0, 10),
  measurementCompletedAt: null,
  baselineCigarettes: daily,
  onboardingEstimate: daily,
  savingsBaseline: daily,
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
  const t = useT();
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

  const buttonLabel = step < 2 ? t('Weiter', 'Continue') : step === 2 ? t('Plan berechnen', 'Calculate plan') : t('Los geht\u2019s', 'Let\u2019s go');

  return (
    <div className="min-h-[100dvh] bg-background safe-top safe-bottom flex flex-col px-5 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between h-12">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="w-11 h-11 rounded-pill flex items-center justify-center text-foreground" aria-label={t('Zurück', 'Back')}>
            <ArrowLeft className="w-5 h-5" strokeWidth={1.6} />
          </button>
        ) : <span className="w-11" />}
        <Mark size={28} />
        <span className="w-11" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5" aria-label={t('Fortschritt', 'Progress')}>
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
                <h1 className="t-24 text-foreground mb-12">{t('Wie viele rauchst du am Tag?', 'How many do you smoke per day?')}</h1>
                <WheelPicker value={daily} min={1} max={60} onChange={setDaily} horizontal viewportWidth={340} formatValue={(v) => `${v}`} />
                <p className="mt-6 text-center text-[64px] leading-none font-light num text-foreground">{daily}</p>
                <p className="mt-5 t-14 text-subtle text-center">{t('Schätze ehrlich. In der ersten Woche misst du den echten Wert.', 'Estimate honestly. In the first week you\u2019ll measure the real value.')}</p>
              </div>
            )}

            {step === 1 && (
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="t-24 text-foreground mb-10">{t('Wann bist du wach?', 'When are you awake?')}</h1>
                <div className="grid grid-cols-2 gap-3">
                  <TimePicker value={wakeTime} onChange={setWakeTime} label={t('Aufstehen', 'Wake up')} compact />
                  <TimePicker value={sleepTime} onChange={setSleepTime} label={t('Schlafen', 'Sleep')} compact />
                </div>
                <p className="mt-8 t-16 text-subtle text-center">{awakeText(wakeTime, sleepTime, daily)}</p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="t-24 text-foreground mb-6">{t('Wie schnell willst du runter?', 'How fast do you want to cut down?')}</h1>
                <div className="space-y-3">
                  {([
                    { id: 1, title: t('Sanft', 'Gentle'), text: t('1 Zigarette weniger pro Woche', '1 fewer cigarette per week'), badge: null },
                    { id: 2, title: t('Empfohlen', 'Recommended'), text: t('2 weniger pro Woche', '2 fewer per week'), badge: t('Empfohlen', 'Recommended') },
                    { id: 3, title: t('Zügig', 'Fast'), text: t('3 weniger pro Woche', '3 fewer per week'), badge: null },
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
                    <span className="t-18 text-foreground">{t('Selbst festlegen', 'Set your own')}</span>
                    <WheelPicker value={customSpeed} min={1} max={5} onChange={setCustomSpeed} compact horizontal viewportWidth={230} formatValue={(v) => `${v}`} />
                  </button>
                </div>
                <p className="mt-5 t-14 text-subtle text-center">{t(`Bei ${daily} pro Tag und ${selectedSpeed} weniger pro Woche bist du in ${zeroWeeks} Wochen bei null.`, `At ${daily} per day and ${selectedSpeed} fewer per week, you\u2019ll reach zero in ${zeroWeeks} weeks.`)}</p>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 overflow-y-auto hide-scrollbar pb-2">
                <h1 className="t-24 text-foreground mb-2">{t('Der Plan', 'The plan')}</h1>
                <p className="t-14 text-subtle mb-3">{t('Dein Plan bleibt auf diesem Gerät gespeichert.', 'Your plan stays saved on this device.')}</p>
                <p className="t-12 text-subtle mb-5">
                  {t(
                    'Gesundheitshinweis: Diese App ist kein Medizinprodukt und ersetzt keine ärztliche Beratung. Angaben zu Erholungsvorgängen folgen allgemeinen Informationen von WHO und NHS. Bei Beschwerden, Schwangerschaft oder Medikamenten bitte ärztlichen Rat einholen. Rauchstopplinie Schweiz: 0848 000 181.',
                    'Health notice: This app is not a medical device and does not replace medical advice. Information on recovery processes follows general guidance from WHO and NHS. Please seek medical advice for symptoms, pregnancy, or medication. Smoking cessation hotline Switzerland: 0848 000 181.'
                  )}
                </p>

                <div className="surface-card p-4 mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="t-12 text-subtle">{t('Gespart bis dahin', 'Saved by then')}</p>
                    <p className="t-24 num text-foreground">{formatMoney(totalSaved * unitPrice(previewState), previewState.currency)}</p>
                  </div>
                  <div>
                    <p className="t-12 text-subtle">{t('Zeit zurückgewonnen', 'Time regained')}</p>
                    <p className="t-24 num text-foreground">{formatSavedTime(totalSaved * MINUTES_PER_CIGARETTE)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {planRows.map((row) => (
                    <div key={row.week} className="rounded-inner bg-muted px-4 py-3 flex items-center justify-between">
                      <span>
                        <span className="t-14 text-foreground block">{row.label}</span>
                        <span className="t-12 text-subtle">{row.isMeasurement ? t('Messwoche', 'Measurement week') : row.isSmokeFree ? t('Null erreicht', 'Reached zero') : t('Abbauplan', 'Reduction plan')}</span>
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

      <button type="button" onClick={next} className="btn-pill btn-primary w-full mb-2 disabled:opacity-60">
        {buttonLabel}
      </button>
    </div>
  );
};

export default OnboardingScreen;
