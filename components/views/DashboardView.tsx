"use client";

import React from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '@/lib/store';
import { formatCurrency, getMonthlyTotal, getMonthlyExpenses, getFixedExpenses, getTotalByPerson, getGoalProgressPercentage, getBestActivity, cn } from '@/lib/utils';
import { ArrowRight, Wallet, User, Target, CheckCircle2, TrendingUp, Sparkles, TrendingDown, CreditCard, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Tab } from '@/app/page';

interface Props {
  navigate: (tab: Tab) => void;
}

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" as const }
});

export default function DashboardView({ navigate }: Props) {
  const { incomes, expenses, goals, currentMonth } = useAppContext();

  const monthlyTotal = getMonthlyTotal(incomes, currentMonth);
  const monthlyExp = getMonthlyExpenses(expenses, currentMonth);
  const fixedExp = getFixedExpenses(expenses, currentMonth);
  const mrTotal = getTotalByPerson(incomes, 'Monsieur', currentMonth);
  const mmeTotal = getTotalByPerson(incomes, 'Madame', currentMonth);
  
  // URSSAF Pro calculation (21% on specific activities)
  const proActivities = ['Logo', 'Site internet', 'Landing page', 'Application', 'Service', 'Formation'];
  const mrProIncome = incomes.filter(inc => inc.person === 'Monsieur' && proActivities.includes(inc.activity) && inc.date.startsWith(currentMonth)).reduce((sum, inc) => sum + inc.amount, 0);
  const mmeProIncome = incomes.filter(inc => inc.person === 'Madame' && proActivities.includes(inc.activity) && inc.date.startsWith(currentMonth)).reduce((sum, inc) => sum + inc.amount, 0);
  
  const mrUrssaf = mrProIncome * 0.21;
  const mmeUrssaf = mmeProIncome * 0.21;
  const totalUrssaf = mrUrssaf + mmeUrssaf;

  const cashflow = monthlyTotal - monthlyExp;
  const resteAVivre = monthlyTotal - fixedExp - totalUrssaf;
  const netDansLaPoche = monthlyTotal - totalUrssaf;
  
  const progress = getGoalProgressPercentage(monthlyTotal, goals.familyTarget);
  const remaining = Math.max(0, goals.familyTarget - monthlyTotal);

  const bestActivity = getBestActivity(incomes, currentMonth);
  
  // Data for Charts
  const activityTotals = incomes.filter(inc => inc.date.startsWith(currentMonth)).reduce((acc, curr) => {
    acc[curr.activity] = (acc[curr.activity] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(activityTotals).map(([name, value]) => ({ name, value }));
  const COLORS = ['#43D39E', '#D8B86A', '#8B5CF6', '#FF6B4A', '#6B665F', '#159B72'];

  const recentEntries = [...incomes, ...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Bonjour, Famille Numdema</h1>
          <p className="text-[var(--color-app-text-muted)] mt-1">Chaque euro a une trace. Voici votre progression du mois.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <div className="px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-sm font-medium text-center">Avril 2026</div>
          <button 
            onClick={() => navigate('ajouter')}
            className="flex justify-center items-center gap-2 px-5 py-2.5 bg-[var(--color-app-text)] text-[var(--color-app-ivory)] rounded-full hover:bg-[var(--color-app-deep)] transition overflow-hidden relative group w-full sm:w-auto"
          >
            <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-app-champagne)] to-transparent opacity-50" />
            <span className="font-medium text-sm z-10 relative">Ajouter une entrée</span>
            <ArrowRight className="w-4 h-4 z-10 relative group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </button>
        </div>
      </motion.div>

      {/* Advanced Analysis Row */}
      <motion.div {...fadeUp(0.1)} className="grid md:grid-cols-3 gap-4">
        
        {/* Cashflow Card */}
        <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03] flex flex-col justify-between">
          <div>
            <h2 className="text-black/60 font-bold mb-1 flex items-center gap-2"><Scale className="w-4 h-4 text-[var(--color-app-champion)]"/> Épargne réelle générée</h2>
            <div className="text-4xl font-black mt-2 text-[var(--color-app-text)]">
              {formatCurrency(cashflow)}
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <div className="text-xs text-[var(--color-app-text-muted)] flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[var(--color-app-mint)]"/> Gains</div>
                <div className="font-bold text-sm">{formatCurrency(monthlyTotal)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--color-app-text-muted)] flex items-center gap-1"><TrendingDown className="w-3 h-3 text-[var(--color-app-coral)]"/> Dépenses</div>
                <div className="font-bold text-sm">{formatCurrency(monthlyExp)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reste a vivre Card */}
        <div className="md:col-span-2 bg-[var(--color-app-deep)] rounded-[24px] p-6 relative overflow-hidden shadow-xl text-white flex flex-col justify-between">
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--color-app-mint)]/20 rounded-full blur-[80px]" />
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-app-champagne)] to-transparent opacity-30" />
          
          <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10 w-full mb-6">
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-white/60 font-medium mb-1 flex items-center gap-2"><Wallet className="w-4 h-4"/> Reste à vivre (mois)</h2>
              <div className="text-5xl md:text-6xl font-black mt-2 mb-2 mint-gradient-text">
                {formatCurrency(resteAVivre)}
              </div>
              <p className="text-sm text-white/50 bg-white/5 inline-flex px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 w-fit">
                <Sparkles className="w-4 h-4 mr-2 text-[var(--color-app-champagne)]" />
                Après charges fixes et provisions URSSAF
              </p>
            </div>
            
            <div className="flex-1 md:max-w-[200px] flex flex-col justify-center">
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-white/80">Progression Gain</span>
                <span className="champagne-gradient-text">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[var(--color-app-champagne)] to-[#FFF3C4] rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>Objectif : {formatCurrency(goals.familyTarget)}</span>
                <span>Reste : {formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 relative z-10">
            <div className="bg-black/20 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <div className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Brut Famille</div>
                <div className="text-xl font-black text-white">{formatCurrency(monthlyTotal)}</div>
              </div>
            </div>
            <div className="bg-[var(--color-app-violet)]/20 rounded-2xl p-4 flex justify-between items-center border border-[var(--color-app-violet)]/30">
              <div>
                <div className="text-xs text-[var(--color-app-violet)] uppercase tracking-widest font-bold mb-1">URSSAF (-21%) Pro</div>
                <div className="text-xl font-black text-white">- {formatCurrency(totalUrssaf)}</div>
              </div>
              <div className="text-right text-xs text-white/70">
                <div className="font-bold">Net estimé</div>
                <div className="text-[var(--color-app-mint)] font-black">{formatCurrency(netDansLaPoche)}</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* 4 Stat Cards Row */}
      <motion.div {...fadeUp(0.2)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Famille', value: monthlyTotal, icon: Target, color: 'text-[var(--color-app-mint)]', bg: 'bg-[var(--color-app-mint)]/10' },
          { label: 'Monsieur', value: mrTotal, icon: User, color: 'text-[var(--color-app-violet)]', bg: 'bg-[var(--color-app-violet)]/10' },
          { label: 'Madame', value: mmeTotal, icon: User, color: 'text-[var(--color-app-coral)]', bg: 'bg-[var(--color-app-coral)]/10' },
          { label: 'Attendu', value: incomes.filter(i=>i.status==='Attendu').reduce((a,b)=>a+b.amount,0), icon: TrendingUp, color: 'text-[var(--color-app-champagne)]', bg: 'bg-[var(--color-app-champagne)]/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.03] hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-app-text)]">{formatCurrency(stat.value)}</div>
          </div>
        ))}
      </motion.div>

      {/* Middle Grid: Charts & Split */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Family Split Column */}
        <motion.div {...fadeUp(0.3)} className="md:col-span-1 flex flex-col gap-4">
          <h3 className="font-semibold text-lg text-[var(--color-app-text)] mb-1">Répartition familiale</h3>
          
          {[{ name: 'Monsieur', total: mrTotal, goal: goals.monsieurTarget, color: 'from-[var(--color-app-violet)]' },
            { name: 'Madame', total: mmeTotal, goal: goals.madameTarget, color: 'from-[var(--color-app-mint)]' }
          ].map((person, i) => {
            const pProgress = getGoalProgressPercentage(person.total, person.goal);
            return (
              <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.03]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex justify-center items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-app-muted)] flex items-center justify-center font-bold text-sm text-[var(--color-app-text-muted)]">
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--color-app-text)]">{person.name}</div>
                      <div className="text-xs text-[var(--color-app-text-muted)]">Objectif {formatCurrency(person.goal)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(person.total)}</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-[var(--color-app-muted)] rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pProgress}%` }}
                    className={cn("h-full bg-gradient-to-r to-transparent rounded-full", person.color)}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Charts Column */}
        <motion.div {...fadeUp(0.4)} className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
           <h3 className="font-semibold text-lg text-[var(--color-app-text)] mb-6">Répartition par activité</h3>
           <div className="h-64 flex items-center justify-center">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-[var(--color-app-text-muted)]">Aucune donnée pour ce mois.</div>
             )}
           </div>
        </motion.div>

      </div>

      {/* Recent Entries & Insight */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div {...fadeUp(0.5)} className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-[var(--color-app-text)]">Derniers mouvements</h3>
            <button onClick={() => navigate('recensement')} className="text-sm font-medium text-[var(--color-app-mint)] hover:underline">Tout voir</button>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[var(--color-app-text-muted)] border-b border-[var(--color-app-muted)]">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Personne</th>
                  <th className="pb-3 font-medium">Libellé</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry: any, idx) => (
                  <tr key={idx} className="group hover:bg-[var(--color-app-muted)]/50 transition-colors border-b border-[var(--color-app-muted)]/50 last:border-0">
                    <td className="py-4 text-sm text-[var(--color-app-text-muted)]">{entry.date.split('-').reverse().join('/')}</td>
                    <td className="py-4 text-sm font-medium">{entry.person}</td>
                    <td className="py-4 text-sm">{entry.activity || entry.category}</td>
                    <td className={cn("py-4 text-sm font-bold", 'category' in entry && "text-[var(--color-app-coral)]")}>
                      {'category' in entry && "- "}{formatCurrency(entry.amount)}
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1",
                        entry.status === 'Encaissé' || entry.status === 'Payé' ? "bg-[var(--color-app-mint)]/10 text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/15 text-[#B59648]"
                      )}>
                        {(entry.status === 'Encaissé' || entry.status === 'Payé') && <CheckCircle2 className="w-3 h-3" />}
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentEntries.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-sm text-[var(--color-app-text-muted)]">Aucune entrée.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-3 mt-4">
            {recentEntries.map((entry: any, idx) => (
              <div key={idx} className="bg-white border border-[var(--color-app-muted)] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="font-semibold text-sm">{entry.activity || entry.category}</div>
                     <div className="text-xs text-[var(--color-app-text-muted)]">{entry.date.split('-').reverse().join('/')} • {entry.person}</div>
                   </div>
                   <div className="text-right">
                     <div className={cn("font-bold text-sm", 'category' in entry && "text-[var(--color-app-coral)]")}>
                       {'category' in entry && "- "}{formatCurrency(entry.amount)}
                     </div>
                     <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-1",
                        entry.status === 'Encaissé' || entry.status === 'Payé' ? "bg-[var(--color-app-mint)]/10 text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/15 text-[#B59648]"
                      )}>
                        {entry.status}
                      </span>
                   </div>
                 </div>
              </div>
            ))}
            {recentEntries.length === 0 && (
              <div className="py-4 text-center text-sm text-[var(--color-app-text-muted)]">Aucune entrée.</div>
            )}
          </div>
        </motion.div>
        
        <motion.div {...fadeUp(0.6)} className="md:col-span-1">
          <div className="bg-[var(--color-app-radial)] text-white rounded-3xl p-6 relative overflow-hidden h-full shadow-lg">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 relative z-10">
              <Sparkles className="w-5 h-5 text-[var(--color-app-champagne)]" />
              Lecture du mois
            </h3>
            <p className="text-sm leading-relaxed text-white/80 relative z-10">
              Ce mois-ci, {mrTotal > mmeTotal ? 'Monsieur' : 'Madame'} représente {monthlyTotal > 0 ? Math.round(Math.max(mrTotal, mmeTotal) / monthlyTotal * 100) : 0}% des entrées. 
              {bestActivity && ` ${bestActivity.activity} est la source la plus régulière.`}
              <br/><br/>
              Astuce : Gardez le cap vers les {formatCurrency(goals.familyTarget)} !
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
