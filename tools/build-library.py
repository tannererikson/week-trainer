#!/usr/bin/env python3
"""Build js/exercise-library.js (window.WT_LIBRARY) by merging free exercise datasets.

Run from a working dir holding the two source files, then copy the output:
  curl -sL https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json -o feb.json
  curl -sL https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json -o edb.json
  python3 build-library.py && cp exercise-library.js ../js/exercise-library.js

Sources (both public domain / open source, no API key):
  feb.json - yuhonas/free-exercise-db  (~873; per-exercise 'images' = jpg paths under
             https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/)
  edb.json - ExerciseDB open source    (1500; per-exercise 'gifUrl' = animated demo gif)
  exercise-pool.md - Tanner's 77 curated gym lifts (no images), flagged mine=True.

Each record carries `img` (ExerciseDB animated gif, else free-exercise-db photo URL;
gym-pool lifts have none). The picker renders these as row thumbnails — they load
online-only (external hosts, not service-worker cached). Bundle is ~560KB.
"""
import json, re

# --- source muscle vocab -> Tanner's 17 canonical keys (js/muscles.js) ---
M = {
    # abs / core
    'abdominals':'abs','abs':'abs','core':'abs','lower abs':'abs','obliques':'abs',
    'serratus anterior':'abs','hip flexors':'abs',
    # chest
    'chest':'chest','pectorals':'chest','upper chest':'chest',
    # delts
    'shoulders':['front_delts','side_delts'],'deltoids':['front_delts','side_delts'],
    'delts':['front_delts','side_delts'],
    'rear deltoids':'rear_delts','rotator cuff':'rear_delts',
    # arms
    'biceps':'biceps','brachialis':'biceps',
    'triceps':'triceps',
    'forearms':'forearms','grip muscles':'forearms','wrist extensors':'forearms',
    'wrist flexors':'forearms','wrists':'forearms','hands':'forearms',
    # back
    'lats':'lats','latissimus dorsi':'lats',
    'middle back':'mid_back','upper back':'mid_back','back':'mid_back','rhomboids':'mid_back',
    'lower back':'lower_back','spine':'lower_back',
    'traps':'traps','trapezius':'traps','neck':'traps',
    'levator scapulae':'traps','sternocleidomastoid':'traps',
    # legs
    'quadriceps':'quads','quads':'quads',
    'hamstrings':'hamstrings',
    'glutes':'glutes','abductors':'glutes',
    'adductors':'adductors','inner thighs':'adductors','groin':'adductors',
    'calves':'calves','soleus':'calves','shins':'calves','ankle stabilizers':'calves',
    'ankles':'calves','feet':'calves',
    # not tracked -> drop (cardio etc.)
    'cardiovascular system':None,
}
def mm(names):
    out=[]
    for n in names or []:
        v=M.get(n.strip().lower(),'__skip__')
        if v=='__skip__' or v is None: continue
        for k in (v if isinstance(v,list) else [v]):
            if k not in out: out.append(k)
    return out

# --- equipment normalization ---
EQ = {
    'barbell':'barbell','olympic barbell':'barbell','trap bar':'barbell',
    'ez barbell':'ez bar','e-z curl bar':'ez bar',
    'dumbbell':'dumbbell',
    'kettlebell':'kettlebell','kettlebells':'kettlebell',
    'cable':'cable',
    'machine':'machine','leverage machine':'machine','hammer':'machine','assisted':'machine',
    'smith machine':'smith machine',
    'body weight':'bodyweight','body only':'bodyweight','weighted':'bodyweight',
    'band':'band','bands':'band','resistance band':'band',
    'medicine ball':'medicine ball',
    'exercise ball':'ball','stability ball':'ball','bosu ball':'ball',
    'foam roll':'other','roller':'other','wheel roller':'other','rope':'other',
    'tire':'other','sled machine':'other','other':'other',
    'elliptical machine':'cardio machine','stationary bike':'cardio machine',
    'skierg machine':'cardio machine','stepmill machine':'cardio machine',
    'upper body ergometer':'cardio machine',
}
def eq(name):
    return EQ.get((name or '').strip().lower(),'other')

def norm_name(n):
    return re.sub(r'\s+',' ',n.strip().lower())

lib={}  # norm name -> record (first source wins; feb loaded first = curated equipment)

def add(rec):
    k=norm_name(rec['name'])
    if not k: return
    if k in lib:
        # merge: keep existing, but backfill an image if missing
        if not lib[k].get('img') and rec.get('img'): lib[k]['img']=rec['img']
        # union muscles if existing had none
        if not lib[k]['primary'] and rec['primary']: lib[k]['primary']=rec['primary']
        return
    lib[k]=rec

# ---- Tanner's curated gym pool (exercise-pool.md) — loaded FIRST so his canonical
#      names win dedup and get flagged mine=True for the "my gym" filter ----
POOL='/Users/tannererikson/week-trainer-public/exercise-pool.md'
KEYS={'chest','front_delts','side_delts','triceps','rear_delts','traps','lats','mid_back',
      'lower_back','biceps','forearms','abs','quads','hamstrings','glutes','calves','adductors'}
def eq_pool(s):
    s=s.lower()
    # earliest-listed option wins (e.g. "barbell or Smith" -> barbell); else it's a machine
    cands=[(s.find(k),v) for k,v in [('smith','smith machine'),('e-z','ez bar'),('ez ','ez bar'),
            ('barbell','barbell'),('dumbbell','dumbbell'),('kettlebell','kettlebell'),
            ('cable','cable'),('bodyweight','bodyweight')] if k in s]
    return min(cands)[1] if cands else 'machine'
def musc_pool(s):
    s=re.split(r'⚠',s)[0]                # drop personal-only caution notes (public build)
    s=re.sub(r'\(.*?\)','',s)            # drop parentheticals like "(also great for posture)"
    parts=s.split('/')
    grab=lambda t:[m.strip() for m in t.replace('&',',').split(',') if m.strip() in KEYS]
    pri=grab(parts[0])
    sec=[m for m in (grab(parts[1]) if len(parts)>1 else []) if m not in pri]
    return pri,sec
n_pool=0
for line in open(POOL):
    line=line.rstrip()
    if not line.startswith('- '): continue
    segs=[x.strip() for x in line[2:].split(' — ')]
    if len(segs)<3: continue
    name,equip,musc=segs[0],segs[1],' — '.join(segs[2:])
    pri,sec=musc_pool(musc)
    add({'name':name,'equipment':eq_pool(equip),'category':'strength',
         'primary':pri,'secondary':sec,'mine':True,'source':'gym-pool'})
    n_pool+=1
print('gym-pool lifts parsed:',n_pool)

# ---- feb (curated, Tanner's equipment vocab) ----
for e in json.load(open('feb.json')):
    pri=mm(e.get('primaryMuscles')); sec=[m for m in mm(e.get('secondaryMuscles')) if m not in pri]
    add({
        'name':e['name'].strip(),
        'equipment':eq(e.get('equipment')),
        'category':e.get('category') or 'strength',
        'primary':pri,'secondary':sec,
        'img':('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'+e['images'][0] if e.get('images') else None),
        'source':'free-exercise-db',
    })

# ---- edb (adds 1500 + gifs) ----
for e in json.load(open('edb.json')):
    pri=mm(e.get('targetMuscles')); sec=[m for m in mm(e.get('secondaryMuscles')) if m not in pri]
    eqs=e.get('equipments') or []
    cat='cardio' if (eq(eqs[0]) if eqs else '')=='cardio machine' or not pri else 'strength'
    add({
        'name':e['name'].strip(),
        'equipment':eq(eqs[0] if eqs else None),
        'category':cat,
        'primary':pri,'secondary':sec,
        'img':e.get('gifUrl'),  # animated demo gif (online-only thumbnail)
        'source':'exercisedb',
    })

recs=sorted(lib.values(), key=lambda r:r['name'].lower())
# title-case names from feb stay; edb names are lowercase -> title them for display
for r in recs:
    if r['source']=='exercisedb' and r['name']==r['name'].lower():
        r['name']=r['name'].title()

# stats
from collections import Counter
print('TOTAL unique lifts:',len(recs))
print('by source:',Counter(r['source'] for r in recs))
print('by equipment:',dict(sorted(Counter(r['equipment'] for r in recs).items(),key=lambda x:-x[1])))
print('no-muscle (untagged):',sum(1 for r in recs if not r['primary']))
print('machine/barbell/dumbbell/cable lifts:',
      sum(1 for r in recs if r['equipment'] in('machine','smith machine','barbell','dumbbell','cable','ez bar')))

out='/* Week Trainer exercise library — merged from free-exercise-db (CC0) + ExerciseDB (open source).\n'
out+='   Built by scratchpad/merge.py. Muscle keys match js/muscles.js. */\n'
out+='window.WT_LIBRARY = '+json.dumps(recs,ensure_ascii=False,separators=(',',':'))+';\n'
out+='window.WT_LIBRARY_BY_NAME = (function(){var m={};(window.WT_LIBRARY||[]).forEach(function(r){m[r.name.toLowerCase()]=r;});return m;})();\n'
open('exercise-library.js','w').write(out)
print('wrote exercise-library.js', len(out),'bytes')
PY = None
