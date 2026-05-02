"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppContext, Person, Activity, Status } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, FilterX, CheckCircle2, MoreHorizontal, Trash, Paperclip, Download, FileText, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const }
});

export default function HistoryView() {
  const { incomes, deleteIncome, expenses, deleteExpense, updateExpense } = useAppContext();
  
  const [tableType, setTableType] = useState<'incomes' | 'expenses'>('incomes');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleUpdate = (e: any) => {
    e.preventDefault();
    if (editingItem) {
      if (tableType === 'expenses') {
        updateExpense(editingItem.id, editingItem);
      }
      setEditingItem(null);
    }
  };
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState<Person | ''>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: 'date', direction: 'desc' });

  const requestSort = (key: string) => {
    let direction: 'asc'|'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const filteredData = useMemo(() => {
    const data = tableType === 'incomes' ? incomes : expenses;
    let filtered = data.filter((item: any) => {
      const matchMonth = filterMonth ? item.date.startsWith(filterMonth) : true;
      const matchPerson = filterPerson ? item.person === filterPerson : true;
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      
      const searchTarget = tableType === 'incomes' 
        ? item.client + ' ' + item.activity + ' ' + (item.note || '')
        : item.description + ' ' + item.category + ' ' + (item.note || '');
        
      const matchSearch = searchTarget.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchMonth && matchPerson && matchStatus && matchSearch;
    });

    filtered.sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      // Fallbacks depending on type
      if (sortConfig.key === 'clientOrd') {
        valA = a.client || ''; valB = b.client || '';
      } else if (sortConfig.key === 'descOrd') {
        valA = a.description || ''; valB = b.description || '';
      } else if (sortConfig.key === 'catOrd') {
        valA = a.activity || a.category || ''; valB = b.activity || b.category || '';
      }

      if (sortConfig.key === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortConfig.key === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incomes, expenses, tableType, filterMonth, filterPerson, filterStatus, searchQuery, sortConfig]);

  // Extract unique months for the filter
  const months = useMemo(() => {
    const dates = [...incomes, ...expenses].map(i => i.date.substring(0, 7));
    return Array.from(new Set(dates)).sort((a,b) => b.localeCompare(a));
  }, [incomes, expenses]);

  const resetFilters = () => {
    setFilterMonth('');
    setFilterPerson('');
    setFilterStatus('');
    setSearchQuery('');
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Date', 'Personne', 'Catégorie/Activité', 'Description/Client', 'Montant', 'Statut', 'Note'];
    const rows = filteredData.map((item: any) => [
      tableType === 'incomes' ? 'Gain' : 'Dépense',
      item.date,
      item.person,
      tableType === 'incomes' ? item.activity : item.category,
      tableType === 'incomes' ? item.client : item.description,
      tableType === 'expenses' ? `-${item.amount}` : item.amount,
      item.status,
      item.note || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(',')).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `numdema_export_${tableType}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Bilan ${tableType === 'incomes' ? 'Gains' : 'Dépenses'} - Numdema`, 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy')}`, 14, 30);
        
        const headers = [['Date', 'Personne', 'Type', 'Description', 'Montant', 'Statut']];
        const data = filteredData.map((item: any) => [
          format(parseISO(item.date), 'dd/MM/yyyy'),
          item.person,
          tableType === 'incomes' ? item.activity : item.category,
          tableType === 'incomes' ? item.client : item.description,
          tableType === 'expenses' ? `-${item.amount}` : `${item.amount}`,
          item.status
        ]);
        
        autoTable(doc, {
          startY: 36,
          head: headers,
          body: data,
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30] },
          styles: { fontSize: 9 }
        });
        
        doc.save(`numdema_bilan_${tableType}_${new Date().getTime()}.pdf`);
      });
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-24 md:pb-0">
      <motion.div {...fadeUp(0)} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-app-text)]">Recensement</h1>
          <p className="text-[var(--color-app-text-muted)] mt-1">Recensement comptable de chaque gain et dépense par personne.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
          <button onClick={handleExportCSV} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-semibold hover:bg-[var(--color-app-muted)] transition-colors text-[var(--color-app-text)] shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-[var(--color-app-deep)] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-sm">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .md\\:hidden { display: none !important; }
          button { display: none !important; }
          nav { display: none !important; }
          .bg-\\[var\\(--color-app-muted\\)\\] { background: transparent !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />

      <motion.div {...fadeUp(0.1)} className="flex gap-2 p-1 bg-[var(--color-app-muted)] rounded-2xl w-fit">
        <button
          onClick={() => setTableType('incomes')}
          className={cn("px-6 py-2 text-sm font-semibold rounded-xl transition-all", tableType === 'incomes' ? 'bg-white text-[var(--color-app-text)] shadow-sm' : 'text-[var(--color-app-text-muted)] hover:text-black')}
        >
          Entrées (Gains)
        </button>
        <button
          onClick={() => setTableType('expenses')}
          className={cn("px-6 py-2 text-sm font-semibold rounded-xl transition-all", tableType === 'expenses' ? 'bg-white text-[var(--color-app-text)] shadow-sm' : 'text-[var(--color-app-text-muted)] hover:text-black')}
        >
          Sorties (Dépenses)
        </button>
      </motion.div>

      <motion.div {...fadeUp(0.2)} className="bg-white rounded-[24px] p-4 md:p-6 shadow-sm border border-black/[0.03]">
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
          <div className="relative flex-1 md:min-w-[200px]">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-app-text-muted)]" />
             <input 
               type="text" 
               placeholder="Rechercher..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-3 md:py-2 bg-[var(--color-app-muted)] text-[var(--color-app-text)] placeholder:text-[var(--color-app-text-muted)]/60 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-app-mint)] text-sm transition-all"
             />
          </div>
          
          <div className="flex gap-2">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 md:flex-none px-3 py-3 md:py-2 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl text-sm outline-none cursor-pointer">
              <option value="">Tous les mois</option>
              {months.map(m => (
                <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy', {locale: fr})}</option>
              ))}
            </select>

            <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value as Person | '')} className="flex-1 md:flex-none px-3 py-3 md:py-2 bg-[var(--color-app-muted)] text-[var(--color-app-text)] rounded-xl text-sm outline-none cursor-pointer">
              <option value="">Famille</option>
              <option value="Monsieur">Monsieur</option>
              <option value="Madame">Madame</option>
            </select>

            <button onClick={resetFilters} className="p-3 md:py-2 md:px-3 text-[var(--color-app-text-muted)] hover:bg-[var(--color-app-muted)] rounded-xl transition-all border border-[var(--color-app-muted)] md:border-transparent flex-shrink-0 flex items-center justify-center" title="Réinitialiser les filtres">
              <FilterX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-[var(--color-app-text-muted)] border-b border-[var(--color-app-muted)]">
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort('date')}>
                  <div className="flex items-center gap-1">Date {getSortIcon('date')}</div>
                </th>
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort('person')}>
                  <div className="flex items-center gap-1">Personne {getSortIcon('person')}</div>
                </th>
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort('catOrd')}>
                  <div className="flex items-center gap-1">{tableType === 'incomes' ? 'Activité' : 'Catégorie'} {getSortIcon('catOrd')}</div>
                </th>
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort(tableType === 'incomes' ? 'clientOrd' : 'descOrd')}>
                  <div className="flex items-center gap-1">{tableType === 'incomes' ? 'Client / Source' : 'Description'} {getSortIcon(tableType === 'incomes' ? 'clientOrd' : 'descOrd')}</div>
                </th>
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort('amount')}>
                  <div className="flex items-center gap-1">Montant {getSortIcon('amount')}</div>
                </th>
                <th className="pb-3 font-medium px-2 cursor-pointer hover:text-black group" onClick={() => requestSort('status')}>
                  <div className="flex items-center gap-1">Statut {getSortIcon('status')}</div>
                </th>
                <th className="pb-3 font-medium px-2">Note</th>
                <th className="pb-3 font-medium px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any) => (
                <tr key={item.id} className="group hover:bg-[var(--color-app-muted)]/50 transition-colors border-b border-[var(--color-app-muted)]/50 last:border-0">
                  <td className="py-4 px-2 text-sm text-[var(--color-app-text-muted)]">{format(parseISO(item.date), 'dd MMM yyyy', {locale: fr})}</td>
                  <td className="py-4 px-2 text-sm font-medium">{item.person}</td>
                  <td className="py-4 px-2 text-sm">
                    <span className="px-2.5 py-1 bg-[var(--color-app-muted)] rounded-lg text-xs font-medium">
                      {tableType === 'incomes' ? item.activity : item.category}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-sm">
                    {tableType === 'incomes' ? item.client : item.description}
                  </td>
                  <td className={cn("py-4 px-2 text-sm font-bold", tableType === 'expenses' && "text-[var(--color-app-coral)]")}>
                    {tableType === 'expenses' && "- "}{formatCurrency(item.amount)}
                  </td>
                  <td className="py-4 px-2">
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1",
                      item.status === 'Encaissé' || item.status === 'Payé' ? "bg-[var(--color-app-mint)]/10 text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/15 text-[#B59648]"
                    )}>
                      {(item.status === 'Encaissé' || item.status === 'Payé') && <CheckCircle2 className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-sm text-[var(--color-app-text-muted)] truncate max-w-[120px]" title={item.note}>
                    {item.note || '-'}
                    {item.receiptUrl && (
                      <span className="inline-flex items-center gap-1 text-[var(--color-app-mint)] ml-2" title={`Justificatif: ${item.receiptUrl}`}>
                        <Paperclip className="w-3 h-3" />
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => tableType === 'incomes' ? deleteIncome(item.id) : deleteExpense(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                       <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-[var(--color-app-text-muted)]">Aucune entrée trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredData.map((item: any) => (
             <div key={item.id} className="bg-white border border-[var(--color-app-muted)] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
               <div className="flex justify-between items-start">
                 <div>
                   <div className="font-semibold">{tableType === 'incomes' ? item.client : item.description}</div>
                   <div className="text-xs text-[var(--color-app-text-muted)]">{format(parseISO(item.date), 'dd MMMM yyyy', {locale: fr})} • {item.person}</div>
                 </div>
                 <div className="text-right">
                   <div className={cn("font-bold", tableType === 'expenses' && "text-[var(--color-app-coral)]")}>{tableType === 'expenses' && "- "}{formatCurrency(item.amount)}</div>
                   <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-1",
                      item.status === 'Encaissé' || item.status === 'Payé' ? "bg-[var(--color-app-mint)]/10 text-[var(--color-app-deepmint)]" : "bg-[var(--color-app-champagne)]/15 text-[#B59648]"
                    )}>
                      {item.status}
                    </span>
                 </div>
               </div>
               
               <div className="flex justify-between items-center bg-[var(--color-app-muted)]/50 px-3 py-2 rounded-xl text-xs">
                 <span className="font-medium text-[var(--color-app-text-muted)]">{tableType === 'incomes' ? item.activity : item.category}</span>
                 <button onClick={() => tableType === 'incomes' ? deleteIncome(item.id) : deleteExpense(item.id)} className="text-red-400 p-1">
                   <Trash className="w-4 h-4" />
                 </button>
               </div>
             </div>
          ))}
          {filteredData.length === 0 && (
             <div className="py-12 text-center text-[var(--color-app-text-muted)]">Aucune entrée trouvée.</div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
