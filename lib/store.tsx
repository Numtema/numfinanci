"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Person = string;
export type Activity = 
  | 'Service' 
  | 'Logo' 
  | 'Site internet' 
  | 'Landing page' 
  | 'Application' 
  | 'Formation' 
  | 'Abonnement' 
  | 'Remboursement'
  | 'Crédit/Avoir'
  | 'Guidance Complète'
  | 'Guidance Suivi'
  | 'Guidance Question'
  | 'Soin LAHOCHI'
  | 'Formule Harmonie'
  | 'Formule Renaissance'
  | 'Pack Soins'
  | 'Autre';
export type Status = 'Encaissé' | 'Attendu';

export type ExpenseStatus = 'Payé' | 'Prévu';

export type AssetType = 'Compte Courant' | 'Livret A' | 'Assurance Vie' | 'Crypto' | 'Autre';
export type SubCycle = 'Mensuel' | 'Annuel';

export interface Income {
  id: string;
  date: string;
  person: Person;
  activity: Activity;
  client: string;
  amount: number;
  status: Status;
  note?: string;
  receiptUrl?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  person: Person;
  category: string;
  description: string;
  amount: number;
  status: ExpenseStatus;
  note?: string;
  receiptUrl?: string;
  paidFor?: 'Commune' | 'Monsieur' | 'Madame';
  created_at: string;
}

export interface Goals {
  familyTarget: number;
  monsieurTarget: number;
  madameTarget: number;
  savingRate: number; // percentage
}

export interface Project {
  id: string;
  name: string;
  target: number;
  current: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: SubCycle;
  nextDate: string;
}

export const DEFAULT_EXPENSE_CATEGORIES = ['Fixes', 'Variables', 'Plaisir', 'Enfants', 'Autre'];

interface AppContextType {
  incomes: Income[];
  addIncome: (income: Omit<Income, 'id' | 'created_at'>) => void;
  deleteIncome: (id: string) => void;
  
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  categories: string[];
  addCategory: (category: string) => void;

  goals: Goals;
  updateGoals: (newGoals: Partial<Goals>) => void;
  
  projects: Project[];
  addProject: (p: Omit<Project, 'id'>) => void;
  deleteProject: (id: string) => void;

  assets: Asset[];
  addAsset: (a: Omit<Asset, 'id'>) => void;
  deleteAsset: (id: string) => void;

  subscriptions: Subscription[];
  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  deleteSubscription: (id: string) => void;

  currentMonth: string; // YYYY-MM format
  setCurrentMonth: (month: string) => void;
}

const initialIncomes: Income[] = [
  { id: '1', date: "2026-04-03", person: "Madame", activity: "Service", client: "Client X", amount: 70, status: "Encaissé", note: "Service court", created_at: new Date().toISOString() },
  { id: '2', date: "2026-04-07", person: "Monsieur", activity: "Site internet", client: "Client Y", amount: 150, status: "Encaissé", note: "Projet web", created_at: new Date().toISOString() },
  { id: '3', date: "2026-04-10", person: "Madame", activity: "Service", client: "Client Z", amount: 50, status: "Encaissé", note: "Micro-service", created_at: new Date().toISOString() },
  { id: '4', date: "2026-04-14", person: "Monsieur", activity: "Logo", client: "Client A", amount: 85, status: "Encaissé", note: "Identité visuelle", created_at: new Date().toISOString() },
  { id: '5', date: "2026-04-18", person: "Madame", activity: "Service", client: "Client B", amount: 60, status: "Encaissé", note: "Service récurrent", created_at: new Date().toISOString() }
];

const initialExpenses: Expense[] = [
  { id: 'e1', date: "2026-04-01", person: "Monsieur", category: "Fixes", description: "Loyer", amount: 800, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
  { id: 'e2', date: "2026-04-05", person: "Madame", category: "Variables", description: "Courses Alimentaires", amount: 150, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
  { id: 'e3', date: "2026-04-12", person: "Monsieur", category: "Plaisir", description: "Restaurant", amount: 60, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
  { id: 'e4', date: "2026-04-15", person: "Madame", category: "Enfants", description: "Vêtements enfants", amount: 45, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
  { id: 'e5', date: "2026-04-01", person: "Monsieur", category: "Fixes", description: "Assurance Habitation", amount: 35, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
  { id: 'e6', date: "2026-04-01", person: "Monsieur", category: "Fixes", description: "Assurance Voiture", amount: 45, status: "Payé", paidFor: "Commune", created_at: new Date().toISOString() },
];

const initialGoals: Goals = {
  familyTarget: 1500,
  monsieurTarget: 700,
  madameTarget: 800,
  savingRate: 20
};

const initialProjects: Project[] = [
  { id: 'p1', name: 'Vacances Été', target: 2000, current: 800 },
  { id: 'p2', name: 'Achat Voiture', target: 5000, current: 1500 },
  { id: 'p3', name: 'Fonds d\'urgence', target: 10000, current: 3000 },
];

const initialAssets: Asset[] = [
  { id: 'a1', name: 'Compte Courant Joint', type: 'Compte Courant', value: 2500 },
  { id: 'a2', name: 'Livret A Monsieur', type: 'Livret A', value: 4000 },
  { id: 'a3', name: 'Livret A Madame', type: 'Livret A', value: 5000 },
  { id: 'a4', name: 'Assurance Vie', type: 'Assurance Vie', value: 12000 },
  { id: 'a5', name: 'Binance / Crypto', type: 'Crypto', value: 850 },
];

const initialSubscriptions: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 13.49, cycle: 'Mensuel', nextDate: '2026-05-15' },
  { id: 's2', name: 'Spotify Famille', amount: 15.99, cycle: 'Mensuel', nextDate: '2026-05-20' },
  { id: 's3', name: 'Adobe Creative Cloud', amount: 59.99, cycle: 'Mensuel', nextDate: '2026-05-05' },
  { id: 's4', name: 'Figma Pro', amount: 144, cycle: 'Annuel', nextDate: '2027-01-10' },
  { id: 's5', name: 'Google Drive', amount: 9.99, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's6', name: 'SFR Mobile L1', amount: 20, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's7', name: 'BBox Internet', amount: 35, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's8', name: 'ChatGPT Plus', amount: 20, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's9', name: 'Claude Pro', amount: 20, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's10', name: 'Canva Pro', amount: 12, cycle: 'Mensuel', nextDate: '2026-05-01' },
  { id: 's11', name: 'Hostinger', amount: 5, cycle: 'Mensuel', nextDate: '2026-05-01' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [goals, setGoals] = useState<Goals>(initialGoals);
  
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  
  const [currentMonth, setCurrentMonth] = useState('2026-04'); // Starting with April 2026 as per mock
  const [categories, setCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedIncomes = localStorage.getItem('numdema_incomes');
    const storedExpenses = localStorage.getItem('numdema_expenses');
    const storedGoals = localStorage.getItem('numdema_goals');
    
    // Also try to load new ones if they exist
    const storedProjects = localStorage.getItem('numdema_projects');
    const storedAssets = localStorage.getItem('numdema_assets');
    const storedSubscriptions = localStorage.getItem('numdema_subscriptions');
    const storedCategories = localStorage.getItem('numdema_categories');
    
    if (storedIncomes) {
      try { setIncomes(JSON.parse(storedIncomes)); } catch (e) {}
    }
    if (storedExpenses) {
      try { setExpenses(JSON.parse(storedExpenses)); } catch (e) {}
    }
    if (storedGoals) {
      try { setGoals(JSON.parse(storedGoals)); } catch (e) {}
    }
    if (storedProjects) try { setProjects(JSON.parse(storedProjects)); } catch(e) {}
    if (storedAssets) try { setAssets(JSON.parse(storedAssets)); } catch(e) {}
    if (storedSubscriptions) try { setSubscriptions(JSON.parse(storedSubscriptions)); } catch(e) {}
    if (storedCategories) try { setCategories(JSON.parse(storedCategories)); } catch(e) {}
    
    // Also set current month based on current local date
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setCurrentMonth(`${yyyy}-${mm}`);
    
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('numdema_incomes', JSON.stringify(incomes));
    }
  }, [incomes, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('numdema_expenses', JSON.stringify(expenses));
    }
  }, [expenses, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('numdema_goals', JSON.stringify(goals));
      localStorage.setItem('numdema_categories', JSON.stringify(categories));
    }
  }, [goals, categories, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('numdema_projects', JSON.stringify(projects));
      localStorage.setItem('numdema_assets', JSON.stringify(assets));
      localStorage.setItem('numdema_subscriptions', JSON.stringify(subscriptions));
    }
  }, [projects, assets, subscriptions, initialized]);

  const addIncome = (newIncome: Omit<Income, 'id' | 'created_at'>) => {
    const income: Income = {
      ...newIncome,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
    };
    setIncomes((prev) => [...prev, income]);
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter(inc => inc.id !== id));
  }

  const addExpense = (newExpense: Omit<Expense, 'id' | 'created_at'>) => {
    const expense: Expense = {
      ...newExpense,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, expense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter(exp => exp.id !== id));
  }

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  }

  const updateGoals = (newGoals: Partial<Goals>) => {
    setGoals((prev) => ({ ...prev, ...newGoals }));
  };

  const addProject = (p: Omit<Project, 'id'>) => setProjects(prev => [...prev, { ...p, id: Math.random().toString(36).substring(7) }]);
  const deleteProject = (id: string) => setProjects(prev => prev.filter(x => x.id !== id));

  const addAsset = (a: Omit<Asset, 'id'>) => setAssets(prev => [...prev, { ...a, id: Math.random().toString(36).substring(7) }]);
  const deleteAsset = (id: string) => setAssets(prev => prev.filter(x => x.id !== id));

  const addSubscription = (s: Omit<Subscription, 'id'>) => setSubscriptions(prev => [...prev, { ...s, id: Math.random().toString(36).substring(7) }]);
  const deleteSubscription = (id: string) => setSubscriptions(prev => prev.filter(x => x.id !== id));

  return (
    <AppContext.Provider value={{
      incomes,
      addIncome,
      deleteIncome,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      categories,
      addCategory,
      goals,
      updateGoals,
      projects,
      addProject,
      deleteProject,
      assets,
      addAsset,
      deleteAsset,
      subscriptions,
      addSubscription,
      deleteSubscription,
      currentMonth,
      setCurrentMonth
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
