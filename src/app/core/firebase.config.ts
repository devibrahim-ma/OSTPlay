import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyD459l_9Dd45YY7vglAzc2tnux3WiuVnWY",
  authDomain: "ostplay-6e77c.firebaseapp.com",
  projectId: "ostplay-6e77c",
  storageBucket: "ostplay-6e77c.firebasestorage.app",
  messagingSenderId: "926796167360",
  appId: "1:926796167360:web:79875c4703e617ee479525",
  measurementId: "G-LFJR4BHHT2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
