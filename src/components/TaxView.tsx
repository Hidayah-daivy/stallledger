import { useState, useEffect } from 'react';
import { loadMonth, listMonthKeys } from '../lib/storage';
import { fmt } from '../lib/utils';

const BRACKETS = [
  { upto: 5000, rate: 0 },
  { upto: 20000, rate: 0.01 },
  { upto: 35000, rate: 0.03 },
  { upto: 50000, rate: 0.06 },
  { upto: 70000, rate: 0.11 },
  { upto: 100000, rate: 0.19 },
  { upto: 400000, rate: 0.25 },
  { upto: 600000, rate: 0.26 },
  { upto: 2000000, rate: 0.28 },
  { upto: Infinity, rate: 0.30 }
];

function computeProgressiveTax(chargeable: number) {
  if (chargeable <= 0) return { tax: 0, rows: [] };
  let tax = 0, lower = 0, rows = [];
  
  for (const b of BRACKETS) {
    if (chargeable <= lower) break;
    const bandTop = Math.min(chargeable, b.upto);
    const bandAmount = Math.max(0, bandTop - lower);
    const bandTax = bandAmount * b.rate;
    
    if (bandAmount > 0) {
      rows.push({ from: lower, to: bandTop, rate: b.rate, tax: bandTax });
      tax += bandTax;
    }
    
    lower = b.upto;
    if (chargeable <= b.upto) break;
  }
  return { tax, rows };
}

export default function TaxView() {
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  
  const [expRent, setExpRent] = useState(0);
  const [expUtil, setExpUtil] = useState(0);
  const [expWage, setExpWage] = useState(0);
  const [expOther, setExpOther] = useState(0);
  const [personalRelief, setPersonalRelief] = useState(9000);
  
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    initYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      calcTax();
    }
  }, [selectedYear, expRent, expUtil, expWage, expOther, personalRelief]);

  const initYears = async () => {
    const keys = await listMonthKeys();
    const allYears = Array.from(new Set(keys.map(k => k.slice(0, 4)))).sort().reverse();
    const currentYear = String(new Date().getFullYear());
    
    if (!allYears.includes(currentYear)) {
      allYears.unshift(currentYear);
    }
    
    setYears(allYears);
    setSelectedYear(allYears[0]);
  };

  const calcTax = async () => {
    if (!selectedYear) return;
    
    const keys = (await listMonthKeys()).filter(k => k.startsWith(selectedYear));
    let revenue = 0, cost = 0;
    
    for (const mk of keys) {
      const list = await loadMonth(mk);
      list.forEach(t => {
        if (t.type === 'sale') {
          revenue += (t.sellingPricePerUnit || 0) * t.quantity;
          cost += (t.costPricePerUnit || 0) * t.quantity;
        } else {
          cost += t.expenseAmount || 0;
        }
      });
    }
    
    const extra = (expRent || 0) + (expUtil || 0) + (expWage || 0) + (expOther || 0);
    const relief = personalRelief || 0;
    const netProfit = revenue - cost - extra;
    const chargeable = Math.max(0, netProfit - relief);
    const { tax, rows } = computeProgressiveTax(chargeable);
    const effRate = chargeable > 0 ? (tax / chargeable * 100) : 0;

    setResult({
      year: selectedYear,
      revenue,
      cost,
      extra,
      netProfit,
      relief,
      chargeable,
      tax,
      effRate,
      rows
    });
  };

  return (
    <div className="pb-8">
      <h3 className="text-xs font-bold text-[#8a7a56] uppercase mb-3 flex items-center gap-2 underline decoration-[#3f7d5c] underline-offset-4 tracking-widest">Tax Estimator (LHDN Form B)</h3>
      <div className="bg-[#fbeecb] border-2 border-line rounded-lg p-3 text-xs text-[#6b5320] leading-[1.6] mb-6 shadow-sm">
        <b className="text-stall-red font-bold uppercase tracking-widest text-[10px]">Disclaimer: </b>
        Simplified estimation only. Not official tax advice. Please file Form B via LHDN MyTax.
      </div>

      <div className="bg-paper2 border-2 border-line rounded-xl p-4 mb-4 flex items-center gap-4 shadow-sm">
        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-[#8a7a56] m-0 shrink-0">Tax Year</h4>
        <select 
          value={selectedYear} 
          onChange={e => setSelectedYear(e.target.value)}
          className="flex-1 bg-transparent border-b border-line text-sm font-sans focus:outline-none focus:border-stall-red py-1 font-bold font-mono tracking-widest"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-[#fffdf6] border border-line rounded-xl p-4 mb-4 print:hidden shadow-sm">
        <h4 className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#8a7a56] m-0 mb-3 pb-1 border-b border-line">Deductible Expenses</h4>
        
        <div className="flex gap-2 items-center mb-3">
          <label className="w-[120px] text-xs font-bold text-ink">Rental</label>
          <input type="number" min="0" value={expRent} onChange={e => setExpRent(Number(e.target.value))} className="flex-1 border-b border-line px-1 py-1 text-sm bg-transparent font-mono focus:outline-none focus:border-stall-red" />
        </div>
        
        <div className="flex gap-2 items-center mb-3">
          <label className="w-[120px] text-xs font-bold text-ink">Utilities</label>
          <input type="number" min="0" value={expUtil} onChange={e => setExpUtil(Number(e.target.value))} className="flex-1 border-b border-line px-1 py-1 text-sm bg-transparent font-mono focus:outline-none focus:border-stall-red" />
        </div>
        
        <div className="flex gap-2 items-center mb-3">
          <label className="w-[120px] text-xs font-bold text-ink">Wages</label>
          <input type="number" min="0" value={expWage} onChange={e => setExpWage(Number(e.target.value))} className="flex-1 border-b border-line px-1 py-1 text-sm bg-transparent font-mono focus:outline-none focus:border-stall-red" />
        </div>
        
        <div className="flex gap-2 items-center mb-3">
          <label className="w-[120px] text-xs font-bold text-ink">Others</label>
          <input type="number" min="0" value={expOther} onChange={e => setExpOther(Number(e.target.value))} className="flex-1 border-b border-line px-1 py-1 text-sm bg-transparent font-mono focus:outline-none focus:border-stall-red" />
        </div>
        
        <div className="flex gap-2 items-center mb-1">
          <label className="w-[120px] text-xs font-bold text-ink">Personal Relief</label>
          <input type="number" min="0" value={personalRelief} onChange={e => setPersonalRelief(Number(e.target.value))} className="flex-1 border-b border-line px-1 py-1 text-sm bg-transparent font-mono focus:outline-none focus:border-stall-red" />
        </div>
      </div>

      {result && (
        <div className="bg-[#efe0bf] border border-line rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-3 border-b border-line pb-2">
            <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-[#8a7a56] m-0">Estimation Result</h4>
            <span className="text-xs font-mono font-bold">{result.year}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-ink">Net Profit:</span>
              <span>{fmt(result.netProfit)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-ink">Personal Relief:</span>
              <span>- {fmt(result.relief)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono font-bold mt-2 pt-2 border-t border-dashed border-line">
              <span className="text-ink">Taxable Income:</span>
              <span>{fmt(result.chargeable)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-line pt-2 mt-2">
              <span className="text-stall-red uppercase tracking-widest text-[11px] flex items-center">Est. Tax:</span>
              <span className="font-mono text-stall-red">{fmt(result.tax)}</span>
            </div>
          </div>
          
          {result.rows.length > 0 && (
            <table className="w-full text-[10px] border-collapse mt-4 bg-[#fffdf6] rounded border border-line overflow-hidden">
              <thead className="bg-paper2">
                <tr>
                  <th className="text-left text-[#8a7a56] font-sans font-bold py-1.5 px-2 uppercase tracking-widest">Bracket</th>
                  <th className="text-left text-[#8a7a56] font-sans font-bold py-1.5 px-2 uppercase tracking-widest text-right">Rate</th>
                  <th className="text-left text-[#8a7a56] font-sans font-bold py-1.5 px-2 uppercase tracking-widest text-right">Tax</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-dashed border-line">
                    <td className="py-1.5 px-2 font-mono text-ink">
                      {Math.round(r.from).toLocaleString()} - {r.to === Infinity ? 'MAX' : Math.round(r.to).toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-ink text-right">
                      {(r.rate * 100).toFixed(0)}%
                    </td>
                    <td className="py-1.5 px-2 font-mono text-ink text-right">
                      {fmt(r.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <button 
        onClick={() => window.print()}
        className="w-full bg-ink text-white border-2 border-ink rounded-lg py-3 text-xs font-bold uppercase tracking-widest cursor-pointer print:hidden hover:bg-paper hover:text-ink transition-all shadow-sm"
      >
        🖨 Print Summary
      </button>
    </div>
  );
}
