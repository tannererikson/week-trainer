/* Week Trainer — binds a program lift's display name to its canonical entry in
   window.WT_LIBRARY (js/exercise-library.js) so the lift screen can show that
   exercise's demo gif. Only lifts whose OWN name doesn't already resolve to a gif
   need a line here (the resolver falls back to the lift's name otherwise).

   Keyed by the lift's lowercased display name -> canonical library name.
   Add a line whenever you want to bind another lift to a specific demo. */
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
  'reverse pec deck': 'Dumbbell Reverse Fly',
  'rope pushdown': 'Triceps Pushdown - Rope Attachment',
  'seated cable row': 'Cable Seated Row'
};
