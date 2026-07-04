import { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { motion } from 'motion/react';

export default function SignIn() {
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    try {
      setErrorMsg('');
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // user just closed the popup, ignore
        return;
      }
      setErrorMsg('Failed to sign in. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border-[3px] border-ink rounded-3xl p-8 shadow-[6px_6px_0_var(--color-ink)] flex flex-col items-center"
      >
        <div className="bg-[#c1432a] text-white font-bold p-3 rounded-xl border-[3px] border-ink shadow-[3px_3px_0_var(--color-ink)] mb-6 text-2xl">
          SL
        </div>
        <h1 className="text-3xl font-black font-serif tracking-tighter text-ink mb-2">STALL LEDGER</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[#8a7a56] mb-8 text-center">AI-POWERED VOICE BOOKKEEPING</p>
        
        <button 
          onClick={handleSignIn}
          className="w-full bg-ink text-white font-bold uppercase tracking-widest py-4 rounded-xl border-[3px] border-ink hover:bg-white hover:text-ink transition-colors shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-[0_0_0_var(--color-ink)]"
        >
          Sign In with Google
        </button>
        {errorMsg && <p className="text-stall-red text-xs font-bold mt-4 text-center">{errorMsg}</p>}
      </motion.div>
    </div>
  );
}
