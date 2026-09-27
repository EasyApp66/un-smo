import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { goTo } from '@/lib/navigate';
import { useLang, useT } from '@/lib/i18n';
import { featureSections } from '@/content/features';

const wordsWithPositions = (text: string) => Array.from(text.matchAll(/\S+/g), (match) => ({ text: match[0], start: match.index ?? 0 }));
const chooseVoice = (voices: SpeechSynthesisVoice[], lang: string) => {
  const matching = voices.filter((voice) => lang === 'de' ? /^de(-|$)/i.test(voice.lang) : /^en(-|$)/i.test(voice.lang));
  const prioritized = matching.sort((a, b) => {
    const score = (v: SpeechSynthesisVoice) => (/Premium|Enhanced|Erweitert/i.test(v.name) ? 3 : /Anna|Helena|Markus|Petra|Yannick/i.test(v.name) ? 2 : 1) + (/de-(CH|DE)/i.test(v.lang) ? 0.5 : 0);
    return score(b) - score(a);
  });
  return prioritized[0];
};

const Features = () => {
  const t = useT();
  const lang = useLang();
  const items = useMemo(() => featureSections.flatMap((section) => section.items), []);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [state, setState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [index, setIndex] = useState(0);
  const [word, setWord] = useState(-1);
  const [rate, setRate] = useState(1);
  const generation = useRef(0);
  const current = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const fallback = useRef<ReturnType<typeof setInterval> | null>(null);
  const readStart = useRef(0);
  const elapsedBeforePause = useRef(0);
  const manualScrollUntil = useRef(0);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  const stopTimer = () => { if (fallback.current) clearInterval(fallback.current); fallback.current = null; };
  const cancel = useCallback(() => {
    generation.current += 1;
    stopTimer();
    if (supported) window.speechSynthesis.cancel();
    utterance.current = null;
    current.current = 0;
    setIndex(0); setWord(-1); setState('stopped');
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    const visibility = () => { if (document.visibilityState === 'hidden') cancel(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', update); document.removeEventListener('visibilitychange', visibility); generation.current++; stopTimer(); window.speechSynthesis.cancel(); };
  }, [supported, cancel]);

  useEffect(() => {
    if (state !== 'playing' || Date.now() < manualScrollUntil.current) return;
    nodes.current[index]?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [index, state]);

  useEffect(() => {
    const manual = (event: Event) => { if (event.isTrusted) manualScrollUntil.current = Date.now() + 4000; };
    window.addEventListener('wheel', manual, { passive: true });
    window.addEventListener('touchmove', manual, { passive: true });
    return () => { window.removeEventListener('wheel', manual); window.removeEventListener('touchmove', manual); };
  }, []);

  const speak = (next: number) => {
    if (!supported || next >= items.length) { cancel(); return; }
    const id = ++generation.current;
    stopTimer();
    window.speechSynthesis.cancel();
    current.current = next;
    setIndex(next); setWord(-1); setState('playing');
    const text = `${t(...items[next].title)}. ${t(...items[next].description)}`;
    const positions = wordsWithPositions(text);
    const message = new SpeechSynthesisUtterance(text);
    const voice = chooseVoice(window.speechSynthesis.getVoices(), lang);
    if (voice) message.voice = voice;
    message.lang = voice?.lang ?? (lang === 'de' ? 'de-DE' : 'en-GB');
    message.pitch = 1;
    message.rate = 0.95 * rate;
    let boundarySeen = false;
    message.onboundary = (event) => {
      if (id !== generation.current || event.name && event.name !== 'word') return;
      boundarySeen = true;
      let found = 0;
      positions.forEach((entry, position) => { if (entry.start <= event.charIndex) found = position; });
      setWord(Math.max(0, found));
    };
    message.onend = () => { if (id !== generation.current) return; stopTimer(); speak(next + 1); };
    message.onerror = (event) => { if (id !== generation.current || event.error === 'interrupted' || event.error === 'canceled') return; cancel(); };
    utterance.current = message;
    elapsedBeforePause.current = 0;
    readStart.current = Date.now();
    fallback.current = setInterval(() => {
      if (id !== generation.current || boundarySeen || window.speechSynthesis.paused) return;
      const elapsed = elapsedBeforePause.current + Date.now() - readStart.current;
      setWord(Math.min(positions.length - 1, Math.floor(elapsed / (380 / rate))));
    }, 120);
    window.speechSynthesis.speak(message);
  };

  const toggle = () => {
    if (state === 'paused') {
      window.speechSynthesis.resume(); readStart.current = Date.now(); setState('playing');
    } else if (state === 'playing') {
      elapsedBeforePause.current += Date.now() - readStart.current;
      window.speechSynthesis.pause(); setState('paused');
    } else speak(0);
  };
  const chosenVoice = chooseVoice(voices, lang);
  const simpleVoice = voices.length > 0 && (!chosenVoice || !/Premium|Enhanced|Erweitert|Anna|Helena|Markus|Petra|Yannick/i.test(chosenVoice.name));
  let cursor = -1;

  return <div className="min-h-[100dvh] bg-background safe-top safe-bottom">
    <div className="mx-auto max-w-[640px] px-5">
      <div className="flex items-center gap-2 min-h-14 sticky top-0 z-20 bg-background">
        <Button variant="ghost" size="icon" className="w-11 h-11 rounded-pill" aria-label={t('Zurück', 'Back')} onClick={() => { cancel(); window.history.length > 1 ? window.history.back() : goTo('/'); }}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="t-20 text-foreground">{t('Funktionen', 'Features')}</h1>
      </div>
      {supported && <div className="sticky top-14 z-20 bg-background py-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Button aria-label={state === 'playing' ? t('Pausieren', 'Pause') : t('Vorlesen', 'Read aloud')} onClick={toggle} className="w-14 h-14 shrink-0 rounded-pill bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-0">{state === 'playing' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</Button>
          <span className="t-16 text-foreground min-w-0 flex-1">{state === 'paused' ? t('Pausiert', 'Paused') : t('Vorlesen', 'Read aloud')}</span>
          <Button variant="ghost" size="icon" aria-label={t('Stopp', 'Stop')} onClick={cancel} className="w-11 h-11 shrink-0 rounded-pill text-subtle"><Square className="w-5 h-5" /></Button>
          <select aria-label={t('Geschwindigkeit', 'Speed')} value={rate} onChange={(event) => setRate(Number(event.target.value))} className="t-12 text-foreground bg-muted rounded-pill h-9 px-1 shrink-0">
            <option value="0.9">0.9×</option><option value="1">1×</option><option value="1.1">1.1×</option>
          </select>
        </div>
        {simpleVoice && <p className="t-12 text-subtle mt-2">{t('Für eine natürlichere Stimme: iPhone-Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch → eine Premium-Stimme laden.', 'For a more natural voice: iPhone Settings → Accessibility → Spoken Content → Voices → download a premium voice.')}</p>}
      </div>}
      <div className="py-6 pb-20 space-y-8">
        {featureSections.map((section) => <section key={section.title[0]}>
          <h2 className="t-18 text-foreground mb-3">{t(...section.title)}</h2>
          <div className="space-y-2">{section.items.map((item) => {
            const itemIndex = ++cursor;
            const text = `${t(...item.title)}. ${t(...item.description)}`;
            const positions = wordsWithPositions(text);
            return <div key={item.title[0]} ref={(node) => { nodes.current[itemIndex] = node; }} onClick={() => { if (state !== 'stopped') speak(itemIndex); }} className={`rounded-[16px] p-3 -mx-3 ${state !== 'stopped' && index === itemIndex ? 'bg-primary/[0.08]' : ''}`}>
              <p className="t-16 font-medium text-foreground"><SpokenWords positions={positions} start={0} length={`${t(...item.title)}.`.length} active={state !== 'stopped' && index === itemIndex ? word : -1} /></p>
              <p className="text-foreground font-light" style={{ fontSize: 15, lineHeight: 1.6 }}><SpokenWords positions={positions} start={`${t(...item.title)}. `.length} length={t(...item.description).length} active={state !== 'stopped' && index === itemIndex ? word : -1} /></p>
            </div>;
          })}</div>
        </section>)}
      </div>
    </div>
  </div>;
};

const SpokenWords = ({ positions, start, length, active }: { positions: { text: string; start: number }[]; start: number; length: number; active: number }) => <>{positions.map((entry, i) => entry.start >= start && entry.start < start + length ? <span key={i} className={active === i ? 'decoration-primary underline decoration-2 underline-offset-[3px]' : ''}>{entry.text}{' '}</span> : null)}</>;

export default Features;