import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface ExerciseResult {
  id: string;
  name: string;
  name_pt: string | null;
  muscle_group: string;
  body_part_pt: string | null;
  target_muscle_pt: string | null;
  equipment: string;
  equipment_pt: string | null;
  image_url: string | null;
  gif_url: string | null;
}

interface Params {
  bodyPart?: string;
  equipment?: string;
  search?: string;
  limit?: number;
}

export function useExerciseSearch(params: Params = {}) {
  const [data, setData] = useState<ExerciseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = params.limit || 40;

  const fetch = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    setLoading(true);

    let query = supabase
      .from('exercises')
      .select('id, name, name_pt, muscle_group, body_part_pt, target_muscle_pt, equipment, equipment_pt, image_url, gif_url')
      .order('name')
      .range(currentOffset, currentOffset + limit - 1);

    if (params.bodyPart) {
      query = query.or(
        `muscle_group.eq.${params.bodyPart},body_part_pt.eq.${params.bodyPart},target_muscle_pt.eq.${params.bodyPart}`
      );
    }

    if (params.equipment) {
      query = query.or(`equipment.eq.${params.equipment},equipment_pt.eq.${params.equipment}`);
    }

    if (params.search && params.search.length >= 2) {
      query = query.or(`name.ilike.%${params.search}%,name_pt.ilike.%${params.search}%`);
    }

    const { data: rows, error } = await query;

    if (!error && rows) {
      if (reset) {
        setData(rows);
        setOffset(rows.length);
      } else {
        setData((prev) => [...prev, ...rows]);
        setOffset(currentOffset + rows.length);
      }
      setHasMore(rows.length >= limit);
    }

    setLoading(false);
  }, [params.bodyPart, params.equipment, params.search, offset, limit]);

  // Reset on filter change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetch(true);
  }, [params.bodyPart, params.equipment, params.search]);

  const loadMore = () => {
    if (!loading && hasMore) fetch(false);
  };

  return { exercises: data, loading, hasMore, loadMore, refetch: () => fetch(true) };
}
