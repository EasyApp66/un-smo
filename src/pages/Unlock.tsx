import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { adminUnlock } from '@/lib/account';
import { goTo } from '@/lib/navigate';
import Mark from '@/components/Mark';

const Unlock = () => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminUnlock(code.trim());
      setDone(true);
    } catch (error) {
      const text = error instanceof Error ? error.message : '';
      setMessage(
        text.includes('429') ? 'Zu viele Versuche. Bitte später erneut probieren.' : 'Code ungültig.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background safe-top safe-bottom flex flex-col px-5 max-w-md mx-auto w-full">
      <div className="h-12 flex items-center justify-center">
        <Mark size={28} />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {done ? (
          <div className="surface-card p-6 text-center space-y-3">
            <span className="icon-tile mx-auto">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
            </span>
            <p className="t-24 text-foreground">Als Admin angemeldet</p>
            <p className="t-14 text-subtle">
              Alles ist dauerhaft freigeschaltet. Du musst dich nicht erneut anmelden.
            </p>
            <button type="button" onClick={() => goTo('/')} className="btn-pill btn-primary w-full">
              Zur App
            </button>
          </div>
        ) : (
          <>
            <h1 className="t-24 text-foreground mb-2">Freischalten</h1>
            <p className="t-14 text-subtle mb-5">Code eingeben, um dauerhaft freizuschalten.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Code"
              className="w-full h-12 rounded-pill bg-muted px-4 t-16 text-foreground outline-none mb-3"
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="btn-pill btn-primary w-full disabled:opacity-60"
            >
              {busy ? '…' : 'Freischalten'}
            </button>
            {message && <p className="t-12 text-subtle mt-3">{message}</p>}
            <button type="button" onClick={() => goTo('/')} className="btn-pill btn-secondary w-full mt-3">
              Zurück
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Unlock;
