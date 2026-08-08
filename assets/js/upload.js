/**
 * upload.js — local file & video intake, shared by the consoles.
 *
 * IMPORTANT, and the reason this file is short: nothing is uploaded anywhere.
 * There is no server on this site, so "upload" here means "open locally" —
 * files are read with the FileReader/Blob APIs inside your own tab, used, and
 * dropped when you close it. That keeps the site's core promise intact: private
 * material never leaves the device.
 *
 * Text-bearing files (.txt, .md, .csv, .json, .srt, .vtt) are read and handed to
 * the analyzer. Audio and video are attached to a local player via an object URL.
 * Images are previewed. Nothing is ever transmitted.
 *
 * Usage:
 *   mountUploader(containerEl, { onText(text, file), accept, label })
 */

(function (root) {
  const TEXTY = /\.(txt|md|markdown|csv|tsv|json|log|srt|vtt|rtf|eml)$/i;
  const MEDIA = /^(audio|video|image)\//;

  const fmt = bytes =>
    bytes < 1024 ? bytes + " B"
    : bytes < 1048576 ? (bytes / 1024).toFixed(0) + " KB"
    : (bytes / 1048576).toFixed(1) + " MB";

  /** Strip subtitle timing so transcripts analyse as prose. */
  function cleanSubtitles(text) {
    return text
      .replace(/^\d+\s*$/gm, "")
      .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->.*$/gm, "")
      .replace(/^WEBVTT.*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function mountUploader(host, opts) {
    opts = opts || {};
    const accept = opts.accept || ".txt,.md,.csv,.json,.srt,.vtt,.log,audio/*,video/*,image/*";
    host.classList.add("uploadzone");
    host.innerHTML = `
      <div class="uz-head">${opts.label || "Add your own files"}</div>
      <div class="uz-actions">
        <button type="button" data-act="pick">Choose files</button>
        <button type="button" data-act="video">Add audio or video</button>
      </div>
      <input type="file" hidden multiple accept="${accept}" data-role="file">
      <input type="file" hidden multiple accept="audio/*,video/*" data-role="media">
      <p class="uz-hint">Or drag them here. Nothing is uploaded — files are opened locally in this tab
        and discarded when you close it. Transcripts (.srt/.vtt/.txt) are read straight into the analysis.</p>
      <ul class="uz-list" data-role="list"></ul>`;

    const list = host.querySelector('[data-role="list"]');
    const filePick = host.querySelector('[data-role="file"]');
    const mediaPick = host.querySelector('[data-role="media"]');

    host.querySelector('[data-act="pick"]').onclick = () => filePick.click();
    host.querySelector('[data-act="video"]').onclick = () => mediaPick.click();
    filePick.onchange = e => handle(e.target.files);
    mediaPick.onchange = e => handle(e.target.files);

    ["dragenter", "dragover"].forEach(ev =>
      host.addEventListener(ev, e => { e.preventDefault(); host.classList.add("drag"); }));
    ["dragleave", "drop"].forEach(ev =>
      host.addEventListener(ev, e => { e.preventDefault(); host.classList.remove("drag"); }));
    host.addEventListener("drop", e => handle(e.dataTransfer.files));

    function row(file, extra) {
      const li = document.createElement("li");
      li.className = "uz-item";
      li.innerHTML = `
        <div>
          <div class="uz-name">${file.name.replace(/</g, "&lt;")}</div>
          <div class="uz-meta">${fmt(file.size)} · ${file.type || "unknown type"}${extra ? " · " + extra : ""}</div>
        </div>
        <button class="uz-x" type="button" aria-label="Remove">×</button>`;
      li.querySelector(".uz-x").onclick = () => {
        const media = li.querySelector("audio,video,img");
        if (media && media.src.startsWith("blob:")) URL.revokeObjectURL(media.src);
        li.remove();
      };
      list.appendChild(li);
      return li;
    }

    function handle(files) {
      [...files].forEach(file => {
        const isText = TEXTY.test(file.name) || /^text\//.test(file.type);
        if (isText) {
          const r = new FileReader();
          r.onload = () => {
            let text = String(r.result || "");
            if (/\.(srt|vtt)$/i.test(file.name)) text = cleanSubtitles(text);
            const li = row(file, `${text.split(/\s+/).length} words · read locally`);
            if (typeof opts.onText === "function") opts.onText(text, file, li);
          };
          r.readAsText(file);
          return;
        }
        if (MEDIA.test(file.type)) {
          const li = row(file, "playing locally");
          const url = URL.createObjectURL(file);
          const kind = file.type.startsWith("video") ? "video"
                    : file.type.startsWith("audio") ? "audio" : "img";
          const el = document.createElement(kind);
          el.className = "uz-media";
          el.src = url;
          if (kind !== "img") { el.controls = true; el.preload = "metadata"; }
          if (kind === "img") el.alt = file.name;
          li.insertAdjacentElement("afterend", Object.assign(document.createElement("li"), {
            className: "uz-item", style: "display:block",
          })).appendChild(el);
          return;
        }
        row(file, "unsupported for analysis — stored locally only");
      });
    }

    return { clear() { list.innerHTML = ""; } };
  }

  root.mountUploader = mountUploader;
})(window);
