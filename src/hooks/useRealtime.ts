import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Trainer } from '../types/payment';

interface UnitCapacity {
  current_count: number;
  capacity: number;
}

/**
 * Subscribe to realtime capacity changes for one or more units.
 * Returns a Map from unit ID to { current_count, capacity }.
 */
export function useUnitCapacity(
  unitIds: string[],
): Map<string, UnitCapacity> {
  const [capacityMap, setCapacityMap] = useState<Map<string, UnitCapacity>>(
    new Map(),
  );

  useEffect(() => {
    if (unitIds.length === 0) return;

    // Fetch initial data
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, current_count, capacity')
        .in('id', unitIds);

      if (!error && data) {
        const map = new Map<string, UnitCapacity>();
        for (const unit of data) {
          map.set(unit.id, {
            current_count: unit.current_count,
            capacity: unit.capacity,
          });
        }
        setCapacityMap(map);
      }
    };

    fetchInitial();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`units-capacity-${unitIds.join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'units',
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            current_count: number;
            capacity: number;
          };

          if (unitIds.includes(updated.id)) {
            setCapacityMap((prev) => {
              const next = new Map(prev);
              next.set(updated.id, {
                current_count: updated.current_count,
                capacity: updated.capacity,
              });
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitIds.join(',')]);

  return capacityMap;
}

/**
 * Subscribe to realtime changes for trainers on the floor at a given unit.
 * Returns the list of trainers currently on the floor.
 */
export function useTrainersOnFloor(unitId: string | null): Trainer[] {
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  useEffect(() => {
    if (!unitId) return;

    // Fetch initial data
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('unit_id', unitId)
        .eq('on_floor', true);

      if (!error && data) {
        setTrainers(data as Trainer[]);
      }
    };

    fetchInitial();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`trainers-floor-${unitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trainers',
          filter: `unit_id=eq.${unitId}`,
        },
        (payload) => {
          const trainer = (payload.new ?? payload.old) as Trainer;

          if (payload.eventType === 'DELETE') {
            setTrainers((prev) => prev.filter((t) => t.id !== trainer.id));
            return;
          }

          setTrainers((prev) => {
            if (trainer.on_floor) {
              // Add or update
              const exists = prev.find((t) => t.id === trainer.id);
              if (exists) {
                return prev.map((t) => (t.id === trainer.id ? trainer : t));
              }
              return [...prev, trainer];
            } else {
              // Remove from floor list
              return prev.filter((t) => t.id !== trainer.id);
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId]);

  return trainers;
}
