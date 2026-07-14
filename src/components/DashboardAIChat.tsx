import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { listMonthKeys, loadMonth } from '../lib/storage';

export default function DashboardAIChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Load some context data to send to AI
      const keys = await listMonthKeys();
      keys.sort((a, b) => b.localeCompare(a));
      const currentMonth = keys.length ? keys[0] : null;
      let contextData = [];
      if (currentMonth) {
        contextData = await loadMonth(currentMonth);
      }

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          context: contextData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');

      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-[3px] border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--color-ink)] flex flex-col h-full min-h-[400px]">
      <div className="flex items-center gap-2 mb-4 border-b-[2px] border-dashed border-line pb-2">
        <Sparkles size={20} className="text-[#c1432a]" />
        <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest">Business Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs font-bold text-[#8a7a56] uppercase tracking-widest">
              Ask me anything about your current month's transactions, top selling items, or business advice!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[85%] border-[2px] border-ink text-sm font-bold shadow-[2px_2px_0_var(--color-ink)] ${
                m.role === 'user' ? 'bg-[#e4d5b7] text-ink' : 'bg-[#f8f5ee] text-ink'
              }`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-[#f8f5ee] border-[2px] border-ink shadow-[2px_2px_0_var(--color-ink)] flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-ink" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#8a7a56]">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative flex items-center">
        <input 
          type="text" 
          placeholder="Ask a question..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#f8f5ee] border-[2px] border-ink rounded-xl pl-4 pr-12 py-3 text-sm font-bold focus:outline-none focus:bg-white transition-colors"
        />
        <button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="absolute right-2 p-2 bg-ink text-white rounded-lg hover:bg-[#8a7a56] transition-colors disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
