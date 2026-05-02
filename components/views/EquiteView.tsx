"use client";

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext, Expense } from '@/lib/store';
import { formatCurrency, getTotalByPerson } from '@/lib/utils';
import { Scale, ArrowRightLeft, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

export default function EquiteView() {
  const { incomes, expenses, currentMonth } = useAppContext();

  // Calculate incomes to establish pro-rata
  const mrIncome = getTotalByPerson(incomes, 'Monsieur', currentMonth);
  const mmeIncome = getTotalByPerson(incomes, 'Madame', currentMonth);
  const totalIncome = mrIncome + mmeIncome;
  
  const mrRatio = totalIncome > 0 ? mrIncome / totalIncome : 0.5;
  const mmeRatio = totalIncome > 0 ? mmeIncome / totalIncome : 0.5;

  // Calculate debts based on common expenses
  // Look at current month common expenses
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const commonExpenses = monthExpenses.filter(e => e.paidFor === 'Commune');
  
  const totalCommon = commonExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const mrShouldPay = totalCommon * mrRatio;
  const mmeShouldPay = totalCommon * mmeRatio;
  
  const mrActuallyPaidForCommon = commonExpenses.filter(e => e.person === 'Monsieur').reduce((sum, e) => sum + e.amount, 0);
  const mmeActuallyPaidForCommon = commonExpenses.filter(e => e.person === 'Madame').reduce((sum, e) => sum + e.amount, 0);
  
  const mrBalance = mrActuallyPaidForCommon - mrShouldPay;
  const mmeBalance = mmeActuallyPaidForCommon - mmeShouldPay;

  // Track who owes whom (advances)
  // Let's also check if anyone paid for the other explicitly
  const mrPaidForMme = monthExpenses.filter(e => e.person === 'Monsieur' && e.paidFor === 'Madame').reduce((sum, e) => sum + e.amount, 0);
  const mmePaidForMr = monthExpenses.filter(e => e.person === 'Madame' && e.paidFor === 'Monsieur').reduce((sum, e) => sum + e.amount, 0);

  const finalMrBalance = mrBalance + mrPaidForMme - mmePaidForMr;
  
  let debtMessage = "";
  if (finalMrBalance > 0) {
    debtMessage = `Madame doit ${formatCurrency(Math.abs(finalMrBalance))} à Monsieur`;
  } else if (finalMrBalance < 0) {
    debtMessage = `Monsieur doit ${formatCurrency(Math.abs(finalMrBalance))} à Madame`;
  } else {
    debtMessage = "Vous êtes à jour ! Personne ne se doit rien.";
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Équité & Tricount</h1>
        <p className="text-[var(--color-app-text-muted)] mt-1">Répartition automatique des frais communs au prorata des revenus.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Scale className="w-5 h-5" /> Ratio Prorata</h2>
           <p className="text-sm text-[var(--color-app-text-muted)] mb-6">Basé sur les revenus du mois en cours.</p>
           
           <div className="flex justify-between items-end mb-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-app-coral)]" />
                <span className="font-semibold text-sm">Monsieur</span>
             </div>
             <div className="font-bold">{Math.round(mrRatio * 100)}%</div>
           </div>
           
           <div className="flex justify-between items-end mb-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-app-mint)]" />
                <span className="font-semibold text-sm">Madame</span>
             </div>
             <div className="font-bold">{Math.round(mmeRatio * 100)}%</div>
           </div>

           <div className="h-4 flex rounded-full overflow-hidden">
             <div className="bg-[var(--color-app-coral)] h-full" style={{ width: `${mrRatio * 100}%` }} />
             <div className="bg-[var(--color-app-mint)] h-full" style={{ width: `${mmeRatio * 100}%` }} />
           </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03] flex flex-col justify-center">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Qui doit à qui ?</h2>
           <div className="text-center">
             <div className="text-3xl font-black text-[var(--color-app-deep)] mb-2 mt-4">
               {formatCurrency(Math.abs(finalMrBalance))}
             </div>
             <div className={cn("inline-block px-4 py-2 rounded-full font-bold text-sm", finalMrBalance === 0 ? "bg-[var(--color-app-muted)] text-[var(--color-app-text)]" : "bg-[var(--color-app-mint)]/20 text-[var(--color-app-deepmint)]")}>
               {debtMessage}
             </div>
           </div>
        </motion.div>
      </div>

      <motion.div {...fadeUp(0.3)} className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
        <h2 className="text-lg font-bold mb-4">Détail des calculs</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
           <div className="p-4 bg-[var(--color-app-muted)] rounded-2xl">
             <div className="font-bold mb-2">Dépenses Communes (Mois)</div>
             <div className="text-2xl font-black">{formatCurrency(totalCommon)}</div>
           </div>
           
           <div className="p-4 bg-[var(--color-app-muted)] border border-black/5 rounded-2xl flex flex-col gap-2">
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">Part Monsieur:</span>
                <span className="font-semibold text-[var(--color-app-coral)]">{formatCurrency(mrShouldPay)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">Part Madame:</span>
                <span className="font-semibold text-[var(--color-app-mint)]">{formatCurrency(mmeShouldPay)}</span>
             </div>
           </div>
           
           <div className="p-4 bg-[var(--color-app-muted)] border border-black/5 rounded-2xl flex flex-col gap-2">
             <div className="font-bold mb-1">Total payé (sur communs)</div>
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">Monsieur:</span>
                <span className="font-semibold">{formatCurrency(mrActuallyPaidForCommon)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">Madame:</span>
                <span className="font-semibold">{formatCurrency(mmeActuallyPaidForCommon)}</span>
             </div>
           </div>

           <div className="p-4 bg-[var(--color-app-muted)] border border-black/5 rounded-2xl flex flex-col gap-2">
             <div className="font-bold mb-1">Avances pour le partenaire</div>
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">M. pour Mme:</span>
                <span className="font-semibold">{formatCurrency(mrPaidForMme)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">Mme pour M.:</span>
                <span className="font-semibold">{formatCurrency(mmePaidForMr)}</span>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
