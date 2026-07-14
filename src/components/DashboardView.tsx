import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { listMonthKeys, loadMonth } from '../lib/storage';
import { fmt, todayStr } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lightbulb } from 'lucide-react';
import DashboardAIChat from './DashboardAIChat';

export default function DashboardView() {
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ revenue: 0, profit: 0, txCount: 0 });
  const [tip, setTip] = useState('');

  const tips = [
    "Keep personal and business money separate to make accounting easier.",
    "Review your best-selling items weekly and ensure you have enough stock.",
    "Record all expenses, no matter how small. They add up quickly!",
    "Track your peak hours to schedule your prep time efficiently.",
    "A clean stall attracts more customers. Dedicate 10 minutes at closing to clean up.",
    "Always count your float (starting cash) before opening to avoid mistakes later.",
    "Consistent pricing and clear menus help customers make quicker decisions."
  ];

  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    
    async function loadData() {
      const keys = await listMonthKeys();
      keys.sort((a, b) => b.localeCompare(a));
      
      const currentMonth = keys.length ? keys[0] : todayStr().slice(0, 7);
      const txs = await loadMonth(currentMonth);
      
      const sortedTxs = [...txs].sort((a, b) => b.ts - a.ts);
      setRecentTxs(sortedTxs.slice(0, 5));
      
      let rev = 0, cost = 0;
      txs.forEach(t => {
        if (t.type === 'sale') {
          rev += (t.sellingPricePerUnit || 0) * t.quantity;
          cost += (t.costPricePerUnit || 0) * t.quantity;
        } else {
          cost += (t.expenseAmount || 0);
        }
      });
      setMetrics({ revenue: rev, profit: rev - cost, txCount: txs.length });

      // Build chart data (daily breakdown for the current month)
      const days = new Map<string, { revenue: number, cost: number }>();
      txs.forEach(t => {
        const d = t.date.slice(8, 10);
        if (!days.has(d)) days.set(d, { revenue: 0, cost: 0 });
        const obj = days.get(d)!;
        if (t.type === 'sale') {
          obj.revenue += (t.sellingPricePerUnit || 0) * t.quantity;
          obj.cost += (t.costPricePerUnit || 0) * t.quantity;
        } else {
          obj.cost += (t.expenseAmount || 0);
        }
      });

      const chartData = Array.from(days.entries()).map(([day, data]) => ({
        day,
        revenue: data.revenue,
        profit: data.revenue - data.cost
      })).sort((a, b) => a.day.localeCompare(b.day));
      
      setMonthlyData(chartData);
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-xl font-black font-sans uppercase tracking-widest text-ink mb-2">KPI Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#e4d5b7] border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)]">
          <p className="text-xs font-bold text-ink uppercase tracking-widest mb-2 opacity-70">Current Month Revenue</p>
          <p className="text-3xl font-mono font-black text-ink">{fmt(metrics.revenue)}</p>
        </div>
        <div className="bg-[#3f7d5c] border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)]">
          <p className="text-xs font-bold text-white uppercase tracking-widest mb-2 opacity-90">Current Month Profit</p>
          <p className="text-3xl font-mono font-black text-white">{fmt(metrics.profit)}</p>
        </div>
        <div className="bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)]">
          <p className="text-xs font-bold text-ink uppercase tracking-widest mb-2 opacity-70">Monthly Transactions</p>
          <p className="text-3xl font-mono font-black text-ink">{metrics.txCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)] min-h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-6 border-b-[2px] border-dashed border-line pb-2">Revenue & Profit Trends (Daily)</h3>
          <div className="flex-1 w-full h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a7a56', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8a7a56', fontWeight: 'bold' }} tickFormatter={(v) => `RM${v}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8f5ee' }}
                    contentStyle={{ borderRadius: '8px', border: '3px solid #2b241c', fontWeight: 'bold', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#2b241c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#3f7d5c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold uppercase tracking-widest text-[#8a7a56]">No Data Available</div>
            )}
          </div>
        </div>

        <div className="bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)] flex flex-col">
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-6 border-b-[2px] border-dashed border-line pb-2">Recent Activities</h3>
          <div className="flex-1 overflow-y-auto">
            {recentTxs.length > 0 ? (
              <div className="space-y-4">
                {recentTxs.map(t => (
                  <div key={t.id} className="flex justify-between items-center border-b border-line pb-3 last:border-none">
                    <div>
                      <p className="font-bold text-ink text-sm truncate max-w-[150px]">{t.item}</p>
                      <p className="text-[10px] font-bold text-[#8a7a56] uppercase tracking-widest">{t.date}</p>
                    </div>
                    <span className={`font-mono font-bold ${t.type === 'sale' ? 'text-jade' : 'text-[#c1432a]'}`}>
                      {t.type === 'sale' ? '+' : '-'}{t.type === 'sale' ? ((t.sellingPricePerUnit || 0)*t.quantity).toFixed(2) : (t.expenseAmount||0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#8a7a56] text-xs font-bold uppercase tracking-widest py-10">No recent activities</div>
            )}
          </div>
        </div>
      </div>

      {/* Stall Tip Card */}
      <div className="bg-[#f8f5ee] border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)] mt-2">
        <div className="flex items-start gap-4">
          <div className="bg-[#e4d5b7] text-ink w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-[2px] border-ink">
            <Lightbulb size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-1">Stall Tip</h3>
            <p className="text-[#8a7a56] font-bold text-sm">{tip}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 h-[500px]">
        <DashboardAIChat />
      </div>
    </div>
  );
}
