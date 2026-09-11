import { motion } from 'framer-motion';
import { useAppStore, GOAL_FLOOR, suggestGoal } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Cigarette, Calendar, Target } from 'lucide-react';
import { useMemo } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

const StatisticsScreen = () => {
  const { days, dailyCigarettes, setDailyCigarettes } = useAppStore();

  // Empfehlung für morgen
  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }, []);
  const suggestion = useMemo(
    () => suggestGoal(days, tomorrowDate, dailyCigarettes),
    [days, tomorrowDate, dailyCigarettes]
  );
  const todayData = days[formatLocalDate()];
  const suggestionText = !todayData
    ? `Halte morgen ${suggestion} Zigaretten – ein kleiner Schritt nach unten.`
    : todayData.cigarettesSmoked <= todayData.totalCigarettes
      ? `Heute im Ziel. Morgen ${suggestion} – eine weniger.`
      : `Heute ${todayData.cigarettesSmoked} statt ${todayData.totalCigarettes}. Nimm morgen wieder ${suggestion} und halte sie durch.`;

  // Letzte 7 Tage berechnen
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

  // Statistiken berechnen
  const stats = useMemo(() => {
    const daysWithData = weekData.filter((d) => d.hasData);

    if (daysWithData.length === 0) {
      return {
        totalSmoked: 0,
        avgPerDay: 0,
        bestDay: null,
        worstDay: null,
        trend: 'neutral' as const,
        savedCigarettes: 0,
      };
    }

    const totalSmoked = daysWithData.reduce((sum, d) => sum + d.smoked, 0);
    const totalGoal = daysWithData.reduce((sum, d) => sum + d.goal, 0);
    const avgPerDay = totalSmoked / daysWithData.length;

    const bestDay = daysWithData.reduce(
      (best, d) => (d.smoked < (best?.smoked ?? Infinity) ? d : best),
      daysWithData[0]
    );
    const worstDay = daysWithData.reduce(
      (worst, d) => (d.smoked > (worst?.smoked ?? -1) ? d : worst),
      daysWithData[0]
    );

    // Trend berechnen (erste Hälfte vs zweite Hälfte)
    const half = Math.floor(daysWithData.length / 2);
    const firstHalf = daysWithData.slice(0, half);
    const secondHalf = daysWithData.slice(half);

    const firstAvg =
      firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.smoked, 0) / firstHalf.length : 0;
    const secondAvg =
      secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.smoked, 0) / secondHalf.length : 0;

    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (secondAvg < firstAvg - 0.5) trend = 'down';
    else if (secondAvg > firstAvg + 0.5) trend = 'up';

    const savedCigarettes = totalGoal - totalSmoked;

    return {
      totalSmoked,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      bestDay,
      worstDay,
      trend,
      savedCigarettes: Math.max(0, savedCigarettes),
    };
  }, [weekData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const Metric = ({
    icon: Icon,
    label,
    children,
    delay,
  }: {
    icon: typeof Cigarette;
    label: string;
    children: React.ReactNode;
    delay: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE, delay }}
      className="surface-card p-4"
    >
      <span className="icon-tile mb-3">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </span>
      <p className="t-14 text-subtle">{label}</p>
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-48 safe-top">
      <div className="px-4 py-4 space-y-[10px]">
        {/* Empfehlung */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="surface-card surface-card-lg p-5"
        >
          <p className="t-12 uppercase tracking-[0.08em] text-subtle mb-1">Ziel für morgen</p>
          <p className="t-36 num text-foreground mb-2">{suggestion}</p>
          <p className="t-14 text-muted-foreground mb-2">{suggestionText}</p>
          <p className="t-12 text-subtle mb-4">
            Das Ziel sinkt nur nach unten – bis mindestens {GOAL_FLOOR} pro Tag.
          </p>
          <button
            type="button"
            onClick={() => setDailyCigarettes(suggestion, tomorrowDate)}
            className="btn-pill btn-primary w-full"
          >
            Ziel übernehmen
          </button>
        </motion.div>

        {/* Wochenübersicht Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE, delay: 0.02 }}
          className="surface-card p-5"
        >
          <h2 className="t-18 text-foreground mb-4">Wochenübersicht</h2>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap="30%">
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--border) / 0.2)"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--subtle))', fontSize: 12 }}
                />
                <YAxis hide />
                <Bar dataKey="smoked" radius={[8, 8, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.hasData
                          ? entry.smoked <= entry.goal
                            ? 'hsl(var(--success))'
                            : 'hsl(var(--primary))'
                          : 'hsl(var(--border))'
                      }
                      opacity={entry.hasData ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Kennzahlen im Bento-Raster */}
        <div className="grid grid-cols-2 gap-[10px]">
          <Metric icon={Cigarette} label="Gesamt geraucht" delay={0.04}>
            <p className="t-32 num text-foreground">{stats.totalSmoked}</p>
          </Metric>

          <Metric icon={Calendar} label="Ø pro Tag" delay={0.06}>
            <p className="t-32 num text-foreground">{stats.avgPerDay}</p>
          </Metric>

          <Metric icon={Target} label="Eingespart" delay={0.08}>
            <p className="t-32 num" style={{ color: 'hsl(var(--success))' }}>
              {stats.savedCigarettes}
            </p>
          </Metric>

          <Metric icon={TrendingDown} label="Bester Tag" delay={0.1}>
            {stats.bestDay ? (
              <p className="flex items-baseline gap-1">
                <span className="t-32 num text-foreground">{stats.bestDay.smoked}</span>
                <span className="t-14 num text-subtle">({formatDate(stats.bestDay.date)})</span>
              </p>
            ) : (
              <p className="t-14 text-subtle">Keine Daten</p>
            )}
          </Metric>
        </div>

        {/* Tägliche Details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE, delay: 0.12 }}
          className="surface-card p-5"
        >
          <h2 className="t-18 text-foreground mb-3">Ziel &amp; erreicht pro Tag</h2>

          <div>
            {weekData.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-3 border-b border-border/60 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="t-16 font-medium text-foreground w-8">{day.day}</span>
                  <span className="t-12 num text-subtle">{formatDate(day.date)}</span>
                </div>

                {day.hasData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-border rounded-pill overflow-hidden">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${Math.min((day.smoked / day.goal) * 100, 100)}%`,
                          backgroundColor:
                            day.smoked <= day.goal
                              ? 'hsl(var(--success))'
                              : 'hsl(var(--destructive))',
                        }}
                      />
                    </div>
                    <span className="flex items-baseline gap-1 num">
                      <span
                        className="t-16 font-medium"
                        style={{
                          color:
                            day.smoked <= day.goal
                              ? 'hsl(var(--foreground))'
                              : 'hsl(var(--destructive))',
                        }}
                      >
                        {day.smoked}
                      </span>
                      <span className="t-14 text-subtle">/ {day.goal} Ziel</span>
                    </span>
                  </div>
                ) : (
                  <span className="t-12 text-subtle">Keine Daten</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsScreen;
