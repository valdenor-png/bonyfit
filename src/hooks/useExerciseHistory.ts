import { useState, useEffect, useCallback } from 'react';
import { fetchExerciseHistory } from '../services/workoutHistory';
import { useAuth } from './useAuth';

interface SessionData {
  workoutLogId: string;
  date: string;
  maxCarga: number;
  totalReps: number;
  volume: number;
  sets: { weight_kg: number; reps: number; set_index: number }[];
}

export function useExerciseHistory(exerciseId: string | null) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [pr, setPr] = useState(0);
  const [evolucaoPct, setEvolucaoPct] = useState(0);
  const [ultimaCarga, setUltimaCarga] = useState(0);
  const [ultimaReps, setUltimaReps] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id || !exerciseId) return;
    setLoading(true);
    try {
      const data = await fetchExerciseHistory(user.id, exerciseId);

      // Group by workout_log_id
      const grouped: Record<string, { date: string; sets: { weight_kg: number; reps: number; set_index: number }[] }> = {};
      data.forEach((row: any) => {
        const wid = row.workout_log_id;
        if (!grouped[wid]) grouped[wid] = { date: row.created_at, sets: [] };
        grouped[wid].sets.push({ weight_kg: row.weight_kg, reps: row.reps, set_index: row.set_index });
      });

      const sessionList: SessionData[] = Object.entries(grouped).map(([wid, g]) => {
        const maxCarga = Math.max(...g.sets.map(s => s.weight_kg), 0);
        const totalReps = g.sets.reduce((sum, s) => sum + s.reps, 0);
        const volume = g.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
        return { workoutLogId: wid, date: g.date, maxCarga, totalReps, volume, sets: g.sets };
      });

      // Sort by date ascending
      sessionList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSessions(sessionList);

      const maxPr = sessionList.length > 0 ? Math.max(...sessionList.map(s => s.maxCarga)) : 0;
      setPr(maxPr);

      if (sessionList.length >= 2) {
        const first = sessionList[0].maxCarga;
        const last = sessionList[sessionList.length - 1].maxCarga;
        setEvolucaoPct(first > 0 ? Math.round(((last - first) / first) * 100) : 0);
      } else {
        setEvolucaoPct(0);
      }

      if (sessionList.length > 0) {
        const lastSession = sessionList[sessionList.length - 1];
        setUltimaCarga(lastSession.maxCarga);
        setUltimaReps(lastSession.totalReps);
      }
    } catch {
      setSessions([]);
      setPr(0);
      setEvolucaoPct(0);
      setUltimaCarga(0);
      setUltimaReps(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, pr, evolucaoPct, ultimaCarga, ultimaReps, loading };
}
