"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext, Person, Activity, Status, ExpenseStatus } from '@/lib/store';
import { format, parseISO, addMonths } from 'date-fns';
import { CheckCircle2, Save, ArrowLeft, ArrowUpRight, ArrowDownRight, UploadCloud, Paperclip, X, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';

interface Props {
  onSuccess: () => void;
}

const ACTIVITIES: Activity[] = ['Service', 'Logo', 'Site internet', 'Landing page', 'Application', 'Formation', 'Abonnement', 'Remboursement', 'Crédit/Avoir', 'Guidance Complète', 'Guidance Suivi', 'Guidance Question', 'Soin LAHOCHI', 'Formule Harmonie', 'Formule Renaissance', 'Pack Soins', 'Autre'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Fixes', 'Variables', 'Plaisir', 'Enfants', 'Autre'];
const CHIP_AMOUNTS = [50, 70, 85, 150, 250];

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

export default function AddView({ onSuccess }: Props) {
  const { addIncome, addExpense, categories, addCategory } = useAppContext();
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [person, setPerson] = useState<Person>('Madame');
  
  const [activity, setActivity] = useState<Activity>('Service');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<Status>('Encaissé');
  
  const [category, setCategory] = useState<ExpenseCategory>('Fixes');
  const [description, setDescription] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus>('Payé');
  const [paidFor, setPaidFor] = useState<'Commune'|'Monsieur'|'Madame'>('Commune');
  const [installments, setInstallments] = useState<number>(1);

  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [fileAttached, setFileAttached] = useState<string | null>(null);
  
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API Gemini non configurée.");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Analyse l'entrée suivante pour détecter s'il s'agit d'une dépense ou d'un revenu, et remplis les champs appropriés. \nEntrée : "${aiInput}"\n\nRègles : \nType: 'income' ou 'expense'.\nPerson: 'Monsieur', 'Madame' ou 'Autre'.\nSi \`type\` est 'expense': 'category' ('Fixes', 'Variables', 'Plaisir', 'Enfants', 'Autre'), 'description' (nom de l'achat/société), et optionnellement 'paidFor' ('Commune', 'Monsieur', 'Madame').\nSi \`type\` est 'income': 'activity' (Service, Logo, Site internet, Landing page, Application, Formation, Abonnement, Remboursement, Crédit/Avoir, Guidance Complète, Guidance Suivi, Guidance Question, Soin LAHOCHI, Formule Harmonie, Formule Renaissance, Pack Soins, Autre), 'client'.\n'amount' est le montant en nombre.\n\nRetourne uniquement un objet JSON (sans le bloc markdown).`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
             type: { type: "STRING" },
             amount: { type: "NUMBER" },
             person: { type: "STRING" },
             category: { type: "STRING" },
             description: { type: "STRING" },
             activity: { type: "STRING" },
             client: { type: "STRING" },
             paidFor: { type: "STRING" }
            },
            required: ["type", "amount", "person"]
          }
        }
      });

      if (response.text) {
         const data = JSON.parse(response.text);
         if (data.type === 'income' || data.type === 'expense') setType(data.type);
         if (data.amount) setAmount(data.amount.toString());
         if (data.person) setPerson(data.person as any);
         
         if (data.type === 'expense') {
           if (data.category && EXPENSE_CATEGORIES.includes(data.category)) setCategory(data.category as any);
           if (data.description) setDescription(data.description);
           if (data.paidFor && ['Commune', 'Monsieur', 'Madame'].includes(data.paidFor)) setPaidFor(data.paidFor as any);
         } else {
           if (data.activity && ACTIVITIES.includes(data.activity)) setActivity(data.activity as any);
           if (data.client) setClient(data.client);
         }
         
         setAiInput('');
      }
    } catch (e) {
      console.error(e);
      alert("Impossible de parser cette phrase.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    if (type === 'income') {
      addIncome({
        date,
        person,
        activity,
        client: client || 'Anonyme',
        amount: Number(amount),
        status,
        note,
        receiptUrl: fileAttached || undefined
      });
    } else {
      const baseDate = parseISO(date);
      const baseAmount = Number(amount) / installments;
      
      for (let i = 0; i < installments; i++) {
        const currentInstallmentDate = format(addMonths(baseDate, i), 'yyyy-MM-dd');
        addExpense({
          date: currentInstallmentDate,
          person,
          category,
          description: installments > 1 ? `${description || 'Dépense'} (${i+1}/${installments})` : (description || 'Dépense'),
          amount: Math.round(baseAmount * 100) / 100,
          status: i === 0 ? expenseStatus : 'Prévu',
          paidFor,
          note,
          receiptUrl: fileAttached || undefined
        });
      }
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onSuccess();
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="mb-8">
        <button onClick={onSuccess} className="text-sm font-medium text-[var(--color-app-text-muted)] hover:text-black mb-4 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4"/> Retour au dashboard
        </button>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Ajouter une entrée</h1>
        <p className="text-[var(--color-app-text-muted)] mt-1">Enregistre une nouvelle rentrée d’argent en quelques secondes.</p>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="bg-[var(--color-app-mint)]/10 border border-[var(--color-app-mint)]/20 rounded-3xl p-6 shadow-sm mb-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-app-deepmint)] flex items-center gap-2"><Wand2 className="w-5 h-5" /> Triage Automatique</h2>
          <p className="text-sm text-[var(--color-app-deepmint)]/80">Décrivez votre transaction, l&apos;IA remplit le formulaire pour vous.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAiParse(); } }}
            placeholder="Ex: J'ai payé 300€ chez IKEA..."
            className="flex-1 px-4 py-3 bg-white text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)] border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] transition-all"
          />
          <button 
            type="button" 
            onClick={handleAiParse}
            disabled={isAiLoading || !aiInput.trim()}
            className="w-full sm:w-auto justify-center bg-[var(--color-app-mint)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--color-app-deepmint)] transition-colors disabled:opacity-50"
          >
            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Magie !"}
          </button>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/[0.03] relative overflow-hidden">
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center target-blur"
          >
            <div className="w-16 h-16 bg-[var(--color-app-mint)]/20 text-[var(--color-app-deepmint)] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-black">Entrée ajoutée</h3>
            <p className="text-[var(--color-app-text-muted)] mt-1">Chaque euro a une trace.</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex gap-2 p-1 bg-[var(--color-app-muted)] rounded-2xl">
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn("flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all", type === 'income' ? 'bg-white text-[var(--color-app-deepmint)] shadow-sm' : 'text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text)]')}
            >
              <ArrowDownRight className="w-4 h-4" /> Gain
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn("flex-1 py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all", type === 'expense' ? 'bg-white text-[var(--color-app-coral)] shadow-sm' : 'text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text)]')}
            >
              <ArrowUpRight className="w-4 h-4" /> Dépense
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Montant (€)</label>
              <input 
                type="number" 
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all font-semibold text-lg"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {CHIP_AMOUNTS.map(amt => (
              <button 
                key={amt} 
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-1.5 rounded-full bg-[var(--color-app-muted)] text-sm font-medium hover:bg-[var(--color-app-champagne)]/20 hover:text-[#B59648] transition-colors whitespace-nowrap"
              >
                + {amt} €
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Personne</label>
            <div className="flex gap-4">
              {(['Monsieur', 'Madame', 'Autre'] as Person[]).map(p => (
                <label key={p} className={cn(
                  "cursor-pointer flex-1 text-center px-4 py-3 rounded-xl border transition-all",
                  person === p ? "bg-[var(--color-app-text)] text-[var(--color-app-ivory)] border-[var(--color-app-text)]" : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                )}>
                  <input type="radio" value={p} checked={person === p} onChange={(e) => setPerson(e.target.value as Person)} className="hidden" />
                  <span className="font-medium">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {type === 'income' ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Activité</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map(act => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setActivity(act)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                        activity === act 
                          ? "bg-[var(--color-app-violet)]/10 border-[var(--color-app-violet)]/30 text-[var(--color-app-violet)]" 
                          : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                      )}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Client / Source</label>
                <input 
                  type="text" 
                  placeholder="Nom du client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)]/50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Statut</label>
                <div className="flex gap-4">
                  {(['Encaissé', 'Attendu'] as Status[]).map(s => (
                    <label key={s} className={cn(
                      "cursor-pointer flex-1 text-center px-4 py-3 rounded-xl border transition-all",
                      status === s 
                        ? s === 'Encaissé' ? "bg-[var(--color-app-mint)]/20 border-[var(--color-app-mint)] text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/20 border-transparent text-[#B59648]"
                        : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                    )}>
                      <input type="radio" value={s} checked={status === s} onChange={(e) => setStatus(e.target.value as Status)} className="hidden" />
                      <span className="font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map(act => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setCategory(act)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                        category === act 
                          ? "bg-[var(--color-app-coral)]/10 border-[var(--color-app-coral)]/30 text-[var(--color-app-coral)]" 
                          : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                      )}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Description</label>
                <input 
                  type="text" 
                  placeholder="Loyer, électricité, courses..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)]/50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Paiement en</label>
                <select 
                  value={installments}
                  onChange={e => setInstallments(Number(e.target.value))}
                  className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all"
                >
                  <option value={1}>1 fois (Comptant)</option>
                  <option value={2}>2 fois</option>
                  <option value={3}>3 fois</option>
                  <option value={4}>4 fois</option>
                  <option value={10}>10 fois</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Pour le compte de</label>
                <div className="flex gap-4">
                  {(['Commune', 'Monsieur', 'Madame'] as const).map(p => (
                    <label key={p} className={cn(
                      "cursor-pointer flex-1 text-center px-4 py-3 rounded-xl border transition-all text-sm",
                      paidFor === p
                        ? "bg-[var(--color-app-text)] text-[var(--color-app-ivory)] border-[var(--color-app-text)]" 
                        : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                    )}>
                       <input type="radio" value={p} checked={paidFor === p} onChange={(e) => setPaidFor(e.target.value as any)} className="hidden" />
                       <span className="font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Statut</label>
                <div className="flex gap-4">
                  {(['Payé', 'Prévu'] as ExpenseStatus[]).map(s => (
                    <label key={s} className={cn(
                      "cursor-pointer flex-1 text-center px-4 py-3 rounded-xl border transition-all",
                      expenseStatus === s 
                        ? s === 'Payé' ? "bg-[var(--color-app-mint)]/20 border-[var(--color-app-mint)] text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/20 border-transparent text-[#B59648]"
                        : "bg-transparent border-[var(--color-app-muted)] text-[var(--color-app-text-muted)] hover:border-black/20"
                    )}>
                      <input type="radio" value={s} checked={expenseStatus === s} onChange={(e) => setExpenseStatus(e.target.value as ExpenseStatus)} className="hidden" />
                      <span className="font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Note (optionnelle)</label>
            <input 
              type="text" 
              placeholder="Ex: Facture #402"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="px-4 py-3 bg-[var(--color-app-muted)] text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)]/50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-app-text-muted)]">Justificatif (optionnel)</label>
            {!fileAttached ? (
               <label className="border-2 border-dashed border-[var(--color-app-muted)] hover:border-[var(--color-app-mint)] bg-[var(--color-app-ivory)] hover:bg-[var(--color-app-mint)]/5 transition-all rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer group">
                  <input type="file" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileAttached(e.target.files[0].name);
                    }
                  }} />
                  <UploadCloud className="w-6 h-6 text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-mint)] transition-colors mb-2" />
                  <span className="text-sm font-medium text-[var(--color-app-text-muted)] group-hover:text-[var(--color-app-text)]">Joindre une facture ou photo</span>
               </label>
            ) : (
               <div className="flex items-center justify-between p-4 bg-[var(--color-app-muted)] rounded-xl">
                 <div className="flex items-center gap-3">
                   <Paperclip className="w-5 h-5 text-[var(--color-app-text-muted)]" />
                   <span className="text-sm font-medium text-[var(--color-app-text)] truncate max-w-[200px]">{fileAttached}</span>
                 </div>
                 <button type="button" onClick={() => setFileAttached(null)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-red-400">
                   <X className="w-4 h-4" />
                 </button>
               </div>
            )}
          </div>

          <button 
            type="submit" 
            className="mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--color-app-text)] text-[var(--color-app-ivory)] rounded-2xl hover:bg-black transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-app-champagne)] to-transparent opacity-50" />
            <Save className="w-5 h-5 z-10" />
            <span className="font-medium text-lg z-10">{type === 'income' ? 'Enregistrer l’entrée' : 'Enregistrer la dépense'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </button>
        </form>
      </motion.div>
    </div>
  )
}
