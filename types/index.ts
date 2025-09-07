export interface User {
  id: string;
  email: string;
  points: number;
  createdAt: Date;
}

export interface ParkingSpot {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timeToLeave: number; // minutes
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  claimedBy?: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}
