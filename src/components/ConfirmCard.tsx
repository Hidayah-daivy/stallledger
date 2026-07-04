import { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { todayStr } from '../lib/utils';
import { uploadImage } from '../lib/storage';
import { motion } from 'motion/react';
import { ImagePlus, X } from 'lucide-react';

interface ConfirmCardProps {
  pendingTx: Partial<Transaction>;
  onCancel: () => void;
  onSave: (tx: Transaction) => void;
}

export default function ConfirmCard({ pendingTx, onCancel, onSave }: ConfirmCardProps) {
  const [type, setType] = useState(pendingTx.type || 'sale');
  const [date, setDate] = useState(todayStr());
  const [item, setItem] = useState(pendingTx.item || '');
  const [qty, setQty] = useState(pendingTx.quantity || 1);
  const [sell, setSell] = useState(pendingTx.sellingPricePerUnit ?? '');
  const [cost, setCost] = useState(pendingTx.costPricePerUnit ?? '');
  const [expAmt, setExpAmt] = useState(pendingTx.expenseAmount ?? '');
  const [note, setNote] = useState(pendingTx.note || '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setType(pendingTx.type || 'sale');
    setItem(pendingTx.item || '');
    setQty(pendingTx.quantity || 1);
    setSell(pendingTx.sellingPricePerUnit ?? '');
    setCost(pendingTx.costPricePerUnit ?? '');
    setExpAmt(pendingTx.expenseAmount ?? '');
    setNote(pendingTx.note || '');
    setImageUrl(pendingTx.imageUrl || null);
  }, [pendingTx]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const tx: any = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      date,
      type: type as 'sale' | 'expense',
      item: item.trim() || 'Unnamed',
      quantity: Number(qty) || 1,
      sellingPricePerUnit: type === 'sale' ? Number(sell) || 0 : null,
      costPricePerUnit: type === 'sale' ? Number(cost) || 0 : null,
      expenseAmount: type === 'expense' ? Number(expAmt) || 0 : null,
      note: note.trim(),
    };
    if (imageUrl) {
      tx.imageUrl = imageUrl;
    }
    onSave(tx);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setImageUrl(url);
    }
    setIsUploading(false);
  };

  return (
    <motion.form 
      onSubmit={handleSave}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#e4d5b7] border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)]"
    >
      <h4 className="m-0 mb-6 font-sans font-black text-lg text-ink uppercase tracking-widest border-b-[3px] border-ink pb-2">
        Confirm Transaction
      </h4>
      
      <div className="flex gap-4 mb-4 items-center">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]">
          <option value="sale">Sale Revenue</option>
          <option value="expense">Expense / Restock</option>
        </select>
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:bg-[#f8f5ee]" />
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Item</label>
        <input type="text" value={item} onChange={(e) => setItem(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]" />
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Qty</label>
        <input type="number" min="0" step="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:bg-[#f8f5ee]" />
      </div>

      {type === 'sale' ? (
        <>
          <div className="flex gap-4 mb-4 items-center">
            <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Sell / ea</label>
            <input type="number" min="0" step="0.01" value={sell} onChange={(e) => setSell(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:bg-[#f8f5ee]" />
          </div>
          <div className="flex gap-4 mb-4 items-center">
            <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Cost / ea</label>
            <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Optional" className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:bg-[#f8f5ee]" />
          </div>
        </>
      ) : (
        <div className="flex gap-4 mb-4 items-center">
          <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Amount</label>
          <input type="number" min="0" step="0.01" value={expAmt} onChange={(e) => setExpAmt(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold font-mono focus:outline-none focus:bg-[#f8f5ee]" />
        </div>
      )}

      <div className="flex gap-4 mb-4 items-center">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0">Note</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1 bg-white border-[3px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]" />
      </div>

      <div className="flex gap-4 mb-6">
        <label className="w-[80px] text-[10px] font-black text-ink uppercase tracking-widest shrink-0 pt-2">Receipt</label>
        <div className="flex-1">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          {imageUrl ? (
            <div className="relative inline-block border-[3px] border-ink rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Receipt" className="h-24 w-auto object-cover" />
              <button 
                onClick={() => setImageUrl(null)}
                className="absolute -top-1 -right-1 bg-ink text-white rounded-bl-lg p-1"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white border-[3px] border-dashed border-ink/50 text-ink/70 hover:text-ink hover:border-ink rounded-lg px-4 py-3 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ImagePlus size={16} />
              {isUploading ? 'UPLOADING...' : 'ATTACH IMAGE'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onCancel} className="flex-1 bg-white text-ink border-[3px] border-ink rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-[#f8f5ee] transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none">Cancel</button>
        <button type="submit" className="flex-1 bg-ink text-white border-[3px] border-ink rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-ink transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none">Save</button>
      </div>
    </motion.form>
  );
}
