"use client";

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '@/lib/store';
import { formatCurrency, getBestActivity } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Sparkles, Trophy, ArrowUpRight, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

export default function AnalysisView() {
  const { incomes, currentMonth } = useAppContext();

  // Monthly Evolution Data
  const monthlyData = useMemo(() => {
    const rawData = incomes.reduce((acc, current) => {
      const m = current.date.substring(0, 7);
      if (!acc[m]) {
        acc[m] = { mr: 0, mme: 0, value: 0 };
      }
      if (current.person === 'Monsieur') acc[m].mr += current.amount;
      else if (current.person === 'Madame') acc[m].mme += current.amount;
      
      acc[m].value += current.amount;
      return acc;
    }, {} as Record<string, { mr: number, mme: number, value: number }>);
    
    return Object.entries(rawData)
      .map(([m, val]) => ({ month: format(parseISO(`${m}-01`), 'MMM yy', {locale: fr}), ...val, raw: m }))
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [incomes]);

  // Person Data
  const mrTotal = incomes.filter(i => i.person === 'Monsieur').reduce((a, b) => a + b.amount, 0);
  const mmeTotal = incomes.filter(i => i.person === 'Madame').reduce((a, b) => a + b.amount, 0);
  const familyTotal = mrTotal + mmeTotal;

  // Activity Data
  const activityDataObj = incomes.reduce((acc, curr) => {
    acc[curr.activity] = (acc[curr.activity] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
  const activityData = Object.entries(activityDataObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  // Best Client
  const clientData = incomes.reduce((acc, curr) => {
    acc[curr.client] = (acc[curr.client] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
  const bestClient = Object.entries(clientData).sort((a,b)=>b[1]-a[1])[0] || null;

  // Best Month
  const bestMonth = [...monthlyData].sort((a,b)=>b.value - a.value)[0] || null;
  const avgPerEntry = familyTotal / (incomes.length || 1);

  const bestActivity = getBestActivity(incomes);

  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Analyse</h1>
        <p className="text-[var(--color-app-text-muted)] mt-1">Observez les performances de la famille et optimisez les entrées.</p>
      </motion.div>

      {/* Automatic Analysis Text */}
      <motion.div {...fadeUp(0.1)} className="bg-[var(--color-app-deep)] text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-app-violet)]/30 rounded-full blur-[80px] pointer-events-none" />
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 relative z-10">
          <Sparkles className="w-5 h-5 text-[var(--color-app-champagne)]" />
          Note analytique automatique
        </h3>
        <p className="text-sm md:text-base leading-relaxed text-white/80 relative z-10 max-w-3xl">
          Globalement, {mrTotal > mmeTotal ? 'Monsieur' : 'Madame'} représente {familyTotal > 0 ? Math.round(Math.max(mrTotal, mmeTotal) / familyTotal * 100) : 0}% des entrées. 
          {bestActivity && ` ${bestActivity.activity} est la source la plus importante de revenus.`} 
          {bestClient && ` Le client "${bestClient[0]}" a été particulièrement rémunérateur avec ${formatCurrency(bestClient[1])}.`}
          <br className="mb-2"/>
          {mmeTotal > mrTotal 
            ? "Monsieur pourrait renforcer les offres à ticket élevé comme les sites internet et applications pour équilibrer la croissance."
            : "Madame pourrait développer des offres premium supplémentaires ou des services récurrents."}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Evolution Chart */}
        <motion.div {...fadeUp(0.2)} className="bg-white rounded-[24px] p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-semibold text-lg text-[var(--color-app-text)] mb-6">Évolution mensuelle</h3>
          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B665F' }} axisLine={false} tickLine={false} />
                   <YAxis tickFormatter={(val) => `${val}€`} tick={{ fontSize: 12, fill: '#6B665F' }} axisLine={false} tickLine={false} />
                   <Tooltip formatter={(val: any, name: any) => [formatCurrency(val as number), name === 'mr' ? 'Monsieur' : 'Madame']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                   <Bar dataKey="mr" stackId="a" fill="var(--color-app-violet)" radius={[0, 0, 4, 4]} />
                   <Bar dataKey="mme" stackId="a" fill="var(--color-app-mint)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-[var(--color-app-text-muted)] text-sm">Pas assez de données</div>
            )}
          </div>
        </motion.div>

        {/* Revenue by Activity */}
        <motion.div {...fadeUp(0.3)} className="bg-white rounded-[24px] p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-semibold text-lg text-[var(--color-app-text)] mb-6">Revenus par activité</h3>
          <div className="h-64 w-full">
            {activityData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={activityData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#171717', fontWeight: 500 }} />
                   <Tooltip cursor={{ fill: 'transparent' }} formatter={(val: any) => formatCurrency(val as number)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                   <Bar dataKey="value" maxBarSize={24} radius={[0, 4, 4, 0]}>
                     {activityData.slice(0, 5).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === 0 ? "var(--color-app-mint)" : "var(--color-app-muted)"} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-[var(--color-app-text-muted)] text-sm">Pas assez de données</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <motion.div {...fadeUp(0.4)} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Meilleure activité', value: bestActivity?.activity || '-', icon: Trophy },
          { label: 'Meilleur mois', value: bestMonth?.month || '-', icon: BarChart3 },
          { label: 'Meilleur source', value: bestClient ? bestClient[0] : '-', icon: Trophy },
          { label: 'Moyenne / entrée', value: formatCurrency(avgPerEntry), icon: ArrowUpRight },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.03]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-app-champagne)]/10 text-[#B59648]">
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[var(--color-app-text-muted)]">{stat.label}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-[var(--color-app-text)] truncate">{stat.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Monthly Summary Grouped Table */}
      <motion.div {...fadeUp(0.5)} className="bg-white rounded-[24px] p-6 shadow-sm border border-black/[0.03] mt-6">
        <h3 className="font-bold text-lg text-[var(--color-app-text)] mb-6 flex items-center gap-2">
          Résumé des gains par mois
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-[var(--color-app-text-muted)] border-b border-[var(--color-app-muted)]">
                <th className="pb-3 font-semibold px-2">Mois</th>
                <th className="pb-3 font-semibold px-2">Total Famille</th>
                <th className="pb-3 font-semibold px-2 text-[var(--color-app-violet)]">Monsieur</th>
                <th className="pb-3 font-semibold px-2 text-[var(--color-app-deepmint)]">Madame</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyData].reverse().map((data, idx) => (
                <tr key={idx} className="group hover:bg-[var(--color-app-muted)]/50 transition-colors border-b border-[var(--color-app-muted)]/50 last:border-0">
                  <td className="py-4 px-2 text-sm font-semibold capitalize text-[var(--color-app-text)]">{data.month}</td>
                  <td className="py-4 px-2 text-sm font-black text-[var(--color-app-text)]">{formatCurrency(data.value)}</td>
                  <td className="py-4 px-2 text-sm text-[var(--color-app-violet)] font-bold">{formatCurrency(data.mr)}</td>
                  <td className="py-4 px-2 text-sm text-[var(--color-app-deepmint)] font-bold">{formatCurrency(data.mme)}</td>
                </tr>
              ))}
              {monthlyData.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-[var(--color-app-text-muted)]">Aucune donnée disponible.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  )
}
