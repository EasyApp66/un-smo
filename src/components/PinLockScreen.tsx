import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import appIcon from '../assets/app-icon.png';

export const hashPin = async (pin: string) => {
  const data = new TextEncoder().encode(`un-smo:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

interface PinLockScreenProps {
  /** 'setup' = neue PIN festlegen, 'unlock' = entsperren, 'change' = alte PIN prüfen + neue setzen */
  mode: 'setup' | 'unlock' | 'change';
  onDone?: () => void;
  onCancel?: () => void;
}

const PinLockScreen = ({ mode, onDone, onCancel }: PinLockScreenProps) => {
  const { pinHash, setPinHash, unlock } = useAppStore();
  const [step, setStep] = useState<'verify' | 'enter' | 'confirm'>(
    mode === 'unlock' || mode === 'change' ? 'verify' : 'enter'
  );
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  const title =
    step === 'verify'
      ? mode === 'change'
        ? 'Aktuelle PIN eingeben'
        : 'PIN eingeben'
      : step === 'enter'
      ? 'Neue PIN festlegen'
      : 'PIN wiederholen';

  const fail = () => {
    setError(true);
    setShake((s) => s + 1);
    if ('vibrate' in navigator) navigator.vibrate([40, 60, 40]);
    setTimeout(() => {
      setPin('');
      setError(false);
    }, 450);
  };

  useEffect(() => {
    if (pin.length !== 4) return;
    let cancelled = false;
    (async () => {
      const hash = await hashPin(pin);
      if (cancelled) return;
      if (step === 'verify') {
        if (hash === pinHash) {
          if (mode === 'unlock') {
            unlock();
            onDone?.();
          } else {
            setPin('');
            setStep('enter');
          }
        } else {
          fail();
        }
      } else if (step === 'enter') {
        setFirstPin(pin);
        setPin('');
        setStep('confirm');
      } else {
        if (pin === firstPin) {
          setPinHash(hash);
          if ('vibrate' in navigator) navigator.vibrate(15);
          onDone?.();
        } else {
          setFirstPin('');
          setStep('enter');
          fail();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const press = (d: string) => {
    if (pin.length >= 4 || error) return;
    if ('vibrate' in navigator) navigator.vibrate(5);
    setPin((p) => p + d);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between safe-top safe-bottom px-6 py-8">
      <div className="flex flex-col items-center mt-6">
        <motion.img
          src={appIcon}
          alt="UN-SMO"
          width={72}
          height={72}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-[72px] h-[72px] rounded-[20px] shadow-lg glow-green mb-5"
        />
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">UN-SMO</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xl font-bold text-foreground"
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        {/* Punkte */}
        <motion.div
          key={shake}
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="flex gap-4 mt-8"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: pin.length > i ? 1.15 : 1 }}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                error
                  ? 'bg-destructive border-destructive'
                  : pin.length > i
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40'
              }`}
            />
          ))}
        </motion.div>
        <p className="text-xs text-destructive h-4 mt-3">{error ? 'Falsche PIN' : ''}</p>
      </div>

      {/* Ziffernblock */}
      <div className="w-full max-w-[300px]">
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k, i) => {
            if (k === '') return <div key={i} />;
            const isDel = k === 'del';
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => (isDel ? setPin((p) => p.slice(0, -1)) : press(k))}
                aria-label={isDel ? 'Löschen' : k}
                className={`h-[68px] rounded-2xl text-2xl font-semibold flex items-center justify-center ${
                  isDel ? 'text-muted-foreground' : 'bg-card text-foreground border border-border/60'
                }`}
              >
                {isDel ? <Delete className="w-6 h-6" /> : k}
              </motion.button>
            );
          })}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="w-full mt-5 text-sm text-muted-foreground py-2">
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
};

export default PinLockScreen;
