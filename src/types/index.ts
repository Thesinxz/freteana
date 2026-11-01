export type Role = 'driver' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  calendarTokens?: Record<string, unknown>;
}

export interface Transporter {
  id: string;
  name: string;
  color: string; // bg-class or hex key
  textColor?: string;
  borderColor?: string;
  icon: string; // Lucide icon name
  active: boolean;
}

export interface FreightRecord {
  id: string;
  transportId: string;
  amount: number;
  createdAt: number;
  note?: string;
  canceled?: boolean;
  deviceId?: string;
  authorName?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  createdAt: number;
  note?: string;
  bank?: string;
  transportId?: string;
  canceled?: boolean;
  deviceId?: string;
  authorName?: string;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  createdAt: number;
  note?: string;
  canceled?: boolean;
  deviceId?: string;
  authorName?: string;
}

export interface PickupRecord {
  id: string;
  transportId: string;
  scheduledAt: number;
  note?: string;
  completed?: boolean;
  canceled?: boolean;
  createdAt: number;
  deviceId?: string;
  authorName?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  senderDeviceId?: string;
  excludeSender?: boolean;
}
