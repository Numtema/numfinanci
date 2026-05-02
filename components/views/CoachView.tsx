"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '@/lib/utils';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function CoachView() {
  const { incomes, expenses, goals, projects, subscriptions, currentMonth } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Bonjour ! Je suis le Coach IA Numdema. Je connais tout votre budget. Que puis-je vous dire sur vos finances aujourd'hui ?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Clé API Gemini non configurée (NEXT_PUBLIC_GEMINI_API_KEY).");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const financialContext = `
        Voici le contexte financier de la famille "Numdema" (basé sur l'application de budget) :
        Mois en cours : ${currentMonth}
        Objectifs (Reste à vivre / Épargne globale visée) :
        - Famille cible: ${goals.familyTarget}€
        - Objectif Monsieur: ${goals.monsieurTarget}€
        - Objectif Madame: ${goals.madameTarget}€
        - Taux d'épargne visé: ${goals.savingRate}%
        
        Cagnottes par projet :
        ${projects.map(p => `- ${p.name} : ${p.current}€ / ${p.target}€`).join('\n')}
        
        Abonnements prévus :
        ${subscriptions.map(s => `- ${s.name} : ${s.amount}€ (${s.cycle})`).join('\n')}
        
        Dépenses du mois :
        ${expenses.filter(e => e.date.startsWith(currentMonth)).map(e => `- ${e.date}: ${e.description} (${e.category}) - ${e.amount}€ payé par ${e.person} pour ${e.paidFor}`).join('\n')}
        
        Revenus du mois :
        ${incomes.filter(i => i.date.startsWith(currentMonth)).map(i => `- ${i.date}: ${i.client} (${i.activity}) - ${i.amount}€ perçu par ${i.person}`).join('\n')}
        
        Total Dépenses : ${expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0)}€
        Total Revenus : ${incomes.filter(i => i.date.startsWith(currentMonth)).reduce((sum, i) => sum + i.amount, 0)}€
        
        Aide la famille Numdema. Tu es un expert comptable et financier.
        Réponds de manière cordiale, argumentée, en faisant les calculs si nécessaire.
        Utilise un ton encourageant. Formate ta réponse en markdown léger.
      `;

      // We only send the recent conversation history to keep the context simple
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: 'CONTEXT_INSTRUCTIONS:\n' + financialContext }] },
          { role: 'model', parts: [{ text: 'Compris ! Je suis prêt.' }]},
          ...conversationHistory
        ],
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', content: response.text }]);
      } else {
        throw new Error("No text in response");
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Désolé, une erreur est survenue lors de l'analyse (Veuillez vérifier votre clé API)." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="mb-6 shrink-0">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)] flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-[var(--color-app-mint)]" /> Coach IA
        </h1>
        <p className="text-[var(--color-app-text-muted)] mt-1">Discutez en temps réel avec votre assistant financier personnel.</p>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="flex-1 bg-white rounded-3xl shadow-sm border border-black/[0.03] overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-6">
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex max-w-[85%] gap-4", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-[var(--color-app-deep)] text-white" : "bg-[var(--color-app-mint)]/20 text-[var(--color-app-deepmint)]")}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn("p-4 rounded-2xl whitespace-pre-wrap text-sm", msg.role === 'user' ? "bg-[var(--color-app-deep)] text-white rounded-tr-none" : "bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-tl-none")}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="mr-auto flex max-w-[85%] gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-app-mint)]/20 text-[var(--color-app-deepmint)] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-tl-none flex items-center">
                 <Loader2 className="w-5 h-5 animate-spin opacity-50" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-[var(--color-app-muted)] bg-white shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: Est-ce qu'on peut se permettre un weekend à 300€ ce mois-ci ?"
              className="w-full pl-6 pr-16 py-4 rounded-2xl bg-[var(--color-app-muted)] text-[var(--color-app-text)] outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] transition-all"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 p-3 bg-black text-white hover:bg-[var(--color-app-deep)] transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
