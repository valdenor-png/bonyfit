import type { PaymentMethod, PaymentStatus } from '../types/payment';
import { supabase } from './supabase';

const ASAAS_BASE_URL =
  process.env.EXPO_PUBLIC_ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY =
  process.env.EXPO_PUBLIC_ASAAS_API_KEY ?? 'your-asaas-api-key';

const headers = {
  'Content-Type': 'application/json',
  access_token: ASAAS_API_KEY,
};

interface AsaasCustomerPayload {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

interface AsaasSubscriptionResponse {
  id: string;
  status: string;
  value: number;
  nextDueDate: string;
}

interface AsaasPixResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

interface AsaasPaymentStatusResponse {
  id: string;
  status: string;
  value: number;
  billingType: string;
  confirmedDate: string | null;
}

export async function createCustomer(
  userData: AsaasCustomerPayload,
): Promise<AsaasCustomerResponse> {
  const response = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.errors?.[0]?.description ?? 'Erro ao criar cliente no Asaas');
  }

  return response.json();
}

export async function createSubscription(
  customerId: string,
  planId: string,
  billingType: PaymentMethod,
): Promise<AsaasSubscriptionResponse> {
  // Fetch plan details from Supabase
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) throw new Error('Plano não encontrado');

  const cycleMap: Record<string, string> = {
    mensal: 'MONTHLY',
    trimestral: 'QUARTERLY',
    anual: 'YEARLY',
  };

  const response = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType,
      value: plan.price,
      cycle: cycleMap[plan.period] ?? 'MONTHLY',
      description: `Bony Fit - ${plan.name}`,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      err.errors?.[0]?.description ?? 'Erro ao criar assinatura',
    );
  }

  return response.json();
}

export async function generatePixQrCode(
  paymentId: string,
): Promise<AsaasPixResponse> {
  const response = await fetch(
    `${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`,
    { method: 'GET', headers },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.errors?.[0]?.description ?? 'Erro ao gerar QR Code PIX');
  }

  return response.json();
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<AsaasPaymentStatusResponse> {
  const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      err.errors?.[0]?.description ?? 'Erro ao consultar pagamento',
    );
  }

  return response.json();
}
