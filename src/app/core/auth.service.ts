import { Injectable, signal, inject } from '@angular/core';
import { auth, db } from './firebase.config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  avatarId: string;
  role?: 'user' | 'admin';
}

export interface AvatarOption {
  id: string;
  name: string;
  gradient: string;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);
  authInitialized = signal<boolean>(false);

  readonly avatars: AvatarOption[] = [
    {
      id: 'avatar_1',
      name: 'Avatar 1',
      gradient: 'bg-gradient-to-tr from-slate-800 to-slate-950 shadow-slate-900/40',
      avatarUrl: 'assets/avatars/avatar_1.jpg'
    },
    {
      id: 'avatar_2',
      name: 'Avatar 2',
      gradient: 'bg-gradient-to-tr from-amber-700 to-yellow-600 shadow-amber-800/40',
      avatarUrl: 'assets/avatars/avatar_2.jpeg'
    },
    {
      id: 'avatar_3',
      name: 'Avatar 3',
      gradient: 'bg-gradient-to-tr from-purple-800 to-emerald-600 shadow-purple-900/40',
      avatarUrl: 'assets/avatars/avatar_3.jpg'
    },
    {
      id: 'avatar_4',
      name: 'Avatar 4',
      gradient: 'bg-gradient-to-tr from-red-600 to-blue-700 shadow-red-600/40',
      avatarUrl: 'assets/avatars/avatar_4.png'
    },
    {
      id: 'avatar_5',
      name: 'Avatar 5',
      gradient: 'bg-gradient-to-tr from-slate-900 to-slate-950 shadow-slate-950/40',
      avatarUrl: 'assets/avatars/avatar_5.jpg'
    },
    {
      id: 'avatar_6',
      name: 'Avatar 6',
      gradient: 'bg-gradient-to-tr from-yellow-500 to-red-600 shadow-red-500/40',
      avatarUrl: 'assets/avatars/avatar_6.png'
    },
    {
      id: 'avatar_7',
      name: 'Avatar 7',
      gradient: 'bg-gradient-to-tr from-amber-800 to-amber-950 shadow-amber-900/40',
      avatarUrl: 'assets/avatars/avatar_7.jpg'
    },
    {
      id: 'avatar_8',
      name: 'Avatar 8',
      gradient: 'bg-gradient-to-tr from-slate-700 to-slate-900 shadow-slate-800/40',
      avatarUrl: 'assets/avatars/avatar_8.jpg'
    },
    {
      id: 'avatar_9',
      name: 'Avatar 9',
      gradient: 'bg-gradient-to-tr from-slate-600 to-slate-800 shadow-slate-700/40',
      avatarUrl: 'assets/avatars/avatar_9.png'
    },
    {
      id: 'avatar_10',
      name: 'Avatar 10',
      gradient: 'bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-yellow-400/40',
      avatarUrl: 'assets/avatars/avatar_10.jpg'
    },
    {
      id: 'avatar_11',
      name: 'Avatar 11',
      gradient: 'bg-gradient-to-tr from-orange-400 to-orange-600 shadow-orange-500/40',
      avatarUrl: 'assets/avatars/avatar_11.jpg'
    },
    {
      id: 'avatar_12',
      name: 'Avatar 12',
      gradient: 'bg-gradient-to-tr from-blue-500 to-orange-500 shadow-blue-500/40',
      avatarUrl: 'assets/avatars/avatar_12.webp'
    }
  ];

  constructor() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch matching Firestore document to get profile data
        const profile = await this.getUserProfileByUid(firebaseUser.uid);
        if (profile) {
          this.currentUser.set(profile);
        } else {
          // Fallback if auth exists but no Firestore profile yet (should not happen)
          this.currentUser.set({
            uid: firebaseUser.uid,
            username: firebaseUser.displayName || 'Invitado',
            email: firebaseUser.email || '',
            avatarId: 'avatar_1',
            role: 'user'
          });
        }
      } else {
        // Check if local guest session was active
        const isGuest = localStorage.getItem('ostplay_guest') === 'true';
        if (isGuest) {
          this.currentUser.set({
            uid: 'guest',
            username: 'Invitado',
            email: '',
            avatarId: 'avatar_1',
            role: 'user'
          });
        } else {
          this.currentUser.set(null);
        }
      }
      this.authInitialized.set(true);
    });
  }

  loginAsGuest() {
    localStorage.setItem('ostplay_guest', 'true');
    this.currentUser.set({
      uid: 'guest',
      username: 'Invitado',
      email: '',
      avatarId: 'avatar_1'
    });
  }

  getAvatar(avatarId: string): AvatarOption {
    return this.avatars.find(a => a.id === avatarId) || this.avatars[0];
  }

  async updateAvatar(avatarId: string): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    if (user.uid === 'guest') {
      this.currentUser.set({
        ...user,
        avatarId
      });
      return;
    }

    try {
      const cleanUsernameLower = user.username.toLowerCase();
      const userDocRef = doc(db, 'users', cleanUsernameLower);
      await updateDoc(userDocRef, {
        avatarId: avatarId
      });

      this.currentUser.set({
        ...user,
        avatarId
      });
    } catch (e) {
      console.error('Error updating avatar:', e);
    }
  }

  private async getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    try {
      // Find document where uid matches (checking username is primary key so we query)
      // Since usernames are lowercase IDs, we can store a helper lookup or query
      // To keep lookup simple and instant, let's query the collection 'users'
      // where uid === firebaseUser.uid
      // Wait, we can also use a small trick: look up in a special collection or just do a standard query.
      // Firestore query is easy, but we can also store uid-to-username mappings if wanted.
      // Let's do a simple getDoc or search.
      // To query, we'd need collection group or query helper. Let's write a quick query:
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        return {
          uid: docData['uid'],
          username: docData['username'],
          email: docData['email'],
          avatarId: docData['avatarId'] || 'avatar_1',
          role: docData['role'] || 'user'
        };
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
    return null;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const cleanUsername = username.toLowerCase().trim();
    const userDoc = await getDoc(doc(db, 'users', cleanUsername));
    return userDoc.exists();
  }

  async registerUser(username: string, email: string, contrasena: string, avatarId: string): Promise<void> {
    const cleanUsername = username.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsernameLower = cleanUsername.toLowerCase();

    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, contrasena);
    const uid = userCredential.user.uid;

    // 2. Create user document in Firestore keyed by lowercase username to guarantee uniqueness
    const userDocRef = doc(db, 'users', cleanUsernameLower);
    await setDoc(userDocRef, {
      uid,
      username: cleanUsername,
      email: cleanEmail,
      avatarId,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    this.currentUser.set({
      uid,
      username: cleanUsername,
      email: cleanEmail,
      avatarId,
      role: 'user'
    });
  }

  async loginUser(usernameOrEmail: string, contrasena: string): Promise<void> {
    const input = usernameOrEmail.trim();

    let email = input;
    if (!input.includes('@')) {
      // It is a username. Get the associated email from Firestore
      const cleanUsername = input.toLowerCase();
      const userDoc = await getDoc(doc(db, 'users', cleanUsername));
      if (!userDoc.exists()) {
        throw new Error('username-not-found');
      }
      email = userDoc.data()?.['email'] || '';
      if (!email) {
        throw new Error('invalid-user-document');
      }
    }

    // Sign in using email & password
    const userCredential = await signInWithEmailAndPassword(auth, email, contrasena);
    const uid = userCredential.user.uid;

    // Load profile
    const profile = await this.getUserProfileByUid(uid);
    if (profile) {
      this.currentUser.set(profile);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('ostplay_guest');
    await signOut(auth);
    this.currentUser.set(null);
  }
}
