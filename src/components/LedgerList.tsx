import { Transaction } from '../types';
import { fmt } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function LedgerList({ list }: { list: Transaction[] }) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  if (!list.length) {
    return (
      <div className="text-center text-[#8a7a56] text-xs font-bold uppercase tracking-widest px-2.5 py-10">
        NO TRANSACTIONS YET
      </div>
    );
  }

  const sorted = [...list].sort((a, b) => b.ts - a.ts);

  return (
    <div className="flex flex-col pb-8 gap-4">
      <AnimatePresence>
        {sorted.map(t => {
        let revenue = 0, cost = 0, note = t.note || '';
        if (t.type === 'sale') {
          revenue = (t.sellingPricePerUnit || 0) * t.quantity;
          cost = (t.costPricePerUnit || 0) * t.quantity;
        } else {
          cost = t.expenseAmount || 0;
        }
        
        const profit = revenue - cost;
        const isLoss = profit < 0;
        const marginTxt = t.type === 'sale' && cost > 0 
          ? Math.round((profit / revenue) * 100) + '%' 
          : (t.type === 'expense' ? 'OUT' : '');

        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative p-4 border-[3px] border-ink rounded-xl bg-[#f8f5ee] shadow-[4px_4px_0_var(--color-ink)]"
          >
            <div className="flex justify-between items-start mb-2 pr-12">
              <span className="text-base font-bold text-ink flex items-center gap-2">
                {t.item} {t.quantity > 1 ? `× ${t.quantity}` : ''}
              </span>
              <span className={`font-mono font-black text-lg ${t.type === 'sale' && !isLoss ? 'text-jade' : 'text-[#c1432a]'}`}>
                {t.type === 'sale' ? '+ ' + fmt(revenue) : '- ' + fmt(cost)}
              </span>
            </div>
            <div className="text-xs text-[#8a7a56] flex flex-wrap gap-x-4 gap-y-1 pr-12 font-bold uppercase tracking-widest items-center">
              <span className="font-mono">{new Date(t.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              {t.type === 'sale' && cost > 0 && <span>Cost: {fmt(t.costPricePerUnit)}/ea</span>}
              {t.type === 'sale' && cost > 0 && <span>Margin: {marginTxt}</span>}
              {note && <span className="truncate">{note}</span>}
              {t.imageUrl && (
                <button 
                  onClick={() => setSelectedImg(t.imageUrl || null)}
                  className="flex items-center gap-1 text-ink bg-white px-2 py-0.5 rounded border border-ink/30 hover:bg-ink hover:text-white transition-colors"
                >
                  <ImageIcon size={12} />
                  <span>IMG</span>
                </button>
              )}
            </div>
            
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 border-[3px] px-2 py-1 rounded-lg font-sans font-black text-[10px] uppercase -rotate-[15deg] shadow-[2px_2px_0_currentColor] ${t.type === 'expense' || isLoss ? 'border-[#c1432a] text-[#c1432a]' : 'border-jade text-jade'}`}>
              {t.type === 'sale' ? (isLoss ? 'LOSS' : 'PAID') : 'COST'}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>

      {/* Image Modal */}
      {selectedImg && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImg(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={selectedImg} alt="Receipt" className="max-w-full max-h-[90vh] object-contain rounded-xl border-[4px] border-ink shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white" />
            <button className="absolute -top-4 -right-4 bg-[#c1432a] text-white w-8 h-8 rounded-full border-[3px] border-ink font-black flex items-center justify-center shadow-[2px_2px_0_var(--color-ink)]" onClick={() => setSelectedImg(null)}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}
