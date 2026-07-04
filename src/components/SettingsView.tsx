import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { loadSettings, saveSettings } from '../lib/storage';
import { UserSettings } from '../types';

export default function SettingsView() {
  const user = auth.currentUser;
  
  const [settings, setSettings] = useState<UserSettings>({
    companyName: '',
    companyAddress: '',
    currency: 'RM',
    taxId: '',
    role: 'Admin'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadSettings().then(res => {
      if (res) setSettings(res);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg('');
    await saveSettings(settings);
    setIsSaving(false);
    setSaveMsg('SETTINGS SAVED');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="bg-white border-[3px] border-ink rounded-3xl p-8 shadow-[6px_6px_0_var(--color-ink)] min-h-[500px]">
      <h2 className="text-xl font-black font-sans uppercase tracking-widest text-ink mb-8 border-b-[3px] border-ink pb-4">Settings & Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Mgmt */}
        <div>
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8a7a56] rounded-full"></span>
            User Profile
          </h3>
          <div className="bg-[#f8f5ee] border-[3px] border-ink p-4 rounded-xl shadow-[4px_4px_0_var(--color-ink)] mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-1">Name</p>
            <p className="font-mono text-ink text-lg font-bold mb-3">{user?.displayName || 'User'}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-1">Email</p>
            <p className="font-mono text-ink/80 text-sm mb-3">{user?.email}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-1">Role</p>
            <p className="font-mono text-[#c1432a] font-bold text-sm uppercase">{settings.role}</p>
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-white text-ink border-[3px] border-ink rounded-xl py-3 px-6 font-bold uppercase tracking-widest hover:bg-ink hover:text-white transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none"
          >
            Sign Out
          </button>
        </div>

        {/* Company Profile & Preferences */}
        <div>
          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8a7a56] rounded-full"></span>
            Company Profile
          </h3>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-widest mb-1">Business Name</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
                className="w-full bg-[#f8f5ee] border-[3px] border-ink rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-widest mb-1">Tax ID / SSM</label>
              <input 
                type="text" 
                value={settings.taxId}
                onChange={e => setSettings({...settings, taxId: e.target.value})}
                className="w-full bg-[#f8f5ee] border-[3px] border-ink rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-widest mb-1">Address</label>
              <textarea 
                value={settings.companyAddress}
                onChange={e => setSettings({...settings, companyAddress: e.target.value})}
                className="w-full bg-[#f8f5ee] border-[3px] border-ink rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:bg-white min-h-[80px]"
              />
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#8a7a56] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#8a7a56] rounded-full"></span>
            Preferences
          </h3>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-widest mb-1">Currency</label>
              <select 
                value={settings.currency}
                onChange={e => setSettings({...settings, currency: e.target.value})}
                className="w-full bg-[#f8f5ee] border-[3px] border-ink rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:bg-white appearance-none"
              >
                <option value="RM">RM (MYR)</option>
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-jade text-white border-[3px] border-ink rounded-xl py-3 px-6 font-bold uppercase tracking-widest hover:bg-white hover:text-ink transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-none disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {saveMsg && <span className="text-jade font-bold text-xs uppercase tracking-widest">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
