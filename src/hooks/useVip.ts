import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface VipInfo {
  isVip: boolean;
  temPersonalExclusivo: boolean;
  temAvaliacaoMensal: boolean;
  duracaoSessao: number;
  loading: boolean;
}

export function useVip(userId: string | undefined): VipInfo {
  const [info, setInfo] = useState<VipInfo>({
    isVip: false,
    temPersonalExclusivo: false,
    temAvaliacaoMensal: false,
    duracaoSessao: 60,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setInfo((prev) => ({ ...prev, loading: false }));
      return;
    }

    const load = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('plan_id')
          .eq('id', userId)
          .single();

        if (!data?.plan_id) {
          setInfo((prev) => ({ ...prev, loading: false }));
          return;
        }

        const { data: plan } = await supabase
          .from('plans')
          .select('tipo, personal_exclusivo, avaliacao_mensal, duracao_sessao_min')
          .eq('id', data.plan_id)
          .single();

        if (plan) {
          setInfo({
            isVip: plan.tipo === 'vip',
            temPersonalExclusivo: plan.personal_exclusivo ?? false,
            temAvaliacaoMensal: plan.avaliacao_mensal ?? false,
            duracaoSessao: plan.duracao_sessao_min ?? 60,
            loading: false,
          });
        } else {
          setInfo((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
  }, [userId]);

  return info;
}
