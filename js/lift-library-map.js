/* Week Trainer — binds a program lift's display name to its canonical entry in
   window.WT_LIBRARY (js/exercise-library.js) so the lift screen can show that
   exercise's demo gif. Only lifts whose OWN name doesn't already resolve to a gif
   need a line here (the resolver falls back to the lift's name otherwise).

   Keyed by the lift's lowercased display name -> canonical library name.
   Add a line whenever you want to bind another lift to a specific demo. */
// One-time rename of program lifts -> their canonical database names (lowercased
// old name -> new name). Applied at load by a flag-gated migration in app.js so it
// also reaches a program that's already saved on the phone. Keep in sync with the
// seed names in program.js.
window.WT_LIFT_RENAME = {
  'incline machine press': 'Leverage Incline Chest Press',
  'cable fly (low to high)': 'Low Cable Crossover',
  'cable fly': 'Cable Crossover',
  'cable hammer curl': 'Cable Hammer Curl (With Rope)',
  'cable triceps pushdown': 'Cable Triceps Pushdown (V-Bar)',
  'calf raise': 'Lever Standing Calf Raise',
  'chest-supported machine row': 'Lever Seated Row',
  'dumbbell shrugs': 'Dumbbell Shrug',
  'hanging knee raise': 'Hanging Leg Raise',
  'hip adduction machine': 'Lever Seated Hip Adduction',
  'neutral-grip lat pulldown': 'Close-Grip Front Lat Pulldown',
  'lat pulldown': 'Wide-Grip Lat Pulldown',
  'lateral raise': 'Dumbbell Lateral Raise',
  'leg extension': 'Lever Leg Extension',
  'machine triceps press': 'Machine Triceps Extension',
  'pendulum squat': 'Hack Squat',
  'rope pushdown': 'Triceps Pushdown - Rope Attachment',
  'seated cable row': 'Cable Seated Row',
  'cable biceps curl': 'Standing Biceps Cable Curl'
};

window.WT_LIFT_LIB = {
  'cable biceps curl': 'Standing Biceps Cable Curl',
  'cable fly': 'Cable Crossover',
  'cable fly (low to high)': 'Low Cable Crossover',
  'cable hammer curl': 'Cable Hammer Curl (With Rope)',
  'cable triceps pushdown': 'Cable Triceps Pushdown (V-Bar)',
  'calf raise': 'Lever Standing Calf Raise',
  'chest-supported machine row': 'Lever Seated Row',
  'dumbbell shrugs': 'Dumbbell Shrug',
  'hanging knee raise': 'Hanging Leg Raise',
  'hip adduction machine': 'Lever Seated Hip Adduction',
  'incline machine press': 'Leverage Incline Chest Press',  // Hammer Strength iso incline
  'lat pulldown': 'Wide-Grip Lat Pulldown',
  'lateral raise': 'Dumbbell Lateral Raise',
  'leg extension': 'Lever Leg Extension',
  'machine triceps press': 'Machine Triceps Extension',
  'neutral-grip lat pulldown': 'Close-Grip Front Lat Pulldown',
  'pendulum squat': 'Hack squat',  // no pendulum-squat demo in the DB; hack squat machine is closest

  'reverse pec deck': 'Dumbbell Reverse Fly',
  'rope pushdown': 'Triceps Pushdown - Rope Attachment',
  'seated cable row': 'Cable Seated Row'
};
