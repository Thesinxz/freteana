export type Role = 'driver' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
}

export interface Transporter {
  id: string;
  name: string;
  color: string; // bg-class
  textColor: string; // text-class
  borderColor: string; // border-class
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
}

export interface PaymentRecord {
  id: string;
  amount: number;
  createdAt: number;
  note?: string;
  canceled?: boolean;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  createdAt: number;
  note?: string;
  canceled?: boolean;
}

