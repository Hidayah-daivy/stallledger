import { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { loadSettings, saveSettings } from '../lib/storage';
import { Plus, Trash2 } from 'lucide-react';

export default function MenuView() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [catalog, setCatalog] = useState<{item: string, price: number, cost: number}[]>([]);
  
  const [newItem, setNewItem] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadSettings().then(res => {
      if (res) {
        setSettings(res);
        setCatalog(res.catalog || []);
      }
    });
  }, []);

  const handleAdd = () => {
    if (!newItem.trim() || !newPrice || !newCost) return;
    const added = [...catalog, { 
      item: newItem.trim(), 
      price: Number(newPrice), 
      cost: Number(newCost) 
    }];
    setCatalog(added);
    setNewItem('');
    setNewPrice('');
    setNewCost('');
  };

  const handleRemove = (index: number) => {
    const next = catalog.filter((_, i) => i !== index);
    setCatalog(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg('');
    const updated = { ...(settings || {}), catalog } as UserSettings;
    await saveSettings(updated);
    setSettings(updated);
    setIsSaving(false);
    setSaveMsg('MENU SAVED');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="bg-white border-[3px] border-ink rounded-3xl p-8 shadow-[6px_6px_0_var(--color-ink)] min-h-[500px] flex flex-col">
      <h2 className="text-xl font-black font-sans uppercase tracking-widest text-ink mb-2 border-ink">Menu Pricing</h2>
      <p className="text-xs font-bold text-[#8a7a56] uppercase tracking-widest mb-8 leading-relaxed border-b-[3px] border-ink pb-4">
        Set fixed costs and selling prices for your items. The AI will automatically apply these when recording transactions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Left Col: Current Catalog */}
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8a7a56] rounded-full"></span>
            Current Menu Items
          </h3>
          <div className="flex-1 overflow-y-auto mb-6 bg-[#f8f5ee] border-[3px] border-ink p-4 rounded-2xl shadow-[4px_4px_0_var(--color-ink)] min-h-[300px]">
            {catalog.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center py-8 text-[#8a7a56] font-bold text-sm uppercase tracking-widest">
                No items configured yet.
              </div>
            ) : (
              <div className="space-y-3">
                {catalog.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border-[2px] border-ink">
                    <div>
                      <p className="font-bold text-ink">{c.item}</p>
                      <p className="text-[10px] font-bold text-[#8a7a56] uppercase tracking-widest">
                        Price: RM {c.price.toFixed(2)} | Cost: RM {c.cost.toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => handleRemove(idx)} className="text-[#c1432a] hover:bg-[#f8f5ee] p-2 rounded-lg border-[2px] border-transparent hover:border-[#c1432a] transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Add New & Save */}
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8a7a56] rounded-full"></span>
            Add New Item
          </h3>
          <div className="bg-[#e4d5b7] p-6 rounded-2xl border-[3px] border-ink mb-6 flex flex-col gap-4 shadow-[4px_4px_0_var(--color-ink)]">
            <div>
              <label className="block text-[10px] font-black text-ink uppercase tracking-widest mb-1">Item Name</label>
              <input 
                type="text" 
                placeholder="e.g. Nasi Lemak"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                className="w-full bg-white border-[2px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-ink uppercase tracking-widest mb-1">Cost (RM)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={newCost}
                  onChange={e => setNewCost(e.target.value)}
                  className="w-full bg-white border-[2px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-ink uppercase tracking-widest mb-1">Price (RM)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full bg-white border-[2px] border-ink rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee]"
                />
              </div>
            </div>
            <button 
              onClick={handleAdd}
              className="w-full mt-2 bg-ink text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white hover:text-ink border-[3px] border-transparent hover:border-ink transition-all"
            >
              <Plus size={16} /> Add Item to Menu
            </button>
          </div>

          <div className="mt-auto flex items-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-jade text-white border-[3px] border-ink rounded-xl py-4 px-6 font-black uppercase tracking-widest hover:bg-white hover:text-jade transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none disabled:opacity-50 text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Menu'}
            </button>
            {saveMsg && <span className="text-jade font-black text-xs uppercase tracking-widest">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
