/**
 * Seed script: Populate Supabase exercises table from Free Exercise DB
 *
 * Usage:
 *   1. Clone free-exercise-db:
 *      git clone https://github.com/yuhonas/free-exercise-db.git /tmp/free-exercise-db
 *
 *   2. Set your service role key:
 *      export SUPABASE_SERVICE_ROLE_KEY="your-key"
 *
 *   3. Run:
 *      npx tsx scripts/seed-exercises.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://jkvgvchibmpbijxhsftp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Translation maps ────────────────────────────────────────────

const muscleMap: Record<string, string> = {
  abdominals: 'Abdômen',
  abductors: 'Abdutores',
  adductors: 'Adutores',
  biceps: 'Bíceps',
  calves: 'Panturrilha',
  chest: 'Peito',
  forearms: 'Antebraço',
  glutes: 'Glúteos',
  hamstrings: 'Posterior de Coxa',
  lats: 'Dorsal',
  'lower back': 'Lombar',
  'middle back': 'Costas Média',
  neck: 'Pescoço',
  quadriceps: 'Quadríceps',
  shoulders: 'Ombros',
  traps: 'Trapézio',
  triceps: 'Tríceps',
};

const equipmentMap: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halter',
  cable: 'Cabo/Polia',
  machine: 'Máquina',
  'body only': 'Peso Corporal',
  bands: 'Elástico',
  kettlebells: 'Kettlebell',
  'exercise ball': 'Bola Suíça',
  'medicine ball': 'Medicine Ball',
  'foam roll': 'Rolo de Espuma',
  'e-z curl bar': 'Barra W',
  other: 'Outro',
};

const categoryMap: Record<string, string> = {
  strength: 'Força',
  stretching: 'Alongamento',
  plyometrics: 'Pliometria',
  strongman: 'Strongman',
  powerlifting: 'Powerlifting',
  cardio: 'Cardio',
  'olympic weightlifting': 'Levantamento Olímpico',
};

// ── Main ─────────────────────────────────────────────────────────

async function seed() {
  const exercisesPath = '/tmp/free-exercise-db/dist/exercises.json';

  if (!fs.existsSync(exercisesPath)) {
    console.error(`File not found: ${exercisesPath}`);
    console.error('Run: git clone https://github.com/yuhonas/free-exercise-db.git /tmp/free-exercise-db');
    process.exit(1);
  }

  const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf-8'));
  console.log(`Found ${exercises.length} exercises to seed`);

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);

    const records = batch.map((ex: any) => {
      const primaryMuscle = ex.primaryMuscles?.[0] || '';
      const musclePt = muscleMap[primaryMuscle] || primaryMuscle;
      const equipPt = equipmentMap[ex.equipment] || ex.equipment;

      return {
        external_id: `free-db-${ex.id}`,
        name: ex.name,
        name_pt: null, // translate later
        category: ex.category,
        muscle_group: musclePt, // existing column
        body_part: primaryMuscle,
        body_part_pt: musclePt,
        target_muscle: primaryMuscle,
        target_muscle_pt: musclePt,
        secondary_muscles: ex.secondaryMuscles || [],
        equipment: ex.equipment,
        equipment_pt: equipPt,
        instructions: ex.instructions ? ex.instructions.join('\n') : null,
        instructions_pt: null,
        tips: null,
        image_url: ex.images?.[0]
          ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`
          : null,
        gif_url: null,
        video_url: null,
        source: 'free-exercise-db',
        is_custom: false,
      };
    });

    const { error } = await supabase
      .from('exercises')
      .upsert(records, { onConflict: 'external_id' });

    if (error) {
      console.error(`Batch ${i} error:`, error.message);
    } else {
      inserted += records.length;
      console.log(`${inserted}/${exercises.length} inserted`);
    }
  }

  console.log(`\nSeed complete! ${inserted} exercises.`);
}

seed().catch(console.error);
