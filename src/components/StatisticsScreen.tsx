import { motion } from 'framer-motion';
import { useAppStore, GOAL_FLOOR, suggestGoal } from '../store/appStore';
import { formatLocalDate } from '../store/appStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, TrendingUp, Minus, Cigarette, Calendar, Target } from 'lucide-react';
import { useMemo } from 'react';

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
    const daysWithData = weekData.filter(d => d.hasData);
    
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
    
    const bestDay = daysWithData.reduce((best, d) => 
      d.smoked < (best?.smoked ?? Infinity) ? d : best, daysWithData[0]);
    const worstDay = daysWithData.reduce((worst, d) => 
      d.smoked > (worst?.smoked ?? -1) ? d : worst, daysWithData[0]);

    // Trend berechnen (erste Hälfte vs zweite Hälfte)
    const half = Math.floor(daysWithData.length / 2);
    const firstHalf = daysWithData.slice(0, half);
    const secondHalf = daysWithData.slice(half);
    
    const firstAvg = firstHalf.length > 0 
      ? firstHalf.reduce((s, d) => s + d.smoked, 0) / firstHalf.length 
      : 0;
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((s, d) => s + d.smoked, 0) / secondHalf.length 
      : 0;

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

  const TrendIcon = stats.trend === 'down' ? TrendingDown : stats.trend === 'up' ? TrendingUp : Minus;
  const trendColor = stats.trend === 'down' ? 'text-green-500' : stats.trend === 'up' ? 'text-red-500' : 'text-muted-foreground';
  const trendText = stats.trend === 'down' ? 'Weniger geraucht' : stats.trend === 'up' ? 'Mehr geraucht' : 'Stabil';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Statistik</h1>
          <p className="text-sm text-muted-foreground">Letzte 7 Tage</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Empfehlung */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-primary/30 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Ziel für morgen
          </p>
          <p className="text-4xl font-bold text-primary tabular-nums leading-none mb-2">
            {suggestion}
          </p>
          <p className="text-sm text-muted-foreground mb-3">{suggestionText}</p>
          <p className="text-[11px] text-muted-foreground mb-3">
            Das Ziel sinkt nur nach unten – bis mindestens {GOAL_FLOOR} pro Tag.
          </p>
          <button
            type="button"
            onClick={() => setDailyCigarettes(suggestion, tomorrowDate)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Ziel übernehmen
          </button>
        </motion.div>

        {/* Wochenübersicht Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">Wochenübersicht</h2>
          
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap="20%">
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis hide />
                <Bar dataKey="smoked" radius={[6, 6, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.hasData 
                        ? entry.smoked <= entry.goal 
                          ? 'hsl(var(--primary))' 
                          : 'hsl(var(--destructive))'
                        : 'hsl(var(--muted))'
                      }
                      opacity={entry.hasData ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Trend Karte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dein Trend</p>
              <p className={`text-lg font-semibold ${trendColor}`}>{trendText}</p>
            </div>
            <div className={`p-3 rounded-full bg-muted/50 ${trendColor}`}>
              <TrendIcon className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Statistik Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Cigarette className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Gesamt geraucht</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalSmoked}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Ø pro Tag</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.avgPerDay}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Eingespart</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.savedCigarettes}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Bester Tag</p>
            </div>
            {stats.bestDay ? (
              <p className="text-lg font-bold text-foreground">
                {stats.bestDay.smoked} <span className="text-sm font-normal text-muted-foreground">({formatDate(stats.bestDay.date)})</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Daten</p>
            )}
          </motion.div>
        </div>

        {/* Tägliche Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-4 border border-border shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Tagesdetails</h2>
          
          <div className="space-y-2">
            {weekData.map((day, index) => (
              <div 
                key={day.date}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground w-6">{day.day}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
                </div>
                
                {day.hasData ? (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          day.smoked <= day.goal ? 'bg-primary' : 'bg-destructive'
                        }`}
                        style={{ width: `${Math.min((day.smoked / day.goal) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      day.smoked <= day.goal ? 'text-foreground' : 'text-destructive'
                    }`}>
                      {day.smoked}/{day.goal}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Keine Daten</span>
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
