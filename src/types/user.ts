export type Level = 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante';

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  facial_url: string | null;
  unit_id: string | null;
  plan_id: string | null;
  level: Level;
  points: number;
  streak: number;
  created_at: string;
  avatar_url: string | null;
  is_private: boolean;
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  capacity: number;
  current_count: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'mensal' | 'trimestral' | 'anual';
  multi_unit: boolean;
  features: string[];
}

export function getLevel(points: number): Level {
  if (points >= 30000) return 'Diamante';
  if (points >= 15000) return 'Platina';
  if (points >= 8000) return 'Ouro';
  if (points >= 3000) return 'Prata';
  return 'Bronze';
}

export function anonymizeName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '***';
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const masked = first[0] + '***' + first[first.length - 1];
  return last ? `${masked} ${last[0]}.` : masked;
}
