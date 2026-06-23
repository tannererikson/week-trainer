/* Week Trainer — seed program (the weekly plan).
   Source-of-truth CONFIG. Editing it changes the plan, never past logs.
   IDs must stay stable + unique to keep logs attached.

   === 12-Week Recomposition Program — BLOCK 1 (Foundation, weeks 1–4) loaded ===
   Block 1 base of a 12-week program. The week-5 / week-9 swaps and per-block RIR / volume /
   heavy-top-set changes are preserved in window.WT_PROGRESSION below (data only — the app
   does not yet auto-apply them).

   Links are generated at render time (how-to = YouTube search, target = anatomy search).

   muscles: canonical muscle keys (see js/muscles.js MUSCLES) that each lift trains.
     primary   = main movers (full recovery credit / set credit)
     secondary = assisting muscles (half credit)
   These feed the Body → Recovery heatmap and the Targets set goals. */
window.WT_PROGRAM = {
  meta: {
    name: 'Week Trainer',
    block: 'Block 1 · Foundation (weeks 1–4) · RIR 2–3',
    goals: [
      'Build muscle (chest priority)',
      'Improve posture',
      'Lose fat',
      'Increase cardio endurance'
    ],
    standingRules: [
      'Double progression: hit the top of the rep range on all sets → add weight next session, drop back to the bottom.',
      'Working sets 1–3 reps short of failure (RIR 2–3 this block).',
      'Moderate 8–15 reps is the default; heavy 5–8 only on marked lifts; light 15+ on isolations.',
      'Keep the same lifts within each 4-week block — swaps happen at weeks 5 and 9.'
    ],
    deferred: []
  },

  days: [
    /* ---------------- MONDAY — Chest + Side/Rear Delts ---------------- */
    {
      id: 'mon', tabLabel: 'Chest', title: 'Chest + Side/Rear Delts', subtitle: 'Push day · chest priority', type: 'training',
      cardio: {
        kind: 'treadmill',
        prescription: 'Treadmill intervals — start Stage 1: 1:30 jog / 2:30 walk × 6. Warm up 3–5 min brisk walk first; short, quick steps. Advance a stage every 1–2 weeks when it feels easy.',
        trackMinutes: true, trackDistance: true
      },
      warmup: ['Band pull-aparts', 'Arm circles + shoulder openers', 'Light press to warm the shoulders'],
      sections: [
        {
          id: 'mon-chest', label: 'Chest',
          exercises: [
            { id: 'mon-incdbpress', name: 'Incline Dumbbell Press', scheme: '4 x 8–12', defaultSets: 4, focus: true,
              targetMuscle: { label: 'Upper chest' }, muscles: { primary: ['chest'], secondary: ['front_delts', 'triceps'] },
              formCues: ['Upper chest focus', 'Stop short of a deep stretch at the bottom'] },
            { id: 'mon-cablepress', name: 'Cable Chest Press', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Chest' }, muscles: { primary: ['chest'], secondary: ['triceps', 'front_delts'] },
              formCues: ['Keep constant tension'] },
            { id: 'mon-cablefly', name: 'Cable Fly', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Chest (squeeze)' }, muscles: { primary: ['chest'] },
              formCues: ['Squeeze and hold a beat', 'Soft elbows'] },
            { id: 'mon-pullover', name: 'Dumbbell Pullover', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Chest / lats' }, muscles: { primary: ['chest', 'lats'] },
              formCues: ['Chest, serratus, ribcage', 'Also helps posture'] }
          ]
        },
        {
          id: 'mon-delts', label: 'Side / rear delts',
          exercises: [
            { id: 'mon-lateral', name: 'Lateral Raise', scheme: '4 x 12–20', defaultSets: 4,
              targetMuscle: { label: 'Side delts' }, muscles: { primary: ['side_delts'] },
              formCues: ['Side-delt width', 'Lead with the elbows'] },
            { id: 'mon-revpec', name: 'Reverse Pec Deck', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'] },
              formCues: ['Rear delts and posture', 'Lead with the elbows'] }
          ]
        }
      ]
    },

    /* ---------------- TUESDAY — Back + Traps ---------------- */
    {
      id: 'tue', tabLabel: 'Back', title: 'Back + Traps', subtitle: 'Pull day · posture priority', type: 'training',
      cardio: { kind: 'bike', prescription: 'Easy bike, 15–25 min, conversational pace.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Cat-cow / thoracic openers', 'Light lat pulldown to feel the lats'],
      sections: [
        {
          id: 'tue-main', label: 'Main',
          exercises: [
            { id: 'tue-latpull', name: 'Lat Pulldown', scheme: '4 x 8–12', defaultSets: 4,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'], secondary: ['biceps'] },
              formCues: ['Drive elbows to ribs', 'Minimal swing'] },
            { id: 'tue-csrow', name: 'Chest-Supported Machine Row', scheme: '4 x 8–12', defaultSets: 4,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats', 'biceps'] },
              formCues: ['Squeeze the shoulder blades', 'Heavy-option lift'] }
          ]
        },
        {
          id: 'tue-ssA', label: 'Superset', note: 'alternate, ~60s rest', superset: true,
          exercises: [
            { id: 'tue-revpec', name: 'Reverse Pec Deck', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'] },
              formCues: ['Rear delts', 'Lead with the elbows'] },
            { id: 'tue-facepull', name: 'Face Pull', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Rear delts / posture' }, muscles: { primary: ['rear_delts'], secondary: ['traps'] },
              formCues: ['Pull to forehead, elbows high', 'Posture'] }
          ]
        },
        {
          id: 'tue-acc', label: 'Traps + lats',
          exercises: [
            { id: 'tue-shrugs', name: 'Dumbbell Shrugs', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Traps' }, muscles: { primary: ['traps'] },
              formCues: ['Pause hard at the top', 'Straight up, no rolling'] },
            { id: 'tue-sapull', name: 'Straight-Arm Pulldown', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'] },
              formCues: ['High-rep lat isolation', 'Soft elbows, arc to the thighs'] }
          ]
        }
      ]
    },

    /* ---------------- WEDNESDAY — Legs (machine-based) ---------------- */
    {
      id: 'wed', tabLabel: 'Legs', title: 'Legs', subtitle: 'Machine-based', type: 'training',
      cardio: { kind: 'bike', prescription: 'Easy bike, 15–25 min — low-impact, lean on the bike around leg day.', trackMinutes: true, trackDistance: true },
      warmup: ['Bike 3–5 min easy', 'Bodyweight squats to depth', 'Leg swings'],
      sections: [
        {
          id: 'wed-main', label: 'Main', note: 'If quads are the priority, move the pendulum/hack squat first while fresh.',
          exercises: [
            { id: 'wed-legpress', name: 'Leg Press', scheme: '4 x 10–12', defaultSets: 4,
              targetMuscle: { label: 'Quads + glutes' }, muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              formCues: ['Full controlled range', 'Heavy-option lift'] },
            { id: 'wed-pendulum', name: 'Pendulum Squat', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Quads' }, muscles: { primary: ['quads'], secondary: ['glutes'] },
              formCues: ['Quad focus; do while fresh', 'Hack Squat is an equal substitute'] },
            { id: 'wed-legext', name: 'Leg Extension', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Quads' }, muscles: { primary: ['quads'] },
              formCues: ['Pause and squeeze at the top'] },
            { id: 'wed-legcurl', name: 'Seated Leg Curl', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Hamstrings' }, muscles: { primary: ['hamstrings'] },
              formCues: ['Controlled tempo'] }
          ]
        },
        {
          id: 'wed-acc', label: 'Accessory',
          exercises: [
            { id: 'wed-adduction', name: 'Hip Adduction Machine', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Inner thigh' }, muscles: { primary: ['adductors'] },
              formCues: ['Inner thigh, easy joint load', 'Controlled, no swinging'] },
            { id: 'wed-calf', name: 'Calf Raise', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Calves' }, muscles: { primary: ['calves'] },
              formCues: ['Control the bottom, no deep bounce', 'Full stretch, pause at the top'] }
          ]
        }
      ]
    },

    /* ---------------- THURSDAY — Arms (Biceps + Triceps) ---------------- */
    {
      id: 'thu', tabLabel: 'Arms', title: 'Biceps + Triceps', subtitle: 'Antagonist supersets · put your priority arm first', type: 'training',
      cardio: {
        kind: 'treadmill',
        prescription: 'Treadmill intervals — start Stage 1: 1:30 jog / 2:30 walk × 6. Warm up 3–5 min brisk walk first; short, quick steps. Advance a stage every 1–2 weeks when it feels easy.',
        trackMinutes: true, trackDistance: true
      },
      warmup: ['Band pull-aparts', 'Light cable curls + pushdowns to warm the elbows', 'Arm circles'],
      sections: [
        {
          id: 'thu-ssA', label: 'Superset 1', note: 'biceps then straight into triceps, ~60s rest', superset: true,
          exercises: [
            { id: 'thu-cablecurl', name: 'Cable Biceps Curl', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Biceps' }, muscles: { primary: ['biceps'] },
              formCues: ['Constant tension', 'Elbows pinned'] },
            { id: 'thu-pushdown', name: 'Cable Triceps Pushdown', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Triceps' }, muscles: { primary: ['triceps'] },
              formCues: ['Elbows tucked, squeeze the bottom'] }
          ]
        },
        {
          id: 'thu-ssB', label: 'Superset 2', note: 'biceps then straight into triceps, ~60s rest', superset: true,
          exercises: [
            { id: 'thu-inccurl', name: 'Incline Dumbbell Curl', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Biceps (stretched)' }, muscles: { primary: ['biceps'] },
              formCues: ['Stretched biceps', 'No swinging — strict'] },
            { id: 'thu-tripress', name: 'Machine Triceps Press', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Triceps' }, muscles: { primary: ['triceps'] },
              formCues: ['Full lockout'] }
          ]
        },
        {
          id: 'thu-ssC', label: 'Superset 3', note: 'biceps then straight into triceps, ~60s rest', superset: true,
          exercises: [
            { id: 'thu-hammer', name: 'Cable Hammer Curl', scheme: '3 x 12–20', defaultSets: 3,
              targetMuscle: { label: 'Brachialis / forearm' }, muscles: { primary: ['biceps', 'forearms'] },
              formCues: ['Neutral grip', 'Controlled tempo'] },
            { id: 'thu-rope', name: 'Rope Pushdown', scheme: '3 x 12–20', defaultSets: 3,
              targetMuscle: { label: 'Triceps' }, muscles: { primary: ['triceps'] },
              formCues: ['Spread the rope at the bottom', 'Drop set on the last set optional'] }
          ]
        }
      ]
    },

    /* ---------------- FRIDAY — Chest + Back (2nd hit) + Delts ---------------- */
    {
      id: 'fri', tabLabel: 'Push/Pull', title: 'Chest + Back + Delts', subtitle: 'Second chest & back exposures · posture and pump', type: 'training',
      cardio: { kind: 'bike', prescription: 'Easy bike or elliptical, 15–25 min, conversational.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Light press + light pulldown', 'Arm circles'],
      sections: [
        {
          id: 'fri-chest', label: 'Chest',
          exercises: [
            { id: 'fri-incmachpress', name: 'Incline Machine Press', scheme: '4 x 10–12', defaultSets: 4,
              targetMuscle: { label: 'Upper chest' }, muscles: { primary: ['chest'], secondary: ['front_delts', 'triceps'] },
              formCues: ['Second chest, different angle from Monday', 'No lockout slam'] },
            { id: 'fri-cablefly', name: 'Cable Fly (low to high)', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Chest (squeeze)' }, muscles: { primary: ['chest'] },
              formCues: ['Different angle from Monday', 'Squeeze at the midline'] }
          ]
        },
        {
          id: 'fri-back', label: 'Back',
          exercises: [
            { id: 'fri-ngpull', name: 'Neutral-Grip Lat Pulldown', scheme: '4 x 10–12', defaultSets: 4,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'], secondary: ['biceps'] },
              formCues: ['Second back hit, different grip from Tuesday'] },
            { id: 'fri-row', name: 'Seated Cable Row', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats', 'biceps'] },
              formCues: ['Row to the belly, squeeze the shoulder blades', 'Posture'] }
          ]
        },
        {
          id: 'fri-ssA', label: 'Superset', note: 'alternate, ~60s rest', superset: true,
          exercises: [
            { id: 'fri-facepull', name: 'Face Pull', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Rear delts / posture' }, muscles: { primary: ['rear_delts'], secondary: ['traps'] },
              formCues: ['Pull to forehead, elbows high', 'Posture'] },
            { id: 'fri-lateral', name: 'Lateral Raise', scheme: '3 x 15–20', defaultSets: 3,
              targetMuscle: { label: 'Side delts' }, muscles: { primary: ['side_delts'] },
              formCues: ['Lead with the elbows', 'No swinging'] }
          ]
        },
        {
          id: 'fri-traps', label: 'Traps',
          exercises: [
            { id: 'fri-shrugs', name: 'Cable Shrugs', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Traps' }, muscles: { primary: ['traps'] },
              formCues: ['Pause at the top', 'Straight up'] }
          ]
        }
      ]
    },

    /* ---------------- SATURDAY — Optional / Light ---------------- */
    {
      id: 'sat', tabLabel: 'Light', title: 'Optional / Light', subtitle: 'Recovery, not a grind — pick one', type: 'training',
      cardio: { kind: 'cardio', prescription: 'Option A: 25–40 min easy low-impact cardio (incline walk, bike, or elliptical). Or do the core circuit instead — not both.', trackMinutes: true, trackDistance: true },
      warmup: [],
      sections: [
        {
          id: 'sat-core', label: 'Core circuit', note: '2–3 rounds — optional alternative to the easy cardio',
          exercises: [
            { id: 'sat-plank', name: 'Plank', scheme: '2–3 rounds', defaultSets: 3,
              targetMuscle: { label: 'Core' }, muscles: { primary: ['abs'] }, formCues: ['Brace, ribs down, no sag'] },
            { id: 'sat-deadbug', name: 'Dead Bug', scheme: '2–3 rounds', defaultSets: 3,
              targetMuscle: { label: 'Core' }, muscles: { primary: ['abs'] }, formCues: ['Low back flat, slow opposite arm/leg'] },
            { id: 'sat-kneeraise', name: 'Hanging Knee Raise', scheme: '2–3 rounds', defaultSets: 3,
              targetMuscle: { label: 'Core' }, muscles: { primary: ['abs'] }, formCues: ['Curl the pelvis, no swinging'] },
            { id: 'sat-pallof', name: 'Pallof Press', scheme: '2–3 rounds', defaultSets: 3,
              targetMuscle: { label: 'Core (anti-rotation)' }, muscles: { primary: ['abs'] }, formCues: ['Resist the rotation, press straight out'] }
          ]
        }
      ]
    },

    /* ---------------- SUNDAY — Rest ---------------- */
    {
      id: 'sun', tabLabel: 'Rest', title: 'Rest', subtitle: 'Recovery day', type: 'rest',
      cardio: { kind: 'walk', prescription: 'Optional easy walk.', trackMinutes: true, trackDistance: true },
      warmup: [],
      sections: []
    }
  ]
};

/* === 12-WEEK RAMP (data only — not yet applied by the app) ===========================
   The day lists above are the Block 1 base. Blocks 2 and 3 apply swaps + intensity changes
   on top. Wire this in later: track the current program week → resolve the active block →
   apply that block's swaps + rir/volume. Swap `from` references exercise ids above. */
window.WT_PROGRESSION = {
  model: 'Three 4-week blocks. Block 1 is the base; later blocks apply swaps + intensity changes on top.',
  startDate: null,
  blocks: [
    { block: 1, weeks: '1-4', name: 'Foundation', rir: '2-3', heavyTopSet: false, swaps: [],
      volume: 'base sets as listed',
      notes: 'Learn the movements, establish loads, progress by double progression. If week 4 feels run down, lighten it.' },
    { block: 2, weeks: '5-8', name: 'Build', rir: '1-2', heavyTopSet: false,
      volume: 'Add 1 set to the primary chest & back movements (mon-incdbpress→incline machine, tue-latpull, tue-csrow→cable row, fri-incmachpress, fri-ngpull).',
      swaps: [
        { day: 'mon', from: 'mon-incdbpress', toName: 'Incline Machine Press' },
        { day: 'tue', from: 'tue-csrow',      toName: 'Seated Cable Row (wide grip)' },
        { day: 'wed', from: 'wed-legcurl',    toName: 'Lying Leg Curl' },
        { day: 'thu', from: 'thu-inccurl',    toName: 'Preacher Curl' },
        { day: 'fri', from: 'fri-cablefly',   toName: 'Pec Deck' }
      ],
      notes: 'Same double progression. If fatigue piles up by week 8, deload: halve sets for 4–5 days, keep moving, then resume.' },
    { block: 3, weeks: '9-12', name: 'Sharpen', rir: '1 on top sets', heavyTopSet: true,
      volume: 'Keep the Block 2 added set, and add one heavier top set of 5–8 on a safe main compound (Leg Press, Chest-Supported/Machine Row, or Machine Chest Press).',
      swaps: [
        { day: 'mon', from: 'mon-lateral',     toName: 'Cross-Body Cable Lateral Raise' },
        { day: 'tue', from: 'tue-latpull',     toName: 'Assisted Pull-Up' },
        { day: 'wed', from: 'wed-pendulum',    toName: 'Hack Squat' },
        { day: 'thu', from: 'thu-tripress',    toName: 'Triceps Dip Machine' },
        { day: 'fri', from: 'fri-incmachpress', toName: 'Flat Machine Chest Press' }
      ],
      notes: 'Hardest block. Week 12: ease off (lighter, more RIR) + check-in: progress photos, waist, top numbers on a few key lifts.' }
  ],
  deload: 'If fatigue accumulates (commonly ~week 8), take 4–5 lighter days at ~half volume, then resume. Week 12 doubles as a lighter check-in week.',
  cardioStages: {
    current: 'Stage 1 (1:30 jog / 2:30 walk × 6)',
    goal: 'Grow the jog segments toward jogging 10–15 minutes straight.',
    advanceRule: 'Spend ~1–2 weeks per stage. Advance only when the current stage feels easy. If anything flares, hold or drop back one.',
    stages: [
      { stage: 1, jog: '1:30', walk: '2:30', rounds: '6', startHere: true },
      { stage: 2, jog: '2:00', walk: '2:30', rounds: '5-6' },
      { stage: 3, jog: '2:30', walk: '2:00', rounds: '5-6' },
      { stage: 4, jog: '3:00', walk: '2:00', rounds: '5' },
      { stage: 5, jog: '4:00', walk: '1:30', rounds: '4-5' },
      { stage: 6, jog: '5:00', walk: '1:30', rounds: '4', note: 'then build toward 10–15 min straight' }
    ]
  }
};
