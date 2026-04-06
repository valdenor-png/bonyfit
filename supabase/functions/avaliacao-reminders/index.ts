import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── 1. VIP users with last evaluation > 25 days ago and no pending agendamento ──
    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

    // Get all VIP users (users on VIP plans with avaliacao_mensal)
    const { data: vipUsers, error: vipError } = await supabase
      .from('users')
      .select('id, name, email, plan_id')
      .not('plan_id', 'is', null);

    if (vipError) {
      console.error('Error fetching VIP users:', vipError.message);
    }

    const reminders: { userId: string; name: string; daysSince: number }[] = [];

    if (vipUsers) {
      for (const user of vipUsers) {
        // Check if user is on a VIP plan with avaliacao_mensal
        const { data: plan } = await supabase
          .from('plans')
          .select('tipo, avaliacao_mensal')
          .eq('id', user.plan_id)
          .single();

        if (!plan || plan.tipo !== 'vip' || !plan.avaliacao_mensal) continue;

        // Check last completed evaluation
        const { data: lastEval } = await supabase
          .from('agendamento_avaliacoes')
          .select('created_at')
          .eq('aluno_id', user.id)
          .eq('status', 'concluido')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const lastEvalDate = lastEval?.created_at ? new Date(lastEval.created_at) : null;
        const daysSince = lastEvalDate
          ? Math.floor((Date.now() - lastEvalDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSince < 25) continue;

        // Check if there is already a pending agendamento
        const { data: pending } = await supabase
          .from('agendamento_avaliacoes')
          .select('id')
          .eq('aluno_id', user.id)
          .in('status', ['solicitado', 'agendado'])
          .limit(1);

        if (pending && pending.length > 0) continue;

        reminders.push({
          userId: user.id,
          name: user.name || 'Aluno',
          daysSince,
        });
      }
    }

    if (reminders.length > 0) {
      console.log(`[avaliacao-reminders] ${reminders.length} VIP user(s) need evaluation reminders:`);
      for (const r of reminders) {
        console.log(`  - ${r.name} (${r.userId}): ${r.daysSince} days since last evaluation`);
        // Actual push notification would require Expo Push API setup:
        // await sendPushNotification(r.userId, 'Hora da avaliacao!', 'Sua avaliacao mensal esta disponivel.');
      }
    } else {
      console.log('[avaliacao-reminders] No VIP users need evaluation reminders.');
    }

    // ─── 2. Evaluations scheduled for tomorrow ──────────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: scheduledTomorrow, error: schedError } = await supabase
      .from('agendamento_avaliacoes')
      .select('id, aluno_id, personal_nome, data_agendada')
      .eq('status', 'agendado')
      .gte('data_agendada', `${tomorrowStr}T00:00:00`)
      .lte('data_agendada', `${tomorrowStr}T23:59:59`);

    if (schedError) {
      console.error('Error fetching tomorrow evaluations:', schedError.message);
    }

    if (scheduledTomorrow && scheduledTomorrow.length > 0) {
      console.log(`[avaliacao-reminders] ${scheduledTomorrow.length} evaluation(s) scheduled for tomorrow:`);
      for (const s of scheduledTomorrow) {
        console.log(`  - Aluno ${s.aluno_id} with ${s.personal_nome || 'TBD'} at ${s.data_agendada}`);
        // Actual push notification:
        // await sendPushNotification(s.aluno_id, 'Avaliacao amanha!', `Sua avaliacao esta marcada para amanha.`);
      }
    } else {
      console.log('[avaliacao-reminders] No evaluations scheduled for tomorrow.');
    }

    return new Response(
      JSON.stringify({
        ok: true,
        reminders_sent: reminders.length,
        tomorrow_evaluations: scheduledTomorrow?.length ?? 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[avaliacao-reminders] Unexpected error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal error' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
