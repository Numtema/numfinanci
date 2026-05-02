"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext, AssetType } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Landmark, Bitcoin, Briefcase, Plus, Trash } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const }
});

const ASSET_COLORS: Record<AssetType, string> = {
  'Compte Courant': '#43D39E',
  'Livret A': '#0E855F',
  'Assurance Vie': '#D8B86A',
  'Crypto': '#8B5CF6',
  'Autre': '#6B665F'
};

const ASSET_ICONS: Record<AssetType, any> = {
  'Compte Courant': Wallet,
  'Livret A': Landmark,
  'Assurance Vie': Briefcase,
  'Crypto': Bitcoin,
  'Autre': Wallet
};

export default function PatrimoineView() {
  const { assets, addAsset, deleteAsset } = useAppContext();
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('Compte Courant');
  const [value, setValue] = useState('');

  const totalWealth = assets.reduce((sum, a) => sum + a.value, 0);

  const chartData = assets.reduce((acc, asset) => {
    const existing = acc.find((x: {name: string, value: number}) => x.name === asset.type);
    if (existing) existing.value += asset.value;
    else acc.push({ name: asset.type, value: asset.value });
    return acc;
  }, [] as {name: string, value: number}[]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value || isNaN(Number(value))) return;
    addAsset({ name, type, value: Number(value) });
    setName('');
    setValue('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Patrimoine</h1>
          <p className="text-[var(--color-app-text-muted)] mt-1">Vue globale de la richesse de la famille.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[var(--color-app-text)] text-white px-5 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-black transition-colors w-full md:w-auto">
          <Plus className="w-4 h-4" /> {showAdd ? 'Annuler' : 'Ajouter un compte'}
        </button>
      </motion.div>

      {showAdd && (
        <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
          <h3 className="font-semibold text-lg mb-4">Nouvel actif</h3>
          <form onSubmit={handleAddAsset} className="grid md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)]">
                {Object.keys(ASSET_ICONS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Nom du compte</label>
              <input type="text" placeholder="Ex: Livret A Thomas" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)]" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Montant (€)</label>
              <input type="number" step="0.01" placeholder="0.00" value={value} onChange={(e) => setValue(e.target.value)} className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] font-semibold" />
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full bg-[var(--color-app-mint)] text-[var(--color-app-deepmint)] font-bold px-4 py-3 rounded-xl hover:bg-[var(--color-app-mint)]/90 transition-colors">
                Enregistrer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div {...fadeUp(0.2)} className="md:col-span-1 bg-[var(--color-app-deep)] text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[250px]">
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--color-app-champagne)]/20 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <h2 className="text-white/60 font-medium mb-1">Patrimoine Net Total</h2>
            <div className="text-5xl font-black mt-2 champagne-gradient-text">
              {formatCurrency(totalWealth)}
            </div>
          </div>

          <div className="h-24 w-full relative z-10 mt-6">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                   {chartData.map((entry: {name: string}, index: number) => (
                     <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name as AssetType] || '#fff'} />
                   ))}
                 </Pie>
                 <RechartsTooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', backgroundColor: '#1A1814', color: '#fff' }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.map(asset => {
            const Icon = ASSET_ICONS[asset.type as AssetType] || Wallet;
            return (
              <div key={asset.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03] group relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-app-muted)] text-[var(--color-app-text-muted)] group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-app-text)]">{asset.name}</h3>
                      <p className="text-xs text-[var(--color-app-text-muted)] font-medium">{asset.type}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteAsset(asset.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-black text-[var(--color-app-text)]">
                  {formatCurrency(asset.value)}
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  );
}
