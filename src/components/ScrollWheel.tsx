import { useEffect, useRef } from 'react';
import { tick } from '../lib/haptics';

interface ScrollWheelProps {
  values: number[];
  index: number;
  onIndexChange: (index: number) => void;
  itemSize: number; // Höhe (vertikal) bzw. Breite (horizontal) eines Eintrags
  viewport: number; // sichtbare Länge in Scrollrichtung
  crossSize: number; // Breite (vertikal) bzw. Höhe (horizontal)
  horizontal?: boolean;
  format?: (value: number) => string;
  textClass?: string;
  selectedTextClass?: string;
  /** Endlos-Rad: Werte wiederholen sich in beide Richtungen */
  loop?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Weich rollendes Auswahlrad mit CSS-Snap.
 * Der Wert wird sofort beim Scrollen übernommen (kein Nachzieh-Effekt).
 */
const ScrollWheel = ({
  values,
  index,
  onIndexChange,
  itemSize,
  viewport,
  crossSize,
  horizontal = false,
  format = (v) => v.toString(),
  textClass = 'text-muted-foreground/60',
  selectedTextClass = 'text-primary',
  loop = false,
}: ScrollWheelProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const idleTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastIndex = useRef(index);
  const mounted = useRef(false);

  const pad = Math.max(0, (viewport - itemSize) / 2);

  const len = values.length;
  const repeats = loop
    ? Math.max(9, Math.ceil((viewport / itemSize) * 3 / Math.max(1, len)) * 2 + 1)
    : 1;
  const items = loop
    ? Array.from({ length: len * repeats }, (_, i) => values[i % len])
    : values;
  const midStart = loop ? Math.floor(repeats / 2) * len : 0;

  // Position nachziehen, wenn der Wert von außen geändert wird
  useEffect(() => {
    lastIndex.current = index;
    const el = ref.current;
    if (!el || interacting.current) return;
    const current = horizontal ? el.scrollLeft : el.scrollTop;
    let targetIndex = index;
    if (loop) {
      const cIdx = mounted.current ? Math.round(current / itemSize) : midStart;
      let delta = (((index - (((cIdx % len) + len) % len)) % len) + len) % len;
      if (delta > len / 2) delta -= len;
      targetIndex = cIdx + delta;
    }
    const target = targetIndex * itemSize;
    if (Math.abs(current - target) < 1) return;
    el.scrollTo({
      [horizontal ? 'left' : 'top']: target,
      behavior: mounted.current ? 'smooth' : 'auto',
    } as ScrollToOptions);
    mounted.current = true;
  }, [index, itemSize, horizontal, loop, len, midStart]);

  const handleScroll = () => {
    interacting.current = true;
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      interacting.current = false;
    }, 260);

    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = ref.current;
      if (!el) return;
      const offset = horizontal ? el.scrollLeft : el.scrollTop;
      const raw = Math.round(offset / itemSize);
      const i = loop ? ((raw % len) + len) % len : clamp(raw, 0, len - 1);

      // Endlos: zurück in den mittleren Block springen, wenn die Ränder nahen
      if (loop && (raw < len || raw >= len * (repeats - 1))) {
        const shift = (midStart - Math.floor(raw / len) * len) * itemSize;
        if (shift !== 0) {
          if (horizontal) el.scrollLeft = offset + shift;
          else el.scrollTop = offset + shift;
        }
      }

      if (i !== lastIndex.current) {
        lastIndex.current = i;
        tick();
        onIndexChange(i);
      }
    });
  };


  useEffect(
    () => () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: horizontal ? crossSize : viewport,
        width: horizontal ? viewport : crossSize,
      }}
    >
      {/* Auswahl-Markierung */}
      <div
        className="absolute pointer-events-none z-10 rounded-xl bg-primary/10 border border-primary/25"
        style={
          horizontal
            ? { left: '50%', transform: 'translateX(-50%)', top: 4, bottom: 4, width: itemSize - 6 }
            : { top: '50%', transform: 'translateY(-50%)', left: 2, right: 2, height: itemSize - 4 }
        }
      />

      {/* Weiche Ränder */}
      {horizontal ? (
        <>
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent pointer-events-none z-20" />
        </>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
        </>
      )}

      <div
        ref={ref}
        onScroll={handleScroll}
        className={`hide-scrollbar h-full w-full ${
          horizontal
            ? 'overflow-x-scroll overflow-y-hidden snap-x snap-mandatory flex items-center'
            : 'overflow-y-scroll overflow-x-hidden snap-y snap-mandatory'
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          ...(horizontal
            ? { paddingLeft: pad, paddingRight: pad }
            : { paddingTop: pad, paddingBottom: pad }),
        }}
      >
        {items.map((v, i) => {
          const isSelected = loop ? ((i % len) + len) % len === index : i === index;
          return (
            <div
              key={i}

              style={horizontal ? { width: itemSize, flex: '0 0 auto' } : { height: itemSize }}
              className={`flex items-center justify-center snap-center transition-colors duration-150 ${
                isSelected ? selectedTextClass : textClass
              }`}
            >
              <span
                className={`font-light tabular-nums [transition:font-size_180ms_cubic-bezier(0.22,1,0.36,1),opacity_180ms_cubic-bezier(0.22,1,0.36,1)] ${
                  isSelected
                    ? itemSize >= 64
                      ? 'text-[32px]'
                      : 'text-2xl'
                    : itemSize >= 64
                      ? 'text-xl opacity-50'
                      : 'text-lg opacity-70'
                }`}
              >
                {format(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollWheel;
