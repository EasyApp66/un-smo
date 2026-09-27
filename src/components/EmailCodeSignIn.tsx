import { useEffect, useRef, useState } from 'react';
import { sendEmailCode, verifyEmailCode } from '@/lib/account';
import { useT } from '@/lib/i18n';

/**
 * Anmeldung mit sechsstelligem Code aus der E-Mail – die Sitzung entsteht
 * direkt in der App, deshalb funktioniert es auch als Home-Bildschirm-App.
 */
const EmailCodeSignIn = ({ onSignedIn }: { onSignedIn: () => void }) => {
  const t = useT();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const request = async () => {
    if (!email.includes('@')) {
      setMessage(t('Bitte gib eine gültige E-Mail ein.', 'Please enter a valid email address.'));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await sendEmailCode(email.trim());
      setStep('code');
      setCooldown(60);
      setMessage(t('Code gesendet. Er gilt wenige Minuten.', 'Code sent. It is valid for a few minutes.'));
    } catch {
      setMessage(t('Der Code konnte nicht gesendet werden.', 'The code could not be sent.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (code: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await verifyEmailCode(email.trim(), code);
      onSignedIn();
    } catch {
      setMessage(t('Der Code stimmt nicht.', 'The code is not correct.'));
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    clean.split('').forEach((char, offset) => {
      if (index + offset < 6) next[index + offset] = char;
    });
    setDigits(next);
    const target = Math.min(5, index + clean.length);
    refs.current[target]?.focus();
    const joined = next.join('');
    if (joined.length === 6 && !next.includes('')) void submit(joined);
  };

  if (step === 'email') {
    return (
      <>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoComplete="email"
          placeholder={t('E-Mail', 'Email')}
          className="w-full h-12 rounded-pill bg-muted px-4 t-16 text-foreground outline-none"
        />
        <button disabled={busy} onClick={request} className="btn-pill btn-secondary w-full disabled:opacity-60">
          {t('Code per E-Mail senden', 'Send code by email')}
        </button>
        {message && <p className="t-12 text-subtle">{message}</p>}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (refs.current[index] = el)}
            value={digit}
            onChange={(e) => setDigit(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="h-12 rounded-inner bg-muted text-center t-18 num text-foreground outline-none"
          />
        ))}
      </div>
      <button
        disabled={busy || cooldown > 0}
        onClick={request}
        className="btn-pill btn-secondary w-full disabled:opacity-60"
      >
        {cooldown > 0 ? t(`Code erneut senden (${cooldown})`, `Resend code (${cooldown})`) : t('Code erneut senden', 'Resend code')}
      </button>
      {message && <p className="t-12 text-subtle">{message}</p>}
    </>
  );
};

export default EmailCodeSignIn;
