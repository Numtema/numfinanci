import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Income, Expense, Person, Activity } from "./store"
import { format, parseISO, isSameMonth } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

export function getMonthlyTotal(incomes: Income[], month: string): number {
  const targetDate = new Date(month + '-01');
  return incomes
    .filter(inc => isSameMonth(parseISO(inc.date), targetDate))
    .reduce((sum, current) => sum + current.amount, 0);
}

export function getMonthlyExpenses(expenses: Expense[], month: string): number {
  const targetDate = new Date(month + '-01');
  return expenses
    .filter(exp => isSameMonth(parseISO(exp.date), targetDate))
    .reduce((sum, current) => sum + current.amount, 0);
}

export function getFixedExpenses(expenses: Expense[], month: string): number {
  const targetDate = new Date(month + '-01');
  return expenses
    .filter(exp => isSameMonth(parseISO(exp.date), targetDate) && exp.category === 'Fixes')
    .reduce((sum, current) => sum + current.amount, 0);
}

export function getTotalByPerson(incomes: Income[], person: Person, month?: string): number {
  let filtered = incomes.filter(inc => inc.person === person);
  if (month) {
    const targetDate = new Date(month + '-01');
    filtered = filtered.filter(inc => isSameMonth(parseISO(inc.date), targetDate));
  }
  return filtered.reduce((sum, current) => sum + current.amount, 0);
}

export function getTotalByActivity(incomes: Income[], month?: string): Record<Activity, number> {
  let filtered = incomes;
  if (month) {
    const targetDate = new Date(month + '-01');
    filtered = filtered.filter(inc => isSameMonth(parseISO(inc.date), targetDate));
  }
  
  return filtered.reduce((acc, curr) => {
    acc[curr.activity] = (acc[curr.activity] || 0) + curr.amount;
    return acc;
  }, {} as Record<Activity, number>);
}

export function getBestActivity(incomes: Income[], month?: string): { activity: Activity, amount: number } | null {
  const totals = getTotalByActivity(incomes, month);
  let bestActivity: Activity | null = null;
  let maxAmount = 0;
  
  Object.entries(totals).forEach(([act, amt]) => {
    if (amt > maxAmount) {
      maxAmount = amt;
      bestActivity = act as Activity;
    }
  });
  
  return bestActivity ? { activity: bestActivity, amount: maxAmount } : null;
}

export function getGoalProgressPercentage(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
