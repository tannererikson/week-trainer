/* Week Trainer — muscle taxonomy + anatomical body-map wiring.
   Canonical muscle vocabulary shared by program.js (per-lift `muscles` tags),
   the Body → Recovery heatmap, and the Targets set goals.

   The figures are real anatomical SVGs (img/front.svg, img/back.svg). Each muscle
   is an unlabeled <path class="st1">; FRONT_MAP / BACK_MAP map those paths (by their
   document order) to muscle keys so the Recovery view can recolour them. A value can
   be an array when one drawn region stands in for more than one key (e.g. the deltoid
   cap covers both front and side delts). null = not a muscle we track (left as-is). */
(function () {
  'use strict';

  const MUSCLES = {
    chest:       { name: 'Chest',          view: 'front', group: 'push' },
    front_delts: { name: 'Front delts',    view: 'front', group: 'push' },
    side_delts:  { name: 'Side delts',     view: 'front', group: 'push' },
    triceps:     { name: 'Triceps',        view: 'back',  group: 'push' },
    rear_delts:  { name: 'Rear delts',     view: 'back',  group: 'pull' },
    traps:       { name: 'Traps',          view: 'back',  group: 'pull' },
    lats:        { name: 'Lats',           view: 'back',  group: 'pull' },
    mid_back:    { name: 'Mid back',       view: 'back',  group: 'pull' },
    lower_back:  { name: 'Lower back',     view: 'back',  group: 'pull' },
    biceps:      { name: 'Biceps',         view: 'front', group: 'pull' },
    forearms:    { name: 'Forearms',       view: 'both',  group: 'pull' },
    abs:         { name: 'Abs',            view: 'front', group: 'core' },
    quads:       { name: 'Quads',          view: 'front', group: 'legs' },
    hamstrings:  { name: 'Hamstrings',     view: 'back',  group: 'legs' },
    glutes:      { name: 'Glutes',         view: 'back',  group: 'legs' },
    calves:      { name: 'Calves',         view: 'both',  group: 'legs' },
    adductors:   { name: 'Adductors',      view: 'front', group: 'legs' }
  };

  const MUSCLE_ORDER = [
    'traps', 'front_delts', 'side_delts', 'rear_delts', 'chest', 'lats', 'mid_back',
    'biceps', 'triceps', 'forearms', 'abs', 'lower_back', 'glutes', 'quads', 'hamstrings', 'adductors', 'calves'
  ];

  const FRONT_URL = 'img/front.svg';
  const BACK_URL = 'img/back.svg';

  // index of <path class="st1"> (document order) -> muscle key(s). Derived from the
  // labeled muscle map; see /tmp tooling. Bilateral muscles repeat the same key.
  const D = ['front_delts', 'side_delts']; // deltoid cap covers both
  const FRONT_MAP = [
    'chest', 'chest', 'chest', D, D, 'chest', 'chest',          // 0-6  pecs + delts
    'biceps', 'biceps', 'biceps', 'biceps',                     // 7-10 upper arms
    'abs', 'abs', 'abs', 'abs', 'abs', 'abs',                   // 11-16 abs/obliques
    'forearms', 'forearms',                                     // 17-18
    'abs', 'abs',                                               // 19-20
    'forearms', 'forearms',                                     // 21-22
    'abs', 'abs', 'abs', 'abs', 'abs', 'abs', 'abs', 'abs',     // 23-30 abs/obliques
    'quads', 'quads', 'adductors', 'adductors', 'quads', 'quads', 'quads', 'quads', // 31-38 thighs
    'calves', 'calves', 'calves', 'calves',                    // 39-42 lower legs
    'chest', 'chest'                                            // 43-44 upper pecs
  ];
  const LM = ['lats', 'mid_back']; // central back covers lats + rhomboids
  const BACK_MAP = [
    'traps', 'traps', 'rear_delts', 'rear_delts', 'traps', 'traps', // 0-5 upper back + rear delts
    'triceps', 'triceps',                                      // 6-7
    LM, LM,                                                    // 8-9 central back
    'triceps', 'triceps',                                      // 10-11
    'forearms', 'forearms', 'forearms', 'forearms',           // 12-15
    'lower_back', 'lower_back',                                // 16-17
    'lats', 'lats',                                            // 18-19 lower lats
    'glutes', 'glutes', 'glutes', 'glutes',                   // 20-23
    'hamstrings', 'hamstrings', 'hamstrings', 'hamstrings',   // 24-27
    'hamstrings', 'hamstrings', 'hamstrings', 'hamstrings',   // 28-31
    'calves', 'calves', 'calves', 'calves', 'calves', 'calves' // 32-37
  ];

  window.WT_MUSCLES = { MUSCLES, MUSCLE_ORDER, FRONT_URL, BACK_URL, FRONT_MAP, BACK_MAP };
})();
