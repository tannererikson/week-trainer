/* Week Trainer — seed program (the weekly plan).
   This is the source-of-truth CONFIG. Editing it changes the plan, never past logs.
   Add or swap lifts freely; ids must stay stable + unique to keep logs attached.

   Links are generated at render time (how-to = YouTube search, target = anatomy search).

   muscles: canonical muscle keys (see js/muscles.js MUSCLES) that each lift trains.
     primary   = the lift's main movers (full recovery credit / set credit)
     secondary = assisting muscles (half credit)
   These feed the Body → Recovery heatmap and the Targets set goals. */
window.WT_PROGRAM = {
  meta: {
    name: 'Week Trainer',
    goals: [
      'Build strength',
      'Cardiovascular endurance',
      'Balanced, full-body training',
      'Stay consistent'
    ],
    standingRules: [
      'Every back day includes at least one trap-focused lift.',
      'Leg work stays machine-based.',
      'Every exercise is linked.'
    ],
    deferred: []
  },

  days: [
    /* ---------------- MONDAY ---------------- */
    {
      id: 'mon', tabLabel: 'Back', title: 'Back + Traps', subtitle: 'Pull day, posture focus', type: 'training',
      cardio: {
        kind: 'treadmill',
        prescription: 'Jog/walk probe: walk 5 min, then 1-min jog @ 5.0–5.5 mph / 2-min walk, conversational pace. Build easy minutes before chasing speed.',
        trackMinutes: true, trackDistance: true
      },
      warmup: ['Arm circles + band pull-aparts', 'Cat-cow / thoracic openers', 'Light lat pulldown to feel the lats'],
      sections: [
        {
          id: 'mon-ss1', label: 'Superset 1', note: 'alternate, ~60s rest', superset: true,
          exercises: [
            { id: 'mon-shrugs', name: 'Machine shrugs', scheme: '3 x 10–12 · rest 60s', defaultSets: 3,
              targetMuscle: { label: 'Traps' }, muscles: { primary: ['traps'] }, formCues: ['Shrug straight up, no rolling', 'Pause + squeeze at the top'] },
            { id: 'mon-facepull', name: 'Cable face pulls', scheme: '3 x 10–12 · rest 60s', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'], secondary: ['traps'] }, formCues: ['Pull to forehead, elbows high', 'Externally rotate at the end'] }
          ]
        },
        {
          id: 'mon-ss2', label: 'Superset 2', note: 'alternate, ~60s rest', superset: true,
          exercises: [
            { id: 'mon-latpull', name: 'Lat pulldowns', scheme: '3 x 10–12 · rest 60s', defaultSets: 3,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'], secondary: ['biceps'] }, formCues: ['Drive elbows down to your sides', 'Chest tall, no big lean-back'] },
            { id: 'mon-revpec', name: 'Reverse pec deck', scheme: '3 x 10–12 · rest 60s', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'] }, formCues: ['Lead with the elbows', 'Slow on the way back'] }
          ]
        },
        {
          id: 'mon-squeeze', label: 'Squeeze lift', note: 'high reps, full squeeze',
          exercises: [
            { id: 'mon-row', name: 'Seated cable row', scheme: '4 x 15–20', defaultSets: 4,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats', 'biceps'] }, formCues: ['Row to the belly, squeeze shoulder blades', 'Control the stretch forward'] }
          ]
        }
      ]
    },

    /* ---------------- TUESDAY ---------------- */
    {
      id: 'tue', tabLabel: 'Legs', title: 'Legs', subtitle: 'Machine-based leg day', type: 'training',
      cardio: { kind: 'bike', prescription: 'Easy bike, low-impact. Conversational pace.', trackMinutes: true, trackDistance: true },
      warmup: ['Bike 3–5 min easy', 'Bodyweight box squats to depth', 'Leg swings'],
      sections: [
        {
          id: 'tue-main', label: 'Main',
          exercises: [
            { id: 'tue-legpress', name: 'Leg press', scheme: '3–4 x 10–12', defaultSets: 4,
              targetMuscle: { label: 'Quads + glutes' }, muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] }, formCues: ['Feet higher on the platform', 'No lockout — keep tension, knee-friendly'] },
            { id: 'tue-legext', name: 'Leg extension', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Quads' }, muscles: { primary: ['quads'] }, formCues: ['Pause and squeeze at the top'] },
            { id: 'tue-legcurl', name: 'Leg curl', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Hamstrings' }, muscles: { primary: ['hamstrings'] }, formCues: ['Controlled tempo', 'Full range of motion'] }
          ]
        },
        {
          id: 'tue-acc', label: 'Accessory',
          exercises: [
            { id: 'tue-abad', name: 'Hip abductor / adductor', scheme: '2–3 x 15', defaultSets: 3,
              targetMuscle: { label: 'Glute med / adductors' }, muscles: { primary: ['glutes', 'adductors'] }, formCues: ['Controlled, no swinging'] },
            { id: 'tue-calf', name: 'Calf raises', scheme: '4 x 12–20', defaultSets: 4,
              targetMuscle: { label: 'Calves' }, muscles: { primary: ['calves'] }, formCues: ['Full stretch at the bottom', 'Pause at the top'] }
          ]
        }
      ]
    },

    /* ---------------- WEDNESDAY ---------------- */
    {
      id: 'wed', tabLabel: 'Chest', title: 'Chest', subtitle: 'Push day', type: 'training',
      cardio: { kind: 'bike', prescription: 'Easy bike, low-impact.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Push-ups to feel the chest', 'Light press to warm the shoulders'],
      sections: [
        {
          id: 'wed-main', label: 'Main',
          exercises: [
            { id: 'wed-inclinepress', name: 'Incline machine press', scheme: '3 x 8–12', defaultSets: 3,
              targetMuscle: { label: 'Upper chest' }, muscles: { primary: ['chest'], secondary: ['front_delts', 'triceps'] }, formCues: ['Drive through mid-chest', 'No lockout slam'] },
            { id: 'wed-flatpress', name: 'Flat machine / DB press', scheme: '3 x 8–12', defaultSets: 3,
              targetMuscle: { label: 'Chest' }, muscles: { primary: ['chest'], secondary: ['triceps', 'front_delts'] }, formCues: ['Shoulder blades back + down', 'Stretch at the bottom'] }
          ]
        },
        {
          id: 'wed-acc', label: 'Accessory',
          exercises: [
            { id: 'wed-fly', name: 'Pec deck / cable fly', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Chest (squeeze)' }, muscles: { primary: ['chest'] }, formCues: ['Squeeze at the midline', 'Soft elbows'] }
          ]
        }
      ]
    },

    /* ---------------- THURSDAY ---------------- */
    {
      id: 'thu', tabLabel: 'Arms', title: 'Biceps + Triceps', subtitle: 'Arms focus · a little shoulders', type: 'training',
      cardio: { kind: 'treadmill', prescription: '2-min walk / 1-min jog intervals, 25 min total. Easy and conversational on the walk, relaxed on the jog.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Light cable curls + pushdowns to warm the elbows', 'Arm circles'],
      sections: [
        {
          id: 'thu-bis', label: 'Biceps',
          exercises: [
            { id: 'thu-dbcurl', name: 'Dumbbell curls', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Biceps' }, muscles: { primary: ['biceps'], secondary: ['forearms'] }, formCues: ['No swinging — strict', 'Full squeeze at the top'] },
            { id: 'thu-hammer', name: 'Hammer curls', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Biceps / forearms' }, muscles: { primary: ['biceps', 'forearms'] }, formCues: ['Neutral grip', 'Controlled tempo'] },
            { id: 'thu-cablecurl', name: 'Cable curls', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Biceps' }, muscles: { primary: ['biceps'] }, formCues: ['Constant tension', 'Elbows pinned to your sides'] }
          ]
        },
        {
          id: 'thu-tris', label: 'Triceps',
          exercises: [
            { id: 'thu-tripress', name: 'Triceps Press', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Triceps' }, muscles: { primary: ['triceps'] }, formCues: ['Elbows tucked', 'Full lockout, no shoulder strain'] },
            { id: 'thu-pushdown', name: 'Cable pushdowns', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Triceps' }, muscles: { primary: ['triceps'] }, formCues: ['Elbows pinned', 'Squeeze at the bottom'] },
            { id: 'thu-ohext', name: 'Overhead cable extension', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Triceps (long head)' }, muscles: { primary: ['triceps'] }, formCues: ['Full stretch on the long head', 'Controlled tempo'] }
          ]
        },
        {
          id: 'thu-delts', label: 'Shoulders (light)', note: 'posture-friendly, no heavy overhead',
          exercises: [
            { id: 'thu-lateral', name: 'Lateral raises', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Side delts' }, muscles: { primary: ['side_delts'] }, formCues: ['Lead with the elbows', 'No swinging'] },
            { id: 'thu-revpec', name: 'Reverse pec deck', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'] }, formCues: ['Lead with the elbows', 'Slow eccentric'] }
          ]
        }
      ]
    },

    /* ---------------- FRIDAY ---------------- */
    {
      id: 'fri', tabLabel: 'Back', title: 'Back', subtitle: 'Pull day — width, thickness, posture', type: 'training',
      cardio: { kind: 'walk', prescription: 'Optional easy walk or bike to warm up.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Light lat pulldown to feel the lats'],
      sections: [
        {
          id: 'fri-back', label: 'Back',
          exercises: [
            { id: 'fri-latpulldown', name: 'Lat pulldown (wide)', scheme: '4 x 10-12', defaultSets: 4,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'], secondary: ['biceps'] }, formCues: ['Drive elbows down to your sides', 'Chest tall, no big lean-back'] },
            { id: 'fri-cablerow', name: 'Seated cable row', scheme: '4 x 10-12', defaultSets: 4,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats', 'biceps'] }, formCues: ['Row to the belly, squeeze the shoulder blades'] },
            { id: 'fri-machinerow', name: 'Chest-supported machine row', scheme: '3 x 10-12', defaultSets: 3,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats'] }, formCues: ['Pull with the elbows, not the hands'] },
            { id: 'fri-strawpull', name: 'Straight-arm cable pulldown', scheme: '3 x 12-15', defaultSets: 3,
              targetMuscle: { label: 'Lats' }, muscles: { primary: ['lats'] }, formCues: ['Arms long, big stretch at the top'] },
            { id: 'fri-shrugs', name: 'Machine shrugs', scheme: '3 x 12-15', defaultSets: 3,
              targetMuscle: { label: 'Traps' }, muscles: { primary: ['traps'] }, formCues: ['Straight up, pause + squeeze at the top'] },
            { id: 'fri-facepull', name: 'Cable face pulls', scheme: '3 x 15-20', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'], secondary: ['traps'] }, formCues: ['Pull to the forehead, elbows high', 'Light + controlled'] },
            { id: 'fri-revpec', name: 'Reverse pec deck', scheme: '3 x 15', defaultSets: 3,
              targetMuscle: { label: 'Rear delts' }, muscles: { primary: ['rear_delts'] }, formCues: ['Lead with the elbows', 'Slow on the way back'] }
          ]
        }
      ]
    },

    /* ---------------- SATURDAY ---------------- */
    {
      id: 'sat', tabLabel: 'Upper', title: 'Upper (optional)', subtitle: 'Optional full upper', type: 'training',
      cardio: { kind: 'treadmill', prescription: 'Jog/walk intervals: 1-min jog @ 5.0–5.5 mph / 2-min walk.', trackMinutes: true, trackDistance: true },
      warmup: ['Band pull-aparts', 'Light press + light pulldown'],
      sections: [
        {
          id: 'sat-push', label: 'Push',
          exercises: [
            { id: 'sat-press', name: 'Machine chest press', scheme: '3 x 10–12', defaultSets: 3,
              targetMuscle: { label: 'Chest' }, muscles: { primary: ['chest'], secondary: ['triceps', 'front_delts'] }, formCues: ['Controlled, full range'] }
          ]
        },
        {
          id: 'sat-pull', label: 'Pull',
          exercises: [
            { id: 'sat-row', name: 'Seated cable row', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Mid back' }, muscles: { primary: ['mid_back'], secondary: ['lats', 'biceps'] }, formCues: ['Squeeze shoulder blades'] },
            { id: 'sat-shrugs', name: 'Machine shrugs', scheme: '3 x 12–15', defaultSets: 3,
              targetMuscle: { label: 'Traps' }, muscles: { primary: ['traps'] }, formCues: ['Straight up, pause at the top'] }
          ]
        }
      ]
    },

    /* ---------------- SUNDAY ---------------- */
    {
      id: 'sun', tabLabel: 'Rest', title: 'Rest', subtitle: 'Recovery day', type: 'rest',
      cardio: { kind: 'walk', prescription: 'Optional easy walk.', trackMinutes: true, trackDistance: true },
      warmup: [],
      sections: []
    }
  ]
};
