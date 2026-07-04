import { Transaction, UserSettings } from '../types';
import { db, auth } from './firebase';
import { collection, doc, getDocs, setDoc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { todayStr } from './utils';

export async function loadMonth(monthKey: string): Promise<Transaction[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    
    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      where("date", ">=", `${monthKey}-01`),
      where("date", "<=", `${monthKey}-31`)
    );
    
    const snapshot = await getDocs(q);
    const txs: Transaction[] = [];
    snapshot.forEach(doc => {
      txs.push(doc.data() as Transaction);
    });
    return txs;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    // Remove undefined properties before saving to Firestore
    const dataToSave = Object.entries(tx).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    const docRef = doc(db, `users/${user.uid}/transactions`, tx.id);
    await setDoc(docRef, dataToSave);
  } catch (e) {
    console.error('save failed', e);
  }
}

export async function uploadImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function listMonthKeys(): Promise<string[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];
    
    const snapshot = await getDocs(collection(db, `users/${user.uid}/transactions`));
    const keys = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.date) {
        keys.add(data.date.substring(0, 7));
      }
    });
    return Array.from(keys);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function loadSettings(): Promise<UserSettings | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docRef = doc(db, `users/${user.uid}/settings`, 'profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserSettings;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    const docRef = doc(db, `users/${user.uid}/settings`, 'profile');
    await setDoc(docRef, settings, { merge: true });
  } catch (e) {
    console.error(e);
  }
}

export function listenToToday(callback: (txs: Transaction[]) => void): () => void {
  const user = auth.currentUser;
  if (!user) return () => {};
  
  const q = query(
    collection(db, `users/${user.uid}/transactions`),
    where("date", "==", todayStr())
  );
  
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach(doc => {
      txs.push(doc.data() as Transaction);
    });
    callback(txs);
  }, (error) => {
    console.error("listenToToday error", error);
  });
}
