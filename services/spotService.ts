import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ParkingSpot } from '../types';

export const createSpot = async (
  userId: string, 
  latitude: number, 
  longitude: number, 
  timeToLeave: number
): Promise<string> => {
  try {
    const expiresAt = new Date(Date.now() + timeToLeave * 60 * 1000);
    
    const spotData: Omit<ParkingSpot, 'id'> = {
      userId,
      latitude,
      longitude,
      timeToLeave,
      createdAt: new Date(),
      expiresAt,
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, 'spots'), spotData);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const claimSpot = async (spotId: string, userId: string): Promise<void> => {
  try {
    const spotRef = doc(db, 'spots', spotId);
    await updateDoc(spotRef, {
      claimedBy: userId,
      isActive: false
    });
  } catch (error) {
    throw error;
  }
};

export const getNearbySpots = (
  latitude: number, 
  longitude: number, 
  radiusKm: number = 5,
  callback: (spots: ParkingSpot[]) => void
) => {
  // Simple bounding box query (can be improved with geohashing)
  const latDelta = radiusKm / 111; // 1 degree ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
  const q = query(
    collection(db, 'spots'),
    where('isActive', '==', true),
    where('latitude', '>=', latitude - latDelta),
    where('latitude', '<=', latitude + latDelta),
    where('longitude', '>=', longitude - lngDelta),
    where('longitude', '<=', longitude + lngDelta),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const spots: ParkingSpot[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      spots.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date()
      } as ParkingSpot);
    });
    
    // Filter out expired spots
    const now = new Date();
    const activeSpots = spots.filter(spot => spot.expiresAt > now);
    
    callback(activeSpots);
  });
};

export const updateUserPoints = async (userId: string, pointsToAdd: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: pointsToAdd
    });
  } catch (error) {
    throw error;
  }
};
