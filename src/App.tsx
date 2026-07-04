import { useState, useEffect } from 'react';
import RecordView from './components/RecordView';
import ReportView from './components/ReportView';
import TaxView from './components/TaxView';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import SignIn from './components/SignIn';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'record' | 'reports' | 'tax' | 'settings'>('dashboard');
  const [user, setUser] = useState<User | null | undefined>(undefined);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-[#c1432a] animate-pulse" /></div>;
  
  if (!user) return <SignIn />;

  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const weekdayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'record', label: 'Core Business' },
    { id: 'reports', label: 'Reports' },
    { id: 'tax', label: 'Tax Filing' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-ink font-sans flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b-[3px] border-ink bg-[#f8f5ee] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#c1432a] text-white font-bold px-2.5 py-1.5 rounded-lg border-[3px] border-ink shadow-[2px_2px_0_var(--color-ink)] text-lg leading-none">
            SL
          </div>
          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-xl font-black font-sans uppercase tracking-widest text-ink leading-tight">STALL LEDGER</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#8a7a56] font-bold">AI-POWERED VOICE BOOKKEEPING</p>
          </div>
        </div>

        <nav className="hidden lg:flex bg-[#e4d5b7] border-[3px] border-ink rounded-full p-1 shadow-[2px_2px_0_var(--color-ink)]">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'bg-ink text-white' : 'text-[#8a7a56] hover:text-ink'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="text-right flex items-center gap-4">
          <p className="text-sm font-bold font-mono tracking-widest uppercase hidden md:block">{weekdayLabel}, {todayLabel}</p>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="lg:hidden flex overflow-x-auto bg-[#e4d5b7] border-b-[3px] border-ink p-2 px-4 gap-2 no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-none px-4 py-2 rounded-xl border-[2px] border-ink text-xs font-bold uppercase tracking-widest ${activeTab === tab.id ? 'bg-ink text-white shadow-[2px_2px_0_var(--color-ink)]' : 'bg-[#f8f5ee] text-[#8a7a56]'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'record' && <RecordView />}
        {activeTab === 'reports' && <ReportView />}
        {activeTab === 'tax' && <TaxView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
