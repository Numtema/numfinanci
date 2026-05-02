"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Target, 
  Settings, 
  Coins,
  Scale,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/store';

// We will import these views after creating them in separate components.
import DashboardView from '@/components/views/DashboardView';
import AddView from '@/components/views/AddView';
import HistoryView from '@/components/views/HistoryView';
import AnalysisView from '@/components/views/AnalysisView';
import GoalsView from '@/components/views/GoalsView';
import PatrimoineView from '@/components/views/PatrimoineView';
import AbonnementsView from '@/components/views/AbonnementsView';
import EquiteView from '@/components/views/EquiteView';
import CoachView from '@/components/views/CoachView';

export type Tab = 'dashboard' | 'ajouter' | 'recensement' | 'analyse' | 'objectifs' | 'patrimoine' | 'abonnements' | 'equite' | 'coach';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ajouter', label: 'Ajouter', icon: PlusCircle },
    { id: 'recensement', label: 'Recensement', icon: History },
    { id: 'analyse', label: 'Analyse', icon: BarChart3 },
    { id: 'objectifs', label: 'Objectifs', icon: Target },
    { id: 'equite', label: 'Équité', icon: Scale },
    { id: 'coach', label: 'Coach IA', icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden flex font-sans antialiased text-[#171717]">
      {/* Background radial glow effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--color-app-radial)] to-[var(--color-app-deep)]" />
      <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-[#159B72]/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute -top-64 -right-64 w-[600px] h-[600px] bg-[#8B5CF6]/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[#D8B86A]/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col z-10 w-[92px] xl:w-[260px] m-6 liquid-glass rounded-[32px] py-10 px-4 transition-all duration-300 relative group">
        <div className="flex items-center justify-center xl:justify-start xl:px-4 gap-3 mb-16">
          <div className="shrink-0 w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
             <Coins className="w-6 h-6 text-white" />
          </div>
          <span className="hidden xl:block text-white font-semibold text-xl tracking-tight">Numdema</span>
        </div>

        <nav className="flex flex-col gap-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "relative flex items-center justify-center xl:justify-start gap-4 py-3 xl:px-4 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-white/10 rounded-xl pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-[var(--color-app-mint)] drop-shadow-[0_0_8px_rgba(67,211,158,0.5)]" : "")} />
                <span className="hidden xl:block font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
           {/* Settings / Extra */}
           <button className="flex items-center justify-center xl:justify-start gap-4 py-3 xl:px-4 rounded-xl text-white/50 hover:text-white transition-all">
             <Settings className="w-6 h-6 shrink-0" />
             <span className="hidden xl:block font-medium">Paramètres</span>
           </button>
           
           <div className="hidden xl:flex items-center gap-3 mt-4 pt-6 border-t border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-app-violet)] to-[var(--color-app-champagne)] flex items-center justify-center text-white shrink-0 shadow-lg font-bold">
                N
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">Famille Numdema</span>
                <span className="text-xs text-[var(--color-app-mint)]">Avril 2026</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Panel */}
      <main className="flex-1 relative z-10 m-2 md:m-6 md:ml-0 bg-[var(--color-app-ivory)] rounded-[32px] md:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-w-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-[0.03] mix-blend-multiply pointer-events-none"/>
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-10 custom-scrollbar relative z-10">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && <DashboardView navigate={setActiveTab} />}
              {activeTab === 'ajouter' && <AddView onSuccess={() => setActiveTab('dashboard')} />}
              {activeTab === 'recensement' && <HistoryView />}
              {activeTab === 'analyse' && <AnalysisView />}
              {activeTab === 'objectifs' && <GoalsView />}
              {activeTab === 'patrimoine' && <PatrimoineView />}
              {activeTab === 'abonnements' && <AbonnementsView />}
              {activeTab === 'equite' && <EquiteView />}
              {activeTab === 'coach' && <CoachView />}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-app-deep)]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around p-4 relative">
          {TABS.map((tab) => {
             const isActive = activeTab === tab.id;
             if(tab.id === 'ajouter') {
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as Tab)}
                   className="-mt-8 w-14 h-14 rounded-full bg-[var(--color-app-text)] text-[var(--color-app-ivory)] flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-4 border-[var(--color-app-deep)]"
                 >
                   <PlusCircle className="w-8 h-8" />
                 </button>
               )
             }
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={cn("flex flex-col items-center gap-1 transition-all", isActive ? "text-[var(--color-app-mint)]" : "text-white/50")}
               >
                 <tab.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(67,211,158,0.5)]")} />
                 <span className="text-[10px] font-medium">{tab.label}</span>
               </button>
             )
          })}
        </div>
      </nav>
    </div>
  );
}
