import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import { getLogicalDate, logicalDay } from '@/lib/logicalDate';
import { Search, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import { dayStatus } from '@/lib/reductionPlan';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';
import { useT, useLocale } from '@/lib/i18n';

const EASE = [0.22, 1, 0.36, 1] as const;
const StatisticsScreen = () => {
  const { days, dailyCigarettes } = useAppStore();
  const t = useT();
  const locale = useLocale();
  const [monthSearch, setMonthSearch] = useState('');
  const [account, setAccount] = useState<AccountStatus>(defaultAccountStatus);

  useEffect(() => {
    fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
  }, []);

  const weekData = useMemo(() => {
    const data = [];
    const today = logicalDay();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = formatLocalDate(date);
      const dayData = days[dateString];
      const dayNames = t(['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
      data.push({
        day: dayNames[date.getDay()],
        date: dateString,
        smoked: dayData?.cigarettesSmoked || 0,
         goal: dayData?.totalCigarettes ?? dailyCigarettes,
        hasData: !!dayData,
      });
    }
    return data;
  }, [days, dailyCigarettes, t]);

  // Wochenarchiv: Wochen ab Montag, wählbarer Zeitraum Mo bis X
  const [rangeEnd, setRangeEnd] = useState(6);
  const rangeShort = t(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  const rangeLabels = t(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'], ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const weekArchive = useMemo(() => {
    const mondayOf = (d: Date) => { const m = new Date(d); m.setHours(12, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };
    const isoWeek = (d: Date) => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - n); const y = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return Math.ceil(((x.getTime() - y.getTime()) / 86_400_000 + 1) / 7); };
    const dates = Object.keys(days).sort();
    if (dates.length === 0) return [];
    const currentMonday = mondayOf(logicalDay());
    const firstMonday = mondayOf(new Date(`${dates[0]}T12:00:00`));
    const weeks = [];
    for (let m = new Date(currentMonday); m >= firstMonday && weeks.length < 26; m.setDate(m.getDate() - 7)) {
      let total = 0; let range = 0; let any = false;
      for (let i = 0; i < 7; i++) {
        const d = new Date(m); d.setDate(d.getDate() + i);
        const day = days[formatLocalDate(d)];
        if (day) { any = true; total += day.cigarettesSmoked || 0; if (i <= rangeEnd) range += day.cigarettesSmoked || 0; }
      }
      const end = new Date(m); end.setDate(end.getDate() + 6);
      if (any) weeks.push({ start: formatLocalDate(m), week: isoWeek(m), total, range, current: m.getTime() === currentMonday.getTime(), label: `${m.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} – ${end.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}` });
    }
    return weeks;
  }, [days, rangeEnd, locale]);
  const [archiveMode, setArchiveMode] = useState<'weeks' | 'months'>('weeks');
  const [weekAKey, setWeekAKey] = useState('');
  const [weekBKey, setWeekBKey] = useState('');
  // Standard: Vorwoche (links) gegen aktuelle Woche (rechts)
  const weekA = weekArchive.find((w) => w.start === weekAKey) ?? weekArchive[1] ?? weekArchive[0];
  const weekB = weekArchive.find((w) => w.start === weekBKey) ?? weekArchive[0];

  const monthMemories = useMemo(() => {
    const currentMonth = getLogicalDate().slice(0, 7);
    const months = Array.from(new Set([currentMonth, ...Object.keys(days).map((date) => date.slice(0, 7))])).sort((a, b) => b.localeCompare(a));
    return months.map((month) => {
      const entries = Object.values(days).filter((day) => day.date.startsWith(month));
      const [year, monthNumber] = month.split('-').map(Number);
      const label = new Date(year, monthNumber - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      const smoked = entries.reduce((sum, day) => sum + day.cigarettesSmoked, 0);
      const goal = entries.reduce((sum, day) => sum + day.totalCigarettes, 0);
      const extras = entries.reduce((sum, day) => sum + day.reminders.filter((reminder) => reminder.extra).length, 0);
      const skipped = entries.reduce((sum, day) => sum + day.reminders.filter((reminder) => reminder.skipped).length, 0);
       return { month, label, activeDays: entries.length, smoked, goal, extras, skipped, status: dayStatus(smoked, goal) };
    });
  }, [days, locale]);

  const visibleMonthMemories = useMemo(() => {
    const query = monthSearch.trim().toLocaleLowerCase(locale);
    if (!query) return monthMemories;
    return monthMemories.filter((memory) => memory.label.toLocaleLowerCase(locale).includes(query) || memory.month.includes(query));
  }, [monthMemories, monthSearch, locale]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });

  const locked = !account.access && account.role !== 'admin';

  return (
    <div className="min-h-[100dvh] bg-background pb-48 safe-top">
      <div className="px-4 py-4 space-y-[10px]">
        {locked && (
          <div className="surface-card p-5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-1" strokeWidth={1.75} />
            <div>
              <p className="t-16 text-foreground">{t('Testzeit abgelaufen', 'Trial period expired')}</p>
              <p className="t-12 text-subtle">{t('Statistik, Verlauf, Meilensteine und Export werden nach Freischaltung wieder sichtbar.', 'Statistics, history, milestones and export will be visible again after unlocking.')}</p>
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.16 }} className="surface-card p-5">
          <h2 className="t-18 text-foreground mb-3">{t('Ziel & erreicht pro Tag', 'Goal & achieved per day')}</h2>
          <div>
            {weekData.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3"><span className="t-16 font-medium text-foreground w-8">{day.day}</span><span className="t-12 num text-subtle">{formatDate(day.date)}</span></div>
                {day.hasData ? (
                  <div className="flex items-center gap-3">
                     <div className="w-20 h-1.5 bg-border rounded-pill overflow-hidden"><div className={`h-full rounded-pill ${{ ok: 'bg-success', warn: 'bg-warning', over: 'bg-destructive' }[dayStatus(day.smoked, day.goal)]}`} style={{ width: `${day.goal > 0 ? Math.min((day.smoked / day.goal) * 100, 100) : day.smoked > 0 ? 100 : 0}%` }} /></div>
                     <span className="flex items-baseline gap-1 num"><span className={`t-16 font-medium ${{ ok: 'text-success', warn: 'text-warning', over: 'text-destructive' }[dayStatus(day.smoked, day.goal)]}`}>{day.smoked}</span><span className="t-14 text-subtle">/ {day.goal} {t('Ziel', 'goal')}</span></span>
                  </div>
                ) : <span className="t-12 text-subtle">{t('Keine Daten', 'No data')}</span>}
              </div>
            ))}
          </div>
        </motion.div>
        {!locked && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.08 }} className="surface-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="t-18 text-foreground">{t('Archiv', 'Archive')}</h2>
              <div className="flex rounded-pill bg-muted p-1" role="tablist">
                {(['weeks', 'months'] as const).map((mode) => (
                  <button key={mode} role="tab" aria-selected={archiveMode === mode} onClick={() => setArchiveMode(mode)} className={`h-8 px-4 rounded-pill t-14 ${archiveMode === mode ? 'bg-primary text-primary-foreground' : 'text-subtle'}`}>{mode === 'weeks' ? t('Wochen', 'Weeks') : t('Monate', 'Months')}</button>
                ))}
              </div>
            </div>
            {archiveMode === 'weeks' ? (
              weekArchive.length === 0 ? <p className="t-14 text-subtle text-center py-4">{t('Noch keine Daten', 'No data yet')}</p> : (
              <>
                <p className="t-12 text-subtle mb-2">{t(`Gezählt von Montag bis ${rangeLabels[rangeEnd]}`, `Counted from Monday to ${rangeLabels[rangeEnd]}`)}</p>
                <div className="grid grid-cols-7 gap-1 mb-4" role="radiogroup" aria-label={t('Zeitraum bis', 'Range until')}>
                  {rangeShort.map((label, i) => (
                    <button key={i} role="radio" aria-checked={rangeEnd === i} onClick={() => setRangeEnd(i)} className={`h-9 rounded-pill t-12 ${rangeEnd === i ? 'bg-primary text-primary-foreground' : i < rangeEnd ? 'bg-primary/15 text-foreground' : 'bg-muted text-subtle'}`}>{label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[weekA, weekB].map((w, slot) => (
                    <div key={slot} className="rounded-inner bg-muted p-3">
                      <select aria-label={slot === 0 ? t('Erste Woche', 'First week') : t('Zweite Woche', 'Second week')} value={w?.start ?? ''} onChange={(e) => { (slot === 0 ? setWeekAKey : setWeekBKey)(e.target.value); (e.target as HTMLSelectElement).blur(); }} className="w-full bg-transparent t-14 text-foreground outline-none">
                        {weekArchive.map((o) => <option key={o.start} value={o.start}>{t('KW', 'Wk')} {o.week} · {o.label}</option>)}
                      </select>
                      <p className="t-36 num text-foreground mt-2">{w ? w.range : '–'}</p>
                      <p className="t-12 num text-subtle">{rangeEnd < 6 ? `${t('ganze Woche', 'full week')} ${w?.total ?? 0}` : t('ganze Woche', 'full week')}</p>
                    </div>
                  ))}
                </div>
                {weekA && weekB && weekA.start !== weekB.start && (() => {
                  const diff = weekB.range - weekA.range;
                  return <p className="t-14 text-subtle mt-3 text-center">{t('KW', 'Wk')} {weekB.week} {t('zu', 'vs')} {t('KW', 'Wk')} {weekA.week}: <span className={`num t-16 ${diff <= 0 ? 'text-success' : 'text-destructive'}`}>{diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0'}</span> {diff < 0 ? t('weniger', 'less') : diff > 0 ? t('mehr', 'more') : t('gleich', 'same')}</p>;
                })()}
              </>)
            ) : (
              <>
              <label className="relative block mb-3">
                <span className="sr-only">{t('Monat suchen', 'Search month')}</span>
                <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
                <Input value={monthSearch} onChange={(event) => setMonthSearch(event.target.value)} placeholder={t('Monat suchen', 'Search month')} className="h-12 rounded-pill bg-muted border-transparent pl-11 t-16" />
              </label>
              <div className="space-y-[10px]">
                {visibleMonthMemories.map((memory) => (
                  <div key={memory.month} className="rounded-inner bg-muted px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="t-16 text-foreground capitalize">{memory.label}</p><p className="t-12 text-subtle">{memory.activeDays} {t('Tage gespeichert', 'days saved')}</p></div>
                       <span className="flex items-baseline gap-1 num"><span className={`t-24 ${{ ok: 'text-success', warn: 'text-warning', over: 'text-destructive' }[memory.status]}`}>{memory.smoked}</span><span className="t-12 text-subtle">/ {memory.goal}</span></span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <span className="rounded-pill bg-card px-3 py-2 flex items-center justify-between"><span className="t-12 text-subtle">{t('Extra', 'Extra')}</span><span className="num t-16 text-destructive">{memory.extras}</span></span>
                      <span className="rounded-pill bg-card px-3 py-2 flex items-center justify-between"><span className="t-12 text-subtle">{t('Übersprungen', 'Skipped')}</span><span className="num t-16 text-success">{memory.skipped}</span></span>
                    </div>
                  </div>
                ))}
                {visibleMonthMemories.length === 0 && <p className="t-14 text-subtle text-center py-4">{t('Kein Monat gefunden', 'No month found')}</p>}
              </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StatisticsScreen;
