import { useState, useEffect } from 'react';
import { Transaction, ReportAgg } from '../types';
import { loadMonth, listMonthKeys } from '../lib/storage';
import { fmt, todayStr } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ReportView() {
  const [monthKey, setMonthKey] = useState(todayStr().slice(0, 7));
  const [monthList, setMonthList] = useState<string[]>([]);
  const [reportAgg, setReportAgg] = useState<ReportAgg | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    listMonthKeys().then(keys => {
      keys.sort((a, b) => b.localeCompare(a));
      setMonthList(keys);
      if (keys.length > 0 && !keys.includes(monthKey)) {
        setMonthKey(keys[0]);
      }
    });
  }, []);

  useEffect(() => {
    loadMonth(monthKey).then(txs => {
      if (txs.length === 0) {
        setReportAgg(null);
        return;
      }
      
      let revenue = 0, cost = 0;
      const byItem: Record<string, any> = {};
      
      txs.forEach(t => {
        let r = 0, c = 0;
        if (t.type === 'sale') {
          r = (t.sellingPricePerUnit || 0) * t.quantity;
          c = (t.costPricePerUnit || 0) * t.quantity;
        } else {
          c = t.expenseAmount || 0;
        }
        revenue += r;
        cost += c;
        
        if (t.type === 'sale') {
          if (!byItem[t.item]) {
            byItem[t.item] = { item: t.item, qty: 0, revenue: 0, cost: 0 };
          }
          byItem[t.item].qty += t.quantity;
          byItem[t.item].revenue += r;
          byItem[t.item].cost += c;
        }
      });
      
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue * 100) : 0;
      
      const items = Object.values(byItem).map(x => ({
        ...x, 
        profit: x.revenue - x.cost, 
        margin: x.revenue > 0 ? ((x.revenue - x.cost) / x.revenue * 100) : 0
      })).sort((a, b) => b.revenue - a.revenue);

      setReportAgg({ monthKey, revenue, cost, profit, margin, items });
    });
  }, [monthKey]);

  const COLORS = ['#2b241c', '#3f7d5c', '#c1432a', '#e4d5b7', '#8a7a56'];

  const filteredItems = reportAgg?.items.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-black font-sans uppercase tracking-widest text-ink border-b-[3px] border-ink pb-2">Business Reports</h2>
        
        <div className="flex items-center gap-4 bg-[#e4d5b7] p-2 rounded-xl border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)]">
          <span className="text-[10px] font-black text-ink uppercase tracking-widest px-2">Month</span>
          <select 
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="bg-white border-[3px] border-ink rounded-lg px-3 py-1 text-sm font-bold font-mono focus:outline-none"
          >
            {monthList.map(mk => <option key={mk} value={mk}>{mk}</option>)}
          </select>
        </div>
      </div>

      {!reportAgg ? (
        <div className="text-center text-[#8a7a56] text-xs font-bold uppercase tracking-widest px-2.5 py-10 bg-white border-[3px] border-ink border-dashed rounded-2xl">
          NO DATA FOR THIS MONTH
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border-[3px] border-ink rounded-xl p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <div className="text-[10px] text-[#8a7a56] font-bold uppercase tracking-widest mb-1">Gross Revenue</div>
              <div className="font-mono font-black text-xl text-ink">{fmt(reportAgg.revenue)}</div>
            </div>
            <div className="bg-white border-[3px] border-ink rounded-xl p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <div className="text-[10px] text-[#8a7a56] font-bold uppercase tracking-widest mb-1">Operating Cost</div>
              <div className="font-mono font-black text-xl text-[#c1432a]">{fmt(reportAgg.cost)}</div>
            </div>
            <div className={`border-[3px] border-ink rounded-xl p-4 shadow-[4px_4px_0_var(--color-ink)] ${reportAgg.profit >= 0 ? 'bg-jade text-white' : 'bg-[#c1432a] text-white'}`}>
              <div className="text-[10px] opacity-80 font-bold uppercase tracking-widest mb-1">Net Profit</div>
              <div className="font-mono font-black text-xl">{reportAgg.profit >= 0 ? '+ ' : ''}{fmt(reportAgg.profit)}</div>
            </div>
            <div className="bg-white border-[3px] border-ink rounded-xl p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <div className="text-[10px] text-[#8a7a56] font-bold uppercase tracking-widest mb-1">Gross Margin</div>
              <div className="font-mono font-black text-xl text-ink">{reportAgg.margin.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b-[3px] border-ink pb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-widest">
                  Item Breakdown
                </h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => {
                    const csv = [["Item", "Qty", "Revenue", "Margin %"]];
                    filteredItems.forEach(i => csv.push([i.item, i.qty.toString(), i.revenue.toString(), i.margin.toFixed(0)]));
                    const blob = new Blob([csv.map(r => r.join(",")).join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `report_${monthKey}.csv`; a.click();
                  }} className="bg-white border-[3px] border-ink rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition-colors">Export</button>
                  <input 
                    type="text" 
                    placeholder="Search item..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-48 bg-[#f8f5ee] border-[3px] border-ink rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-[3px] border-ink">
                      <th className="py-2 text-[10px] font-black uppercase tracking-widest text-ink">Item</th>
                      <th className="py-2 text-[10px] font-black uppercase tracking-widest text-right text-ink">Qty</th>
                      <th className="py-2 text-[10px] font-black uppercase tracking-widest text-right text-ink">Rev</th>
                      <th className="py-2 text-[10px] font-black uppercase tracking-widest text-right text-ink">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(it => (
                      <tr key={it.item} className="border-b-[2px] border-dashed border-ink/20 last:border-none">
                        <td className="py-3 font-bold text-ink">{it.item}</td>
                        <td className="py-3 font-mono font-bold text-right text-ink">{it.qty}</td>
                        <td className="py-3 font-mono font-bold text-right text-ink">{fmt(it.revenue)}</td>
                        <td className={`py-3 font-mono font-black text-right ${it.margin < 15 ? 'text-[#c1432a]' : (it.margin > 35 ? 'text-jade' : 'text-ink')}`}>
                          {it.margin.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs font-bold uppercase text-[#8a7a56]">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)] flex flex-col">
              <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-6 border-b-[3px] border-ink pb-4">
                Revenue Share
              </h3>
              <div className="flex-1 w-full min-h-[250px]">
                {reportAgg.items.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportAgg.items.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {reportAgg.items.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '3px solid #2b241c', fontWeight: 'bold', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#2b241c' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-xs font-bold uppercase tracking-widest text-[#8a7a56]">No Data Available</div>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                {reportAgg.items.slice(0, 5).map((entry, index) => (
                  <div key={entry.item} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="truncate max-w-[100px]">{entry.item}</span>
                    </div>
                    <span className="font-mono">{((entry.revenue / reportAgg.revenue) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
