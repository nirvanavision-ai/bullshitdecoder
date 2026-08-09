/**
 * upload.js — materials intake, shared by every console.
 *
 * NOTHING IS UPLOADED. There is no server on this site. "Upload" here means
 * "open on your own machine": files are read through FileReader/Blob APIs inside
 * your tab, and — when the vault is available (assets/js/vault.js) — persisted to
 * this browser's own IndexedDB so they survive reloads and are restored on your
 * next visit. They never transit a network. Erasing them is one button.
 *
 * Text-bearing files (.txt .md .csv .json .srt .vtt .log) are read and handed to
 * the analyzer, with subtitle timing stripped so transcripts read as prose.
 * Audio, video, and images attach a local player or preview.
 *
 * Usage:
 *   mountUploader(el, { label, accept, persist = true, onText(text, file, li) })
 */

(function (root) {
  "use strict";

  const TEXTY = /\.(txt|md|markdown|csv|tsv|json|log|srt|vtt|rtf|eml)$/i;
  const MEDIA = /^(audio|video|image)\//;

  const fmt = b =>
    b < 1024 ? b + " B" :
    b < 1048576 ? (b / 1024).toFixed(0) + " KB" :
    (b / 1048576).toFixed(1) + " MB";

  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  /** Strip cue numbers and timecodes so a subtitle file analyses as prose. */
  const cleanSubtitles = t => t
    .replace(/^\d+\s*$/gm, "")
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->.*$/gm, "")
    .replace(/^WEBVTT.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  function mountUploader(host, opts) {
    opts = opts || {};
    const accept = opts.accept || ".txt,.md,.csv,.json,.srt,.vtt,.log,audio/*,video/*,image/*";
    const vaultOn = opts.persist !== false && typeof root.Vault !== "undefined";

    host.classList.add("uploadzone");
    host.innerHTML = `
      <div class="uz-head">${esc(opts.label || "Add your own materials")}</div>
      <div class="uz-actions">
        <button type="button" data-act="pick">Choose files</button>
        <button type="button" data-act="media">Add audio or video</button>
      </div>
      <input type="file" hidden multiple accept="${accept}" data-role="file">
      <input type="file" hidden multiple accept="audio/*,video/*" data-role="mediapick">
      <p class="uz-hint" data-role="hint"></p>
      <div class="uz-vaultbar" data-role="vaultbar" hidden>
        <span data-role="vaultstat"></span>
        <button type="button" data-act="manifest">Export manifest</button>
        <button type="button" data-act="wipe">Erase vault</button>
      </div>
      <ul class="uz-list" data-role="list"></ul>`;

    const $r = sel => host.querySelector(`[data-role="${sel}"]`);
    const $a = sel => host.querySelector(`[data-act="${sel}"]`);
    const list = $r("list"), vaultbar = $r("vaultbar"), vaultstat = $r("vaultstat");

    $r("hint").innerHTML = vaultOn
      ? "Or drag them here. <b>Nothing is uploaded.</b> Materials are held in this browser's own vault — " +
        "they survive reloads, never touch a network, and erasing them is one button."
      : "Or drag them here. <b>Nothing is uploaded.</b> Files open locally in this tab and are discarded " +
        "when you close it.";

    /* ---------- vault status ---------- */
    async function refreshBar() {
      if (!vaultOn) return;
      try {
        const recs = await Vault.all();
        const { used, quota } = await Vault.usage();
        vaultbar.hidden = recs.length === 0;
        vaultstat.textContent = recs.length
          ? `${recs.length} item${recs.length === 1 ? "" : "s"} held locally · ${fmt(used)}` +
            (quota ? ` of ${fmt(quota)} available` : "")
          : "";
      } catch (e) { vaultbar.hidden = true; }
    }

    /* ---------- one row per material ---------- */
    function attach(file, rec, restored) {
      const li = document.createElement("li");
      li.className = "uz-item";
      const kind = rec ? rec.kind : (root.Vault ? Vault.kindOf(file) : "other");
      const extra = restored ? "from vault" : kind === "text" ? "read into analysis" : "playing locally";
      li.innerHTML = `
        <div>
          <div class="uz-name">${esc(file.name || rec.name)}</div>
          <div class="uz-meta">${fmt(file.size)} · ${esc(file.type || "unknown")} · ${extra}</div>
        </div>
        <button class="uz-x" type="button" aria-label="Remove this material">×</button>`;
      list.appendChild(li);

      let mediaLi = null;
      if (MEDIA.test(file.type)) {
        mediaLi = document.createElement("li");
        mediaLi.className = "uz-item";
        mediaLi.style.display = "block";
        const tag = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "img";
        const el = document.createElement(tag);
        el.className = "uz-media";
        el.src = URL.createObjectURL(file);
        if (tag === "img") el.alt = file.name || "";
        else { el.controls = true; el.preload = "metadata"; }
        mediaLi.appendChild(el);
        list.appendChild(mediaLi);
      }

      li.querySelector(".uz-x").onclick = async () => {
        const m = mediaLi && mediaLi.querySelector("audio,video,img");
        if (m && m.src.startsWith("blob:")) URL.revokeObjectURL(m.src);
        if (mediaLi) mediaLi.remove();
        li.remove();
        if (vaultOn && rec && rec.id != null) { await Vault.remove(rec.id); refreshBar(); }
      };
      return li;
    }

    /* ---------- intake ---------- */
    function handle(files) {
      [...files].forEach(file => {
        const isText = TEXTY.test(file.name) || /^text\//.test(file.type);
        if (isText) {
          const r = new FileReader();
          r.onload = async () => {
            let text = String(r.result || "");
            if (/\.(srt|vtt)$/i.test(file.name)) text = cleanSubtitles(text);
            let rec = null;
            if (vaultOn) { try { rec = await Vault.put(file, { text }); refreshBar(); } catch (e) {} }
            const li = attach(file, rec, false);
            if (typeof opts.onText === "function") opts.onText(text, file, li);
          };
          r.readAsText(file);
          return;
        }
        (async () => {
          let rec = null;
          if (vaultOn) { try { rec = await Vault.put(file, {}); refreshBar(); } catch (e) {} }
          attach(file, rec, false);
        })();
      });
    }

    /* ---------- controls ---------- */
    $a("pick").onclick = () => $r("file").click();
    $a("media").onclick = () => $r("mediapick").click();
    $r("file").onchange = e => handle(e.target.files);
    $r("mediapick").onchange = e => handle(e.target.files);

    ["dragenter", "dragover"].forEach(ev =>
      host.addEventListener(ev, e => { e.preventDefault(); host.classList.add("drag"); }));
    ["dragleave", "drop"].forEach(ev =>
      host.addEventListener(ev, e => { e.preventDefault(); host.classList.remove("drag"); }));
    host.addEventListener("drop", e => handle(e.dataTransfer.files));

    if (vaultOn) {
      $a("wipe").onclick = async () => {
        if (!confirm("Erase every material stored in this browser? This cannot be undone.")) return;
        await Vault.clear();
        list.innerHTML = "";
        refreshBar();
      };
      $a("manifest").onclick = async () => {
        const blob = new Blob([JSON.stringify(await Vault.manifest(), null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "vault-manifest.json";
        a.click();
        URL.revokeObjectURL(a.href);
      };
    }

    /* ---------- restore previous session ---------- */
    (async function restore() {
      if (!vaultOn) return;
      try {
        const metas = await Vault.all();
        for (const meta of metas.slice().reverse()) {
          const rec = await Vault.get(meta.id);
          if (rec && rec.blob) attach(rec.blob, rec, true);
        }
        refreshBar();
      } catch (e) { /* private browsing or storage denied — intake still works */ }
    })();

    return { refresh: refreshBar };
  }

  root.mountUploader = mountUploader;
})(window);
