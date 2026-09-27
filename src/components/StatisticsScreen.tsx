import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Cigarette, Calendar, Target, Search, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { dayStatus, pauseStats } from '@/lib/reductionPlan';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';
import { useT, useLocale } from '@/lib/i18n';

const EASE = [0.22, 1, 0.36, 1] as const;
const hour = () => new Date().getHours();
const quietOrTyping = () => {
  const active = document.activeElement?.tagName?.toLowerCase();
  return hour() >= 23 || hour() < 7 || active === 'input' || active === 'textarea';
};
const fmtDuration = (ms: number, t: <T,>(de: T, en: T) => T) => {
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return t(`${Math.floor(hours / 24)} Tag${Math.floor(hours / 24) === 1 ? '' : 'e'}`, `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'}`);
  return t(`${Math.max(0, hours)} Std.`, `${Math.max(0, hours)} hr`);
};

const StatisticsScreen = () => {
  const { days, dailyCigarettes, reductionPlan, milestoneSeenIds, markMilestoneSeen } = useAppStore();
  const t = useT();
  const locale = useLocale();
  const [monthSearch, setMonthSearch] = useState('');
  const [account, setAccount] = useState<AccountStatus>(defaultAccountStatus);

  useEffect(() => {
    fetchAccountStatus().then(setAccount).catch(() => setAccount(defaultAccountStatus));
  }, []);

  const weekData = useMemo(() => {
    const data = [];
    const today = new Date();
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

  const stats = useMemo(() => {
    const daysWithData = weekData.filter((d) => d.hasData);
    if (daysWithData.length === 0) return { totalSmoked: 0, avgPerDay: 0, bestDay: null, savedCigarettes: 0 };
    const totalSmoked = daysWithData.reduce((sum, d) => sum + d.smoked, 0);
    const totalGoal = daysWithData.reduce((sum, d) => sum + d.goal, 0);
    const avgPerDay = totalSmoked / daysWithData.length;
    const bestDay = daysWithData.reduce((best, d) => (d.smoked < (best?.smoked ?? Infinity) ? d : best), daysWithData[0]);
    return { totalSmoked, avgPerDay: Math.round(avgPerDay * 10) / 10, bestDay, savedCigarettes: Math.max(0, totalGoal - totalSmoked) };
  }, [weekData]);

  // Summe der letzten 7 Tage im Vergleich zu den 7 Tagen davor
  const weekDelta = useMemo(() => {
    const sum = (from: number) => {
      let total = 0;
      let any = false;
      for (let i = from; i < from + 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = days[formatLocalDate(d)];
        if (day) { any = true; total += day.cigarettesSmoked || 0; }
      }
      return any ? total : null;
    };
    const current = sum(0);
    const previous = sum(7);
    if (current === null || previous === null) return null;
    return current - previous;
  }, [days]);

  const pauses = useMemo(() => pauseStats(days), [days]);

  const milestones = useMemo(() => {
    const longTermActive = !!reductionPlan.zeroReachedAt && formatLocalDate() >= reductionPlan.zeroReachedAt;
    return [
      { id: 'short-20m', label: t('20 Minuten', '20 minutes'), detail: t('Puls und Blutdruck beginnen sich zu normalisieren.', 'Pulse and blood pressure start to normalize.'), done: pauses.currentMs >= 20 * 60_000 },
      { id: 'short-8h', label: t('8 Stunden', '8 hours'), detail: t('Der Sauerstoffgehalt verbessert sich.', 'Oxygen levels improve.'), done: pauses.currentMs >= 8 * 3_600_000 },
      { id: 'short-24h', label: t('24 Stunden', '24 hours'), detail: t('Das Herzinfarkt-Risiko beginnt zu sinken.', 'Heart attack risk starts to decrease.'), done: pauses.currentMs >= 24 * 3_600_000 },
      { id: 'long-2w', label: t('2 Wochen', '2 weeks'), detail: t('Kreislauf und Lungenfunktion können sich verbessern.', 'Circulation and lung function can improve.'), done: longTermActive && reductionPlan.zeroReachedAt ? formatLocalDate() >= new Date(new Date(`${reductionPlan.zeroReachedAt}T12:00:00`).getTime() + 14 * 86_400_000).toISOString().slice(0, 10) : false },
    ];
  }, [pauses.currentMs, reductionPlan.zeroReachedAt, t]);

  useEffect(() => {
    if (quietOrTyping()) return;
    const next = milestones.find((m) => m.done && !milestoneSeenIds.includes(m.id));
    if (!next) return;
    toast(next.label, { description: next.detail });
    markMilestoneSeen(next.id);
  }, [milestones, milestoneSeenIds, markMilestoneSeen]);

  const monthMemories = useMemo(() => {
    const currentMonth = formatLocalDate().slice(0, 7);
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

  const Metric = ({ icon: Icon, label, children, delay }: { icon: typeof Cigarette; label: string; children: React.ReactNode; delay: number }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay }} className="surface-card p-4">
      <span className="icon-tile mb-3"><Icon className="w-6 h-6" strokeWidth={1.5} /></span>
      <p className="t-14 text-subtle">{label}</p>
      {children}
    </motion.div>
  );

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

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.04 }} className="surface-card p-5">
          <h2 className="t-18 text-foreground mb-4">{t('Wochenübersicht', 'Weekly overview')}</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.2)" strokeWidth={1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--subtle))', fontSize: 12 }} />
                <YAxis hide />
                <Bar dataKey="smoked" radius={[8, 8, 0, 0]}>
                  {weekData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.hasData ? `hsl(var(--${{ ok: 'success', warn: 'warning', over: 'destructive' }[dayStatus(entry.smoked, entry.goal)]}))` : 'hsl(var(--border))'} opacity={entry.hasData ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
           <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 t-12 text-subtle">
             {([['bg-success', t('im Ziel', 'on target')], ['bg-warning', t('bis 2 darüber', 'up to 2 over')], ['bg-destructive', t('mehr als 2 darüber', 'more than 2 over')]] as const).map(([color, label]) => <span key={color} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-pill ${color}`} />{label}</span>)}
           </div>
        </motion.div>

        {!locked && (
          <>
            <div className="grid grid-cols-2 gap-[10px]">
              <Metric icon={Cigarette} label={t('Gesamt geraucht', 'Total smoked')} delay={0.06}><p className="t-32 num text-foreground">{stats.totalSmoked}</p></Metric>
              <Metric icon={Calendar} label={t('Ø pro Tag', 'Avg per day')} delay={0.08}><p className="t-32 num text-foreground">{stats.avgPerDay}</p></Metric>
              <Metric icon={Target} label={t('Zur Vorwoche', 'Vs. last week')} delay={0.1}>{weekDelta === null ? <p className="t-14 text-subtle">{t('Keine Daten', 'No data')}</p> : <p className="flex items-baseline gap-1"><span className={`t-32 num ${weekDelta <= 0 ? 'text-success' : 'text-destructive'}`}>{weekDelta > 0 ? `+${weekDelta}` : weekDelta < 0 ? `−${Math.abs(weekDelta)}` : '0'}</span><span className="t-14 text-subtle">{weekDelta < 0 ? t('weniger', 'less') : weekDelta > 0 ? t('mehr', 'more') : t('gleich', 'same')}</span></p>}</Metric>
              <Metric icon={Calendar} label={t('Bester Tag', 'Best day')} delay={0.12}>{stats.bestDay ? <p className="flex items-baseline gap-1"><span className="t-32 num text-foreground">{stats.bestDay.smoked}</span><span className="t-14 num text-subtle">({formatDate(stats.bestDay.date)})</span></p> : <p className="t-14 text-subtle">{t('Keine Daten', 'No data')}</p>}</Metric>
            </div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.16 }} className="surface-card p-5">
          <h2 className="t-18 text-foreground mb-3">{t('Ziel & erreicht pro Tag', 'Goal & achieved per day')}</h2>
          <div>
            {weekData.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3"><span className="t-16 font-medium text-foreground w-8">{day.day}</span><span className="t-12 num text-subtle">{formatDate(day.date)}</span></div>
                {day.hasData ? (
                  <div className="flex items-center gap-3">
                     <div className="w-20 h-1.5 bg-border rounded-pill overflow-hidden"><div className={`h-full rounded-pill ${{ ok: 'bg-success', warn: 'bg-warning', over: 'bg-destructive' }[dayStatus(day.smoked, day.goal)]}`} style={{ width: `${day.goal > 0 ? Math.min((day.smoked / day.goal) * 100, 100) : 0}%` }} /></div>
                     <span className="flex items-baseline gap-1 num"><span className={`t-16 font-medium ${{ ok: 'text-success', warn: 'text-warning', over: 'text-destructive' }[dayStatus(day.smoked, day.goal)]}`}>{day.smoked}</span><span className="t-14 text-subtle">/ {day.goal} {t('Ziel', 'goal')}</span></span>
                  </div>
                ) : <span className="t-12 text-subtle">{t('Keine Daten', 'No data')}</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {!locked && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.14 }} className="surface-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4"><h2 className="t-18 text-foreground">{t('Monats-Memory', 'Monthly memory')}</h2><span className="t-12 text-subtle">{monthMemories.length}</span></div>
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
            </motion.div>
          </>
        )}

        {!locked && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }} className="surface-card p-5">
              <h2 className="t-18 text-foreground mb-4">{t('Dein Körper', 'Your body')}</h2>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-inner bg-muted p-4">
                  <p className="t-12 text-subtle">{t('Aktuelle Pause', 'Current pause')}</p>
                  <p className="t-24 num text-foreground">{fmtDuration(pauses.currentMs, t)}</p>
                </div>
                <div className="rounded-inner bg-muted p-4">
                  <p className="t-12 text-subtle">{t('Längste Pause', 'Longest pause')}</p>
                  <p className="t-24 num text-foreground">{fmtDuration(pauses.longestMs, t)}</p>
                </div>
              </div>
              <div className="space-y-0">
                {milestones.map((m) => (
                  <div key={m.id} className="relative pl-6 pb-5 last:pb-0">
                    <span className="absolute left-[5px] top-2 bottom-0 w-px bg-border last:hidden" />
                    <span className={`absolute left-0 top-1.5 w-3 h-3 rounded-pill ${m.done ? 'bg-primary' : 'bg-border'}`} />
                    <p className="t-16 text-foreground">{m.label}</p>
                    <p className="t-12 text-subtle">{m.detail}</p>
                  </div>
                ))}
              </div>
              <p className="t-12 text-subtle mt-4">{t('Hinweis nach WHO/NHS. Keine medizinische Beratung.', 'Based on WHO/NHS. Not medical advice.')}</p>
            </motion.div>

          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsScreen;
