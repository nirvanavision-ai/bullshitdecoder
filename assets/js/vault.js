/**
 * vault.js — persistent local storage for uploaded materials.
 *
 * WHY THIS IS NOT A SERVER
 * ------------------------
 * The obvious reading of "a backend for materials" is a server that receives
 * uploads. For this project that would be the wrong build, and not because it is
 * hard: the materials people bring here are recordings and transcripts of their
 * own private lives, often naming other people. The moment those bytes leave the
 * device they become someone's liability — a breach, a subpoena, a hosting
 * provider's scanner, an admin with database access. The site's whole claim is
 * that this cannot happen because it structurally cannot happen.
 *
 * So the vault is a real persistence layer with real backend semantics — durable
 * storage, an object store, indexes, quota management, CRUD, export — that lives
 * entirely inside the visitor's browser via IndexedDB. Files survive reloads,
 * restarts, and days away. They never transit a network. Clearing them is one
 * button, and uninstalling is closing the tab and clicking "clear".
 *
 * If a hosted, multi-device archive is ever genuinely needed, the honest version
 * is a private, authenticated, encrypted-at-rest service that is nobody's public
 * website — see README, "If you really need a server".
 *
 * Public API (window.Vault):
 *   await Vault.ready()                  → open/upgrade the database
 *   await Vault.put(file, meta)          → store a File/Blob, returns record
 *   await Vault.all()                    → all records, newest first (no blobs)
 *   await Vault.get(id)                  → one record including its blob
 *   await Vault.remove(id)               → delete one
 *   await Vault.clear()                  → delete everything
 *   await Vault.usage()                  → { used, quota } in bytes
 *   Vault.objectURL(record)              → a blob: URL (caller revokes)
 */

(function (root) {
  "use strict";

  const DB_NAME = "bsd-vault";
  const DB_VERSION = 1;
  const STORE = "materials";
  let dbp = null;

  function ready() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!("indexedDB" in root)) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
          os.createIndex("addedAt", "addedAt");
          os.createIndex("kind", "kind");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function tx(mode, fn) {
    return ready().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      let out;
      try { out = fn(store); } catch (e) { reject(e); return; }
      t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error("transaction aborted"));
    }));
  }

  const kindOf = file =>
    /^audio\//.test(file.type) ? "audio"
    : /^video\//.test(file.type) ? "video"
    : /^image\//.test(file.type) ? "image"
    : /^text\/|\.(txt|md|csv|json|srt|vtt|log)$/i.test(file.type + file.name) ? "text"
    : "other";

  async function put(file, meta) {
    const rec = {
      name: file.name || "untitled",
      type: file.type || "application/octet-stream",
      size: file.size,
      kind: kindOf(file),
      addedAt: Date.now(),
      note: (meta && meta.note) || "",
      text: (meta && meta.text) || "",   // extracted transcript, if any
      blob: file,
    };
    const id = await tx("readwrite", store => store.add(rec));
    return Object.assign({ id }, rec);
  }

  /** Records without blobs — cheap to list. */
  function all() {
    return tx("readonly", store => {
      const out = [];
      store.openCursor(null, "prev").onsuccess = e => {
        const c = e.target.result;
        if (!c) return;
        const { blob, ...rest } = c.value;
        out.push(rest);
        c.continue();
      };
      return { get result() { return out; } };
    });
  }

  const get = id => tx("readonly", store => store.get(id));
  const remove = id => tx("readwrite", store => store.delete(id));
  const clear = () => tx("readwrite", store => store.clear());

  async function usage() {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage: used = 0, quota = 0 } = await navigator.storage.estimate();
      return { used, quota };
    }
    return { used: 0, quota: 0 };
  }

  const objectURL = rec => URL.createObjectURL(rec.blob);

  /** Manifest of what's held — metadata only, never the bytes. */
  async function manifest() {
    const recs = await all();
    return {
      generated: new Date().toISOString(),
      note: "Metadata only. Media never left the browser that produced this file.",
      count: recs.length,
      items: recs.map(r => ({
        name: r.name, kind: r.kind, type: r.type, size: r.size,
        added: new Date(r.addedAt).toISOString(), note: r.note,
        words: r.text ? r.text.split(/\s+/).length : 0,
      })),
    };
  }

  root.Vault = { ready, put, all, get, remove, clear, usage, objectURL, manifest, kindOf };
})(window);
