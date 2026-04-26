import * as auth from "./auth.js";

// ============ STATE ============
const state = {
  screen: "home",
  skill: null,
  videoFile: null,
  videoUrl: null,
  result: null,
  error: null,
  progress: 0,
  stage: 0,
  frames: [],
  stageText: "",
  history: [],
  historyLoading: false,
  authMode: "magic", // "magic" | "password" | "google"
  authBusy: false,
  authMessage: null,
  authMessageType: null,
};

const SKILLS = [
  { id: "wrist", name: "Wrist Shot", icon: "🎯" },
  { id: "snap", name: "Snap Shot", icon: "💥" },
  { id: "slap", name: "Slap Shot", icon: "⚡" },
  { id: "back", name: "Backhand", icon: "↩️" },
  { id: "stride", name: "Skating Stride", icon: "💨" },
  { id: "crossovers", name: "Crossovers", icon: "❌" },
  { id: "tightturns", name: "Tight Turns", icon: "🌀" },
  { id: "stops", name: "Hockey Stops", icon: "🛑" },
  { id: "backwards", name: "Backwards Skating", icon: "⏪" },
  { id: "stick", name: "Stickhandling", icon: "🔵" },
];

const skillName = id => SKILLS.find(s => s.id === id)?.name || id;
const skillIcon = id => SKILLS.find(s => s.id === id)?.icon || "🏒";

// ============ ICONS ============
const icons = {
  plus:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  back:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  right:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  upload:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  sparkle:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  alert:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  home:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  stats:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  user:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  logo:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>',
  trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>',
  google:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
  mail:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  switchUser:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  edit:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  logout:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
};

// ============ FRAME EXTRACTION ============
async function extractFrames(file, n, onProg, onStage) {
  const fileInfo = `(${file.name||"video"}, ${(file.size/1024/1024).toFixed(1)}MB, type: ${file.type||"unknown"})`;
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto";
  v.setAttribute("muted",""); v.setAttribute("playsinline",""); v.setAttribute("webkit-playsinline","");
  v.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0";
  document.body.appendChild(v);
  const cleanup = () => { try{document.body.removeChild(v)}catch{} URL.revokeObjectURL(url); };
  try {
    onStage?.("Loading video");
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Video load timed out after 20s ${fileInfo}`)), 20000);
      const ready = () => {
        clearTimeout(t);
        if (!v.videoWidth || !v.videoHeight) return reject(new Error(`Video loaded but has no visible dimensions ${fileInfo}`));
        if (!isFinite(v.duration) || v.duration <= 0) return reject(new Error(`Video loaded but duration is invalid (${v.duration}) ${fileInfo}`));
        resolve();
      };
      const err = () => {
        clearTimeout(t);
        const e = v.error;
        const m = {1:"ABORTED",2:"NETWORK",3:"DECODE",4:"SRC_NOT_SUPPORTED"};
        reject(new Error(`Video decode failed: ${m[e?.code]||"unknown"} — ${e?.message||"no details"} ${fileInfo}`));
      };
      v.addEventListener("loadeddata", ready);
      v.addEventListener("canplay", ready);
      v.addEventListener("error", err);
      v.src = url; v.load();
    });
    const dur = v.duration;
    const c = document.createElement("canvas");
    const w = 384; c.width = w; c.height = Math.round(w * (v.videoHeight / v.videoWidth));
    const ctx = c.getContext("2d");
    onStage?.("Extracting frames");
    const frames = [];
    for (let i = 0; i < n; i++) {
      const time = (dur / (n + 1)) * (i + 1);
      try {
        await new Promise((res, rej) => {
          const s = () => { v.removeEventListener("seeked", s); res(); };
          v.addEventListener("seeked", s);
          v.currentTime = time;
          setTimeout(() => { v.removeEventListener("seeked", s); rej(new Error(`Could not seek to ${time.toFixed(1)}s ${fileInfo}`)); }, 10000);
        });
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const d = c.toDataURL("image/jpeg", 0.5);
        if (!d || d.length < 100) throw new Error(`Frame ${i+1} extracted blank`);
        frames.push({ time: time.toFixed(1), base64: d.split(",")[1], preview: d });
        onProg?.((i + 1) / n);
      } catch (frameErr) {
        throw new Error(`Frame ${i+1}/${n}: ${frameErr.message}`);
      }
    }
    cleanup();
    return { frames, duration: dur };
  } catch (err) { cleanup(); throw err; }
}

// ============ BACKEND CALL ============
async function callBackend(frames, skill, duration) {
  const totalKB = frames.reduce((sum, f) => sum + f.base64.length * 0.75 / 1024, 0);
  if (totalKB > 4000) throw new Error(`Frames are too large (${Math.round(totalKB)}KB total, max 4000KB). Try a shorter clip.`);

  const headers = { "Content-Type": "application/json", ...(await auth.getAuthHeaders()) };
  const profileId = auth.getCurrentProfile()?.id || null;
  const body = JSON.stringify({ frames, skill, duration, profileId: profileId === "local" ? null : profileId });

  let r;
  try {
    r = await fetch("/api/analyze", { method: "POST", headers, body });
  } catch (netErr) {
    throw new Error(`Network error reaching server: ${netErr.message || netErr}`);
  }
  if (!r.ok) {
    let detail = "";
    try { const j = await r.json(); detail = j.error || ""; if (j.detail) detail += ": " + j.detail; }
    catch { detail = `HTTP ${r.status}`; }
    if (r.status === 413) detail = "Frames too large for server (413). Try a shorter video. — " + detail;
    throw new Error(`Server returned ${r.status}: ${detail}`);
  }
  return await r.json();
}

// ============ TOAST ============
function toast(message, type = "info", ms = 3000) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, ms);
}

// ============ ROUTING ============
function go(screen) { state.screen = screen; renderScreen(); renderTabBar(); }

function renderScreen() {
  const el = document.getElementById("screen");
  if (!el) return;
  const fns = {
    home: Home, skill: Skill, upload: Upload, analyzing: Analyzing,
    results: Results, workout: Workout, error: ErrorS,
    stats: Stats, profile: Profile, login: Login, profileSetup: ProfileSetup,
    profileEdit: ProfileEdit, profileNew: ProfileNew,
  };
  const fn = fns[state.screen] || Home;
  el.innerHTML = `<div class="page">${fn()}</div>`;
  bind();
}

// ============ HOME SCREEN ============
function Home() {
  const profile = auth.getCurrentProfile();
  const profileName = profile?.name || "Player";
  const initials = profileName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem">
      <div style="display:flex;align-items:center;gap:.5rem;color:var(--ice)">${icons.logo}<span class="bebas" style="font-size:1.5rem;color:var(--text)">RINK</span><span class="bebas" style="font-size:1.5rem;color:var(--ice)">AI</span></div>
      <button data-a="goto-profile" style="width:2.25rem;height:2.25rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:var(--surface-hi);border:1px solid var(--border)">
        <span class="bebas" style="font-size:.875rem;color:var(--ice)">${initials}</span>
      </button>
    </div>
    <p class="slabel" style="margin-bottom:.25rem">Welcome${profile ? `, ${profileName.split(" ")[0]}` : " back"}</p>
    <h1 class="bebas" style="font-size:44px;line-height:1">LET'S GET<br>SHARPER.</h1>
    <button data-a="new" class="btn btn-red" style="margin-top:1.75rem">
      <div style="text-align:left">
        <div class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;opacity:.8;margin-bottom:.25rem;font-weight:500">New session</div>
        <div class="bebas" style="font-size:1.625rem">ANALYZE A CLIP</div>
      </div>
      <div style="width:3rem;height:3rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)">${icons.plus}</div>
    </button>
    ${!auth.isLoggedIn() && auth.isConfigured() ? `
      <button data-a="goto-login" style="width:100%;margin-top:.75rem;padding:1rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;gap:.5rem;color:var(--ice)">
        <span style="font-size:.875rem;font-weight:600">Sign in to save sessions across devices</span>
      </button>
    ` : ""}
    <div style="margin-top:1.75rem;padding:1.25rem;border-radius:1rem;background:rgba(91,192,235,.06);border:1px solid rgba(91,192,235,.2)">
      <div style="display:flex;gap:.75rem;align-items:flex-start">
        <div style="color:var(--ice);flex-shrink:0;margin-top:.125rem">${icons.sparkle}</div>
        <div>
          <div style="font-size:.875rem;font-weight:700">Real AI analysis</div>
          <div style="margin-top:.25rem;font-size:.75rem;color:var(--muted);line-height:1.5">Your video is broken into frames and sent to Claude, who reviews your mechanics and builds a personalized plan.</div>
        </div>
      </div>
    </div>
    ${state.result ? `
      <div style="margin-top:2rem;margin-bottom:.75rem"><h2 class="slabel" style="font-weight:700">Last session</h2></div>
      <button data-a="view-last" class="card" style="width:100%;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="width:3rem;height:3rem;border-radius:.75rem;display:flex;align-items:center;justify-content:center;background:var(--surface-hi);font-size:1.5rem">${skillIcon(state.skill)}</div>
          <div style="text-align:left">
            <div style="font-size:.875rem;font-weight:700">${skillName(state.skill)}</div>
            <div style="font-size:.75rem;margin-top:.125rem;color:var(--muted)">Just now</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <div style="text-align:right">
            <div class="bebas" style="font-size:1.25rem;line-height:1">${state.result.score}</div>
            <div class="mono" style="font-size:10px;color:var(--ice);font-weight:600">${state.result.grade}</div>
          </div>
          <div style="color:var(--muted-dim)">${icons.right}</div>
        </div>
      </button>
    ` : ""}
  `;
}

// ============ SKILL SELECT ============
function Skill() {
  return `
    <button data-a="back-home" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <p class="slabel">Step 1 of 2</p>
    <h1 class="title">WHAT ARE WE<br>WORKING ON?</h1>
    <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted)">Pick the skill in your video so the AI knows what to look for.</p>
    <div style="margin-top:1.75rem;display:flex;flex-direction:column;gap:.75rem">
      ${SKILLS.map(s => `
        <button data-a="pick-skill" data-skill="${s.id}" class="sbtn">
          <div style="display:flex;align-items:center;gap:1rem">
            <div class="sicon">${s.icon}</div>
            <span class="bebas" style="font-size:1.25rem">${s.name.toUpperCase()}</span>
          </div>
          <div style="color:var(--muted-dim)">${icons.right}</div>
        </button>
      `).join("")}
    </div>
  `;
}

// ============ UPLOAD ============
function Upload() {
  const sk = SKILLS.find(s => s.id === state.skill);
  return `
    <button data-a="back-skill" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <p class="slabel">Step 2 of 2 · ${sk?.name}</p>
    <h1 class="title">UPLOAD<br>YOUR CLIP.</h1>
    <input type="file" accept="video/*" id="fi" style="display:none"/>
    <button data-a="pick-file" style="width:100%;margin-top:1.75rem;padding:2rem;border-radius:1.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--surface);border:2px dashed var(--border);min-height:220px">
      <div style="width:4rem;height:4rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;background:var(--surface-hi);color:var(--ice)">${icons.upload}</div>
      <div class="bebas" style="font-size:1.375rem">TAP TO SELECT VIDEO</div>
      <div style="margin-top:.375rem;font-size:.8125rem;color:var(--muted)">MP4 · MOV · HEVC from iPhone works</div>
    </button>
    <div class="card" style="margin-top:1.5rem;padding:1.25rem">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;color:var(--ice)">
        ${icons.sparkle}<span class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;font-weight:600">For best results</span>
      </div>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.625rem">
        ${[
          "Film from the side, full body in frame",
          "Good lighting, avoid backlight",
          "Steady camera (tripod or fence)",
          "Shots: on-ice OR off-ice (shooting pad, garage) both work",
          "3-15 second clip of a single sequence",
        ].map(t => `<li style="display:flex;gap:.75rem;align-items:flex-start;font-size:.875rem"><div style="color:var(--good);margin-top:.125rem;flex-shrink:0">${icons.check}</div>${t}</li>`).join("")}
      </ul>
    </div>
  `;
}

// ============ ANALYZING ============
function Analyzing() {
  const stages = ["Loading video", "Extracting frames", "Sending to Claude", "Analyzing form", "Building plan"];
  const pct = Math.round(state.progress);
  return `
    <p class="slabel" style="color:var(--ice);font-weight:600">Analyzing</p>
    <h1 class="title">BREAKING DOWN<br>YOUR FORM.</h1>
    <div style="position:relative;margin-top:1.5rem;border-radius:1.5rem;overflow:hidden;background:#000;aspect-ratio:9/12">
      ${state.videoUrl ? `<video src="${state.videoUrl}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover"></video>` : ""}
      <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 60%,rgba(0,0,0,.85) 100%)"></div>
      <div style="position:absolute;top:1rem;left:1rem;right:1rem;display:flex;justify-content:space-between;align-items:center">
        <div style="padding:.375rem .75rem;border-radius:9999px;display:flex;align-items:center;gap:.5rem;background:rgba(0,0,0,.6);backdrop-filter:blur(8px)">
          <div class="pulse" style="width:.5rem;height:.5rem;border-radius:9999px;background:var(--fire)"></div>
          <span class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:#fff;font-weight:600">Claude AI</span>
        </div>
        <div style="padding:.375rem .75rem;border-radius:9999px;background:rgba(0,0,0,.6);backdrop-filter:blur(8px)">
          <span id="pct" class="mono" style="font-size:.75rem;color:#fff;font-weight:600">${pct}%</span>
        </div>
      </div>
      <div style="position:absolute;bottom:1rem;left:1rem;right:1rem">
        <div id="stagetext" class="mono" style="font-size:.75rem;margin-bottom:.5rem;color:#fff;opacity:.9;font-weight:500">${state.stageText || stages[state.stage] + "..."}</div>
        <div style="width:100%;height:4px;border-radius:9999px;overflow:hidden;background:rgba(255,255,255,.2)">
          <div id="pbar" style="height:100%;border-radius:9999px;transition:all .3s;width:${pct}%;background:var(--ice)"></div>
        </div>
      </div>
    </div>
    <div id="framelist">${state.frames.length > 0 ? framelistHtml() : ""}</div>
    <div id="stagelist" style="margin-top:1.25rem;display:flex;flex-direction:column;gap:.625rem">${stagelistHtml(stages)}</div>
  `;
}

function framelistHtml() {
  return `<div style="margin-top:1.25rem"><div class="slabel" style="font-weight:600;margin-bottom:.75rem">Frames sent to AI</div>
    <div class="no-sb" style="display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.5rem">
      ${state.frames.map(f => `
        <div style="flex-shrink:0;border-radius:.5rem;overflow:hidden;position:relative;width:70px;height:70px;border:1px solid var(--border)">
          <img src="${f.preview}" alt="" style="width:100%;height:100%;object-fit:cover"/>
          <div class="mono" style="position:absolute;bottom:0;left:0;right:0;padding:.125rem .25rem;font-size:9px;background:rgba(0,0,0,.7);color:#fff">${f.time}s</div>
        </div>
      `).join("")}
    </div></div>`;
}

function stagelistHtml(stages) {
  return stages.map((s, i) => {
    const d = i < state.stage, a = i === state.stage;
    return `<div style="display:flex;align-items:center;gap:.75rem">
      <div style="width:1.5rem;height:1.5rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:${d?"var(--ice)":a?"rgba(91,192,235,.2)":"var(--surface)"};border:1px solid ${d||a?"var(--ice)":"var(--border)"}">
        ${d ? `<div style="color:var(--bg)">${icons.check}</div>` : a ? '<div class="pulse" style="width:.5rem;height:.5rem;border-radius:9999px;background:var(--ice)"></div>' : ''}
      </div>
      <span style="font-size:.875rem;font-weight:${a?700:500};color:${d||a?'var(--text)':'var(--muted-dim)'}">${s}</span>
    </div>`;
  }).join("");
}

function updateAnalyzing() {
  if (state.screen !== "analyzing") return;
  const stages = ["Loading video", "Extracting frames", "Sending to Claude", "Analyzing form", "Building plan"];
  const pct = Math.round(state.progress);
  const pctEl = document.getElementById("pct");
  const pbarEl = document.getElementById("pbar");
  const stEl = document.getElementById("stagetext");
  const flEl = document.getElementById("framelist");
  const slEl = document.getElementById("stagelist");
  if (pctEl) pctEl.textContent = pct + "%";
  if (pbarEl) pbarEl.style.width = pct + "%";
  if (stEl) stEl.textContent = state.stageText || stages[state.stage] + "...";
  if (flEl && state.frames.length > 0 && !flEl.hasChildNodes()) flEl.innerHTML = framelistHtml();
  if (slEl) slEl.innerHTML = stagelistHtml(stages);
}

// ============ RESULTS ============
function Results() {
  const r = state.result;
  if (!r) return "Loading...";
  const sk = SKILLS.find(s => s.id === state.skill);
  const gc = r.score >= 85 ? "var(--good)" : r.score >= 70 ? "var(--ice)" : r.score >= 50 ? "var(--warn)" : "var(--fire)";
  const m = r.metrics || [];
  const sz = 240, cx = sz/2, cy = sz/2, rm = 80;
  const pts = m.map((x, i) => { const a = (Math.PI*2*i/m.length) - Math.PI/2; const rv = (x.value/100)*rm; return { x: cx+Math.cos(a)*rv, y: cy+Math.sin(a)*rv }; });
  const lbls = m.map((x, i) => { const a = (Math.PI*2*i/m.length) - Math.PI/2; return { x: cx+Math.cos(a)*(rm+22), y: cy+Math.sin(a)*(rm+22), label: x.label }; });
  return `
    <button data-a="back-home" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Home</span>
    </button>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
      <p class="slabel" style="color:var(--ice);font-weight:600;margin:0">${sk?.name} · Analyzed by Claude</p>
      ${r._saved ? `<span class="chip chip-green">SAVED</span>` : (auth.isLoggedIn() || !auth.isConfigured() ? `<span class="chip chip-blue">LOCAL</span>` : `<span class="chip chip-blue">UNSAVED</span>`)}
    </div>
    <h1 class="title">YOUR REPORT.</h1>
    <div style="margin-top:1.5rem;padding:1.5rem;border-radius:1.5rem;position:relative;overflow:hidden;background:linear-gradient(135deg,var(--surface-hi),var(--surface));border:1px solid var(--border)">
      <div style="position:absolute;top:-2.5rem;right:-2.5rem;width:10rem;height:10rem;border-radius:9999px;opacity:.2;background:radial-gradient(circle,${gc},transparent 70%)"></div>
      <div style="position:relative">
        <div class="slabel" style="font-weight:600;margin-bottom:.5rem">Overall score</div>
        <div style="display:flex;align-items:baseline;gap:.5rem">
          <span class="bebas" style="font-size:76px;line-height:.9;letter-spacing:-.02em">${r.score}</span>
          <span class="bebas" style="font-size:1.5rem;color:var(--muted)">/100</span>
        </div>
        <div style="margin-top:.5rem;display:inline-block;padding:.25rem .75rem;border-radius:9999px;background:${gc}22;border:1px solid ${gc}44">
          <span class="mono" style="font-size:11px;color:${gc};font-weight:700;letter-spacing:.05em">GRADE ${r.grade}</span>
        </div>
        ${r.summary ? `<p style="margin-top:1rem;font-size:.875rem;line-height:1.5">${r.summary}</p>` : ""}
      </div>
      <div style="margin-top:1.5rem;display:flex;justify-content:center">
        <svg width="${sz+60}" height="${sz+40}" viewBox="-30 -20 ${sz+60} ${sz+40}">
          ${[.25,.5,.75,1].map(sc => `<circle cx="${cx}" cy="${cy}" r="${rm*sc}" fill="none" stroke="var(--border)" stroke-width="1"/>`).join("")}
          <polygon points="${pts.map(p => `${p.x},${p.y}`).join(" ")}" fill="var(--ice)" fill-opacity=".25" stroke="var(--ice)" stroke-width="2"/>
          ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--ice)"/>`).join("")}
          ${lbls.map(l => `<text x="${l.x}" y="${l.y}" text-anchor="middle" dominant-baseline="middle" font-family="JetBrains Mono" font-size="10" font-weight="600" fill="var(--muted)">${l.label}</text>`).join("")}
        </svg>
      </div>
    </div>
    ${r.strengths?.length ? `
      <div style="margin-top:1.5rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
          <div style="width:4px;height:1rem;border-radius:9999px;background:var(--good)"></div>
          <h2 class="slabel" style="font-weight:700;margin:0">What's working</h2>
        </div>
        <div class="card" style="display:flex;flex-direction:column;gap:.75rem">
          ${r.strengths.map(s => `<div style="display:flex;gap:.75rem;align-items:flex-start"><div style="color:var(--good);margin-top:.125rem;flex-shrink:0">${icons.check}</div><span style="font-size:.875rem;line-height:1.5">${s}</span></div>`).join("")}
        </div>
      </div>
    ` : ""}
    ${r.improvements?.length ? `
      <div style="margin-top:1.5rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
          <div style="width:4px;height:1rem;border-radius:9999px;background:var(--fire)"></div>
          <h2 class="slabel" style="font-weight:700;margin:0">Coach's notes</h2>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${r.improvements.map((imp, i) => `
            <div class="card">
              <div style="display:flex;align-items:flex-start;gap:.75rem">
                <div style="width:1.75rem;height:1.75rem;border-radius:.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,45,45,.15)">
                  <span class="mono" style="color:var(--fire);font-size:.75rem;font-weight:700">${i+1}</span>
                </div>
                <div style="flex:1">
                  <div style="font-size:.875rem;font-weight:700">${imp.title}</div>
                  <div style="margin-top:.375rem;font-size:.8125rem;color:var(--muted);line-height:1.5">${imp.detail}</div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
    ${r.workout ? `
      <button data-a="show-workout" class="btn btn-blue" style="margin-top:1.75rem">
        <div style="text-align:left">
          <div class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;opacity:.9;margin-bottom:.25rem;font-weight:700">Next step</div>
          <div class="bebas" style="font-size:1.375rem">SEE MY WORKOUT PLAN</div>
        </div>
        <div style="color:var(--bg)">${icons.right}</div>
      </button>
    ` : ""}
  `;
}

// ============ WORKOUT ============
function Workout() {
  const w = state.result?.workout;
  if (!w) return "No workout";
  return `
    <button data-a="back-results" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back to report</span>
    </button>
    <p class="slabel" style="color:var(--ice);font-weight:600">${w.weeks||4}-week plan · Personalized</p>
    <h1 class="title">TRAIN THE FIX.</h1>
    <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted)">Built around your weakest link: <span style="color:var(--ice);font-weight:700">${w.focus||"identified weaknesses"}</span></p>
    <div style="margin-top:1.75rem;display:flex;flex-direction:column;gap:.75rem">
      ${w.days.map(day => `
        <div style="border-radius:1rem;overflow:hidden;background:var(--surface);border:1px solid var(--border)">
          <div style="padding:1.25rem">
            <div class="slabel" style="color:var(--ice);font-weight:600;margin-bottom:0">${day.day}</div>
            <div class="bebas" style="font-size:1.25rem;margin-top:.25rem">${(day.title||"").toUpperCase()}</div>
            <div style="margin-top:.25rem;font-size:.75rem;color:var(--muted)">${day.drills?.length||0} drills</div>
          </div>
          <div style="padding:0 1.25rem 1.25rem;display:flex;flex-direction:column;gap:.75rem">
            ${(day.drills||[]).map((d, j) => `
              <div style="display:flex;gap:.75rem;padding-top:.75rem;border-top:1px solid var(--border)">
                <div style="width:1.75rem;height:1.75rem;border-radius:.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.125rem;background:var(--surface-hi)">
                  <span class="mono" style="color:var(--ice);font-size:.75rem;font-weight:700">${j+1}</span>
                </div>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem">
                    <div style="font-size:.875rem;font-weight:700">${d.name}</div>
                    <div class="mono" style="flex-shrink:0;font-size:.75rem;color:var(--ice);font-weight:600">${d.sets||""}</div>
                  </div>
                  ${d.note ? `<div style="margin-top:.25rem;font-size:.75rem;color:var(--muted);line-height:1.5">${d.note}</div>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============ ERROR ============
function ErrorS() {
  return `
    <p class="slabel" style="color:var(--fire);font-weight:600">Something went wrong</p>
    <h1 class="title">ANALYSIS FAILED.</h1>
    <div style="margin-top:1.5rem;padding:1.25rem;border-radius:1rem;display:flex;align-items:flex-start;gap:.75rem;background:rgba(255,45,45,.08);border:1px solid rgba(255,45,45,.25)">
      <div style="color:var(--fire);flex-shrink:0;margin-top:.125rem">${icons.alert}</div>
      <div style="font-size:.875rem;line-height:1.5;white-space:pre-wrap">${state.error||"Unknown error"}</div>
    </div>
    <button data-a="back-skill" style="width:100%;margin-top:1.5rem;padding:1.25rem;border-radius:1.5rem;display:flex;align-items:center;justify-content:center;gap:.5rem;background:var(--ice);color:var(--bg)">
      <span class="bebas" style="font-size:1.25rem">TRY AGAIN</span>
    </button>
    <button data-a="back-home" style="width:100%;margin-top:.75rem;padding:1rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:.875rem;font-weight:600">Back to home</button>
  `;
}

// ============ STATS ============
async function loadHistory() {
  state.historyLoading = true;
  renderScreen();
  try {
    const profile = auth.getCurrentProfile();
    state.history = await auth.listSessions(profile?.id && profile.id !== "local" ? profile.id : null);
  } catch (err) {
    console.error("[stats] load failed:", err);
    state.history = [];
  }
  state.historyLoading = false;
  renderScreen();
}

function Stats() {
  if (state.historyLoading) {
    return `<h1 class="title">STATS</h1><p style="margin-top:2rem;color:var(--muted);text-align:center">Loading...</p>`;
  }

  const sessions = state.history;
  if (!sessions || sessions.length === 0) {
    return `
      <h1 class="title">STATS</h1>
      <p class="slabel" style="margin-top:.75rem">No sessions yet</p>
      <div class="card" style="margin-top:1.5rem;text-align:center;padding:2rem 1rem">
        <div style="font-size:3rem;margin-bottom:.75rem">📊</div>
        <div style="font-size:.875rem;font-weight:700;margin-bottom:.5rem">Your stats will appear here</div>
        <div style="font-size:.8125rem;color:var(--muted);line-height:1.5">Analyze a few clips and you'll see your progress over time, broken down by skill.</div>
        <button data-a="new" class="btn btn-red" style="margin-top:1.5rem">
          <span class="bebas" style="font-size:1.125rem">ANALYZE YOUR FIRST CLIP</span>
          <div style="color:#fff">${icons.right}</div>
        </button>
      </div>
    `;
  }

  // Aggregate by skill
  const bySkill = {};
  sessions.forEach(s => {
    if (!bySkill[s.skill]) bySkill[s.skill] = [];
    bySkill[s.skill].push(s);
  });

  const totalScore = Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length);
  const bestSkillEntry = Object.entries(bySkill).map(([k, arr]) => [k, Math.round(arr.reduce((s, x) => s + (x.score||0), 0) / arr.length)]).sort((a, b) => b[1] - a[1])[0];
  const worstSkillEntry = Object.entries(bySkill).map(([k, arr]) => [k, Math.round(arr.reduce((s, x) => s + (x.score||0), 0) / arr.length)]).sort((a, b) => a[1] - b[1])[0];

  return `
    <h1 class="title">STATS</h1>
    <p class="slabel" style="margin-top:.5rem">${sessions.length} session${sessions.length === 1 ? '' : 's'} ${auth.getCurrentProfile()?.name ? `· ${auth.getCurrentProfile().name}` : ''}</p>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:1.25rem">
      <div class="card" style="text-align:center;padding:1rem .5rem">
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:var(--ice)">${totalScore}</div>
        <div class="slabel" style="margin-top:.375rem;margin-bottom:0">Avg</div>
      </div>
      <div class="card" style="text-align:center;padding:1rem .5rem">
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:var(--good)">${bestSkillEntry?.[1]||0}</div>
        <div class="slabel" style="margin-top:.375rem;margin-bottom:0">Best</div>
      </div>
      <div class="card" style="text-align:center;padding:1rem .5rem">
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:var(--fire)">${worstSkillEntry?.[1]||0}</div>
        <div class="slabel" style="margin-top:.375rem;margin-bottom:0">Lowest</div>
      </div>
    </div>

    <div style="margin-top:1.75rem">
      <h2 class="slabel" style="font-weight:700;margin-bottom:.75rem">By skill</h2>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        ${Object.entries(bySkill).map(([sk, arr]) => {
          const avg = Math.round(arr.reduce((s, x) => s + (x.score||0), 0) / arr.length);
          const trend = arr.length >= 2 ? (arr[0].score - arr[arr.length-1].score) : 0;
          const trendC = trend > 0 ? "var(--good)" : trend < 0 ? "var(--fire)" : "var(--muted)";
          const trendStr = trend > 0 ? `+${trend}` : trend === 0 ? "—" : trend;
          return `
            <div class="card" style="display:flex;align-items:center;gap:.875rem">
              <div class="sicon" style="width:2.5rem;height:2.5rem;font-size:1.25rem">${skillIcon(sk)}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:.875rem;font-weight:700">${skillName(sk)}</div>
                <div style="font-size:.75rem;color:var(--muted);margin-top:.125rem">${arr.length} session${arr.length === 1 ? '' : 's'}</div>
                ${arr.length >= 2 ? sparkline(arr.map(x => x.score||0).reverse()) : ""}
              </div>
              <div style="text-align:right">
                <div class="bebas" style="font-size:1.5rem;line-height:1">${avg}</div>
                <div class="mono" style="font-size:10px;color:${trendC};font-weight:600">${trendStr}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div style="margin-top:1.75rem">
      <h2 class="slabel" style="font-weight:700;margin-bottom:.75rem">Recent sessions</h2>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${sessions.slice(0, 20).map(s => `
          <div class="card" style="display:flex;align-items:center;gap:.875rem;padding:.875rem">
            <div data-a="open-session" data-session="${s.id}" style="display:flex;align-items:center;gap:.875rem;flex:1;cursor:pointer">
              <div class="sicon" style="width:2.5rem;height:2.5rem;font-size:1.25rem">${skillIcon(s.skill)}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:.875rem;font-weight:700">${skillName(s.skill)}</div>
                <div style="font-size:.75rem;color:var(--muted);margin-top:.125rem">${formatDate(s.created_at)}</div>
              </div>
              <div style="text-align:right">
                <div class="bebas" style="font-size:1.25rem;line-height:1">${s.score||"–"}</div>
                <div class="mono" style="font-size:10px;color:var(--ice);font-weight:600">${s.grade||""}</div>
              </div>
            </div>
            <button data-a="del-session" data-session="${s.id}" style="padding:.5rem;color:var(--muted-dim)">${icons.trash}</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function sparkline(values) {
  if (!values || values.length < 2) return "";
  const w = 80, h = 20;
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i/(values.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  return `<svg width="${w}" height="${h}" style="margin-top:.375rem;display:block"><polyline points="${pts}" fill="none" stroke="var(--ice)" stroke-width="1.5"/></svg>`;
}

function formatDate(s) {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 86400*7) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString();
}

// ============ PROFILE SCREEN ============
function Profile() {
  const profile = auth.getCurrentProfile();
  const profiles = auth.getProfiles();
  const user = auth.getUser();

  return `
    <h1 class="title">PROFILE</h1>
    ${user ? `<p class="slabel" style="margin-top:.5rem">${user.email||"Signed in"}</p>` : `<p class="slabel" style="margin-top:.5rem">Not signed in</p>`}

    ${!profile && !user ? `
      <div class="card" style="margin-top:1.5rem;text-align:center;padding:2rem 1rem">
        <div style="font-size:3rem;margin-bottom:.75rem">👤</div>
        <div style="font-size:.875rem;font-weight:700;margin-bottom:.5rem">Set up your profile</div>
        <div style="font-size:.8125rem;color:var(--muted);line-height:1.5;margin-bottom:1.25rem">Add your name and position so the AI can give you age-appropriate feedback.</div>
        <button data-a="setup-profile" class="btn btn-blue">
          <span class="bebas" style="font-size:1.125rem">SET UP PROFILE</span>
          <div style="color:var(--bg)">${icons.right}</div>
        </button>
      </div>
    ` : ""}

    ${profile ? `
      <div class="card" style="margin-top:1.5rem">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <div style="width:3.5rem;height:3.5rem;border-radius:9999px;background:var(--surface-hi);display:flex;align-items:center;justify-content:center">
            <span class="bebas" style="font-size:1.25rem;color:var(--ice)">${(profile.name||"P").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase()}</span>
          </div>
          <div style="flex:1">
            <div style="font-size:1.125rem;font-weight:700">${profile.name||"Player"}</div>
            <div style="font-size:.75rem;color:var(--muted);margin-top:.125rem">
              ${[profile.position && capitalize(profile.position), profile.age_group?.toUpperCase()].filter(Boolean).join(" · ") || "No details set"}
            </div>
          </div>
          <button data-a="edit-profile" data-id="${profile.id}" style="padding:.5rem;color:var(--muted)">${icons.edit}</button>
        </div>
        ${profile._local ? `<div class="chip chip-blue">LOCAL ONLY</div>` : ""}
      </div>
    ` : ""}

    ${user && profiles.length > 1 ? `
      <div style="margin-top:1.5rem">
        <h2 class="slabel" style="font-weight:700;margin-bottom:.75rem">Switch player</h2>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          ${profiles.map(p => `
            <button data-a="switch-profile" data-id="${p.id}" class="sbtn" style="padding:1rem">
              <div style="display:flex;align-items:center;gap:.75rem">
                <div style="width:2rem;height:2rem;border-radius:9999px;background:var(--surface-hi);display:flex;align-items:center;justify-content:center"><span class="bebas" style="font-size:.75rem;color:var(--ice)">${(p.name||"P").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase()}</span></div>
                <div style="text-align:left">
                  <div style="font-size:.875rem;font-weight:700">${p.name}</div>
                  <div style="font-size:.6875rem;color:var(--muted)">${[p.position && capitalize(p.position), p.age_group?.toUpperCase()].filter(Boolean).join(" · ") || ""}</div>
                </div>
              </div>
              ${profile?.id === p.id ? `<span class="chip chip-blue">ACTIVE</span>` : `<div style="color:var(--muted-dim)">${icons.right}</div>`}
            </button>
          `).join("")}
        </div>
      </div>
    ` : ""}

    ${user ? `
      <button data-a="add-profile" style="width:100%;margin-top:1rem;padding:1rem;border-radius:1rem;background:var(--surface);border:1px dashed var(--border);color:var(--ice);font-size:.875rem;font-weight:600">+ Add another player</button>
    ` : ""}

    <div style="margin-top:2rem">
      <h2 class="slabel" style="font-weight:700;margin-bottom:.75rem">Account</h2>
      ${user ? `
        <div class="card" style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
          <div style="color:var(--ice)">${icons.mail}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:.8125rem;font-weight:700">Signed in</div>
            <div style="font-size:.6875rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email||"—"}</div>
          </div>
        </div>
        <button data-a="sign-out" style="width:100%;padding:1rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:.875rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:.5rem">
          ${icons.logout} Sign out
        </button>
      ` : auth.isConfigured() ? `
        <button data-a="goto-login" class="btn btn-blue">
          <span class="bebas" style="font-size:1.125rem">SIGN IN / SIGN UP</span>
          <div style="color:var(--bg)">${icons.right}</div>
        </button>
        <p style="margin-top:.75rem;font-size:.75rem;color:var(--muted);line-height:1.5">Sign in to save your sessions across devices and back up your data.</p>
      ` : `
        <p style="font-size:.8125rem;color:var(--muted);line-height:1.5">Auth is not configured for this deployment. Sessions are saved locally only.</p>
      `}
    </div>
  `;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

// ============ PROFILE SETUP / EDIT / NEW ============
let profileFormState = { name: "", position: "", age_group: "", makeDefault: false, editingId: null };

function ProfileSetup() {
  return profileFormHtml({ title: "SET UP YOUR<br>PROFILE", subtitle: "Helps the AI give age-appropriate feedback.", submitText: "SAVE PROFILE", showBack: true, backAction: "back-home" });
}

function ProfileNew() {
  return profileFormHtml({ title: "ADD A<br>PLAYER", subtitle: "Track multiple players from one account.", submitText: "ADD PLAYER", showBack: true, backAction: "goto-profile" });
}

function ProfileEdit() {
  return profileFormHtml({ title: "EDIT<br>PROFILE", subtitle: "Update player info.", submitText: "SAVE CHANGES", showBack: true, backAction: "goto-profile", isEdit: true });
}

function profileFormHtml({ title, subtitle, submitText, showBack, backAction, isEdit }) {
  const positions = ["forward", "defense", "goalie"];
  const ages = ["u8", "u10", "u12", "u14", "u16", "u18", "adult"];
  return `
    ${showBack ? `<button data-a="${backAction}" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span></button>` : ""}
    <h1 class="title">${title}</h1>
    <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted)">${subtitle}</p>
    <form id="pf" style="margin-top:1.75rem">
      <label class="slabel">Name</label>
      <input type="text" id="pf-name" class="input" placeholder="Player name" value="${escapeHtml(profileFormState.name)}" required />

      <label class="slabel" style="margin-top:.75rem">Position</label>
      <div class="seg">
        ${positions.map(p => `<button type="button" data-position="${p}" class="${profileFormState.position===p?'active':''}">${capitalize(p)}</button>`).join("")}
      </div>

      <label class="slabel" style="margin-top:.75rem">Age group</label>
      <div class="seg" style="flex-wrap:wrap">
        ${ages.map(a => `<button type="button" data-age="${a}" class="${profileFormState.age_group===a?'active':''}" style="min-width:auto;flex:0 0 calc(25% - .25rem)">${a.toUpperCase()}</button>`).join("")}
      </div>

      ${auth.isLoggedIn() ? `
        <label style="display:flex;align-items:center;gap:.625rem;margin-top:1rem;font-size:.875rem">
          <input type="checkbox" id="pf-default" ${profileFormState.makeDefault?'checked':''} style="width:1.25rem;height:1.25rem"/>
          Set as default player
        </label>
      ` : ""}

      <button type="submit" class="btn btn-blue" style="margin-top:1.5rem">
        <span class="bebas" style="font-size:1.125rem">${submitText}</span>
        <div style="color:var(--bg)">${icons.right}</div>
      </button>

      ${isEdit && profileFormState.editingId ? `
        <button type="button" data-a="delete-profile" data-id="${profileFormState.editingId}" style="width:100%;margin-top:.75rem;padding:1rem;border-radius:1rem;background:transparent;border:1px solid rgba(255,45,45,.3);color:var(--fire);font-size:.875rem;font-weight:600">Delete this player</button>
      ` : ""}
    </form>
  `;
}

function escapeHtml(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

// ============ LOGIN ============
function Login() {
  return `
    <button data-a="back-home" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <h1 class="title">SIGN IN</h1>
    <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted)">Sync your sessions across devices.</p>

    ${state.authMessage ? `
      <div style="margin-top:1rem;padding:.875rem 1rem;border-radius:.75rem;background:${state.authMessageType==='error'?'rgba(255,45,45,.1)':'rgba(74,222,128,.1)'};border:1px solid ${state.authMessageType==='error'?'rgba(255,45,45,.3)':'rgba(74,222,128,.3)'};color:${state.authMessageType==='error'?'var(--fire)':'var(--good)'};font-size:.8125rem;line-height:1.5">${state.authMessage}</div>
    ` : ""}

    <div style="margin-top:1.5rem">
      <button data-a="auth-google" class="sbtn" style="justify-content:center;gap:.625rem;padding:1rem;background:#fff;color:#111;border:none">
        ${icons.google}
        <span style="font-size:.9375rem;font-weight:600">Continue with Google</span>
      </button>
    </div>

    <div style="display:flex;align-items:center;gap:.75rem;margin:1.5rem 0">
      <div style="flex:1;height:1px;background:var(--border)"></div>
      <span class="slabel" style="margin:0">or</span>
      <div style="flex:1;height:1px;background:var(--border)"></div>
    </div>

    <div class="seg">
      <button data-a="auth-mode" data-mode="magic" class="${state.authMode==='magic'?'active':''}">Magic link</button>
      <button data-a="auth-mode" data-mode="password" class="${state.authMode==='password'?'active':''}">Email & password</button>
    </div>

    <form id="af" style="margin-top:1rem">
      <label class="slabel">Email</label>
      <input type="email" id="af-email" class="input" placeholder="you@example.com" required autocomplete="email" />
      ${state.authMode==='password' ? `
        <label class="slabel" style="margin-top:.5rem">Password</label>
        <input type="password" id="af-password" class="input" placeholder="At least 6 characters" required autocomplete="current-password" minlength="6" />
      ` : ""}
      <button type="submit" class="btn btn-blue" ${state.authBusy?'disabled':''} style="margin-top:1rem">
        <span class="bebas" style="font-size:1.125rem">${state.authBusy?'WORKING...':state.authMode==='magic'?'SEND MAGIC LINK':'SIGN IN'}</span>
        ${!state.authBusy ? `<div style="color:var(--bg)">${icons.right}</div>` : ""}
      </button>
      ${state.authMode==='password' ? `
        <button type="button" data-a="auth-signup" ${state.authBusy?'disabled':''} style="width:100%;margin-top:.75rem;padding:1rem;border-radius:1rem;background:transparent;border:1px solid var(--border);color:var(--muted);font-size:.875rem;font-weight:600">Don't have an account? Sign up</button>
      ` : ""}
    </form>
  `;
}

// ============ TAB BAR ============
function renderTabBar() {
  const el = document.getElementById("tabbar");
  if (!el) return;
  const tabs = [
    { id: "home", label: "Home", icon: icons.home },
    { id: "upload", label: "Analyze", icon: icons.plus },
    { id: "stats", label: "Stats", icon: icons.stats },
    { id: "profile", label: "Profile", icon: icons.user },
  ];
  el.innerHTML = `<div>${tabs.map(t => {
    const a = state.screen === t.id || (t.id === "upload" && (state.screen === "skill" || state.screen === "upload"));
    const p = t.id === "upload";
    return `<button data-tab="${t.id}" class="tab">${p
      ? `<div class="tab-plus" style="color:#fff">${t.icon}</div>`
      : `<div style="color:${a?'var(--ice)':'var(--muted-dim)'}">${t.icon}</div><span style="font-size:10px;font-weight:600;color:${a?'var(--ice)':'var(--muted-dim)'}">${t.label}</span>`
    }</button>`;
  }).join("")}</div>`;
  el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.tab;
    if (t === "upload") { state.error = null; go("skill"); }
    else if (t === "home") go("home");
    else if (t === "stats") { go("stats"); loadHistory(); }
    else if (t === "profile") go("profile");
  }));
}

// ============ EVENT BINDING ============
function bind() {
  document.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", e => act(b.dataset.a, b.dataset, e)));
  const fi = document.getElementById("fi");
  if (fi) fi.addEventListener("change", e => { const f = e.target.files?.[0]; if (f) onFile(f); });

  // Profile form
  const pf = document.getElementById("pf");
  if (pf) {
    pf.addEventListener("submit", async e => {
      e.preventDefault();
      profileFormState.name = document.getElementById("pf-name").value;
      profileFormState.makeDefault = document.getElementById("pf-default")?.checked || false;
      try {
        if (profileFormState.editingId) {
          await auth.updateProfile(profileFormState.editingId, { name: profileFormState.name, position: profileFormState.position, age_group: profileFormState.age_group, makeDefault: profileFormState.makeDefault });
          toast("Profile updated", "success");
        } else {
          await auth.createProfile({ name: profileFormState.name, position: profileFormState.position, age_group: profileFormState.age_group, makeDefault: profileFormState.makeDefault });
          toast("Profile created", "success");
        }
        profileFormState = { name: "", position: "", age_group: "", makeDefault: false, editingId: null };
        go("profile");
      } catch (err) {
        toast(err.message || "Save failed", "error");
      }
    });
    pf.querySelectorAll("[data-position]").forEach(b => b.addEventListener("click", () => {
      profileFormState.position = b.dataset.position === profileFormState.position ? "" : b.dataset.position;
      renderScreen();
    }));
    pf.querySelectorAll("[data-age]").forEach(b => b.addEventListener("click", () => {
      profileFormState.age_group = b.dataset.age === profileFormState.age_group ? "" : b.dataset.age;
      renderScreen();
    }));
    const nameEl = document.getElementById("pf-name");
    if (nameEl) nameEl.addEventListener("input", e => { profileFormState.name = e.target.value; });
  }

  // Auth form
  const af = document.getElementById("af");
  if (af) {
    af.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("af-email").value.trim();
      const password = document.getElementById("af-password")?.value;
      state.authBusy = true; state.authMessage = null; renderScreen();
      try {
        if (state.authMode === "magic") {
          await auth.signInWithMagicLink(email);
          state.authMessage = `Check ${email} for a sign-in link. It expires in 1 hour.`;
          state.authMessageType = "success";
        } else {
          await auth.signInWithPassword(email, password);
          toast("Signed in", "success");
          go("home");
          return;
        }
      } catch (err) {
        state.authMessage = err.message || "Sign-in failed";
        state.authMessageType = "error";
      }
      state.authBusy = false;
      renderScreen();
    });
  }
}

async function act(a, d) {
  switch (a) {
    case "new": state.error = null; go("skill"); break;
    case "back-home": go("home"); break;
    case "back-skill": state.error = null; go("skill"); break;
    case "back-results": go("results"); break;
    case "view-last": go("results"); break;
    case "pick-skill": state.skill = d.skill; go("upload"); break;
    case "pick-file": document.getElementById("fi")?.click(); break;
    case "show-workout": go("workout"); break;
    case "goto-profile": go("profile"); break;
    case "goto-login":
      state.authMessage = null; state.authMode = "magic"; go("login"); break;
    case "auth-mode": state.authMode = d.mode; state.authMessage = null; renderScreen(); break;
    case "auth-google":
      try { state.authBusy = true; renderScreen(); await auth.signInWithGoogle(); }
      catch (err) { state.authMessage = err.message; state.authMessageType = "error"; state.authBusy = false; renderScreen(); }
      break;
    case "auth-signup":
      const email = document.getElementById("af-email")?.value.trim();
      const password = document.getElementById("af-password")?.value;
      if (!email || !password) { toast("Enter email and password", "error"); break; }
      state.authBusy = true; renderScreen();
      try {
        const res = await auth.signUpWithPassword(email, password);
        if (res.user && !res.session) {
          state.authMessage = "Check your email to confirm your account.";
          state.authMessageType = "success";
        } else {
          toast("Account created", "success");
          go("home"); return;
        }
      } catch (err) {
        state.authMessage = err.message || "Signup failed";
        state.authMessageType = "error";
      }
      state.authBusy = false; renderScreen();
      break;
    case "sign-out":
      await auth.signOut();
      toast("Signed out");
      go("home");
      break;
    case "setup-profile":
      profileFormState = { name: "", position: "", age_group: "", makeDefault: false, editingId: null };
      go("profileSetup");
      break;
    case "add-profile":
      profileFormState = { name: "", position: "", age_group: "", makeDefault: false, editingId: null };
      go("profileNew");
      break;
    case "edit-profile":
      const cur = auth.getProfiles().find(p => p.id === d.id) || auth.getCurrentProfile();
      if (cur) {
        profileFormState = { name: cur.name||"", position: cur.position||"", age_group: cur.age_group||"", makeDefault: !!cur.is_default, editingId: cur.id };
      }
      go("profileEdit");
      break;
    case "switch-profile":
      auth.setActiveProfile(d.id);
      toast(`Switched to ${auth.getCurrentProfile()?.name}`);
      go("profile");
      break;
    case "delete-profile":
      if (confirm("Delete this player? Their session history will remain but be unlinked.")) {
        try { await auth.deleteProfile(d.id); toast("Deleted"); go("profile"); }
        catch (err) { toast(err.message, "error"); }
      }
      break;
    case "open-session": {
      const s = state.history.find(x => x.id === d.session);
      if (s) {
        state.skill = s.skill;
        state.result = { ...s.result, _saved: true };
        go("results");
      }
      break;
    }
    case "del-session":
      if (confirm("Delete this session?")) {
        try { await auth.deleteSession(d.session); state.history = state.history.filter(s => s.id !== d.session); toast("Deleted"); renderScreen(); }
        catch (err) { toast(err.message, "error"); }
      }
      break;
  }
}

async function onFile(f) {
  try {
    if (!f) { state.error = "[E1] No file received"; go("error"); return; }
    if (!f.type.startsWith("video/") && !f.name.match(/\.(mp4|mov|m4v|qt|hevc|webm|mkv)$/i)) {
      state.error = `[E2] Not a video file. Got name="${f.name||"none"}" type="${f.type||"empty"}" size=${f.size||0}`;
      go("error"); return;
    }
    state.videoFile = f;
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = URL.createObjectURL(f);
    state.frames = []; state.progress = 0; state.stage = 0; state.stageText = "";
    go("analyzing"); run();
  } catch (err) {
    state.error = `[E3-onFile] ${err?.message||err?.toString()||"unparseable error"}`;
    go("error");
  }
}

async function run() {
  try {
    state.progress = 5; renderScreen();
    const { frames, duration } = await extractFrames(state.videoFile, 8,
      fr => { state.progress = 10 + fr * 35; state.stage = 1; updateAnalyzing(); },
      t => { state.stageText = t; updateAnalyzing(); }
    );
    state.frames = frames; state.stageText = ""; state.stage = 2; state.progress = 50; updateAnalyzing();
    state.stage = 3;
    const iv = setInterval(() => { state.progress = Math.min(state.progress + 0.5, 92); updateAnalyzing(); }, 200);
    let result;
    try {
      result = await callBackend(frames, state.skill, duration);
    } catch (backendErr) {
      clearInterval(iv);
      throw new Error(`[E4-backend] ${backendErr?.message||"backend call failed"}`);
    }
    clearInterval(iv);
    if (!result || typeof result !== "object") throw new Error(`[E5-bad-response] ${JSON.stringify(result).slice(0, 300)}`);
    state.stage = 4; state.progress = 98; updateAnalyzing();
    await new Promise(r => setTimeout(r, 400));
    state.progress = 100;
    state.result = { ...result, _meta: { duration, frameCount: frames.length } };

    // If not logged in, save locally
    if (!auth.isLoggedIn()) {
      const localSaved = auth.saveLocalSession({
        skill: state.skill,
        score: result.score,
        grade: result.grade,
        result,
        duration,
        frame_count: frames.length,
      });
      if (localSaved) state.result._saved = true;
    }

    updateAnalyzing();
    await new Promise(r => setTimeout(r, 300));
    go("results");
  } catch (err) {
    console.error("[run] Caught error:", err);
    let msg = "";
    if (err instanceof Error) msg = err.message || err.name || err.toString();
    else if (typeof err === "string") msg = err;
    else if (err && typeof err === "object") msg = JSON.stringify(err).slice(0, 500);
    else msg = `Non-error throw: ${String(err)}`;
    if (!msg) msg = "[E6] Empty error object";
    state.error = msg;
    go("error");
  }
}

// ============ INIT ============
window.addEventListener("auth-changed", e => {
  if (e.detail?.signedIn) toast("Signed in", "success");
  renderScreen(); renderTabBar();
});
window.addEventListener("sessions-migrated", e => {
  toast(`Imported ${e.detail.count} session${e.detail.count === 1 ? '' : 's'} to your account`, "success", 4000);
});

(async function init() {
  try { await auth.initAuth(); } catch (err) { console.error("[init] Auth init failed:", err); }
  auth.loadLocalProfileIfNeeded();
  renderScreen(); renderTabBar();
})();
