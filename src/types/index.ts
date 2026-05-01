export type Role = 'driver' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  calendarTokens?: any; 
}

export interface FreightRecord {
  id: string; // auto-generated
  transportId: string; // 'estrella' | 'sol' | 'cometa'
  amount: number; // in cents
  createdAt: number; // timestamp in ms
  note?: string;
  canceled?: boolean;
}

export interface PaymentRecord {
  id: string; // auto-generated
  amount: number; // in cents
  createdAt: number; // timestamp in ms
  note?: string;
  canceled?: boolean;
}

export const TRANSPORTERS = [
  { id: 'estrella', name: 'Estrella Del Norte', color: 'bg-blue-800', textColor: 'text-blue-800', borderColor: 'border-blue-800', icon: 'Truck' },
  { id: 'sol', name: 'Sol Del Norte', color: 'bg-amber-600', textColor: 'text-amber-600', borderColor: 'border-amber-600', icon: 'Sun' },
  { id: 'cometa', name: 'Cometa Del Amambay', color: 'bg-emerald-600', textColor: 'text-emerald-600', borderColor: 'border-emerald-600', icon: 'Zap' },
];
