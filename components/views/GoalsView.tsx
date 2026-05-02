"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, Project } from '@/lib/store';
import { formatCurrency, getGoalProgressPercentage } from '@/lib/utils';
import { Target, Save, PiggyBank, Edit3, Plus, Trash, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

const ProgressCard = ({ title, current, target, colorClass }: { title: string, current: number, target: number, colorClass: string }) => {
  const p = getGoalProgressPercentage(current, target);
  const rem = Math.max(0, target - current);
  
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-black/[0.03]">
      <h3 className="font-semibold text-lg text-[var(--color-app-text)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--color-app-text-muted)] mb-6">Objectif: {formatCurrency(target)}</p>
      
      <div className="flex justify-between items-end mb-2">
        <div className="text-3xl font-bold">{p}%</div>
        <div className="text-sm font-medium text-[var(--color-app-text-muted)]">Reste: {formatCurrency(rem)}</div>
      </div>
      
      <div className="w-full h-3 bg-[var(--color-app-muted)] rounded-full overflow-hidden mb-4">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 1, ease: "easeOut" as const }}
          className={cn("h-full rounded-full bg-gradient-to-r", colorClass)}
        />
      </div>
      
      {p >= 100 ? (
        <p className="text-sm text-[var(--color-app-deepmint)] font-medium bg-[var(--color-app-mint)]/10 px-3 py-1.5 rounded-lg inline-block">🎉 Objectif atteint ! Excellent travail.</p>
      ) : (
        <p className="text-sm text-[var(--color-app-text-muted)]">Encore {formatCurrency(rem)} pour atteindre l’objectif.</p>
      )}
    </div>
  );
};

export default function GoalsView() {
  const { incomes, goals, updateGoals, currentMonth, projects, addProject, deleteProject } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showProjectAdd, setShowProjectAdd] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', target: '', current: '' });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.target || isNaN(Number(newProject.target))) return;
    addProject({
      name: newProject.name,
      target: Number(newProject.target),
      current: Number(newProject.current) || 0
    });
    setNewProject({ name: '', target: '', current: '' });
    setShowProjectAdd(false);
  };
  
  const [formGoals, setFormGoals] = useState({
    familyTarget: goals.familyTarget.toString(),
    monsieurTarget: goals.monsieurTarget.toString(),
    madameTarget: goals.madameTarget.toString(),
    savingRate: goals.savingRate.toString()
  });

  const mrTotal = incomes.filter(i => i.person === 'Monsieur' && i.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
  const mmeTotal = incomes.filter(i => i.person === 'Madame' && i.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
  const familyTotal = mrTotal + mmeTotal;

  const handleSave = () => {
    updateGoals({
      familyTarget: Number(formGoals.familyTarget),
      monsieurTarget: Number(formGoals.monsieurTarget),
      madameTarget: Number(formGoals.madameTarget),
      savingRate: Number(formGoals.savingRate),
    });
    setIsEditing(false);
  };



  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      <motion.div {...fadeUp(0)}>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Objectifs</h1>
        <p className="text-[var(--color-app-text-muted)] mt-1">Garder le cap sur les projets familiaux.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div {...fadeUp(0.1)} className="md:col-span-2 flex flex-col gap-6">
           <ProgressCard 
             title="Objectif Famille" 
             current={familyTotal} 
             target={goals.familyTarget} 
             colorClass="from-[var(--color-app-champagne)] to-[#FFF3C4]"
           />
           <div className="grid sm:grid-cols-2 gap-6">
             <ProgressCard 
               title="Objectif Monsieur" 
               current={mrTotal} 
               target={goals.monsieurTarget} 
               colorClass="from-[var(--color-app-violet)] to-[#A78BFA]"
             />
             <ProgressCard 
               title="Objectif Madame" 
               current={mmeTotal} 
               target={goals.madameTarget} 
               colorClass="from-[var(--color-app-mint)] to-[#6EE7B7]"
             />
           </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="md:col-span-1">
           {/* Settings / Edit Goals */}
           <div className="bg-[var(--color-app-deep)] text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden">
             <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[var(--color-app-champagne)]/20 rounded-full blur-[60px] pointer-events-none" />
             
             <div className="flex items-center justify-between mb-6 relative z-10">
               <h3 className="font-semibold text-lg flex items-center gap-2">
                 <Target className="w-5 h-5 text-[var(--color-app-champagne)]" />
                 Configuration
               </h3>
               {!isEditing && (
                 <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                   <Edit3 className="w-4 h-4" />
                 </button>
               )}
             </div>

             {isEditing ? (
               <div className="flex flex-col gap-4 relative z-10">
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-white/60">Famille (€)</label>
                   <input type="number" value={formGoals.familyTarget} onChange={(e) => setFormGoals({...formGoals, familyTarget: e.target.value})} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-app-champagne)]" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-white/60">Monsieur (€)</label>
                   <input type="number" value={formGoals.monsieurTarget} onChange={(e) => setFormGoals({...formGoals, monsieurTarget: e.target.value})} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-app-champagne)]" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-white/60">Madame (€)</label>
                   <input type="number" value={formGoals.madameTarget} onChange={(e) => setFormGoals({...formGoals, madameTarget: e.target.value})} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-app-champagne)]" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-white/60">Épargne ciblée (%)</label>
                   <input type="number" value={formGoals.savingRate} onChange={(e) => setFormGoals({...formGoals, savingRate: e.target.value})} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-app-champagne)]" />
                 </div>
                 <button onClick={handleSave} className="mt-2 bg-gradient-to-r from-[var(--color-app-champagne)] to-[#B59648] text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2">
                   <Save className="w-4 h-4" /> Enregistrer
                 </button>
               </div>
             ) : (
               <div className="flex flex-col gap-4 relative z-10">
                 <div className="flex justify-between items-center py-2 border-b border-white/10">
                   <span className="text-sm text-white/60">Famille</span>
                   <span className="font-semibold">{formatCurrency(goals.familyTarget)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/10">
                   <span className="text-sm text-white/60">Monsieur</span>
                   <span className="font-semibold text-[var(--color-app-violet)]">{formatCurrency(goals.monsieurTarget)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-white/10">
                   <span className="text-sm text-white/60">Madame</span>
                   <span className="font-semibold text-[var(--color-app-mint)]">{formatCurrency(goals.madameTarget)}</span>
                 </div>
                 <div className="bg-white/5 rounded-xl p-4 mt-2 border border-white/10">
                   <div className="flex items-center gap-3 mb-2">
                     <PiggyBank className="w-5 h-5 text-[var(--color-app-champagne)]" />
                     <span className="font-medium text-sm text-white">Objectif Épargne</span>
                   </div>
                   <div className="text-2xl font-bold champagne-gradient-text">{goals.savingRate}%</div>
                   <p className="text-xs text-white/50 mt-1">Soit environ {formatCurrency(familyTotal * (goals.savingRate/100))} ce mois-ci.</p>
                 </div>
               </div>
             )}
           </div>
         </motion.div>
      </div>

      {/* Advanced Savings: Cagnottes par projet */}
      <motion.div {...fadeUp(0.6)} className="mt-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-app-text)] flex items-center gap-2"><Flag className="w-5 h-5 text-[var(--color-app-mint)]" /> Cagnottes par Projet</h2>
            <p className="text-sm text-[var(--color-app-text-muted)] mt-1">Gérez vos sous-objectifs (Vacances, Voiture, Fonds d'urgence...)</p>
          </div>
          <button onClick={() => setShowProjectAdd(!showProjectAdd)} className="bg-[var(--color-app-text)] text-white px-5 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-black transition-colors md:w-auto">
            <Plus className="w-4 h-4" /> {showProjectAdd ? 'Annuler' : 'Nouveau Projet'}
          </button>
        </div>

        {showProjectAdd && (
          <motion.form onSubmit={handleAddProject} initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} className="bg-white p-6 rounded-3xl shadow-sm border border-black/[0.03] mb-6 flex flex-col md:flex-row gap-4 md:items-end">
            <div className="w-full md:flex-1 md:min-w-[200px]">
              <label className="text-xs font-semibold text-[var(--color-app-text-muted)] mb-1 block">Nom du projet</label>
              <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="Ex: Vacances été 2026" className="w-full px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)]" />
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-xs font-semibold text-[var(--color-app-text-muted)] mb-1 block">Objectif (€)</label>
              <input type="number" value={newProject.target} onChange={e => setNewProject({...newProject, target: e.target.value})} placeholder="2000" className="w-full px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] font-semibold" />
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-xs font-semibold text-[var(--color-app-text-muted)] mb-1 block">Déjà épargné (€)</label>
              <input type="number" value={newProject.current} onChange={e => setNewProject({...newProject, current: e.target.value})} placeholder="500" className="w-full px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] font-semibold" />
            </div>
            <button type="submit" className="w-full md:w-auto md:shrink-0 bg-black text-white px-6 py-3 rounded-xl font-bold mt-2 md:mt-0">
              Créer
            </button>
          </motion.form>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((p, idx) => {
            const pProgress = Math.min(100, Math.round((p.current / p.target) * 100));
            return (
              <motion.div key={p.id} {...fadeUp(0.2 * idx)} className="bg-white border border-black/[0.03] rounded-3xl p-6 shadow-sm flex flex-col group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-[var(--color-app-text)]">{p.name}</h3>
                  <button onClick={() => deleteProject(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-black text-[var(--color-app-text)]">{formatCurrency(p.current)}</div>
                    <div className="text-sm font-medium text-[var(--color-app-text-muted)]">/ {formatCurrency(p.target)}</div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-[var(--color-app-muted)] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pProgress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut' as const }}
                        className={cn("h-full rounded-full", pProgress >= 100 ? "bg-[var(--color-app-mint)]" : "bg-[var(--color-app-violet)]")}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">{pProgress}%</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
