import { useState, useEffect, useRef } from 'react';
import { Transaction, UserSettings } from '../types';
import { loadMonth, saveTransaction, uploadImage, listenToToday, loadSettings } from '../lib/storage';
import { fmt, todayStr, monthKeyOf } from '../lib/utils';
import ConfirmCard from './ConfirmCard';
import LedgerList from './LedgerList';
import { Mic, ImagePlus, Loader2 } from 'lucide-react';

export default function RecordView() {
  const [todayTx, setTodayTx] = useState<Transaction[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micHint, setMicHint] = useState('TAP TO RECORD NEW TRANSACTION');
  const [textInput, setTextInput] = useState('');
  const [pendingTx, setPendingTx] = useState<Partial<Transaction> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings().then(s => setSettings(s));
    
    const unsubscribe = listenToToday((txs) => {
      setTodayTx(txs);
    });
    
    // @ts-ignore
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = navigator.language || 'en-MY';
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
        if (e.results[e.results.length - 1].isFinal) {
          handleParse(text);
        }
      };
      rec.onend = () => {
        setIsListening(false);
        setMicHint('TAP TO RECORD NEW TRANSACTION');
      };
      rec.onerror = () => {
        setIsListening(false);
        setMicHint('VOICE ERROR. TRY TYPING BELOW.');
      };
      recognitionRef.current = rec;
    } else {
      setMicHint('VOICE NOT SUPPORTED ON THIS BROWSER.');
    }
    
    return () => unsubscribe();
  }, []);

  const refreshToday = async () => {
    // Left for compatibility if needed elsewhere, but no longer used for initial load
    const mk = monthKeyOf(todayStr());
    const monthTx = await loadMonth(mk);
    setTodayTx(monthTx.filter(t => t.date === todayStr()));
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }
    setTranscript('');
    setIsListening(true);
    setMicHint('LISTENING...');
    recognitionRef.current.start();
  };

  const handleParse = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    setTranscript(text || 'Processing Receipt...');
    setIsProcessing(true);
    setPendingTx(null);

    try {
      const payload: any = {};
      if (text) payload.text = text;
      if (imageBase64) payload.image = imageBase64;
      if (settings?.catalog) payload.catalog = settings.catalog;

      const res = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const parsed = await res.json();
      
      if (!res.ok || parsed.error) {
        throw new Error(parsed.error || 'Failed to parse transaction');
      }
      
      if (settings?.catalog && parsed.item) {
        // fuzzy match item name
        const parsedItemLower = parsed.item.toLowerCase();
        const matchedItem = settings.catalog.find((c: any) => 
          parsedItemLower.includes(c.item.toLowerCase()) || 
          c.item.toLowerCase().includes(parsedItemLower)
        );
        if (matchedItem) {
          if (parsed.sellingPricePerUnit == null) parsed.sellingPricePerUnit = matchedItem.price;
          if (parsed.costPricePerUnit == null) parsed.costPricePerUnit = matchedItem.cost;
          // also ensure we use the canonical catalog name if it's very close
          parsed.item = matchedItem.item;
        }
      }

      if (imageBase64) {
        parsed.imageUrl = imageBase64;
      }
      setPendingTx(parsed);
    } catch (e: any) {
      alert(`AI Parsing Error: ${e.message}. Please enter manually.`);
      setPendingTx({
        type: 'sale',
        item: text ? text.slice(0, 20) : 'Receipt Item',
        quantity: 1,
        sellingPricePerUnit: null,
        costPricePerUnit: null,
        expenseAmount: null,
        note: '',
        imageUrl: imageBase64
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSend = () => {
    handleParse(textInput);
    setTextInput('');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setTranscript('READING IMAGE...');
    const base64 = await uploadImage(file);
    if (base64) {
      await handleParse('', base64);
    } else {
      setIsProcessing(false);
      setTranscript('FAILED TO READ IMAGE');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmSave = async (record: Transaction) => {
    // Optimistic UI update immediately
    if (record.date === todayStr()) {
      setTodayTx(prev => [record, ...prev]);
    }
    
    setPendingTx(null);
    setTranscript('');
    
    await saveTransaction(record);
  };

  const summary = todayTx.reduce(
    (acc, t) => {
      if (t.type === 'sale') {
        acc.revenue += (t.sellingPricePerUnit || 0) * t.quantity;
        acc.cost += (t.costPricePerUnit || 0) * t.quantity;
      } else {
        acc.cost += t.expenseAmount || 0;
      }
      return acc;
    },
    { revenue: 0, cost: 0 }
  );

  const profit = summary.revenue - summary.cost;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Left Column - Recorder */}
      <div className="w-full lg:w-[45%] shrink-0">
        <div className="bg-white border-[4px] border-ink rounded-[2rem] p-8 shadow-[8px_8px_0_var(--color-ink)] flex flex-col h-[500px] relative">
          <div className="flex items-center gap-2 mb-10">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-stall-red animate-pulse' : 'bg-jade'}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest text-ink">{isListening ? 'LISTENING' : 'READY'}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <button 
              onClick={toggleListen}
              className={`w-40 h-40 rounded-full border-[4px] border-ink flex items-center justify-center transition-all ${isListening ? 'bg-[#e4d5b7] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]' : 'bg-[#c1432a] shadow-[6px_6px_0_var(--color-ink)] hover:translate-y-1 hover:shadow-[2px_2px_0_var(--color-ink)]'}`}
            >
              <Mic className={isListening ? 'text-ink' : 'text-white'} size={64} />
            </button>
            
            <div className="mt-12 text-center h-16">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-2">
                   <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-ink animate-bounce" style={{animationDelay: '0ms'}}></div>
                     <div className="w-2 h-2 rounded-full bg-ink animate-bounce" style={{animationDelay: '150ms'}}></div>
                     <div className="w-2 h-2 rounded-full bg-ink animate-bounce" style={{animationDelay: '300ms'}}></div>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-ink mt-2">Processing</span>
                </div>
              ) : transcript ? (
                <p className="text-xl font-serif font-bold italic text-ink line-clamp-2 px-4">"{transcript}"</p>
              ) : (
                <p className="text-sm font-bold uppercase tracking-widest text-[#8a7a56]">{micHint}</p>
              )}
            </div>
          </div>

          <div className="mt-auto border-t-[2px] border-dashed border-line pt-6 w-full flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#f8f5ee] border-[3px] border-ink rounded-xl p-3 text-ink hover:bg-ink hover:text-white transition-colors flex-shrink-0"
              title="Upload Receipt"
            >
              <ImagePlus size={20} strokeWidth={2.5} />
            </button>
            
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              placeholder="Type here if noisy..."
              className="flex-1 min-w-0 bg-white border-[3px] border-ink rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:bg-[#f8f5ee] transition-colors"
            />
            
            <button 
              onClick={handleTextSend}
              className="bg-ink text-white font-black uppercase tracking-widest px-4 sm:px-6 py-3.5 rounded-xl border-[3px] border-ink hover:bg-white hover:text-ink transition-colors flex-shrink-0"
            >
              GO
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Stats & Ledger */}
      <div className="w-full lg:w-[55%] flex flex-col gap-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#e4d5b7] border-[3px] border-ink rounded-2xl p-5 shadow-[4px_4px_0_var(--color-ink)]">
            <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 opacity-70">Daily Revenue</p>
            <p className="text-2xl font-mono font-black text-ink">RM {summary.revenue.toFixed(2)}</p>
          </div>
          <div className="bg-[#e4d5b7] border-[3px] border-ink rounded-2xl p-5 shadow-[4px_4px_0_var(--color-ink)]">
            <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2 opacity-70">Total Expenses</p>
            <p className="text-2xl font-mono font-black text-ink">RM {summary.cost.toFixed(2)}</p>
          </div>
          <div className="bg-[#3f7d5c] border-[3px] border-ink rounded-2xl p-5 shadow-[4px_4px_0_var(--color-ink)]">
            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 opacity-90">Net Profit</p>
            <p className="text-2xl font-mono font-black text-white">RM {profit.toFixed(2)}</p>
          </div>
        </div>

        {/* Ledger List Container */}
        <div className="flex-1 bg-white border-[3px] border-ink rounded-2xl shadow-[6px_6px_0_var(--color-ink)] flex flex-col min-h-[300px] overflow-hidden">
          <div className="bg-ink text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest">Today's Ledger</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold opacity-80">{todayTx.length} TRANSACTIONS</span>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {pendingTx && (
              <div className="mb-6">
                <ConfirmCard
                  pendingTx={pendingTx}
                  catalog={settings?.catalog || []}
                  onCancel={() => setPendingTx(null)}
                  onSave={handleConfirmSave}
                />
              </div>
            )}
            
            {todayTx.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[#8a7a56] font-bold">No records yet - record your first transaction today</p>
              </div>
            ) : (
              <LedgerList list={todayTx} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
