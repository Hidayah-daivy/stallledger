import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "polished-composition-209p9",
  appId: "1:1053701514426:web:e294506584d9594c8f8e83",
  apiKey: "AIzaSyCFFdyXSQ7Jj3zOqaQg78GX-fi3-qwUg-I",
  authDomain: "polished-composition-209p9.firebaseapp.com",
  storageBucket: "polished-composition-209p9.firebasestorage.app",
  messagingSenderId: "1053701514426",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-65fd6378-7ba3-45f2-b714-d4607e89d986");
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
