import { useState, useEffect, useCallback } from 'react';
import { fetchLogsMes } from '../services/workoutHistory';
import { useAuth } from './useAuth';

interface LogMes {
  id: string;
  workout_date: string;
  volume_total: number;
  points_earned: number;
  duration_seconds: number;
  name: string;
}

interface StatsMes {
  treinos: number;
  volume: number;
  frequencia: number;
}

export function useWorkoutHistory() {
  const { user } = useAuth();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [logsMes, setLogsMes] = useState<LogMes[]>([]);
  const [diasTreinou, setDiasTreinou] = useState<Set<number>>(new Set());
  const [statsMes, setStatsMes] = useState<StatsMes>({ treinos: 0, volume: 0, frequencia: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchLogsMes(user.id, currentMonth.year, currentMonth.month);
      setLogsMes(data as LogMes[]);

      const dias = new Set<number>();
      let volumeTotal = 0;
      data.forEach((log: any) => {
        const d = new Date(log.workout_date);
        dias.add(d.getDate());
        volumeTotal += log.volume_total || 0;
      });
      setDiasTreinou(dias);

      // Calculate days in month for frequency
      const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();
      const freq = daysInMonth > 0 ? Math.round((dias.size / daysInMonth) * 100) : 0;

      setStatsMes({
        treinos: data.length,
        volume: volumeTotal,
        frequencia: freq,
      });
    } catch {
      setLogsMes([]);
      setDiasTreinou(new Set());
      setStatsMes({ treinos: 0, volume: 0, frequencia: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentMonth.year, currentMonth.month]);

  useEffect(() => {
    load();
  }, [load]);

  return { logsMes, diasTreinou, statsMes, currentMonth, setCurrentMonth, loading, reload: load };
}
