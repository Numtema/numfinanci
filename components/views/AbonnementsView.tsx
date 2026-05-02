"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext, SubCycle } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Calendar, Plus, Trash, History, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const }
});

export default function AbonnementsView() {
  const { subscriptions, addSubscription, deleteSubscription } = useAppContext();
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<SubCycle>('Mensuel');
  const [nextDate, setNextDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthlyTotal = subscriptions.reduce((sum, s) => sum + (s.cycle === 'Mensuel' ? s.amount : s.amount / 12), 0);
  const annualTotal = subscriptions.reduce((sum, s) => sum + (s.cycle === 'Annuel' ? s.amount : s.amount * 12), 0);

  const today = new Date();
  const upcomingIn7Days = subscriptions.filter(s => {
    const d = parseISO(s.nextDate);
    return isAfter(d, today) && isBefore(d, addDays(today, 7));
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || isNaN(Number(amount))) return;
    addSubscription({ name, cycle, amount: Number(amount), nextDate });
    setName('');
    setAmount('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Radar Abonnements</h1>
          <p className="text-[var(--color-app-text-muted)] mt-1">Prélèvements récurrents familiaux et pros.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[var(--color-app-violet)] text-white px-5 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[var(--color-app-violet)]/90 transition-colors w-full md:w-auto mt-2 md:mt-0">
          <Plus className="w-4 h-4" /> {showAdd ? 'Annuler' : 'Ajouter abonnement'}
        </button>
      </motion.div>

      {showAdd && (
        <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-semibold text-lg mb-4 text-[var(--color-app-violet)]">Nouvel abonnement</h3>
          <form onSubmit={handleAdd} className="grid md:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Nom du service</label>
              <input type="text" placeholder="Ex: Netflix, Adobe..." value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-violet)]" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Montant (€)</label>
              <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-violet)] font-semibold" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Fréquence</label>
              <select value={cycle} onChange={(e) => setCycle(e.target.value as SubCycle)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-violet)]">
                <option value="Mensuel">Mensuel</option>
                <option value="Annuel">Annuel</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Prochain prélèvement</label>
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-violet)]" />
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full bg-[var(--color-app-violet)] text-white font-bold px-4 py-3 rounded-xl hover:bg-[var(--color-app-violet)]/90 transition-colors">
                Ajouter
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <motion.div {...fadeUp(0.2)} className="md:col-span-1 flex flex-col gap-4">
           {/* Summary Cards */}
           <div className="bg-[var(--color-app-violet)]/10 border border-[var(--color-app-violet)]/20 rounded-3xl p-6">
             <h3 className="text-xs font-bold text-[var(--color-app-violet)] uppercase tracking-wider mb-2">Mensualisé</h3>
             <div className="text-3xl font-black text-[var(--color-app-violet)]">{formatCurrency(monthlyTotal)} <span className="text-base font-medium opacity-50">/ mois</span></div>
           </div>
           <div className="bg-white border border-black/[0.05] rounded-3xl p-6 shadow-sm">
             <h3 className="text-xs font-bold text-[var(--color-app-text-muted)] uppercase tracking-wider mb-2">Annuel Estimé</h3>
             <div className="text-2xl font-black text-[var(--color-app-text)]">{formatCurrency(annualTotal)} <span className="text-base font-medium opacity-50">/ an</span></div>
           </div>

           {upcomingIn7Days.length > 0 && (
             <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-600">
               <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Alerte prélèvements proches</h3>
               <div className="flex flex-col gap-2">
                 {upcomingIn7Days.map(sub => (
                   <div key={sub.id} className="flex justify-between text-sm">
                     <span className="font-semibold">{sub.name}</span>
                     <span>{formatCurrency(sub.amount)}</span>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="md:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-semibold text-lg mb-6 text-[var(--color-app-text)]">Liste des abonnements</h3>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[var(--color-app-text-muted)] border-b border-[var(--color-app-muted)]">
                  <th className="pb-3 font-medium px-2">Service</th>
                  <th className="pb-3 font-medium px-2">Montant</th>
                  <th className="pb-3 font-medium px-2">Cycle</th>
                  <th className="pb-3 font-medium px-2">Prochain Paiement</th>
                  <th className="pb-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-[var(--color-app-muted)]/50 transition-colors border-b border-[var(--color-app-muted)]/50 last:border-0">
                    <td className="py-4 px-2 text-sm font-semibold text-[var(--color-app-text)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-app-muted)] flex items-center justify-center text-[var(--color-app-text-muted)]"><CreditCard className="w-4 h-4"/></div>
                      {sub.name}
                    </td>
                    <td className="py-4 px-2 text-sm font-black text-[var(--color-app-text)]">{formatCurrency(sub.amount)}</td>
                    <td className="py-4 px-2 text-sm">
                      <span className="px-2 py-1 bg-[var(--color-app-violet)]/10 text-[var(--color-app-violet)] rounded-md text-xs font-bold">{sub.cycle}</span>
                    </td>
                    <td className="py-4 px-2 text-sm text-[var(--color-app-text-muted)] font-medium flex items-center gap-2">
                       <Calendar className="w-4 h-4 opacity-50"/> {format(parseISO(sub.nextDate), 'dd MMM yyyy', {locale: fr})}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button onClick={() => deleteSubscription(sub.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                         <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-[var(--color-app-text-muted)]">Aucun abonnement trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden flex flex-col gap-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border border-[var(--color-app-muted)] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[var(--color-app-muted)] flex items-center justify-center text-[var(--color-app-text-muted)]">
                       <CreditCard className="w-5 h-5"/>
                     </div>
                     <div>
                       <div className="font-semibold text-sm">{sub.name}</div>
                       <span className="px-2 py-0.5 bg-[var(--color-app-violet)]/10 text-[var(--color-app-violet)] rounded-md text-[10px] font-bold inline-block mt-0.5">{sub.cycle}</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-black text-[var(--color-app-text)]">{formatCurrency(sub.amount)}</div>
                   </div>
                 </div>
                 <div className="flex justify-between items-center bg-[var(--color-app-muted)]/50 px-3 py-2 rounded-xl text-xs">
                   <span className="font-medium text-[var(--color-app-text-muted)] flex items-center gap-1"><Calendar className="w-3 h-3 opacity-50"/> {format(parseISO(sub.nextDate), 'dd MMM', {locale: fr})}</span>
                   <button onClick={() => deleteSubscription(sub.id)} className="text-red-400 p-1">
                     <Trash className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            ))}
            {subscriptions.length === 0 && (
              <div className="py-12 text-center text-sm text-[var(--color-app-text-muted)]">Aucun abonnement trouvé.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
