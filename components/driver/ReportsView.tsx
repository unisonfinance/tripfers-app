import React, { useState, useEffect } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { Transaction } from '../../types';
import { Icons } from '../Icons';

interface ReportsViewProps {
  onBack: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = mockBackend.getCurrentUser();
      if (!user) return;

      const allTransactions = await mockBackend.getTransactions();
      // Filter for this user and Payouts/Commissions (money movement)
      const userTransactions = allTransactions.filter(t => 
        t.userId === user.id && (t.type === 'PAYOUT' || t.type === 'COMMISSION' || t.type === 'PAYMENT')
      );
      
      // Sort by date desc
      userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(userTransactions);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    // Payouts are money OUT from system to driver (positive for driver)
    // Payments are money IN from client (not relevant for driver payout report usually, but maybe direct payments?)
    // Let's assume for Driver Report:
    // PAYOUT = Money received by driver (Positive)
    // COMMISSION = Money taken by platform (Negative)
    // PAYMENT = Usually client paying system, but if assigned to driver, maybe +?
    
    // For simplicity based on mock data:
    if (t.type === 'PAYOUT') return sum + t.amount;
    return sum;
  }, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Icons.ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Reports</h2>
        </div>
        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
          <Icons.Download className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white px-4 py-4 border-b border-slate-200 grid grid-cols-2 gap-3">
        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 py-4">
        <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-200">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Payouts ({months[selectedMonth]})</p>
          <div className="text-3xl font-bold">${totalAmount.toFixed(2)}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-100 bg-blue-700/50 w-fit px-2 py-1 rounded-lg">
            <Icons.Calendar className="w-3 h-3" />
            <span>{filteredTransactions.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">History</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Icons.Filter className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No transactions found for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.type === 'PAYOUT' ? 'bg-green-100 text-green-600' : 
                    t.type === 'COMMISSION' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t.type === 'PAYOUT' ? '+$' : t.type === 'COMMISSION' ? '-$' : '$'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString()} • {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    t.type === 'PAYOUT' ? 'text-green-600' : 
                    t.type === 'COMMISSION' ? 'text-red-600' : 'text-slate-800'
                  }`}>
                    {t.type === 'PAYOUT' ? '+' : t.type === 'COMMISSION' ? '-' : ''}
                    ${t.amount.toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
