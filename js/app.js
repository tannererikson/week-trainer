/* Week Trainer — UI + logic.
   Vanilla JS, no framework. Reads the seed program (window.WT_PROGRAM) and persists
   per-date session logs through window.WTStore (IndexedDB). */
(function () {
  'use strict';

  // ---------- tiny DOM helper ----------
  function h(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach((kid) => {
      if (kid == null || kid === false) return;
      node.appendChild((typeof kid === 'string' || typeof kid === 'number') ? document.createTextNode(String(kid)) : kid);
    });
    return node;
  }
  const $ = (sel) => document.querySelector(sel);

  // ---------- date helpers ----------
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; }
  function addDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function dateKeyOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseKey(k) { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function niceDate(k) { const d = parseKey(k); return WD[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function shortDate(k) { const d = parseKey(k); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- links (generated, never stored) ----------
  const howToLink = (name) => 'https://www.google.com/search?q=' + encodeURIComponent('how to do ' + name + ' YouTube');
  const muscleLink = (label) => 'https://www.google.com/search?q=' + encodeURIComponent('where is the ' + label + ' muscle anatomy');

  // ---------- body metrics + recovery config ----------
  // Metrics you log by date.
  const ENTERED = {
    weight:    { name: 'Weight', unit: 'lb', step: '0.1' },
    bodyfat:   { name: 'Body Fat Percentage', short: 'Body Fat', unit: '%', step: '0.1' },
    neck:      { name: 'Neck', unit: 'in', step: '0.1' },
    shoulders: { name: 'Shoulders', unit: 'in', step: '0.1' },
    chest:     { name: 'Chest/Bust', short: 'Chest', unit: 'in', step: '0.1' },
    waist:     { name: 'Waist', unit: 'in', step: '0.1' },
    hip:       { name: 'Hip', unit: 'in', step: '0.1' },
    upper_arm: { name: 'Upper Arm', unit: 'in', step: '0.1' },
    lower_arm: { name: 'Lower Arm', unit: 'in', step: '0.1' },
    thigh:     { name: 'Thigh', unit: 'in', step: '0.1' },
    calf:      { name: 'Calf', unit: 'in', step: '0.1' }
  };
  // Metrics derived from your entered values + profile (height/age/sex).
  const COMPUTED = {
    fat_mass:        { name: 'Fat Mass', unit: 'lb', fn: (e) => (e.weight != null && e.bodyfat != null) ? e.weight * e.bodyfat / 100 : null },
    lean_mass:       { name: 'Lean Mass', unit: 'lb', fn: (e) => (e.weight != null && e.bodyfat != null) ? e.weight * (1 - e.bodyfat / 100) : null },
    bmi:             { name: 'Body Mass Index', short: 'BMI', unit: '', fn: (e, p) => (e.weight != null && p.heightIn) ? 703 * e.weight / (p.heightIn * p.heightIn) : null },
    lean_mass_index: { name: 'Lean Mass Index', short: 'LMI', unit: '', fn: (e, p) => { if (e.weight == null || e.bodyfat == null || !p.heightIn) return null; const leanKg = e.weight * (1 - e.bodyfat / 100) * 0.453592, hM = p.heightIn * 0.0254; return leanKg / (hM * hM); } },
    bmr:             { name: 'Metabolic Rate', unit: 'kcal', fn: (e, p) => { if (e.weight == null || !p.heightIn || !p.age) return null; const kg = e.weight * 0.453592, cm = p.heightIn * 2.54; return 10 * kg + 6.25 * cm - 5 * p.age + (p.sex === 'female' ? -161 : 5); } }
  };
  // Results screen structure (matches Fitbod's grouped composition + measurement lists).
  const RESULTS_LAYOUT = [
    { title: 'Composition', groups: [
      { title: 'Body Mass', keys: ['fat_mass', 'lean_mass', 'weight'] },
      { title: 'Indices', keys: ['bodyfat', 'bmi', 'lean_mass_index'] },
      { title: 'Metabolism', keys: ['bmr'] }
    ] },
    { title: 'Measurements', groups: [
      { title: 'Arms', keys: ['upper_arm', 'lower_arm'] },
      { title: 'Legs', keys: ['thigh', 'calf'] },
      { title: 'Torso', keys: ['chest', 'hip', 'waist', 'neck', 'shoulders'] }
    ] }
  ];
  const metricMeta = (k) => ENTERED[k] || COMPUTED[k];
  const isEntered = (k) => !!ENTERED[k];

  const RECOVERY_DAYS = 3; // full recovery window: trained → fully fresh after this many days
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function daysBetween(aKey, bKey) { return Math.round((parseKey(bKey) - parseKey(aKey)) / 86400000); }
  // body heatmap ramp: muscle gray (fresh) → red (just trained / fatigued)
  function bodyHeat(f) {
    const gray = [124, 133, 151], red = [232, 69, 94];
    const c = gray.map((g, i) => Math.round(g + (red[i] - g) * f));
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  // exercise id -> [muscle keys] (primary + secondary), built once from the program.
  let _exMuscleIndex = null;
  function exMuscleIndex() {
    if (_exMuscleIndex) return _exMuscleIndex;
    const idx = {};
    state.program.days.forEach((d) => (d.sections || []).forEach((s) => (s.exercises || []).forEach((ex) => {
      const m = ex.muscles || {};
      idx[ex.id] = (m.primary || []).concat(m.secondary || []);
    })));
    _exMuscleIndex = idx;
    return idx;
  }
  // muscle key -> [{ name, role }] of program lifts that train it (dedup by lift name).
  function liftsForMuscle(key) {
    const out = [], seen = {};
    state.program.days.forEach((d) => (d.sections || []).forEach((s) => (s.exercises || []).forEach((ex) => {
      const m = ex.muscles || {};
      const role = (m.primary || []).indexOf(key) !== -1 ? 'primary'
        : (m.secondary || []).indexOf(key) !== -1 ? 'secondary' : null;
      if (!role || seen[ex.name]) return;
      seen[ex.name] = 1; out.push({ name: ex.name, role });
    })));
    return out;
  }
  // exercise id -> { primary:[], secondary:[] } (roles kept separate, for set-credit math).
  let _exRoles = null;
  function exRoles() {
    if (_exRoles) return _exRoles;
    const idx = {};
    state.program.days.forEach((d) => (d.sections || []).forEach((s) => (s.exercises || []).forEach((ex) => {
      const m = ex.muscles || {};
      idx[ex.id] = { primary: m.primary || [], secondary: m.secondary || [] };
    })));
    _exRoles = idx;
    return idx;
  }

  // ---------- Targets config ----------
  // Default weekly set goal per muscle (editable; overrides saved in state.targets).
  const DEFAULT_TARGETS = {
    chest: 12, front_delts: 8, side_delts: 8, triceps: 10,
    lats: 10, traps: 8, rear_delts: 8, mid_back: 8, lower_back: 4, biceps: 10, forearms: 4,
    quads: 12, hamstrings: 10, glutes: 10, calves: 8, adductors: 4
  };
  const TARGET_GROUPS = [
    { key: 'push', name: 'Push Muscles' },
    { key: 'pull', name: 'Pull Muscles' },
    { key: 'legs', name: 'Leg Muscles' }
  ];
  const effectiveTarget = (m) => (state.targets && state.targets[m] != null) ? state.targets[m] : (DEFAULT_TARGETS[m] || 0);
  const fmtSets = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

  // ---------- state ----------
  const state = {
    program: null,
    weekStart: startOfWeek(new Date()),
    activeDayId: null,
    log: null,
    dateKey: null,
    activeExIds: [],
    saveTimer: null,
    config: {},
    body: { entries: {} },
    bodyTab: 'recovery',
    recoveryView: 'front',
    targets: {},
    targetGroupOpen: 'push'
  };

  const dayIndex = (id) => state.program.days.findIndex((d) => d.id === id);
  const currentDay = () => state.program.days.find((d) => d.id === state.activeDayId);
  function sectionById(id) {
    if (id === 'custom') return { id: 'custom', label: 'Added lifts', exercises: state.log.customExercises };
    return currentDay().sections.find((s) => s.id === id);
  }

  // ---------- session log handling ----------
  function newSession(dateKey, dayId) {
    return { dateKey, dayId, exercises: {}, customExercises: [], order: {}, warmupChecks: {}, cardio: { minutes: '', seconds: '', distance: '', done: false }, sessionNotes: '' };
  }
  function newExLog(ex) {
    const n = Math.max(1, ex.defaultSets || 1);
    return { sets: Array.from({ length: n }, () => ({ weight: '', reps: '', done: false })), note: '' };
  }
  function ensureExLog(ex) {
    const log = state.log;
    let e = log.exercises[ex.id];
    if (!e) { e = newExLog(ex); log.exercises[ex.id] = e; return e; }
    if (!Array.isArray(e.sets) || !e.sets.length) e.sets = newExLog(ex).sets;
    e.sets.forEach((s) => { if (typeof s.done !== 'boolean') s.done = false; });
    if (typeof e.note !== 'string') e.note = '';
    return e;
  }

  function orderedExercises(section) {
    const base = section.exercises || [];
    const baseIds = base.map((e) => e.id);
    const saved = state.log.order[section.id];
    let ids = saved ? saved.filter((id) => baseIds.indexOf(id) !== -1) : baseIds.slice();
    baseIds.forEach((id) => { if (ids.indexOf(id) === -1) ids.push(id); });
    return ids.map((id) => base.find((e) => e.id === id)).filter(Boolean);
  }

  function save() {
    clearTimeout(state.saveTimer);
    const log = state.log, dateKey = state.dateKey;
    state.saveTimer = setTimeout(() => {
      WTStore.setLog(dateKey, log).then(() => toast('Saved')).catch(() => toast('Save failed'));
    }, 500);
  }

  // ---------- volume ----------
  function calcVolume() {
    let v = 0;
    state.activeExIds.forEach((id) => {
      const e = state.log.exercises[id];
      if (!e) return;
      e.sets.forEach((s) => { const w = parseFloat(s.weight), r = parseFloat(s.reps); if (!isNaN(w) && !isNaN(r)) v += w * r; });
    });
    return v;
  }
  function updateVolume() { $('#volValue').textContent = calcVolume().toLocaleString() + ' lb'; }

  // ---------- rest countdown timer ----------
  const REST_OPTIONS = [30, 45, 60, 75, 90, 105, 120, 150, 180];
  let restInterval = null;
  let audioCtx = null;

  function restSecFor(exId) {
    const c = state.config || {};
    if (c.restByEx && c.restByEx[exId] != null) return c.restByEx[exId];
    return (c.defaultRestSec != null) ? c.defaultRestSec : 60;
  }

  function ensureAudio() {
    try {
      if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  }
  function beep() {
    if (!audioCtx) return;
    try {
      const t = audioCtx.currentTime;
      [0, 0.2].forEach((off) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.exponentialRampToValueAtTime(0.3, t + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.16);
        o.start(t + off); o.stop(t + off + 0.18);
      });
    } catch (e) {}
  }
  function buzz() { if (navigator.vibrate) try { navigator.vibrate([200, 90, 200]); } catch (e) {} }

  function startRest(ex) {
    if (state.config.restEnabled === false) return;
    ensureAudio(); // resume audio under the tap gesture so the end-beep can fire
    const total = restSecFor(ex.id);
    state.rest = { exId: ex.id, total, endsAt: Date.now() + total * 1000, paused: false, remainMs: total * 1000, done: false, dismissTimer: null };
    $('#restBar').classList.remove('done');
    $('#restLabel').textContent = 'Rest';
    $('#restPause').innerHTML = '&#10073;&#10073;';
    $('#restBar').hidden = false;
    document.body.classList.add('resting'); // pads the lift body so sets clear the docked bar
    clearInterval(restInterval);
    restInterval = setInterval(tickRest, 200);
    tickRest();
  }
  function tickRest() {
    const r = state.rest; if (!r) return;
    let remainMs = r.paused ? r.remainMs : (r.endsAt - Date.now());
    if (!r.paused && remainMs <= 0 && !r.done) { r.done = true; remainMs = 0; onRestDone(); }
    $('#restTime').textContent = fmtClock(Math.max(0, remainMs / 1000));
  }
  function clearDismiss() {
    const r = state.rest; if (r && r.dismissTimer) { clearTimeout(r.dismissTimer); r.dismissTimer = null; }
    $('#restBar').classList.remove('done');
  }
  function adjustRest(deltaSec) {
    const r = state.rest; if (!r) return;
    clearDismiss();
    if (r.paused) r.remainMs = Math.max(0, r.remainMs + deltaSec * 1000);
    else { r.endsAt += deltaSec * 1000; if (r.endsAt < Date.now()) r.endsAt = Date.now(); }
    if (deltaSec > 0) r.done = false;
    tickRest();
  }
  function togglePauseRest() {
    const r = state.rest; if (!r) return;
    clearDismiss();
    if (r.paused) { r.endsAt = Date.now() + r.remainMs; r.paused = false; r.done = false; }
    else { r.remainMs = Math.max(0, r.endsAt - Date.now()); r.paused = true; }
    $('#restPause').innerHTML = r.paused ? '&#9654;' : '&#10073;&#10073;';
    tickRest();
  }
  function dismissRest() {
    if (state.rest && state.rest.dismissTimer) clearTimeout(state.rest.dismissTimer);
    state.rest = null;
    clearInterval(restInterval); restInterval = null;
    $('#restBar').hidden = true;
    $('#restBar').classList.remove('done');
    document.body.classList.remove('resting');
  }
  function onRestDone() {
    buzz(); beep();
    $('#restBar').classList.add('done');
    $('#restLabel').textContent = 'Done';
    state.rest.dismissTimer = setTimeout(() => { dismissRest(); }, 2500);
  }

  // rest-length picker
  function openRestPicker(ex) {
    state.restPickerExId = ex.id;
    $('#restEnabled').checked = state.config.restEnabled !== false;
    $('#restPickerFor').textContent = 'Rest after each set. Applies to every lift.';
    renderRestOptions();
    $('#restSheet').hidden = false;
  }
  function renderRestOptions() {
    const cur = restSecFor(state.restPickerExId);
    const box = $('#restOptions'); box.innerHTML = '';
    const enabled = state.config.restEnabled !== false;
    REST_OPTIONS.forEach((sec) => {
      box.appendChild(h('button', {
        class: 'rest-opt' + (enabled && sec === cur ? ' on' : ''),
        onclick: () => {
          // one rest length for the whole workout — picking here becomes the default for every lift
          state.config.defaultRestSec = sec;
          state.config.restByEx = {};
          if (state.config.restEnabled === false) { state.config.restEnabled = true; $('#restEnabled').checked = true; }
          WTStore.setConfig(state.config);
          renderRestOptions();
          refreshLiftDetail();
        }
      }, fmtClock(sec)));
    });
  }

  // ---------- custom numeric keypad (replaces the iOS keyboard for set entry) ----------
  // kp = { input, set, field ('weight'|'reps'), repsInput, complete } while a box is active.
  let kp = null;
  function openKeypad(ctx) {
    kp = ctx;
    document.querySelectorAll('.setbox.kp-active').forEach((el) => el.classList.remove('kp-active'));
    ctx.input.classList.add('kp-active');
    // on weight we offer "Next" (jump to reps); on reps the big button is "Done"
    $('#kpAction').textContent = (ctx.field === 'weight' && ctx.repsInput) ? 'Next' : 'Done';
    $('#kpDot').classList.toggle('disabled', ctx.field !== 'weight'); // decimals only make sense on weight
    $('#keypad').hidden = false;
    document.body.classList.add('keypadding');
    // lift the active row up so it clears the keypad (centering would still land behind it)
    requestAnimationFrame(() => {
      const lb = $('#liftBody'), pad = $('#keypad');
      if (!lb || !pad) return;
      const keypadTop = window.innerHeight - pad.offsetHeight;
      const delta = ctx.input.getBoundingClientRect().bottom - (keypadTop - 16);
      if (delta > 0) lb.scrollTop += delta; // instant, so there's no visible scroll/zoom motion
    });
  }
  function closeKeypad() {
    if (kp && kp.input) kp.input.classList.remove('kp-active');
    kp = null;
    $('#keypad').hidden = true;
    document.body.classList.remove('keypadding');
  }
  function keypadPress(key) {
    if (!kp) return;
    const inp = kp.input;
    let v = inp.value;
    if (key === 'back') v = v.slice(0, -1);
    else if (key === '.') { if (kp.field === 'weight' && v.indexOf('.') === -1) v += (v === '' ? '0.' : '.'); }
    else v += key;
    inp.value = v;
    kp.set[kp.field] = v;
    save(); updateVolume();
  }
  function keypadAction() {
    if (!kp) return;
    if (kp.field === 'weight' && kp.repsInput) { // "Next" → hop to the reps box
      openKeypad({ input: kp.repsInput, set: kp.set, field: 'reps', repsInput: null, complete: kp.complete });
      return;
    }
    const complete = kp.complete; // "Done" → close, then log the set + start rest
    closeKeypad();
    if (complete) complete();
  }

  // ---------- note modal ----------
  function openNoteModal(ex) {
    state.noteEditExId = ex.id;
    const e = ensureExLog(ex);
    $('#noteTitle').textContent = e.note ? 'Edit Note' : 'Add Note';
    $('#noteInput').value = e.note || '';
    $('#noteModal').hidden = false;
    setTimeout(() => $('#noteInput').focus(), 50);
  }
  function closeNoteModal() { $('#noteModal').hidden = true; state.noteEditExId = null; }
  function saveNote() {
    const id = state.noteEditExId;
    if (!id) { closeNoteModal(); return; }
    const e = state.log.exercises[id];
    if (e) {
      e.note = $('#noteInput').value.trim();
      save();
      const card = document.querySelector('[data-ex="' + id + '"]');
      const btn = card && card.querySelector('.note-toggle');
      if (btn) { btn.classList.toggle('has-note', !!e.note); btn.textContent = e.note ? 'Note ●' : '+ Note'; }
      toast(e.note ? 'Note saved' : 'Note cleared');
    }
    closeNoteModal();
  }

  // ---------- history & trends ----------
  // Resolve a logged exercise id to its display name (program slot, else custom name in that log).
  function exNameById(exId) {
    for (const day of state.program.days) {
      for (const sec of (day.sections || [])) {
        const f = (sec.exercises || []).find((e) => e.id === exId);
        if (f) return f.name;
      }
    }
    return null;
  }
  // Epley estimated 1-rep-max, best across the day's sets.
  function bestOneRm(sets) {
    let best = 0;
    sets.forEach((s) => { const v = s.weight * (1 + s.reps / 30); if (v > best) best = v; });
    return best;
  }
  // Every past session for a lift, matched by name across all dates. Newest first.
  async function gatherHistory(targetName) {
    const want = targetName.trim().toLowerCase();
    const all = await WTStore.allLogs();
    const out = [];
    Object.keys(all).forEach((k) => {
      const log = all[k];
      const dateKey = log.dateKey || k.replace(/^log:/, '');
      const customNames = {};
      (log.customExercises || []).forEach((c) => { customNames[c.id] = c.name; });
      Object.keys(log.exercises || {}).forEach((exId) => {
        const name = customNames[exId] || exNameById(exId);
        if (!name || name.trim().toLowerCase() !== want) return;
        const sets = (log.exercises[exId].sets || [])
          .map((s) => ({ weight: parseFloat(s.weight), reps: parseFloat(s.reps) }))
          .filter((s) => !isNaN(s.weight) && !isNaN(s.reps));
        if (sets.length) out.push({ dateKey, sets });
      });
    });
    out.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
    return out;
  }

  async function openHistory(ex) {
    state.histName = ex.name;
    $('#histTitle').textContent = ex.name;
    // make sure today's in-progress entries are persisted before we read them back
    try { await WTStore.setLog(state.dateKey, state.log); } catch (e) {}
    state.histEntries = await gatherHistory(ex.name);
    setHistTab('results');
    $('#histScreen').hidden = false;
  }
  function setHistTab(tab) {
    state.histTab = tab;
    document.querySelectorAll('#histTabs .seg-btn').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    renderHistory();
  }
  function renderHistory() {
    const body = $('#histBody'); body.innerHTML = '';
    const entries = state.histEntries || [];
    body.appendChild(state.histTab === 'trends' ? renderTrendsTab(entries) : renderResultsTab(entries));
  }
  function renderResultsTab(entries) {
    if (!entries.length) return h('p', { class: 'muted hist-empty' }, 'No history yet for this lift. Log a session and it shows up here.');
    return h('div', { class: 'hist-results' }, entries.map((en) => {
      const rm = bestOneRm(en.sets);
      return h('div', { class: 'hist-day' },
        h('div', { class: 'hist-date' }, niceDate(en.dateKey)),
        h('div', { class: 'hist-sets' }, en.sets.map((s, i) =>
          h('div', { class: 'hist-set' },
            h('span', { class: 'hist-set-n' }, i + 1),
            h('span', null, s.reps + ' reps × ' + s.weight + ' lb')))),
        rm ? h('div', { class: 'hist-1rm' }, 'Est. 1 rep max · ' + (Math.round(rm * 10) / 10) + ' lb') : null
      );
    }));
  }
  function renderTrendsTab(entries) {
    if (!entries.length) return h('p', { class: 'muted hist-empty' }, 'No history yet to chart.');
    const asc = entries.slice().reverse();
    const oneRm = asc.map((en) => ({ dateKey: en.dateKey, value: bestOneRm(en.sets) }));
    const topWt = asc.map((en) => ({ dateKey: en.dateKey, value: Math.max.apply(null, en.sets.map((s) => s.weight)) }));
    return h('div', { class: 'hist-trends' }, trendCard('Est. 1 Rep Max', oneRm), trendCard('Top Weight', topWt));
  }
  function trendCard(title, series) {
    const latest = series[series.length - 1];
    const val = latest ? (Math.round(latest.value * 10) / 10) : 0;
    return h('div', { class: 'card trend-card' },
      h('h3', null, title),
      h('div', { class: 'trend-val' }, String(val), h('span', { class: 'trend-unit' }, ' lb')),
      latest ? h('div', { class: 'trend-date' }, 'Logged ' + shortDate(latest.dateKey)) : null,
      lineChart(series),
      h('div', { class: 'trend-foot' }, series.length > 1 ? 'Most recent performances' : 'Log this lift again to see a trend')
    );
  }
  function lineChart(series) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 320, H = 150, padL = 6, padR = 46, padT = 14, padB = 16;
    const innerW = W - padL - padR, innerH = H - padT - padB, n = series.length;
    const vals = series.map((p) => p.value);
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { const d = Math.max(1, Math.abs(min) * 0.05); min -= d; max += d; }
    const X = (i) => padL + innerW * (n === 1 ? 0.5 : i / (n - 1));
    const Y = (v) => padT + innerH * (1 - (v - min) / (max - min));
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'chart');
    for (let t = 0; t <= 4; t++) {
      const v = min + (max - min) * t / 4, y = Y(v);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', padL); line.setAttribute('x2', padL + innerW);
      line.setAttribute('y1', y); line.setAttribute('y2', y); line.setAttribute('class', 'grid');
      svg.appendChild(line);
      const txt = document.createElementNS(NS, 'text');
      txt.setAttribute('x', padL + innerW + 4); txt.setAttribute('y', y + 3); txt.setAttribute('class', 'gridlabel');
      txt.textContent = String(Math.round(v * 10) / 10);
      svg.appendChild(txt);
    }
    if (n > 1) {
      const poly = document.createElementNS(NS, 'polyline');
      poly.setAttribute('points', series.map((p, i) => X(i) + ',' + Y(p.value)).join(' '));
      poly.setAttribute('class', 'chart-line');
      svg.appendChild(poly);
    }
    series.forEach((p, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', X(i)); c.setAttribute('cy', Y(p.value));
      c.setAttribute('r', i === n - 1 ? 4 : 3);
      c.setAttribute('class', i === n - 1 ? 'dot last' : 'dot');
      svg.appendChild(c);
    });
    return svg;
  }

  // ---------- builders ----------
  // ----- lift list rows (workout view) -----
  function liftDone(ex) {
    const e = state.log.exercises[ex.id];
    return !!(e && e.sets.length && e.sets.every((s) => s.done));
  }
  function isFocus(ex) {
    return !!(ex && (ex.focus || (state.focusExId && ex.id === state.focusExId)));
  }
  function liftSummary(ex) {
    const e = state.log.exercises[ex.id];
    const logged = e ? e.sets.filter((s) => s.weight !== '' && s.reps !== '') : [];
    if (logged.length) {
      let top = logged[0];
      logged.forEach((s) => { if (parseFloat(s.weight) > parseFloat(top.weight)) top = s; });
      return logged.length + ' set' + (logged.length > 1 ? 's' : '') + ' · ' + top.reps + ' reps · ' + top.weight + ' lb';
    }
    if (ex.scheme) return ex.scheme;
    const n = e ? e.sets.length : (ex.defaultSets || 1);
    return n + ' set' + (n > 1 ? 's' : '');
  }
  function buildLiftRow(section, ex, idx, count) {
    ensureExLog(ex);
    const done = liftDone(ex);
    return h('div', { class: 'lift-row' + (done ? ' done' : ''), onclick: () => openLift(section, ex) },
      h('div', { class: 'lift-tile' }, ex.caution ? '⚠️' : '🏋️', h('span', { class: 'lift-badge' }, '💪')),
      h('div', { class: 'lift-main' },
        isFocus(ex) ? h('div', { class: 'focus-label' }, 'FOCUS EXERCISE') : null,
        h('div', { class: 'lift-name' }, ex.name),
        h('div', { class: 'lift-sum' }, liftSummary(ex))
      ),
      h('div', { class: 'lift-right' },
        done ? h('span', { class: 'lift-check' }, '✓') : null,
        h('button', { class: 'lift-menu', 'aria-label': 'Options', onclick: (ev) => openRowMenu(ev, section, ex, idx, count) }, '⋯')
      )
    );
  }
  function openRowMenu(ev, section, ex, idx, count) {
    ev.stopPropagation();
    state.menuCtx = { sectionId: section.id, exId: ex.id, idx, count };
    const m = $('#rowMenu');
    m.querySelector('[data-act="up"]').disabled = idx === 0;
    m.querySelector('[data-act="down"]').disabled = idx === count - 1;
    m.querySelector('[data-act="remove"]').hidden = !ex.custom;
    m.hidden = false;
    const r = ev.currentTarget.getBoundingClientRect();
    m.style.top = (r.bottom + 6) + 'px';
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 8)) + 'px';
  }
  function buildListSection(section) {
    const exs = orderedExercises(section);
    return h('div', { class: 'list-section', dataset: { section: section.id } },
      h('div', { class: 'list-section-label' },
        h('h3', null, section.label),
        section.superset ? h('span', { class: 'pill' }, 'superset') : null,
        section.note ? h('span', { class: 'section-note' }, section.note) : null
      ),
      exs.map((ex, i) => buildLiftRow(section, ex, i, exs.length))
    );
  }
  function buildCustomListSection() {
    const section = { id: 'custom', label: 'Added lifts', exercises: state.log.customExercises };
    const exs = state.log.customExercises;
    const input = h('input', { class: 'custom-in', type: 'text', placeholder: 'Add a lift for today…', 'aria-label': 'New lift name' });
    const addBtn = h('button', { class: 'btn btn-ghost', onclick: () => {
      const name = input.value.trim();
      if (!name) return;
      const id = 'custom-' + Date.now();
      state.log.customExercises.push({ id, name, scheme: '', defaultSets: 1, custom: true });
      ensureExLog(state.log.customExercises[state.log.customExercises.length - 1]);
      save(); renderWorkout();
    } }, 'Add');
    return h('div', { class: 'list-section', dataset: { section: 'custom' } },
      h('div', { class: 'list-section-label' }, h('h3', null, 'Added lifts')),
      exs.length ? exs.map((ex, i) => buildLiftRow(section, ex, i, exs.length)) : h('p', { class: 'muted' }, 'No extra lifts yet.'),
      h('div', { class: 'custom-add' }, input, addBtn)
    );
  }

  // ----- per-lift detail page -----
  function openLift(section, ex) {
    state.liftSectionObj = section;
    state.liftEx = ex;
    $('#liftTitle').textContent = ex.name;
    $('#liftHowTo').href = howToLink(ex.name);
    $('#liftHero').style.backgroundImage = ex.image ? 'url("' + ex.image + '")' : '';
    renderLiftBody(section, ex);
    $('#liftScreen').hidden = false;
  }
  function closeLift() {
    closeKeypad();
    $('#liftScreen').hidden = true;
    state.liftEx = null; state.liftSectionObj = null;
    renderWorkout();
  }
  function refreshLiftDetail() {
    if ($('#liftScreen').hidden || !state.liftEx) return;
    renderLiftBody(state.liftSectionObj, state.liftEx);
  }
  function buildSetsBlock(section, ex, e) {
    const head = h('div', { class: 'sets-head' },
      h('span', { class: 'sets-head-label' }, 'Weight (lb)'),
      h('span', { class: 'sets-head-label' }, 'Reps'));
    const rows = e.sets.map((s, i) => {
      const badge = h('button', { class: 'hexbadge' + (s.done ? ' done' : ''), 'aria-label': 'Complete set ' + (i + 1) }, s.done ? '✓' : String(i + 1));
      // readonly so iOS never opens its own keyboard — entry goes through the app's keypad
      const wIn = h('input', { class: 'setbox', type: 'text', inputmode: 'decimal', readonly: true, placeholder: 'wt', value: s.weight, 'aria-label': 'Weight set ' + (i + 1) });
      const rIn = h('input', { class: 'setbox', type: 'text', inputmode: 'numeric', readonly: true, placeholder: 'reps', value: s.reps, 'aria-label': 'Reps set ' + (i + 1) });
      const row = h('div', { class: 'setrow' + (s.done ? ' done' : '') }, badge, wIn, rIn);
      // mark/unmark a set complete — updates the badge + row and (when completing) starts the rest timer
      function setDone(v, startTimer) {
        s.done = v;
        row.classList.toggle('done', v);
        badge.classList.toggle('done', v);
        badge.textContent = v ? '✓' : String(i + 1);
        save();
        if (v && startTimer) startRest(ex);
      }
      badge.addEventListener('click', () => setDone(!s.done, true));
      // both filled → auto-log the set and start rest (fired by the keypad's "Done")
      const maybeComplete = () => { if (!s.done && s.weight !== '' && s.reps !== '') setDone(true, true); };
      // tapping a box opens the app keypad pointed at it. mousedown-preventDefault blocks the input from
      // taking focus, so iOS doesn't grab the readonly field and zoom/rescale the page; click still fires.
      const blockFocus = (ev) => ev.preventDefault();
      wIn.addEventListener('mousedown', blockFocus);
      rIn.addEventListener('mousedown', blockFocus);
      wIn.addEventListener('click', () => openKeypad({ input: wIn, set: s, field: 'weight', repsInput: rIn, complete: maybeComplete }));
      rIn.addEventListener('click', () => openKeypad({ input: rIn, set: s, field: 'reps', repsInput: null, complete: maybeComplete }));
      return row;
    });
    const add = h('button', { class: 'addset', onclick: () => { e.sets.push({ weight: '', reps: '', done: false }); save(); renderLiftBody(section, ex); } },
      h('span', { class: 'addset-plus' }, '+'), 'Add Set');
    // remove the last set (only when there's more than one) — for the trailing set you didn't fill in
    const remove = e.sets.length > 1 ? h('button', { class: 'addset removeset', onclick: () => {
      e.sets.pop(); save(); updateVolume(); renderLiftBody(section, ex);
    } }, h('span', { class: 'addset-plus minus' }, '−'), 'Remove Set') : null;
    return h('div', { class: 'setblock' }, head, rows, h('div', { class: 'setblock-actions' }, add, remove));
  }
  function renderLiftBody(section, ex) {
    closeKeypad(); // the rows are about to be rebuilt — drop any stale keypad target
    const e = ensureExLog(ex);
    const body = $('#liftBody'); body.innerHTML = '';

    const restOn = state.config.restEnabled !== false;
    const restChip = h('button', { class: 'lift-chip' + (restOn ? '' : ' off'), onclick: () => openRestPicker(ex) }, '⏱ ' + fmtClock(restSecFor(ex.id)) + (restOn ? ' rest' : ' off'));
    const histChip = h('button', { class: 'lift-chip', onclick: () => openHistory(ex) }, '📈 History');
    const noteChip = h('button', { class: 'lift-chip' + (e.note ? ' has-note' : ''), onclick: () => openNoteModal(ex) }, e.note ? '📝 Note ●' : '📝 Note');
    body.appendChild(h('div', { class: 'lift-chips' }, restChip, histChip, noteChip));

    if (isFocus(ex)) body.appendChild(h('div', { class: 'focus-panel' },
      h('div', { class: 'focus-burst' }, '✷'),
      h('div', null,
        h('div', { class: 'focus-title' }, 'Focus Exercise'),
        h('p', { class: 'focus-text' }, 'A key lift — aim to add a little each week.'))));

    if (ex.scheme) body.appendChild(h('p', { class: 'lift-scheme' }, ex.scheme));
    if (ex.targetMuscle && ex.targetMuscle.label) {
      body.appendChild(h('div', { class: 'target' }, 'Target: ',
        h('a', { href: muscleLink(ex.targetMuscle.label), target: '_blank', rel: 'noopener' }, ex.targetMuscle.label)));
    }
    if (ex.caution) body.appendChild(h('div', { class: 'caution' }, '⚠ ' + ex.caution));
    if (ex.formCues && ex.formCues.length) body.appendChild(h('ul', { class: 'cues' }, ex.formCues.map((c) => h('li', null, c))));

    body.appendChild(h('div', { class: 'customize-label' }, 'Customize'));
    body.appendChild(buildSetsBlock(section, ex, e));

    if (ex.custom) body.appendChild(h('button', { class: 'btn btn-ghost block danger', onclick: () => removeCustom(ex.id) }, 'Remove this lift'));

    // jump to the next lift in the day (or back to the list on the last one)
    const seq = dayLiftSequence();
    const idx = seq.findIndex((s) => s.ex.id === ex.id);
    const next = (idx >= 0 && idx < seq.length - 1) ? seq[idx + 1] : null;
    if (next) body.appendChild(h('button', { class: 'btn btn-primary block lift-next', onclick: () => openLift(next.section, next.ex) }, 'Next: ' + next.ex.name + ' →'));
    else body.appendChild(h('button', { class: 'btn btn-ghost block lift-next', onclick: closeLift }, 'Back to workout'));
  }
  // ordered (section, ex) pairs for the current day — program order, then custom lifts.
  function dayLiftSequence() {
    const day = currentDay();
    const out = [];
    (day.sections || []).forEach((sec) => orderedExercises(sec).forEach((ex) => out.push({ section: sec, ex })));
    if (day.type !== 'rest') {
      const cs = { id: 'custom', label: 'Added lifts', exercises: state.log.customExercises };
      state.log.customExercises.forEach((ex) => out.push({ section: cs, ex }));
    }
    return out;
  }

  function buildCardio(day) {
    const c = day.cardio; if (!c) return null;
    const log = state.log.cardio;
    const inputs = [];
    if (c.trackMinutes) {
      // Fitbod-style time entry: digits fill from the right as MM:SS (type 2012 -> 20:12)
      const fmtTime = (mm, ss) => (mm != null && mm !== '' ? String(mm) : '0') + ':' + String(ss || '').padStart(2, '0');
      const hasTime = (log.minutes !== '' && log.minutes != null) || (log.seconds !== '' && log.seconds != null);
      const timeIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '0:00', value: hasTime ? fmtTime(log.minutes, log.seconds) : '' });
      timeIn.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4); // MMSS
        if (!digits) { log.minutes = ''; log.seconds = ''; e.target.value = ''; save(); return; }
        const ss = digits.slice(-2), mm = digits.slice(0, -2) || '0';
        log.minutes = mm; log.seconds = ss;
        e.target.value = mm + ':' + ss.padStart(2, '0');
        save();
      });
      inputs.push(h('label', { class: 'cardio-field' }, 'Time', timeIn));
    }
    if (c.trackDistance) inputs.push(h('label', { class: 'cardio-field' }, 'Miles',
      h('input', { type: 'text', inputmode: 'decimal', placeholder: '0.0', value: log.distance || '', oninput: (e) => { log.distance = e.target.value; save(); } })));
    const done = h('label', { class: 'cardio-done' },
      h('input', { type: 'checkbox', checked: !!log.done, onchange: (e) => { log.done = e.target.checked; save(); rerenderCardio(); } }),
      ' Done');
    return h('section', { class: 'card cardio' + (log.done ? ' done' : ''), dataset: { cardio: '1' } },
      h('div', { class: 'cardio-head' }, h('span', { class: 'cardio-tag' }, 'Cardio · ' + cap(c.kind)), done),
      h('p', { class: 'cardio-rx' }, c.prescription),
      inputs.length ? h('div', { class: 'cardio-inputs' }, inputs) : null
    );
  }

  function buildWarmup(day) {
    if (!day.warmup || !day.warmup.length) return null;
    const items = day.warmup.map((text, i) => {
      const key = String(i);
      const checked = !!state.log.warmupChecks[key];
      const label = h('label', { class: 'check' + (checked ? ' on' : '') },
        h('input', { type: 'checkbox', checked, onchange: (e) => { state.log.warmupChecks[key] = e.target.checked; label.classList.toggle('on', e.target.checked); save(); } }),
        h('span', null, text));
      return label;
    });
    return h('section', { class: 'card warmup' }, h('h3', null, 'Warm-up'), h('div', { class: 'checks' }, items));
  }

  function buildDeferred() {
    const d = state.program.meta && state.program.meta.deferred;
    if (!d || !d.length) return null;
    return h('details', { class: 'card deferred' },
      h('summary', null, 'On hold (recovery) · ' + d.length),
      h('ul', null, d.map((x) => h('li', null, h('strong', null, x.name), x.reason ? ' — ' + x.reason : ''))));
  }

  function buildSessionNotes() {
    return h('section', { class: 'card notes' },
      h('h3', null, 'Session notes'),
      h('textarea', { class: 'session-notes', rows: 3, placeholder: 'How did it feel? Anything to flag…',
        oninput: (e) => { state.log.sessionNotes = e.target.value; save(); } }, state.log.sessionNotes || ''));
  }

  // ---------- targeted re-renders ----------
  function rerenderCardio() {
    const node = document.querySelector('[data-cardio]');
    if (node) node.replaceWith(buildCardio(currentDay()));
  }

  // ---------- reorder / custom remove ----------
  function move(sectionId, exId, dir) {
    const section = sectionById(sectionId);
    const ids = orderedExercises(section).map((e) => e.id);
    const i = ids.indexOf(exId), j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    state.log.order[sectionId] = ids;
    save(); renderWorkout();
  }
  function removeCustom(exId) {
    state.log.customExercises = state.log.customExercises.filter((e) => e.id !== exId);
    delete state.log.exercises[exId];
    if (state.log.order.custom) state.log.order.custom = state.log.order.custom.filter((id) => id !== exId);
    if (state.liftEx && state.liftEx.id === exId) { $('#liftScreen').hidden = true; state.liftEx = null; state.liftSectionObj = null; }
    save(); renderWorkout();
  }

  // ---------- full day render ----------
  function renderTabs() {
    const tabs = $('#dayTabs');
    tabs.innerHTML = '';
    const todayKey = dateKeyOf(new Date());
    state.program.days.forEach((d) => {
      const dk = dateKeyOf(addDays(state.weekStart, dayIndex(d.id)));
      const btn = h('button', {
        class: 'tab' + (d.id === state.activeDayId ? ' active' : '') + (dk === todayKey ? ' today' : ''),
        onclick: () => switchDay(d.id)
      }, h('span', { class: 'tab-day' }, d.tabLabel), h('span', { class: 'tab-date' }, shortDate(dk)));
      tabs.appendChild(btn);
    });
  }

  function renderWeekLabel() {
    const thisWeek = startOfWeek(new Date());
    const sameWeek = dateKeyOf(thisWeek) === dateKeyOf(state.weekStart);
    const end = addDays(state.weekStart, 6);
    $('#weekLabel').textContent = sameWeek ? 'This week' : (shortDate(dateKeyOf(state.weekStart)) + ' – ' + shortDate(dateKeyOf(end)));
  }

  function renderWorkout() {
    const day = currentDay();
    const view = $('#dayView');
    view.innerHTML = '';
    state.activeExIds = [];

    // pick the focus lift: first flagged ex.focus, else the day's first lift
    state.focusExId = null;
    let exCount = 0;
    (day.sections || []).forEach((sec) => orderedExercises(sec).forEach((ex) => {
      exCount++;
      if (ex.focus && !state.focusExId) state.focusExId = ex.id;
    }));
    if (!state.focusExId && day.sections && day.sections.length) {
      const first = orderedExercises(day.sections[0])[0];
      if (first) state.focusExId = first.id;
    }

    view.appendChild(h('div', { class: 'day-head' },
      h('div', null,
        h('h1', null, day.title),
        day.subtitle ? h('p', { class: 'subtitle' }, day.subtitle) : null,
        exCount ? h('p', { class: 'day-meta' }, exCount + ' exercise' + (exCount > 1 ? 's' : '')) : null,
        h('div', { class: 'vol' }, h('span', { class: 'vol-label' }, 'Volume'), h('span', { class: 'vol-value', id: 'volValue' }, '0 lb'))
      ),
      h('span', { class: 'day-date' }, niceDate(state.dateKey))
    ));

    if (day.verify) view.appendChild(h('div', { class: 'banner' }, '⚠ Lifts here are a best-guess — confirm or edit in program.js.'));

    const cardio = buildCardio(day); if (cardio) view.appendChild(cardio);
    const warmup = buildWarmup(day); if (warmup) view.appendChild(warmup);

    (day.sections || []).forEach((section) => {
      orderedExercises(section).forEach((ex) => state.activeExIds.push(ex.id));
      view.appendChild(buildListSection(section));
    });

    // custom lifts (always available unless a pure rest day)
    if (day.type !== 'rest') {
      state.log.customExercises.forEach((ex) => state.activeExIds.push(ex.id));
      view.appendChild(buildCustomListSection());
    }

    if (day.type !== 'rest') { const def = buildDeferred(); if (def) view.appendChild(def); }
    view.appendChild(buildSessionNotes());

    if (day.type !== 'rest') {
      view.appendChild(h('div', { class: 'finish' },
        h('button', { class: 'btn btn-primary block', onclick: finishAndSave }, 'Finish & Save')));
    }

    updateVolume();
  }

  // ====================================================================
  // BODY tab — Recovery (anatomical heatmap) + Results (composition/measurements)
  // ====================================================================
  const bodyProfile = () => state.body.profile || {};
  function metricSeries(key) {
    const e = state.body.entries || {};
    const dates = Object.keys(e).sort();
    const out = [];
    if (isEntered(key)) {
      dates.forEach((dk) => { const v = e[dk] && e[dk][key]; if (v != null && v !== '') { const n = Number(v); if (!isNaN(n)) out.push({ dateKey: dk, value: n }); } });
    } else {
      const fn = COMPUTED[key].fn, p = bodyProfile();
      dates.forEach((dk) => { const v = fn(e[dk] || {}, p); if (v != null && isFinite(v)) out.push({ dateKey: dk, value: v }); });
    }
    return out;
  }
  const latestOf = (key) => { const s = metricSeries(key); return s.length ? s[s.length - 1] : null; };
  const fmtVal = (v, meta) => { const r = Math.round(v * 10) / 10; return meta.unit ? r + ' ' + meta.unit : String(r); };

  function renderBody() {
    const v = $('#otherView'); v.innerHTML = '';
    v.appendChild(h('div', { class: 'seg body-seg' },
      h('button', { class: 'seg-btn' + (state.bodyTab === 'results' ? ' on' : ''), onclick: () => { state.bodyTab = 'results'; renderBody(); } }, 'Results'),
      h('button', { class: 'seg-btn' + (state.bodyTab === 'recovery' ? ' on' : ''), onclick: () => { state.bodyTab = 'recovery'; renderBody(); } }, 'Recovery')
    ));
    const body = h('div', { class: 'body-body' });
    v.appendChild(body);
    if (state.bodyTab === 'results') renderResults(body);
    else renderRecovery(body);
  }

  // ----- Results: grouped composition + measurement stats -----
  function renderResults(root) {
    root.appendChild(h('div', { class: 'results-actions' },
      h('button', { class: 'btn btn-primary', onclick: () => openBodyEntry() }, '+ Log measurement'),
      h('button', { class: 'btn btn-ghost', onclick: openProfile }, 'Profile')));
    RESULTS_LAYOUT.forEach((sec) => {
      root.appendChild(h('h2', { class: 'results-sec' }, sec.title));
      sec.groups.forEach((g) => {
        root.appendChild(h('div', { class: 'results-group' },
          h('div', { class: 'results-group-title' }, g.title),
          h('div', { class: 'stat-rows' }, g.keys.map((k) => {
            const meta = metricMeta(k), lt = latestOf(k);
            return h('button', { class: 'stat-row', onclick: () => openStatDetail(k) },
              h('span', { class: 'stat-row-name' }, meta.name),
              h('span', { class: 'stat-row-right' },
                lt ? h('span', { class: 'stat-row-val' }, fmtVal(lt.value, meta)) : h('span', { class: 'stat-row-add' }, 'Add'),
                h('span', { class: 'chev' }, '›')));
          }))));
      });
    });
  }

  // ----- a single stat's detail (chart + history) -----
  function openStatDetail(key) {
    state.statKey = key;
    $('#statScreenName').textContent = metricMeta(key).name;
    renderStatDetail();
    $('#statScreen').hidden = false;
  }
  function renderStatDetail() {
    const key = state.statKey, meta = metricMeta(key);
    const body = $('#statScreenBody'); body.innerHTML = '';
    const series = metricSeries(key);
    const lt = series.length ? series[series.length - 1] : null;
    body.appendChild(h('div', { class: 'stat-hero' },
      h('div', { class: 'stat-hero-val' }, lt ? String(Math.round(lt.value * 10) / 10) : '—', meta.unit ? h('span', { class: 'stat-unit' }, ' ' + meta.unit) : null),
      lt ? h('div', { class: 'stat-when' }, 'Logged ' + niceDate(lt.dateKey)) : h('p', { class: 'muted' }, 'No data yet.')));
    if (series.length > 1) body.appendChild(h('div', { class: 'card' }, lineChart(series)));
    if (!isEntered(key)) body.appendChild(h('p', { class: 'muted' }, 'Computed from your weight, body fat' + (['bmi', 'lean_mass_index', 'bmr'].indexOf(key) !== -1 ? ' and profile' : '') + '.'));
    if (series.length) body.appendChild(h('div', { class: 'stat-history' }, series.slice().reverse().map((p) =>
      h('div', { class: 'stat-hrow' }, h('span', null, niceDate(p.dateKey)), h('span', { class: 'stat-hrow-v' }, fmtVal(p.value, meta))))));
    if (isEntered(key)) body.appendChild(h('button', { class: 'btn btn-primary block', onclick: () => openBodyEntry(key) }, 'Log measurement'));
  }

  // ----- measurement entry + profile -----
  function openBodyEntry(focusKey) {
    $('#bodyEntryDate').value = dateKeyOf(new Date());
    buildBodyFields($('#bodyEntryDate').value);
    $('#bodyEntryModal').hidden = false;
    if (typeof focusKey === 'string') { const el = $('#bodyEntryFields').querySelector('[data-metric="' + focusKey + '"]'); if (el) setTimeout(() => el.focus(), 60); }
  }
  function buildBodyFields(dateKey) {
    const existing = (state.body.entries && state.body.entries[dateKey]) || {};
    const box = $('#bodyEntryFields'); box.innerHTML = '';
    Object.keys(ENTERED).forEach((k) => {
      const m = ENTERED[k];
      box.appendChild(h('label', { class: 'body-field' },
        h('span', { class: 'body-field-name' }, m.name + ' (' + m.unit + ')'),
        h('input', { type: 'number', inputmode: 'decimal', step: m.step, 'data-metric': k, placeholder: '—', value: existing[k] != null ? existing[k] : '' })));
    });
  }
  function saveBodyEntry() {
    const dateKey = $('#bodyEntryDate').value;
    if (!dateKey) { toast('Pick a date'); return; }
    const entry = {};
    $('#bodyEntryFields').querySelectorAll('input[data-metric]').forEach((inp) => {
      const val = inp.value.trim();
      if (val !== '' && !isNaN(Number(val))) entry[inp.dataset.metric] = Number(val);
    });
    state.body.entries = state.body.entries || {};
    if (Object.keys(entry).length) state.body.entries[dateKey] = entry;
    else delete state.body.entries[dateKey];
    WTStore.setBody(state.body).then(() => toast('Saved')).catch(() => toast('Save failed'));
    $('#bodyEntryModal').hidden = true;
    if (!$('#statScreen').hidden) renderStatDetail();
    renderBody();
  }
  function openProfile() {
    const p = bodyProfile();
    $('#profHeight').value = p.heightIn != null ? p.heightIn : '';
    $('#profAge').value = p.age != null ? p.age : '';
    $('#profSex').value = p.sex || 'male';
    $('#profileModal').hidden = false;
  }
  function saveProfile() {
    const p = {}, hv = $('#profHeight').value.trim(), av = $('#profAge').value.trim();
    if (hv !== '' && !isNaN(Number(hv))) p.heightIn = Number(hv);
    if (av !== '' && !isNaN(Number(av))) p.age = Number(av);
    p.sex = $('#profSex').value;
    state.body.profile = p;
    WTStore.setBody(state.body).then(() => toast('Profile saved')).catch(() => toast('Save failed'));
    $('#profileModal').hidden = true;
    renderBody();
  }

  // ----- Recovery: one anatomical figure, worked muscles glow red -----
  // muscle key -> most recent dateKey it was trained (any filled/completed set).
  async function computeLastTrained() {
    const idx = exMuscleIndex();
    const all = await WTStore.allLogs();
    const last = {};
    Object.keys(all).forEach((k) => {
      const log = all[k];
      const dateKey = log.dateKey || k.replace(/^log:/, '');
      Object.keys(log.exercises || {}).forEach((exId) => {
        const e = log.exercises[exId];
        const trained = (e.sets || []).some((s) => (s.weight !== '' && s.reps !== '') || s.done);
        if (!trained) return;
        (idx[exId] || []).forEach((m) => { if (!last[m] || dateKey > last[m]) last[m] = dateKey; });
      });
    });
    return last;
  }
  // all dates with at least one trained set, ascending.
  async function computeWorkoutDates() {
    const all = await WTStore.allLogs();
    const out = [];
    Object.keys(all).forEach((k) => {
      const log = all[k], dk = log.dateKey || k.replace(/^log:/, '');
      const any = Object.values(log.exercises || {}).some((e) => (e.sets || []).some((s) => (s.weight !== '' && s.reps !== '') || s.done));
      if (any) out.push(dk);
    });
    return out.sort();
  }
  function recoveredPct(lastKey, todayKey) {
    if (!lastKey) return 1;
    return clamp(daysBetween(lastKey, todayKey) / RECOVERY_DAYS, 0, 1);
  }
  function sinceLabel(lastKey, todayKey) {
    if (!lastKey) return 'Not trained yet';
    const d = daysBetween(lastKey, todayKey);
    if (d <= 0) return 'Trained today';
    if (d === 1) return 'Trained yesterday';
    return 'Trained ' + d + ' days ago';
  }
  function timeAgoCaps(dateKey, todayKey) {
    const d = daysBetween(dateKey, todayKey);
    if (d <= 0) return 'TODAY';
    if (d === 1) return 'YESTERDAY';
    return d + ' DAYS AGO';
  }
  function flipIcon() {
    return h('span', { class: 'flip-ic', html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h11a5 5 0 0 1 5 5"/><path d="M16 21l4-4-4-4"/><path d="M20 17H9a5 5 0 0 1-5-5"/></svg>' });
  }

  async function renderRecovery(root) {
    root.appendChild(h('p', { class: 'muted body-loading' }, 'Reading your history…'));
    const todayKey = dateKeyOf(new Date());
    const view = state.recoveryView || 'front';
    const M = window.WT_MUSCLES;
    const url = view === 'front' ? M.FRONT_URL : M.BACK_URL;
    const [last, wdates, svgText] = await Promise.all([
      computeLastTrained(), computeWorkoutDates(),
      fetch(url).then((r) => r.text()).catch(() => null)
    ]);
    state.lastTrained = last;
    const lastWorkout = wdates.length ? wdates[wdates.length - 1] : null;
    const daysSince = lastWorkout ? Math.max(0, daysBetween(lastWorkout, todayKey)) : null;
    const universe = {};
    Object.values(exMuscleIndex()).forEach((arr) => arr.forEach((m) => { universe[m] = 1; }));
    const fresh = Object.keys(universe).filter((m) => recoveredPct(last[m], todayKey) >= 0.85).length;

    root.innerHTML = '';
    root.appendChild(h('div', { class: 'rec-stats' },
      h('div', { class: 'rec-stat' }, h('div', { class: 'rec-stat-n' }, daysSince == null ? '—' : String(daysSince)), h('div', { class: 'rec-stat-l' }, 'DAYS SINCE YOUR LAST WORKOUT')),
      h('div', { class: 'rec-stat' }, h('div', { class: 'rec-stat-n' }, String(fresh)), h('div', { class: 'rec-stat-l' }, 'FRESH MUSCLE GROUPS'))));

    const figWrap = h('div', { class: 'rec-figwrap' });
    if (svgText) {
      figWrap.innerHTML = svgText;
      const map = view === 'front' ? M.FRONT_MAP : M.BACK_MAP;
      figWrap.querySelectorAll('svg .st1').forEach((p, i) => {
        const keys = map[i]; if (!keys) return;
        const arr = Array.isArray(keys) ? keys : [keys];
        let fat = 0; arr.forEach((k) => { const f = 1 - recoveredPct(last[k], todayKey); if (f > fat) fat = f; });
        p.style.fill = bodyHeat(fat);
        p.style.cursor = 'pointer';
        p.setAttribute('data-mk', arr[0]);
      });
      figWrap.addEventListener('click', (ev) => { const t = ev.target.closest('[data-mk]'); if (t) openMuscleScreen(t.getAttribute('data-mk')); });
    } else {
      figWrap.appendChild(h('p', { class: 'muted' }, 'Could not load the body map.'));
    }
    const flip = h('button', { class: 'rec-flip', 'aria-label': 'Flip front and back', onclick: () => { state.recoveryView = view === 'front' ? 'back' : 'front'; renderBody(); } }, flipIcon());
    root.appendChild(h('div', { class: 'rec-figbox' }, figWrap, flip));
  }

  // recent program lifts that trained a muscle (most recent per lift), newest first.
  async function recentLiftsForMuscle(key) {
    const idx = exMuscleIndex();
    const all = await WTStore.allLogs();
    const byName = {};
    Object.keys(all).forEach((k) => {
      const log = all[k], dk = log.dateKey || k.replace(/^log:/, '');
      Object.keys(log.exercises || {}).forEach((exId) => {
        if ((idx[exId] || []).indexOf(key) === -1) return;
        const e = log.exercises[exId];
        const setN = (e.sets || []).filter((s) => (s.weight !== '' && s.reps !== '') || s.done).length;
        if (!setN) return;
        const name = exNameById(exId); if (!name) return;
        if (!byName[name] || dk > byName[name].dateKey) byName[name] = { name, dateKey: dk, sets: setN };
      });
    });
    return Object.values(byName).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }
  async function openMuscleScreen(key) {
    const M = window.WT_MUSCLES.MUSCLES[key]; if (!M) return;
    state.muscleKey = key;
    $('#muscleScreenName').textContent = M.name;
    const body = $('#muscleScreenBody'); body.innerHTML = '';
    body.appendChild(h('p', { class: 'muted' }, 'Loading…'));
    $('#muscleScreen').hidden = false;
    const todayKey = dateKeyOf(new Date());
    const recent = await recentLiftsForMuscle(key);
    const last = (state.lastTrained || {})[key];
    body.innerHTML = '';
    body.appendChild(h('div', { class: 'msc-status' }, sinceLabel(last, todayKey) + ' · ' + Math.round(recoveredPct(last, todayKey) * 100) + '% recovered'));
    if (!recent.length) { body.appendChild(h('p', { class: 'muted' }, 'You haven’t logged anything that trains this yet.')); return; }
    recent.forEach((r) => body.appendChild(h('div', { class: 'msc-lift' },
      h('div', { class: 'msc-tile' }, '🏋️'),
      h('div', { class: 'msc-main' },
        h('div', { class: 'msc-ago' }, timeAgoCaps(r.dateKey, todayKey)),
        h('div', { class: 'msc-name' }, r.name),
        h('div', { class: 'msc-sets' }, r.sets + ' set' + (r.sets === 1 ? '' : 's'))))));
  }

  // ====================================================================
  // TARGETS tab — weekly Push/Pull/Legs set goals (primary=1, secondary=0.5)
  // ====================================================================
  // set-credit per muscle over the 7 days of a week.
  async function weeklyMuscleSets(weekStart) {
    const roles = exRoles();
    const counts = {};
    for (let i = 0; i < 7; i++) {
      const log = await WTStore.getLog(dateKeyOf(addDays(weekStart, i)));
      if (!log) continue;
      Object.keys(log.exercises || {}).forEach((exId) => {
        const r = roles[exId]; if (!r) return;
        const e = log.exercises[exId];
        const setN = (e.sets || []).filter((s) => (s.weight !== '' && s.reps !== '') || s.done).length;
        if (!setN) return;
        r.primary.forEach((m) => { counts[m] = (counts[m] || 0) + setN; });
        r.secondary.forEach((m) => { counts[m] = (counts[m] || 0) + setN * 0.5; });
      });
    }
    return counts;
  }
  // flat-top hexagon path (pathLength=100 so progress = dasharray "pct 100", clockwise from top-left).
  function hexPath(cx, cy, R) {
    const H = R * 0.8660254;
    const p = [[cx - R / 2, cy - H], [cx + R / 2, cy - H], [cx + R, cy], [cx + R / 2, cy + H], [cx - R / 2, cy + H], [cx - R, cy]];
    return 'M' + p[0] + 'L' + p[1] + 'L' + p[2] + 'L' + p[3] + 'L' + p[4] + 'L' + p[5] + 'Z';
  }
  function bigHexSVG(pct) {
    const d = hexPath(110, 104, 92);
    return '<svg viewBox="0 0 220 210" class="hexsvg">' +
      '<defs><linearGradient id="hexg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f5d76e"/><stop offset="0.5" stop-color="#f0883e"/><stop offset="1" stop-color="#e23a5e"/>' +
      '</linearGradient></defs>' +
      '<path d="' + d + '" class="hex-track"/>' +
      '<path d="' + d + '" class="hex-prog" pathLength="100" stroke-dasharray="' + (pct * 100).toFixed(2) + ' 100"/>' +
      '</svg>';
  }
  function miniHexSVG(pct) {
    const d = hexPath(13, 12, 10);
    return '<svg viewBox="0 0 26 25" class="hexmini">' +
      '<path d="' + d + '" class="hm-track"/>' +
      '<path d="' + d + '" class="hm-prog" pathLength="100" stroke-dasharray="' + (pct * 100).toFixed(1) + ' 100"/></svg>';
  }

  async function renderTargets() {
    const v = $('#otherView'); v.innerHTML = '';
    v.appendChild(h('p', { class: 'muted body-loading' }, 'Tallying this week…'));
    const weekStart = startOfWeek(new Date());
    const counts = await weeklyMuscleSets(weekStart);
    const MUS = window.WT_MUSCLES.MUSCLES;

    let totCur = 0, totTgt = 0;
    const groups = TARGET_GROUPS.map((g) => {
      const muscles = Object.keys(DEFAULT_TARGETS).filter((m) => MUS[m].group === g.key);
      let cur = 0, tgt = 0, toGo = 0;
      const rows = muscles.map((m) => {
        const c = Math.round((counts[m] || 0) * 2) / 2, t = effectiveTarget(m);
        cur += Math.min(c, t); tgt += t; toGo += Math.max(0, t - c);
        return { m, c, t };
      });
      totCur += cur; totTgt += tgt;
      return Object.assign({}, g, { rows, cur, tgt, toGo });
    });
    const pct = totTgt ? clamp(totCur / totTgt, 0, 1) : 0;

    v.innerHTML = '';
    v.appendChild(h('div', { class: 'tg-head' },
      h('h1', null, 'Weekly Set Targets'),
      h('p', { class: 'subtitle' }, shortDate(dateKeyOf(weekStart)) + ' – ' + shortDate(dateKeyOf(addDays(weekStart, 6))))));

    const ring = h('div', { class: 'tg-ring' });
    ring.insertAdjacentHTML('afterbegin', bigHexSVG(pct));
    ring.appendChild(h('div', { class: 'tg-ring-pct' }, Math.round(pct * 100) + '%'));
    v.appendChild(ring);

    const list = h('div', { class: 'tg-list' });
    groups.forEach((g) => {
      const open = state.targetGroupOpen === g.key;
      const gp = g.tgt ? clamp(g.cur / g.tgt, 0, 1) : 0;
      const head = h('button', { class: 'tg-grow', onclick: () => { state.targetGroupOpen = open ? null : g.key; renderTargets(); } },
        h('span', { class: 'tg-hex', html: miniHexSVG(gp) }),
        h('span', { class: 'tg-gmain' },
          h('span', { class: 'tg-gname' }, g.name),
          h('span', { class: 'tg-gsets' }, fmtSets(g.cur) + ' / ' + g.tgt + ' Sets')),
        g.toGo > 0 ? h('span', { class: 'tg-togo' }, fmtSets(g.toGo), h('span', { class: 'tg-togo-l' }, 'to go')) : h('span', { class: 'tg-grdone' }, '✓'),
        h('span', { class: 'tg-chev' + (open ? ' open' : '') }, '›'));
      const kids = [head];
      if (open) {
        kids.push(h('div', { class: 'tg-muscles' },
          g.rows.map((r) => {
            const done = r.c >= r.t && r.t > 0;
            return h('button', { class: 'tg-mrow', onclick: () => openTargetEdit(r.m) },
              h('span', { class: 'tg-mcheck' + (done ? ' on' : '') }, done ? '✓' : ''),
              h('span', { class: 'tg-mname' }, MUS[r.m].name),
              h('span', { class: 'tg-msets' }, fmtSets(r.c) + ' / ' + r.t + ' Sets'),
              (r.t - r.c) > 0 ? h('span', { class: 'tg-mtogo' }, fmtSets(r.t - r.c) + ' to go') : null);
          }),
          h('p', { class: 'tg-foot' }, 'Primary muscles = 1 set, secondary muscles = 0.5 sets')));
      }
      list.appendChild(h('div', { class: 'tg-group' + (open ? ' open' : '') }, kids));
    });
    v.appendChild(list);
  }

  function openTargetEdit(m) {
    state.targetEditM = m;
    $('#targetModalName').textContent = window.WT_MUSCLES.MUSCLES[m].name;
    $('#targetInput').value = effectiveTarget(m);
    $('#targetModal').hidden = false;
  }
  function bumpTarget(delta) {
    const el = $('#targetInput');
    el.value = Math.max(0, (parseInt(el.value, 10) || 0) + delta);
  }
  function saveTarget() {
    const m = state.targetEditM;
    if (m) {
      const n = Math.max(0, parseInt($('#targetInput').value, 10) || 0);
      state.targets = state.targets || {};
      state.targets[m] = n;
      WTStore.setTargets(state.targets).then(() => toast('Target saved')).catch(() => toast('Save failed'));
    }
    $('#targetModal').hidden = true;
    renderTargets();
  }

  // ====================================================================
  // LOG tab — stats, month calendar, past-workout history (+ PRs)
  // ====================================================================
  const WEEKLY_GOAL_DEFAULT = 4;
  function logTrained(log) { return Object.values(log.exercises || {}).some((e) => (e.sets || []).some((s) => (s.weight !== '' && s.reps !== '') || s.done)); }
  function logVolume(log) { let v = 0; Object.values(log.exercises || {}).forEach((e) => (e.sets || []).forEach((s) => { const w = parseFloat(s.weight), r = parseFloat(s.reps); if (!isNaN(w) && !isNaN(r)) v += w * r; })); return v; }
  function logExCount(log) { let n = 0; Object.values(log.exercises || {}).forEach((e) => { if ((e.sets || []).some((s) => (s.weight !== '' && s.reps !== '') || s.done)) n++; }); return n; }
  function dayTitle(dayId) { const d = state.program.days.find((x) => x.id === dayId); return d ? d.title : 'Workout'; }
  function nameInLog(log, exId) { const c = (log.customExercises || []).find((x) => x.id === exId); return c ? c.name : exNameById(exId); }

  function inWeek(dk, weekStart) { const dt = parseKey(dk); return dt >= weekStart && dt <= addDays(weekStart, 6); }
  function computeWeekStreak(set) {
    const hasWeek = (ws) => { for (let i = 0; i < 7; i++) if (set.has(dateKeyOf(addDays(ws, i)))) return true; return false; };
    let ws = startOfWeek(new Date()), streak = 0;
    if (!hasWeek(ws)) ws = addDays(ws, -7); // grace: current week in progress doesn't break the streak
    while (hasWeek(ws)) { streak++; ws = addDays(ws, -7); }
    return streak;
  }

  async function renderLog() {
    const v = $('#otherView'); v.innerHTML = '';
    v.appendChild(h('p', { class: 'muted body-loading' }, 'Loading your log…'));
    const all = await WTStore.allLogs();
    const sessions = Object.keys(all).map((k) => ({ dk: all[k].dateKey || k.replace(/^log:/, ''), log: all[k] }))
      .filter((x) => logTrained(x.log)).sort((a, b) => (a.dk < b.dk ? 1 : -1));
    const workoutSet = new Set(sessions.map((s) => s.dk));

    const weekStart = startOfWeek(new Date());
    const weekSessions = sessions.filter((s) => inWeek(s.dk, weekStart));
    const goal = (state.config && state.config.weeklyGoalDays) || WEEKLY_GOAL_DEFAULT;
    const weekVol = weekSessions.reduce((sum, s) => sum + logVolume(s.log), 0);
    const streak = computeWeekStreak(workoutSet);

    v.innerHTML = '';
    v.appendChild(h('h1', { class: 'log-title' }, 'Log'));
    v.appendChild(h('div', { class: 'log-stats' },
      logStat(String(sessions.length), 'WORKOUTS'),
      logStat(weekSessions.length + ' / ' + goal, 'WEEKLY GOAL'),
      logStat(String(streak), streak === 1 ? 'WEEK STREAK' : 'WEEK STREAK'),
      logStat(weekVol ? Math.round(weekVol / 1000) + 'k' : '0', 'VOLUME THIS WK')));

    v.appendChild(renderCalendar(workoutSet));

    v.appendChild(h('h2', { class: 'log-sec' }, 'Past Workouts'));
    if (!sessions.length) v.appendChild(h('p', { class: 'muted' }, 'No workouts logged yet. Finish a session and it shows up here.'));
    else v.appendChild(h('div', { class: 'pw-list' }, sessions.slice(0, 60).map((s) =>
      h('button', { class: 'pw-card', onclick: () => openSession(s.dk) },
        h('div', { class: 'pw-tile' }, '🏋️'),
        h('div', { class: 'pw-main' },
          h('div', { class: 'pw-title' }, dayTitle(s.log.dayId)),
          h('div', { class: 'pw-date' }, niceDate(s.dk)),
          h('div', { class: 'pw-stats' },
            h('span', null, logExCount(s.log) + ' exercises'),
            h('span', { class: 'pw-dot' }, '·'),
            h('span', null, Math.round(logVolume(s.log)).toLocaleString() + ' lb'))),
        h('span', { class: 'chev' }, '›')))));
  }
  function logStat(n, label) { return h('div', { class: 'log-stat' }, h('div', { class: 'log-stat-n' }, n), h('div', { class: 'log-stat-l' }, label)); }

  function renderCalendar(workoutSet) {
    if (!state.logMonth) { const d = new Date(); state.logMonth = { y: d.getFullYear(), m: d.getMonth() }; }
    const lm = state.logMonth;
    const todayKey = dateKeyOf(new Date());
    const first = new Date(lm.y, lm.m, 1);
    const pad = first.getDay(); // Sun=0
    const daysIn = new Date(lm.y, lm.m + 1, 0).getDate();
    const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const shift = (delta) => { let m = lm.m + delta, y = lm.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } state.logMonth = { y, m }; renderLog(); };
    const head = h('div', { class: 'cal-head' },
      h('button', { class: 'cal-nav', onclick: () => shift(-1), 'aria-label': 'Previous month' }, '‹'),
      h('div', { class: 'cal-month' }, MONTHS_FULL[lm.m] + ' ' + lm.y),
      h('button', { class: 'cal-nav', onclick: () => shift(1), 'aria-label': 'Next month' }, '›'));
    const dow = h('div', { class: 'cal-grid cal-dow' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => h('span', { class: 'cal-dowc' }, d)));
    const cells = [];
    for (let i = 0; i < pad; i++) cells.push(h('span', { class: 'cal-cell empty' }));
    for (let d = 1; d <= daysIn; d++) {
      const dk = lm.y + '-' + String(lm.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const has = workoutSet.has(dk);
      cells.push(h(has ? 'button' : 'span', {
        class: 'cal-cell' + (has ? ' has' : '') + (dk === todayKey ? ' today' : ''),
        onclick: has ? () => openSession(dk) : null
      }, String(d)));
    }
    return h('section', { class: 'card cal' }, head, dow, h('div', { class: 'cal-grid' }, cells));
  }

  async function openSession(dateKey) {
    state.sessionDate = dateKey;
    $('#sessionScreenDate').textContent = niceDate(dateKey);
    const body = $('#sessionScreenBody'); body.innerHTML = '';
    body.appendChild(h('p', { class: 'muted' }, 'Loading…'));
    $('#sessionScreen').hidden = false;
    const all = await WTStore.allLogs();
    const log = all['log:' + dateKey];
    body.innerHTML = '';
    if (!log) { body.appendChild(h('p', { class: 'muted' }, 'No workout logged this day.')); return; }

    // best est-1RM per lift name per date, for PR detection
    const series = {};
    Object.keys(all).forEach((k) => {
      const lg = all[k], dk = lg.dateKey || k.replace(/^log:/, '');
      Object.keys(lg.exercises || {}).forEach((exId) => {
        const nm = nameInLog(lg, exId); if (!nm) return;
        const sets = (lg.exercises[exId].sets || []).map((s) => ({ weight: parseFloat(s.weight), reps: parseFloat(s.reps) })).filter((s) => !isNaN(s.weight) && !isNaN(s.reps));
        if (!sets.length) return;
        const b = bestOneRm(sets);
        if (!series[nm]) series[nm] = {};
        if (series[nm][dk] == null || b > series[nm][dk]) series[nm][dk] = b;
      });
    });
    const isPR = (nm) => { const m = series[nm]; if (!m || m[dateKey] == null) return false; let mx = -Infinity; Object.keys(m).forEach((dk) => { if (dk < dateKey && m[dk] > mx) mx = m[dk]; }); return m[dateKey] > mx; };

    // ordered exercises (program order, then customs), with filled sets only
    const day = state.program.days.find((d) => d.id === log.dayId);
    const ordered = [];
    (day ? day.sections || [] : []).forEach((sec) => (sec.exercises || []).forEach((ex) => { if (log.exercises[ex.id]) ordered.push({ id: ex.id, name: ex.name, focus: ex.focus }); }));
    (log.customExercises || []).forEach((c) => { if (log.exercises[c.id]) ordered.push({ id: c.id, name: c.name }); });
    const withSets = ordered.map((ex) => {
      const e = log.exercises[ex.id];
      const sets = (e.sets || []).filter((s) => s.weight !== '' && s.reps !== '');
      return Object.assign({}, ex, { sets, note: e.note, pr: isPR(ex.name) && sets.length });
    }).filter((ex) => ex.sets.length);
    const focusId = (ordered.find((e) => e.focus) || ordered[0] || {}).id;
    const prCount = withSets.filter((e) => e.pr).length;

    body.appendChild(h('div', { class: 'ses-hero' },
      h('h1', null, dayTitle(log.dayId)),
      h('p', { class: 'ses-date' }, niceDate(dateKey))));
    body.appendChild(h('div', { class: 'ses-stats' },
      sesStat(Math.round(logVolume(log)).toLocaleString(), 'VOLUME (lb)'),
      sesStat(String(withSets.length), 'EXERCISES'),
      sesStat(prCount + (prCount ? ' 🏆' : ''), 'RECORDS')));

    if (!withSets.length) { body.appendChild(h('p', { class: 'muted' }, 'No sets were filled in for this day.')); return; }
    withSets.forEach((ex) => {
      body.appendChild(h('div', { class: 'ses-ex' },
        ex.id === focusId ? h('div', { class: 'focus-label' }, 'FOCUS EXERCISE') : null,
        h('div', { class: 'ses-ex-head' }, h('span', { class: 'ses-ex-name' }, ex.name), ex.pr ? h('span', { class: 'ses-pr' }, '🏆 PR') : null),
        h('div', { class: 'ses-sets' }, ex.sets.map((s, i) =>
          h('div', { class: 'ses-set' }, h('span', { class: 'ses-set-n' }, i + 1), h('span', null, s.reps + ' reps × ' + s.weight + ' lb')))),
        ex.note ? h('div', { class: 'ses-note' }, '“' + ex.note + '”') : null));
    });
  }
  function sesStat(n, label) { return h('div', { class: 'ses-stat' }, h('div', { class: 'ses-stat-n' }, n), h('div', { class: 'ses-stat-l' }, label)); }

  // ---------- bottom-nav section routing ----------
  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll('#bottomNav .navbtn').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const isWorkout = tab === 'workout';
    $('#topbar').hidden = !isWorkout;
    $('#dayView').hidden = !isWorkout;
    $('#otherView').hidden = isWorkout;
    if (tab === 'body') renderBody();
    else if (tab === 'targets') renderTargets();
    else if (tab === 'log') renderLog();
  }

  function render() { renderTabs(); renderWeekLabel(); renderWorkout(); }

  // ---------- switch day (loads that date's log) ----------
  async function switchDay(dayId) {
    state.activeDayId = dayId;
    state.dateKey = dateKeyOf(addDays(state.weekStart, dayIndex(dayId)));
    const stored = await WTStore.getLog(state.dateKey);
    state.log = stored || newSession(state.dateKey, dayId);
    // shape guards
    state.log.exercises = state.log.exercises || {};
    state.log.customExercises = state.log.customExercises || [];
    state.log.order = state.log.order || {};
    state.log.warmupChecks = state.log.warmupChecks || {};
    state.log.cardio = state.log.cardio || { minutes: '', distance: '', done: false };
    if (typeof state.log.sessionNotes !== 'string') state.log.sessionNotes = '';
    // ensure ex logs exist for this day
    const day = currentDay();
    (day.sections || []).forEach((s) => orderedExercises(s).forEach((ex) => ensureExLog(ex)));
    state.log.customExercises.forEach((ex) => ensureExLog(ex));
    render();
  }

  // ---------- copy for Claude ----------
  function buildSummary() {
    const day = currentDay();
    const lines = [];
    lines.push(day.title + ', ' + niceDate(state.dateKey));

    const c = state.log.cardio;
    if (c && (c.done || c.minutes || c.seconds || c.distance)) {
      const bits = [];
      if (c.minutes || c.seconds) {
        const m = c.minutes || '0';
        bits.push(c.seconds ? (m + ':' + String(c.seconds).padStart(2, '0') + ' min') : (m + ' min'));
      }
      if (c.distance) bits.push(c.distance + ' mi');
      if (c.done && !bits.length) bits.push('done');
      lines.push('', 'CARDIO (' + cap(day.cardio.kind) + '): ' + bits.join(', '));
    }

    const sections = (day.sections || []).slice();
    if (state.log.customExercises.length) sections.push({ id: 'custom', label: 'Added lifts', exercises: state.log.customExercises });

    sections.forEach((section) => {
      const exs = orderedExercises(section);
      const block = [];
      exs.forEach((ex) => {
        const e = state.log.exercises[ex.id]; if (!e) return;
        const setStrs = e.sets.filter((s) => s.weight !== '' && s.reps !== '').map((s) => s.weight + ' x ' + s.reps);
        if (!setStrs.length && !e.note) return;
        block.push('• ' + ex.name + ': ' + (setStrs.length ? setStrs.join(', ') : '—'));
        if (e.note) block.push('   note: ' + e.note);
      });
      if (block.length) { lines.push('', section.label.toUpperCase()); block.forEach((b) => lines.push(b)); }
    });

    lines.push('', 'SESSION VOLUME: ' + calcVolume().toLocaleString() + ' lb');
    lines.push('', 'SESSION NOTES:', state.log.sessionNotes || '—');
    return lines.join('\n');
  }

  async function copyForClaude() {
    const text = buildSummary();
    try { await navigator.clipboard.writeText(text); toast('Copied for Claude'); }
    catch (_) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied for Claude'); } catch (e) { toast('Copy failed'); }
      ta.remove();
    }
  }

  // ---------- finish & save (sync to Mac) ----------
  function buildPayload() {
    return {
      app: 'week-trainer', dateKey: state.dateKey, dayId: state.activeDayId,
      title: currentDay().title, niceDate: niceDate(state.dateKey),
      volume: calcVolume(), summary: buildSummary(), log: state.log
    };
  }
  async function postSession(payload) {
    const base = (state.config && state.config.syncUrl) ? state.config.syncUrl.replace(/\/+$/, '') : '';
    const res = await fetch(base + '/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  async function finishAndSave() {
    const payload = buildPayload();
    try { await WTStore.setLog(state.dateKey, state.log); } catch (e) {}
    // public build: nothing to sync to — the workout is saved on this phone
    if (window.WT_PUBLIC) { toast('Workout saved ✓'); return; }
    try {
      await postSession(payload);
      toast('Saved to your Mac ✓');
    } catch (e) {
      await WTStore.enqueueOutbox(payload);
      toast('Saved on phone — will sync when your Mac’s reachable');
    }
    flushOutbox();
  }
  let flushing = false;
  async function flushOutbox() {
    if (flushing) return; flushing = true;
    try {
      const items = await WTStore.listOutbox();
      for (const it of items) {
        try { await postSession(it.payload); await WTStore.removeOutbox(it.id); }
        catch (e) { break; } // likely unreachable — stop and try again later
      }
    } finally { flushing = false; updateSyncBadge(); }
  }
  async function updateSyncBadge() {
    const n = (await WTStore.listOutbox()).length;
    const badge = $('#syncBadge');
    if (badge) { badge.textContent = n ? String(n) : ''; badge.hidden = !n; }
    const pend = $('#syncPending');
    if (pend) pend.textContent = n ? (n + ' session' + (n === 1 ? '' : 's') + ' waiting to sync') : 'All sessions synced.';
  }

  // ---------- clear / data ----------
  async function clearDay() {
    if (!confirm('Clear all logged entries for ' + niceDate(state.dateKey) + '? The plan stays; your entries reset.')) return;
    await WTStore.deleteLog(state.dateKey);
    state.log = newSession(state.dateKey, state.activeDayId);
    const day = currentDay();
    (day.sections || []).forEach((s) => orderedExercises(s).forEach((ex) => ensureExLog(ex)));
    renderWorkout();
    $('#dataSheet').hidden = true;
    toast('Day cleared');
  }

  async function exportData() {
    const data = await WTStore.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: 'week-trainer-backup-' + dateKeyOf(new Date()) + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Exported');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('Import this backup? It overwrites any matching dates and the program plan.')) return;
        const res = await WTStore.importAll(data);
        const stored = await WTStore.getProgram();
        if (stored) state.program = stored;
        await switchDay(state.activeDayId);
        $('#dataSheet').hidden = true;
        toast('Imported ' + res.logs + ' day' + (res.logs === 1 ? '' : 's'));
      } catch (e) { toast(e.message || 'Import failed'); }
    };
    reader.readAsText(file);
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => { t.hidden = true; }, 250); }, 1300);
  }

  // ---------- wire up + init ----------
  async function init() {
    const stored = await WTStore.getProgram();
    state.program = (stored && stored.days && stored.days.length) ? stored : window.WT_PROGRAM;
    state.config = await WTStore.getConfig();
    state.body = await WTStore.getBody();
    state.targets = await WTStore.getTargets();

    // default to today's weekday if it exists, else first day
    const todayId = state.program.days[(new Date().getDay() + 6) % 7] ? state.program.days[(new Date().getDay() + 6) % 7].id : state.program.days[0].id;
    state.activeDayId = todayId;

    $('#weekPrev').addEventListener('click', () => { state.weekStart = addDays(state.weekStart, -7); switchDay(state.activeDayId); });
    $('#weekNext').addEventListener('click', () => { state.weekStart = addDays(state.weekStart, 7); switchDay(state.activeDayId); });
    $('#weekLabel').addEventListener('click', () => { state.weekStart = startOfWeek(new Date()); state.activeDayId = todayId; switchDay(todayId); });

    $('#btnCopy').addEventListener('click', () => { copyForClaude(); $('#dataSheet').hidden = true; });
    $('#btnClear').addEventListener('click', clearDay);
    $('#btnTools').addEventListener('click', () => { $('#macUrl').value = state.config.syncUrl || ''; updateSyncBadge(); $('#dataSheet').hidden = false; });
    $('#btnCloseData').addEventListener('click', () => { $('#dataSheet').hidden = true; });
    $('#dataSheet').addEventListener('click', (e) => { if (e.target.id === 'dataSheet') e.target.hidden = true; });
    $('#btnExport').addEventListener('click', exportData);
    $('#btnSyncNow').addEventListener('click', () => { flushOutbox(); toast('Syncing…'); });
    $('#macUrl').addEventListener('change', (e) => { state.config.syncUrl = e.target.value.trim(); WTStore.setConfig(state.config); toast('Sync URL saved'); flushOutbox(); });
    $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });

    // rest timer controls
    $('#restMinus').addEventListener('click', () => adjustRest(-10));
    $('#restPlus').addEventListener('click', () => adjustRest(10));
    $('#restPause').addEventListener('click', togglePauseRest);
    $('#restClose').addEventListener('click', dismissRest);
    $('#restSheetClose').addEventListener('click', () => { $('#restSheet').hidden = true; });
    $('#restSheet').addEventListener('click', (e) => { if (e.target.id === 'restSheet') e.target.hidden = true; });
    $('#restEnabled').addEventListener('change', (e) => {
      state.config.restEnabled = e.target.checked;
      WTStore.setConfig(state.config);
      if (!e.target.checked) dismissRest();
      renderRestOptions();
      refreshLiftDetail();
    });

    // custom keypad
    $('#keypad').addEventListener('click', (e) => { const k = e.target.closest('.kp-key'); if (k && !k.classList.contains('disabled')) keypadPress(k.dataset.k); });
    $('#kpAction').addEventListener('click', keypadAction);
    document.addEventListener('click', (e) => {
      // close on tap-outside, but never on the lift-close X (let it fall through to closeLift so one tap exits)
      if (!$('#keypad').hidden && !e.target.closest('#keypad') && !e.target.closest('.setbox') && !e.target.closest('#liftClose')) closeKeypad();
    });

    // note modal
    $('#noteCancel').addEventListener('click', closeNoteModal);
    $('#noteSave').addEventListener('click', saveNote);
    $('#noteModal').addEventListener('click', (e) => { if (e.target.id === 'noteModal') closeNoteModal(); });

    // history screen
    $('#histBack').addEventListener('click', () => { $('#histScreen').hidden = true; });
    $('#histTabs').addEventListener('click', (e) => { const b = e.target.closest('.seg-btn'); if (b) setHistTab(b.dataset.tab); });

    // bottom nav + lift detail
    $('#bottomNav').addEventListener('click', (e) => { const b = e.target.closest('.navbtn'); if (b) switchTab(b.dataset.tab); });
    $('#liftClose').addEventListener('click', closeLift);

    // body: measurement entry modal
    $('#bodyEntryCancel').addEventListener('click', () => { $('#bodyEntryModal').hidden = true; });
    $('#bodyEntrySave').addEventListener('click', saveBodyEntry);
    $('#bodyEntryDate').addEventListener('change', (e) => buildBodyFields(e.target.value));
    $('#bodyEntryModal').addEventListener('click', (e) => { if (e.target.id === 'bodyEntryModal') e.target.hidden = true; });
    // body: profile modal
    $('#profCancel').addEventListener('click', () => { $('#profileModal').hidden = true; });
    $('#profSave').addEventListener('click', saveProfile);
    $('#profileModal').addEventListener('click', (e) => { if (e.target.id === 'profileModal') e.target.hidden = true; });
    // body: full-screen detail (muscle + stat)
    $('#muscleScreenBack').addEventListener('click', () => { $('#muscleScreen').hidden = true; });
    $('#statScreenBack').addEventListener('click', () => { $('#statScreen').hidden = true; });
    // log: past-workout detail
    $('#sessionScreenBack').addEventListener('click', () => { $('#sessionScreen').hidden = true; });
    // targets: edit-target modal
    $('#targetCancel').addEventListener('click', () => { $('#targetModal').hidden = true; });
    $('#targetSave').addEventListener('click', saveTarget);
    $('#targetMinus').addEventListener('click', () => bumpTarget(-1));
    $('#targetPlus').addEventListener('click', () => bumpTarget(1));
    $('#targetModal').addEventListener('click', (e) => { if (e.target.id === 'targetModal') e.target.hidden = true; });

    // per-row options menu
    $('#rowMenu').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const c = state.menuCtx; $('#rowMenu').hidden = true;
      if (!c) return;
      if (b.dataset.act === 'up') move(c.sectionId, c.exId, -1);
      else if (b.dataset.act === 'down') move(c.sectionId, c.exId, 1);
      else if (b.dataset.act === 'remove') removeCustom(c.exId);
    });
    document.addEventListener('click', (e) => {
      if (!$('#rowMenu').hidden && !e.target.closest('#rowMenu') && !e.target.closest('.lift-menu')) $('#rowMenu').hidden = true;
    });

    // auto-sync queued sessions whenever we regain connectivity or reopen the app
    window.addEventListener('online', flushOutbox);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) flushOutbox(); });

    // lock the page scroll behind any overlay (iOS-safe) by watching their hidden state
    const lockObs = new MutationObserver(syncScrollLock);
    document.querySelectorAll('.screen, .sheet-backdrop, .modal-backdrop').forEach((el) => lockObs.observe(el, { attributes: true, attributeFilter: ['hidden'] }));

    await switchDay(todayId);
    updateSyncBadge();
    flushOutbox();
  }

  // ---------- iOS-safe scroll lock behind overlays ----------
  let _lockY = 0;
  function syncScrollLock() {
    // .lift-screen is EXCLUDED on purpose: it fully covers the page and has its own internal scroll
    // (.lift-body, overscroll-contain). Locking the body to position:fixed behind it broke iOS fixed
    // positioning — the keypad mis-anchored over the inputs, the page left a bottom gap, and the close
    // X got swallowed. Sheets, modals and the other full screens still lock.
    const open = !!document.querySelector('.screen:not(.lift-screen):not([hidden]), .sheet-backdrop:not([hidden]), .modal-backdrop:not([hidden])');
    const locked = document.body.classList.contains('scroll-locked');
    if (open && !locked) {
      _lockY = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.style.top = (-_lockY) + 'px';
      document.body.classList.add('scroll-locked');
    } else if (!open && locked) {
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';
      window.scrollTo(0, _lockY);
    }
  }

  // ---------- service worker: register + auto-reload when a new version takes over ----------
  if ('serviceWorker' in navigator) {
    // only reload on an UPDATE (page already controlled) — not on the first-ever load
    if (navigator.serviceWorker.controller) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return; refreshing = true; window.location.reload();
      });
    }
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => { if (reg.update) reg.update(); }).catch(() => {});
    });
  }

  init();
})();
