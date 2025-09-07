import { auth, db } from '../firebase';
import { 
  signInAnonymously,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

export interface CloudStoredSpot {
  id?: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  createdAt?: Date;
}

async function ensureUser(): Promise<string> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  if (!auth.currentUser) throw new Error('Failed to authenticate.');
  return auth.currentUser.uid;
}

export async function getOnboardingCompletedCloud(): Promise<boolean> {
  const uid = await ensureUser();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return !!snap.data()?.onboardingCompleted;
}

export async function setOnboardingCompletedCloud(completed: boolean): Promise<void> {
  const uid = await ensureUser();
  const userRef = doc(db, 'users', uid);
  // Use set with merge
  await import('firebase/firestore').then(({ setDoc }) =>
    setDoc(userRef, { onboardingCompleted: completed }, { merge: true })
  );
}

export interface UserProfileCloud {
  fullName?: string;
}

export async function getUserProfileCloud(): Promise<UserProfileCloud> {
  const uid = await ensureUser();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const data = snap.data() as any;
  return {
    fullName: typeof data?.fullName === 'string' ? data.fullName : undefined,
  };
}

export async function setUserFullNameCloud(fullName: string): Promise<void> {
  const uid = await ensureUser();
  const userRef = doc(db, 'users', uid);
  await import('firebase/firestore').then(({ setDoc }) =>
    setDoc(userRef, { fullName }, { merge: true })
  );
}

export async function getSpotsCloud(): Promise<CloudStoredSpot[]> {
  const uid = await ensureUser();
  const q = query(
    collection(db, 'userSpots'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const list: CloudStoredSpot[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    list.push({
      id: d.id,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMiles: data.radiusMiles,
      createdAt: data.createdAt?.toDate?.() ?? undefined,
    });
  });
  return list;
}

export async function addSpotCloud(spot: Omit<CloudStoredSpot, 'id' | 'createdAt'>): Promise<string> {
  const uid = await ensureUser();
  const ref = await addDoc(collection(db, 'userSpots'), {
    userId: uid,
    latitude: spot.latitude,
    longitude: spot.longitude,
    radiusMiles: spot.radiusMiles,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function clearSpotsCloud(): Promise<void> {
  const uid = await ensureUser();
  const q = query(collection(db, 'userSpots'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
