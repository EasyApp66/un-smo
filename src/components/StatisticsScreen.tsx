import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Cigarette, Calendar, Target, Search, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import {
  formatMoney,
  MINUTES_PER_CIGARETTE,
  formatSavedTime,
  pauseStats,
  savedSummary,
  weeklyActuals,
} from '@/lib/reductionPlan';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';

const EASE = [0.22, 1, 0.36, 1] as const;
const hour = () => new Date().getHours();
const quietOrTyping = () => {
  const active = document.activeElement?.tagName?.toLowerCase();
  return hour() >= 23 || hour() < 7 || active === 'input' || active === 'textarea';
};
const fmtDuration = (ms: number) => {
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} Tag${Math.floor(hours / 24) === 1 ? '' : 'e'}`;
  return `${Math.max(0, hours)} Std.`;
};

const StatisticsScreen = () => {
  const { days, dailyCigarettes, reductionPlan, milestoneSeenIds, markMilestoneSeen } = useAppStore();
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
      const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      data.push({
        day: dayNames[date.getDay()],
        date: dateString,
        smoked: dayData?.cigarettesSmoked || 0,
        goal: dayData?.totalCigarettes || dailyCigarettes,
        hasData: !!dayData,
      });
    }
    return data;
  }, [days, dailyCigarettes]);

  const stats = useMemo(() => {
    const daysWithData = weekData.filter((d) => d.hasData);
    if (daysWithData.length === 0) return { totalSmoked: 0, avgPerDay: 0, bestDay: null, savedCigarettes: 0 };
    const totalSmoked = daysWithData.reduce((sum, d) => sum + d.smoked, 0);
    const totalGoal = daysWithData.reduce((sum, d) => sum + d.goal, 0);
    const avgPerDay = totalSmoked / daysWithData.length;
    const bestDay = daysWithData.reduce((best, d) => (d.smoked < (best?.smoked ?? Infinity) ? d : best), daysWithData[0]);
    return { totalSmoked, avgPerDay: Math.round(avgPerDay * 10) / 10, bestDay, savedCigarettes: Math.max(0, totalGoal - totalSmoked) };
  }, [weekData]);

  const savings = useMemo(() => savedSummary(days, reductionPlan), [days, reductionPlan]);
  const weeklySavings = useMemo(() => weeklyActuals(days, reductionPlan).slice(0, 8), [days, reductionPlan]);
  const pauses = useMemo(() => pauseStats(days), [days]);

  const milestones = useMemo(() => {
    const longTermActive = !!reductionPlan.zeroReachedAt && formatLocalDate() >= reductionPlan.zeroReachedAt;
    return [
      { id: 'short-20m', label: '20 Minuten', detail: 'Puls und Blutdruck beginnen sich zu normalisieren.', done: pauses.currentMs >= 20 * 60_000 },
      { id: 'short-8h', label: '8 Stunden', detail: 'Der Sauerstoffgehalt verbessert sich.', done: pauses.currentMs >= 8 * 3_600_000 },
      { id: 'short-24h', label: '24 Stunden', detail: 'Das Herzinfarkt-Risiko beginnt zu sinken.', done: pauses.currentMs >= 24 * 3_600_000 },
      { id: 'long-2w', label: '2 Wochen', detail: 'Kreislauf und Lungenfunktion können sich verbessern.', done: longTermActive && reductionPlan.zeroReachedAt ? formatLocalDate() >= new Date(new Date(`${reductionPlan.zeroReachedAt}T12:00:00`).getTime() + 14 * 86_400_000).toISOString().slice(0, 10) : false },
    ];
  }, [pauses.currentMs, reductionPlan.zeroReachedAt]);

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
      const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      const smoked = entries.reduce((sum, day) => sum + day.cigarettesSmoked, 0);
      const goal = entries.reduce((sum, day) => sum + day.totalCigarettes, 0);
      const extras = entries.reduce((sum, day) => sum + day.reminders.filter((reminder) => reminder.extra).length, 0);
      const skipped = entries.reduce((sum, day) => sum + day.reminders.filter((reminder) => reminder.skipped).length, 0);
      return { month, label, activeDays: entries.length, smoked, goal, extras, skipped, overGoal: goal > 0 && smoked > goal };
    });
  }, [days]);

  const visibleMonthMemories = useMemo(() => {
    const query = monthSearch.trim().toLocaleLowerCase('de-DE');
    if (!query) return monthMemories;
    return monthMemories.filter((memory) => memory.label.toLocaleLowerCase('de-DE').includes(query) || memory.month.includes(query));
  }, [monthMemories, monthSearch]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

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
              <p className="t-16 text-foreground">Testzeit abgelaufen</p>
              <p className="t-12 text-subtle">Statistik, Verlauf, Meilensteine und Export werden nach Freischaltung wieder sichtbar.</p>
            </div>
          </div>
        )}

        {!locked && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }} className="surface-card p-5">
              <h2 className="t-18 text-foreground mb-4">Dein Körper</h2>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-inner bg-muted p-4">
                  <p className="t-12 text-subtle">Aktuelle Pause</p>
                  <p className="t-24 num text-foreground">{fmtDuration(pauses.currentMs)}</p>
                </div>
                <div className="rounded-inner bg-muted p-4">
                  <p className="t-12 text-subtle">Längste Pause</p>
                  <p className="t-24 num text-foreground">{fmtDuration(pauses.longestMs)}</p>
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
              <p className="t-12 text-subtle mt-4">Hinweis nach WHO/NHS. Keine medizinische Beratung.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.02 }} className="surface-card p-5">
              <h2 className="t-18 text-foreground mb-4">Gewonnene Zeit</h2>
              <div className="mb-4">
                <div className="rounded-inner bg-muted p-4"><p className="t-12 text-subtle">Zeit</p><p className="t-24 num text-foreground">{formatSavedTime(savings.savedMinutes)}</p></div>
              </div>
              <div className="space-y-2">
                {weeklySavings.map((row) => (
                  <div key={row.week} className="flex items-center justify-between rounded-inner bg-muted px-4 py-3">
                    <span className="t-14 text-foreground">{row.label}</span>
                    <span className="t-16 num text-foreground">{formatSavedTime(row.savedCigarettes * MINUTES_PER_CIGARETTE)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.04 }} className="surface-card p-5">
          <h2 className="t-18 text-foreground mb-4">Wochenübersicht</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.2)" strokeWidth={1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--subtle))', fontSize: 12 }} />
                <YAxis hide />
                <Bar dataKey="smoked" radius={[8, 8, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hasData ? (entry.smoked <= entry.goal ? 'hsl(var(--success))' : 'hsl(var(--destructive))') : 'hsl(var(--border))'} opacity={entry.hasData ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {!locked && (
          <>
            <div className="grid grid-cols-2 gap-[10px]">
              <Metric icon={Cigarette} label="Gesamt geraucht" delay={0.06}><p className="t-32 num text-foreground">{stats.totalSmoked}</p></Metric>
              <Metric icon={Calendar} label="Ø pro Tag" delay={0.08}><p className="t-32 num text-foreground">{stats.avgPerDay}</p></Metric>
              <Metric icon={Target} label="Eingespart" delay={0.1}><p className="t-32 num text-success">{stats.savedCigarettes}</p></Metric>
              <Metric icon={Calendar} label="Bester Tag" delay={0.12}>{stats.bestDay ? <p className="flex items-baseline gap-1"><span className="t-32 num text-foreground">{stats.bestDay.smoked}</span><span className="t-14 num text-subtle">({formatDate(stats.bestDay.date)})</span></p> : <p className="t-14 text-subtle">Keine Daten</p>}</Metric>
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.14 }} className="surface-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4"><h2 className="t-18 text-foreground">Monats-Memory</h2><span className="t-12 text-subtle">{monthMemories.length}</span></div>
              <label className="relative block mb-3">
                <span className="sr-only">Monat suchen</span>
                <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
                <Input value={monthSearch} onChange={(event) => setMonthSearch(event.target.value)} placeholder="Monat suchen" className="h-12 rounded-pill bg-muted border-transparent pl-11 t-16" />
              </label>
              <div className="space-y-[10px]">
                {visibleMonthMemories.map((memory) => (
                  <div key={memory.month} className="rounded-inner bg-muted px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="t-16 text-foreground capitalize">{memory.label}</p><p className="t-12 text-subtle">{memory.activeDays} Tage gespeichert</p></div>
                      <span className="flex items-baseline gap-1 num"><span className={`t-24 ${memory.overGoal ? 'text-destructive' : 'text-foreground'}`}>{memory.smoked}</span><span className="t-12 text-subtle">/ {memory.goal}</span></span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <span className="rounded-pill bg-card px-3 py-2 flex items-center justify-between"><span className="t-12 text-subtle">Extra</span><span className="num t-16 text-destructive">{memory.extras}</span></span>
                      <span className="rounded-pill bg-card px-3 py-2 flex items-center justify-between"><span className="t-12 text-subtle">Übersprungen</span><span className="num t-16 text-success">{memory.skipped}</span></span>
                    </div>
                  </div>
                ))}
                {visibleMonthMemories.length === 0 && <p className="t-14 text-subtle text-center py-4">Kein Monat gefunden</p>}
              </div>
            </motion.div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE, delay: 0.16 }} className="surface-card p-5">
          <h2 className="t-18 text-foreground mb-3">Ziel &amp; erreicht pro Tag</h2>
          <div>
            {weekData.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3"><span className="t-16 font-medium text-foreground w-8">{day.day}</span><span className="t-12 num text-subtle">{formatDate(day.date)}</span></div>
                {day.hasData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-border rounded-pill overflow-hidden"><div className={`h-full rounded-pill ${day.smoked <= day.goal ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${day.goal > 0 ? Math.min((day.smoked / day.goal) * 100, 100) : 0}%` }} /></div>
                    <span className="flex items-baseline gap-1 num"><span className={`t-16 font-medium ${day.smoked <= day.goal ? 'text-foreground' : 'text-destructive'}`}>{day.smoked}</span><span className="t-14 text-subtle">/ {day.goal} Ziel</span></span>
                  </div>
                ) : <span className="t-12 text-subtle">Keine Daten</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsScreen;
