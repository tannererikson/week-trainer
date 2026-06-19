/* Week Trainer — durable storage layer.
   Self-contained promise wrapper over IndexedDB (no external deps, fully offline).
   One DB, one key/value object store. Keys:
     'program'      -> program template snapshot (optional; falls back to seed config)
     'log:<dateKey>'-> SessionLog for that calendar date
   Logs are kept separate from the program so editing the plan never alters past logs. */
(function () {
  'use strict';

  const DB_NAME = 'week-trainer';
  const DB_VERSION = 1;
  const STORE = 'kv';
  const LOG_PREFIX = 'log:';
  const PROGRAM_KEY = 'program';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      let result;
      const r = fn(store);
      if (r) r.onsuccess = () => { result = r.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  function get(key) { return tx('readonly', (s) => s.get(key)); }
  function set(key, val) { return tx('readwrite', (s) => s.put(val, key)); }
  function del(key) { return tx('readwrite', (s) => s.delete(key)); }

  function keys() {
    return tx('readonly', (s) => s.getAllKeys());
  }

  function entries(prefix) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const out = {};
      const t = db.transaction(STORE, 'readonly');
      const cursorReq = t.objectStore(STORE).openCursor();
      cursorReq.onsuccess = () => {
        const cur = cursorReq.result;
        if (cur) {
          if (!prefix || String(cur.key).startsWith(prefix)) out[cur.key] = cur.value;
          cur.continue();
        }
      };
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
    }));
  }

  // ---- domain helpers ----
  const logKey = (dateKey) => LOG_PREFIX + dateKey;

  const WTStore = {
    getProgram() { return get(PROGRAM_KEY); },
    setProgram(p) { return set(PROGRAM_KEY, p); },

    getLog(dateKey) { return get(logKey(dateKey)); },
    setLog(dateKey, log) { return set(logKey(dateKey), log); },
    deleteLog(dateKey) { return del(logKey(dateKey)); },
    allLogs() { return entries(LOG_PREFIX); },

    // Whole-database snapshot for backup.
    async exportAll() {
      const all = await entries('');
      const logs = {};
      let program = null, body = null, targets = null;
      Object.keys(all).forEach((k) => {
        if (k === PROGRAM_KEY) program = all[k];
        else if (k === 'body') body = all[k];
        else if (k === 'targets') targets = all[k];
        else if (k.startsWith(LOG_PREFIX)) logs[k.slice(LOG_PREFIX.length)] = all[k];
      });
      return { app: 'week-trainer', version: 1, exportedAt: new Date().toISOString(), program, body, targets, logs };
    },

    // ---- body metrics (bodyweight + measurements over time) ----
    // Shape: { entries: { '<YYYY-MM-DD>': { <metricKey>: <number> } } }
    getBody() { return get('body').then((b) => b || { entries: {} }); },
    setBody(b) { return set('body', b); },

    // ---- weekly set targets per muscle ({ <muscleKey>: <sets> }, overrides defaults) ----
    getTargets() { return get('targets').then((t) => t || {}); },
    setTargets(t) { return set('targets', t); },

    // ---- sync: config + outbox of unsent sessions ----
    getConfig() { return get('config').then((c) => c || {}); },
    setConfig(c) { return set('config', c); },
    enqueueOutbox(item) {
      const id = 'outbox:' + Date.now() + ':' + Math.floor(Math.random() * 1e6);
      return set(id, item).then(() => id);
    },
    listOutbox() { return entries('outbox:').then((o) => Object.keys(o).sort().map((k) => ({ id: k, payload: o[k] }))); },
    removeOutbox(id) { return del(id); },

    // Restore from a backup object. Overwrites matching keys; leaves others intact.
    async importAll(data) {
      if (!data || typeof data !== 'object') throw new Error('Not a Week Trainer backup file.');
      if (data.app && data.app !== 'week-trainer') throw new Error('This JSON is not a Week Trainer backup.');
      const logs = data.logs || {};
      if (data.program) await set(PROGRAM_KEY, data.program);
      if (data.body) await set('body', data.body);
      if (data.targets) await set('targets', data.targets);
      const dateKeys = Object.keys(logs);
      for (const dk of dateKeys) await set(logKey(dk), logs[dk]);
      return { logs: dateKeys.length, program: !!data.program };
    }
  };

  window.WTStore = WTStore;
})();
