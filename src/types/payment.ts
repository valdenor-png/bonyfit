export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  asaas_id: string | null;
  created_at: string;
}

export interface CreditCardData {
  number: string;
  expiry: string;
  cvv: string;
  holder_name: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  unit_id: string;
  avatar_url: string | null;
  rating: number;
  on_floor: boolean;
  since_time: string | null;
  students_count: number;
}

export interface CatracaEvent {
  id: string;
  user_id: string;
  unit_id: string;
  direction: 'in' | 'out';
  timestamp: string;
}
