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
  authMode: "magic",
  authBusy: false,
  authMessage: null,
  authMessageType: null,
  workouts: [],
  completions: [],
  activeWorkout: null,
  activeTrack: null,
  expandedDay: 0,
  // Home screen aggregates
  recentTicker: [],
  totalAnalyses: 0,
  bestScore: 0,
  streak: 0,
  todaysWorkout: null,
  todaysWorkoutPct: 0,
  homeDataLoaded: false,
  // Trim UI state
  videoDuration: 0,
  trimStart: 0,
  trimEnd: 0,
  trimReady: false,
  // Drag-to-load state
  isDragOver: false,
};

// Custom hockey-themed SVG icons for each skill
const skillSvgs = {
  wrist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  snap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-2 8 9-12h-6z" fill="currentColor" fill-opacity="0.15"/></svg>',
  slap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 19 5"/><path d="M16 5h3v3"/><path d="M5 16v3h3"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/></svg>',
  stride: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M5 19c4-1 7-3 9-7"/><path d="M9 19c3-1 5-3 6-6"/><circle cx="17" cy="6" r="2"/></svg>',
  crossovers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4 19 20"/><path d="M19 4 5 20"/><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="19" cy="20" r="1.5" fill="currentColor"/></svg>',
  tightturns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 4v5h-5"/></svg>',
  stops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6v6H9z" fill="currentColor" fill-opacity="0.3"/></svg>',
  backwards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>',
  stick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 18 6"/><path d="M18 6h4v3"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/></svg>',
};

const SKILLS = [
  { id: "wrist", name: "Wrist Shot", svg: skillSvgs.wrist, group: "shots" },
  { id: "snap", name: "Snap Shot", svg: skillSvgs.snap, group: "shots" },
  { id: "slap", name: "Slap Shot", svg: skillSvgs.slap, group: "shots" },
  { id: "back", name: "Backhand", svg: skillSvgs.back, group: "shots" },
  { id: "stride", name: "Skating Stride", svg: skillSvgs.stride, group: "skating" },
  { id: "crossovers", name: "Crossovers", svg: skillSvgs.crossovers, group: "skating" },
  { id: "tightturns", name: "Tight Turns", svg: skillSvgs.tightturns, group: "skating" },
  { id: "stops", name: "Hockey Stops", svg: skillSvgs.stops, group: "skating" },
  { id: "backwards", name: "Backwards Skating", svg: skillSvgs.backwards, group: "skating" },
  { id: "stick", name: "Stickhandling", svg: skillSvgs.stick, group: "puck" },
];

const skillName = id => SKILLS.find(s => s.id === id)?.name || id;
const skillSvg = id => SKILLS.find(s => s.id === id)?.svg || skillSvgs.wrist;
// Backwards-compat: where we previously used emoji we now use the SVG wrapped in a span
const skillIcon = id => `<span class="skill-svg">${skillSvg(id)}</span>`;

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
  dumbbell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>',
  circle:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
  checkCircle:'<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--good)" stroke="var(--bg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="var(--good)" stroke="none"/><polyline points="9 12 11 14 15 10"/></svg>',
  flame:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  calendar:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
};

// ============ FRAME EXTRACTION ============
async function extractFrames(file, n, onProg, onStage, opts = {}) {
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
    const fullDur = v.duration;
    // Apply trim if provided. Clamp inside the actual duration.
    const trimStart = Math.max(0, Math.min(fullDur - 0.1, opts.trimStart ?? 0));
    const trimEnd = Math.max(trimStart + 0.1, Math.min(fullDur, opts.trimEnd ?? fullDur));
    const dur = trimEnd - trimStart;

    const c = document.createElement("canvas");
    const w = 384; c.width = w; c.height = Math.round(w * (v.videoHeight / v.videoWidth));
    const ctx = c.getContext("2d");
    onStage?.("Extracting frames");

    // Smart sampling: bias frames toward the middle of the clip where the action is.
    // Use a simple cubic curve mapping uniform [0,1] -> [0,1] that compresses edges and
    // expands the middle. f(t) = 0.5 + 0.5 * sign(2t-1) * |2t-1|^1.6  (gentle middle-bias).
    // For very short clips (<2s) we just sample uniformly.
    const sampleTimes = [];
    const useBias = dur >= 2.0;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1); // uniform 0..1, exclusive of endpoints
      let mapped;
      if (useBias) {
        const x = 2 * t - 1; // -1..1
        const sign = x < 0 ? -1 : 1;
        // Power < 1 expands middle (puts samples closer together near the middle).
        // Power > 1 expands edges. We want middle-dense, so use power > 1 in inverse.
        // Effectively: t' = 0.5 + 0.5 * sign(x) * |x|^1.6  -> samples cluster around the edges.
        // To invert (cluster around middle), use power < 1: |x|^0.6
        mapped = 0.5 + 0.5 * sign * Math.pow(Math.abs(x), 1.6);
      } else {
        mapped = t;
      }
      sampleTimes.push(trimStart + mapped * dur);
    }

    const frames = [];
    for (let i = 0; i < n; i++) {
      const time = sampleTimes[i];
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
        // Display time is relative to the trimmed clip, since the AI is told the clip
        // is `dur` seconds long — keeping the math consistent.
        const displayTime = (time - trimStart).toFixed(1);
        frames.push({ time: displayTime, base64: d.split(",")[1], preview: d });
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
  const profile = auth.getCurrentProfile();
  const profileId = profile?.id || null;
  // Send experience + age inline as well — useful for local/anonymous profiles since
  // the backend can only look up DB profiles for signed-in users.
  const body = JSON.stringify({
    frames, skill, duration,
    profileId: profileId === "local" ? null : profileId,
    anonId: auth.getAnonId(),
    experienceLevel: profile?.experience_level || null,
    ageGroup: profile?.age_group || null,
  });

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
    workouts: Workouts, workoutDetail: WorkoutDetail,
  };
  const fn = fns[state.screen] || Home;
  el.innerHTML = `<div class="page">${fn()}</div>`;
  bind();
}

// Helper: pick a hockey-themed greeting based on time of day + state
function homeGreeting(profile) {
  const hour = new Date().getHours();
  const name = profile?.name?.split(" ")[0];
  const hasName = !!name;

  // Time-of-day buckets with hockey vocabulary
  const lastSession = state.recentTicker?.[0];
  const lastWasGood = state.result?.score >= 80;

  if (hour < 11) {
    return hasName ? `Morning skate, ${name}.` : "Morning skate.";
  } else if (hour < 17) {
    return hasName ? `Game time, ${name}.` : "Game time.";
  } else if (hour < 21) {
    return hasName ? `Time to put in work, ${name}.` : "Time to put in work.";
  } else {
    return hasName ? `One more shift, ${name}?` : "One more shift?";
  }
}

function homeSubGreeting() {
  const r = state.result;
  if (r) {
    if (r.score >= 85) return `Last shift was an A. Keep it rolling.`;
    if (r.score >= 75) return `Last shift was a ${r.grade}. One more.`;
    if (r.score >= 60) return `Last shift was a ${r.grade}. Sharpen the edges.`;
    return `Last shift left some on the table. Let's clean it up.`;
  }
  return "Drop a clip. Get a breakdown. Train the fix.";
}

// ============ HOME SCREEN ============
function Home() {
  const profile = auth.getCurrentProfile();
  const profileName = profile?.name || "Player";
  // Use jersey number if profile has one stored, otherwise generate from name hash
  const jerseyNum = profile?.jersey_number || (profile ? hashToNumber(profileName) : null);

  return `
    <div style="position:relative">
      <div class="rink-bg">${rinkBackgroundSvg()}</div>

      <div style="position:relative;display:flex;justify-content:space-between;align-items:center;margin-bottom:1.75rem">
        <div style="display:flex;align-items:center;gap:.5rem;color:var(--ice)">${icons.logo}<span class="bebas" style="font-size:1.5rem;color:var(--text)">RINK</span><span class="bebas" style="font-size:1.5rem;color:var(--ice)">AI</span></div>
        <button data-a="goto-profile" class="jersey">
          ${profile ? `<span class="jersey-num">${jerseyNum}</span>` : `<span class="jersey-num" style="font-size:.875rem">+</span>`}
        </button>
      </div>

      <p class="slabel" style="margin-bottom:.375rem;color:var(--ice)">RINK AI</p>
      <h1 class="bebas" style="font-size:42px;line-height:1;letter-spacing:-.005em">${escapeHtml(homeGreeting(profile).toUpperCase())}</h1>
      <p style="margin-top:.625rem;font-size:.875rem;color:var(--muted);line-height:1.5">${escapeHtml(homeSubGreeting())}</p>

      <button data-a="new" class="btn btn-red" style="margin-top:1.5rem;position:relative">
        <div style="text-align:left;position:relative;z-index:1">
          <div class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;opacity:.85;margin-bottom:.25rem;font-weight:600">Drop a clip</div>
          <div class="bebas" style="font-size:1.625rem">ANALYZE A SHIFT</div>
        </div>
        <div style="width:3rem;height:3rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);position:relative;z-index:1">${icons.plus}</div>
      </button>

      ${!auth.isLoggedIn() && auth.isConfigured() ? `
        <button data-a="goto-login" style="width:100%;margin-top:.75rem;padding:.875rem 1rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;gap:.5rem;color:var(--ice);font-size:.8125rem;font-weight:600">
          Sign in to save shifts across devices
        </button>
      ` : ""}

      <!-- Quick stats grid -->
      ${quickStatsHtml()}

      <!-- Recent activity ticker -->
      ${state.recentTicker && state.recentTicker.length > 0 ? `
        <div style="margin-top:1.5rem">
          <div class="slabel" style="font-weight:600;display:flex;align-items:center;gap:.5rem">
            <span class="puck"></span>
            ON THE ICE NOW
          </div>
          <div class="ticker-wrap" style="margin-top:.5rem">
            <div class="ticker">
              ${[...state.recentTicker, ...state.recentTicker].map(t => `
                <div class="ticker-item">
                  <span class="dot"></span>
                  <span style="color:var(--text);font-weight:600">${escapeHtml(skillName(t.skill))}</span>
                  <span>${t.score ? `· scored ${t.score}` : ''}</span>
                  <span>· ${formatDate(t.created_at)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      ` : ""}

      <!-- Last session card -->
      ${state.result ? `
        <div style="margin-top:1.75rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:space-between">
          <h2 class="slabel" style="font-weight:700;margin:0">Last shift</h2>
          ${state.result.grade ? `<span class="chip chip-blue">${state.result.grade}</span>` : ''}
        </div>
        <button data-a="view-last" class="card" style="width:100%;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:.875rem">
            <div class="sicon">${skillIcon(state.skill)}</div>
            <div style="text-align:left">
              <div style="font-size:.9375rem;font-weight:700">${skillName(state.skill)}</div>
              <div style="font-size:.75rem;margin-top:.125rem;color:var(--muted)">Just now</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:.875rem">
            <div style="text-align:right">
              <div class="bebas count-in" style="font-size:1.5rem;line-height:1">${state.result.score}</div>
              <div class="mono" style="font-size:10px;color:var(--ice);font-weight:600;margin-top:.125rem">SCORE</div>
            </div>
            <div style="color:var(--muted-dim)">${icons.right}</div>
          </div>
        </button>
      ` : ""}

      <!-- Today's training nudge if they have a workout in progress -->
      ${state.todaysWorkout ? `
        <div style="margin-top:1.5rem">
          <h2 class="slabel" style="font-weight:700">Today's training</h2>
          <button data-a="open-saved-workout" data-id="${state.todaysWorkout.id}" class="card" style="width:100%;text-align:left;display:block">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem">
              <div style="flex:1;min-width:0">
                <div style="font-size:.6875rem;color:var(--ice);font-family:'JetBrains Mono';font-weight:600;letter-spacing:.05em;margin-bottom:.25rem">${escapeHtml(skillName(state.todaysWorkout.skill).toUpperCase())} PLAN</div>
                <div style="font-size:.875rem;font-weight:700;line-height:1.3">${escapeHtml(state.todaysWorkout.result?.workout?.focus || "Continue your plan")}</div>
                <div style="margin-top:.5rem;height:4px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
                  <div style="height:100%;width:${state.todaysWorkoutPct||0}%;background:var(--ice);transition:width .3s"></div>
                </div>
              </div>
              <div style="color:var(--ice);flex-shrink:0;margin-top:.25rem">${icons.right}</div>
            </div>
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function quickStatsHtml() {
  // Compute totals from state.workouts (cached) if available
  if (!state.totalAnalyses && !state.streak && !state.bestScore) return "";
  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:1.5rem">
      <div class="card" style="padding:.875rem;text-align:center">
        <div class="bebas" style="font-size:1.5rem;line-height:1;color:var(--ice)">${state.totalAnalyses || 0}</div>
        <div class="mono" style="font-size:9px;color:var(--muted);font-weight:600;margin-top:.25rem;letter-spacing:.05em;text-transform:uppercase">Shifts</div>
      </div>
      <div class="card" style="padding:.875rem;text-align:center">
        <div class="bebas" style="font-size:1.5rem;line-height:1;color:var(--good)">${state.bestScore || '—'}</div>
        <div class="mono" style="font-size:9px;color:var(--muted);font-weight:600;margin-top:.25rem;letter-spacing:.05em;text-transform:uppercase">Best</div>
      </div>
      <div class="card" style="padding:.875rem;text-align:center;display:flex;flex-direction:column;align-items:center">
        <div class="bebas" style="font-size:1.5rem;line-height:1;color:var(--fire);display:flex;align-items:center;gap:.25rem">${state.streak || 0}${state.streak >= 3 ? icons.flame : ''}</div>
        <div class="mono" style="font-size:9px;color:var(--muted);font-weight:600;margin-top:.25rem;letter-spacing:.05em;text-transform:uppercase">Day Streak</div>
      </div>
    </div>
  `;
}

function hashToNumber(str) {
  // Hash name to a jersey-style number 1-99
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return Math.abs(h) % 99 + 1;
}

function rinkBackgroundSvg() {
  // Subtle hockey rink top-down view as SVG. Colors very muted so it doesn't fight content.
  return `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="rinkGlow" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stop-color="rgba(91,192,235,0.18)"/>
          <stop offset="100%" stop-color="rgba(91,192,235,0)"/>
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill="url(#rinkGlow)"/>
      <!-- Center line -->
      <line x1="0" y1="300" x2="400" y2="300" stroke="rgba(200,16,46,0.2)" stroke-width="2"/>
      <!-- Center circle -->
      <circle cx="200" cy="300" r="60" fill="none" stroke="rgba(91,192,235,0.18)" stroke-width="2"/>
      <circle cx="200" cy="300" r="2" fill="rgba(91,192,235,0.4)"/>
      <!-- Blue lines -->
      <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(91,192,235,0.12)" stroke-width="3"/>
      <line x1="0" y1="400" x2="400" y2="400" stroke="rgba(91,192,235,0.12)" stroke-width="3"/>
      <!-- Goal lines -->
      <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(200,16,46,0.15)" stroke-width="1"/>
      <line x1="0" y1="520" x2="400" y2="520" stroke="rgba(200,16,46,0.15)" stroke-width="1"/>
      <!-- Faceoff circles top -->
      <circle cx="120" cy="130" r="30" fill="none" stroke="rgba(200,16,46,0.18)" stroke-width="1.5"/>
      <circle cx="280" cy="130" r="30" fill="none" stroke="rgba(200,16,46,0.18)" stroke-width="1.5"/>
      <circle cx="120" cy="130" r="2" fill="rgba(200,16,46,0.4)"/>
      <circle cx="280" cy="130" r="2" fill="rgba(200,16,46,0.4)"/>
      <!-- Faceoff circles bottom -->
      <circle cx="120" cy="470" r="30" fill="none" stroke="rgba(200,16,46,0.18)" stroke-width="1.5"/>
      <circle cx="280" cy="470" r="30" fill="none" stroke="rgba(200,16,46,0.18)" stroke-width="1.5"/>
      <circle cx="120" cy="470" r="2" fill="rgba(200,16,46,0.4)"/>
      <circle cx="280" cy="470" r="2" fill="rgba(200,16,46,0.4)"/>
      <!-- Rink boards (rounded edges) -->
      <rect x="20" y="40" width="360" height="520" rx="60" fill="none" stroke="rgba(91,192,235,0.1)" stroke-width="1"/>
    </svg>
  `;
}

// ============ SKILL SELECT ============
function Skill() {
  // Group skills by category — gives the picker structure instead of one long list
  const groups = [
    { id: "shots", label: "Shooting", desc: "On-ice or off-ice — both work" },
    { id: "skating", label: "Skating", desc: "Ice skates or rollerblades" },
    { id: "puck", label: "Puck Skills", desc: "Anywhere with a stick" },
  ];
  return `
    <button data-a="back-home" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <p class="slabel">Step 1 of 2</p>
    <h1 class="title">WHAT ARE WE<br>SHARPENING?</h1>
    <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted)">Pick the skill in your clip so Claude knows what to look for.</p>

    ${groups.map(g => {
      const items = SKILLS.filter(s => s.group === g.id);
      if (items.length === 0) return "";
      return `
        <div style="margin-top:1.5rem">
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:.625rem;padding:0 .25rem">
            <div class="bebas" style="font-size:1rem;color:var(--ice);letter-spacing:.06em">${g.label.toUpperCase()}</div>
            <div class="mono" style="font-size:.625rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">${g.desc}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:.625rem">
            ${items.map(s => `
              <button data-a="pick-skill" data-skill="${s.id}" class="sbtn">
                <div style="display:flex;align-items:center;gap:1rem">
                  <div class="sicon">${s.svg}</div>
                  <span class="bebas" style="font-size:1.25rem">${s.name.toUpperCase()}</span>
                </div>
                <div style="color:var(--muted-dim)">${icons.right}</div>
              </button>
            `).join("")}
          </div>
        </div>
      `;
    }).join("")}
  `;
}

// ============ UPLOAD ============
function Upload() {
  const sk = SKILLS.find(s => s.id === state.skill);
  const hasVideo = !!state.videoFile && state.videoUrl;

  return `
    <button data-a="back-skill" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1.5rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <p class="slabel">Step 2 of 2 · ${escapeHtml(sk?.name || "")}</p>
    <h1 class="title">${hasVideo ? "TRIM TO<br>THE REP." : "UPLOAD<br>YOUR CLIP."}</h1>
    <input type="file" accept="video/*" id="fi" style="display:none"/>

    ${!hasVideo ? `
      <button data-a="pick-file" id="dropzone" style="width:100%;margin-top:1.75rem;padding:2rem;border-radius:1.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${state.isDragOver?'rgba(91,192,235,.08)':'var(--surface)'};border:2px dashed ${state.isDragOver?'var(--ice)':'var(--border)'};min-height:220px;transition:background .15s,border-color .15s">
        <div style="width:4rem;height:4rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;background:var(--surface-hi);color:var(--ice)">${icons.upload}</div>
        <div class="bebas" style="font-size:1.375rem">${state.isDragOver ? "DROP TO UPLOAD" : "TAP OR DRAG VIDEO"}</div>
        <div style="margin-top:.375rem;font-size:.8125rem;color:var(--muted);text-align:center">MP4 · MOV · HEVC from iPhone all work</div>
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
            "Skating: ice skates OR inline / rollerblades both work",
            "3-15 second clip — you can trim longer videos in the next step",
          ].map(t => `<li style="display:flex;gap:.75rem;align-items:flex-start;font-size:.875rem"><div style="color:var(--good);margin-top:.125rem;flex-shrink:0">${icons.check}</div>${t}</li>`).join("")}
        </ul>
      </div>
    ` : `
      <p style="margin-top:.75rem;font-size:.875rem;color:var(--muted);line-height:1.5">Drag the handles to keep just the part with the rep. The AI focuses on what's between the handles.</p>

      <div style="position:relative;margin-top:1.25rem;border-radius:1rem;overflow:hidden;background:#000;aspect-ratio:16/10">
        <video id="trim-video" src="${state.videoUrl}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:contain"></video>
        <div id="trim-overlay" style="position:absolute;bottom:.625rem;left:.75rem;right:.75rem;display:flex;align-items:center;justify-content:space-between;color:#fff;font-family:'JetBrains Mono';font-size:.75rem;font-weight:600">
          <span id="trim-current" style="background:rgba(0,0,0,.6);padding:.125rem .5rem;border-radius:9999px">0.0s</span>
          <span id="trim-window" style="background:rgba(91,192,235,.85);color:#000;padding:.125rem .5rem;border-radius:9999px">— s window</span>
        </div>
      </div>

      <!-- Trim track -->
      <div id="trim-track-wrap" style="margin-top:1rem;padding:.5rem 0;position:relative">
        <div id="trim-track" style="position:relative;height:2.5rem;border-radius:.75rem;background:var(--surface-hi);border:1px solid var(--border);touch-action:none">
          <div id="trim-fill" style="position:absolute;top:0;bottom:0;background:rgba(91,192,235,.18);border-left:2px solid var(--ice);border-right:2px solid var(--ice);left:0%;right:0%;pointer-events:none"></div>
          <div id="trim-handle-start" data-handle="start" style="position:absolute;top:-.25rem;bottom:-.25rem;width:1.25rem;left:0%;margin-left:-.625rem;background:var(--ice);border-radius:.375rem;cursor:ew-resize;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);touch-action:none">
            <div style="width:2px;height:1rem;background:var(--bg);border-radius:1px"></div>
          </div>
          <div id="trim-handle-end" data-handle="end" style="position:absolute;top:-.25rem;bottom:-.25rem;width:1.25rem;left:100%;margin-left:-.625rem;background:var(--ice);border-radius:.375rem;cursor:ew-resize;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);touch-action:none">
            <div style="width:2px;height:1rem;background:var(--bg);border-radius:1px"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:.5rem;font-family:'JetBrains Mono';font-size:.6875rem;color:var(--muted);font-weight:600">
          <span id="trim-start-label">0.0s</span>
          <span id="trim-end-label">${(state.videoDuration||0).toFixed(1)}s</span>
        </div>
      </div>

      <button data-a="analyze-trimmed" class="btn btn-red" style="margin-top:1.25rem">
        <div style="text-align:left;position:relative;z-index:1">
          <div class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;opacity:.85;margin-bottom:.25rem;font-weight:600">Looks good?</div>
          <div class="bebas" style="font-size:1.375rem">ANALYZE THIS WINDOW</div>
        </div>
        <div style="width:3rem;height:3rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);position:relative;z-index:1">${icons.right}</div>
      </button>

      <button data-a="reset-video" style="width:100%;margin-top:.75rem;padding:.875rem;border-radius:.75rem;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:.8125rem;font-weight:600">
        Pick a different clip
      </button>
    `}
  `;
}

// Set up trim UI — runs after Upload screen is rendered with a video.
function setupTrimUI() {
  const video = document.getElementById("trim-video");
  const track = document.getElementById("trim-track");
  const handleStart = document.getElementById("trim-handle-start");
  const handleEnd = document.getElementById("trim-handle-end");
  const fill = document.getElementById("trim-fill");
  const startLabel = document.getElementById("trim-start-label");
  const endLabel = document.getElementById("trim-end-label");
  const currentLabel = document.getElementById("trim-current");
  const windowLabel = document.getElementById("trim-window");
  if (!video || !track) return;

  const onMeta = () => {
    if (!isFinite(video.duration) || video.duration <= 0) return;
    state.videoDuration = video.duration;
    state.trimStart = 0;
    state.trimEnd = video.duration;
    state.trimReady = true;
    updateTrimVisuals();
    // Auto-play preview, looping inside the trim window
    video.currentTime = state.trimStart;
    video.play().catch(() => {/* iOS may block until user gesture, that's ok */});
  };
  if (video.readyState >= 1) onMeta();
  else video.addEventListener("loadedmetadata", onMeta);

  // Loop inside the trim window
  video.addEventListener("timeupdate", () => {
    if (currentLabel) currentLabel.textContent = video.currentTime.toFixed(1) + "s";
    if (state.trimReady && video.currentTime >= state.trimEnd - 0.05) {
      video.currentTime = state.trimStart;
      video.play().catch(() => {});
    }
    if (state.trimReady && video.currentTime < state.trimStart - 0.05) {
      video.currentTime = state.trimStart;
    }
  });

  function updateTrimVisuals() {
    if (!state.videoDuration) return;
    const startPct = (state.trimStart / state.videoDuration) * 100;
    const endPct = (state.trimEnd / state.videoDuration) * 100;
    handleStart.style.left = startPct + "%";
    handleEnd.style.left = endPct + "%";
    fill.style.left = startPct + "%";
    fill.style.right = (100 - endPct) + "%";
    if (startLabel) startLabel.textContent = state.trimStart.toFixed(1) + "s";
    if (endLabel) endLabel.textContent = state.trimEnd.toFixed(1) + "s";
    if (windowLabel) windowLabel.textContent = (state.trimEnd - state.trimStart).toFixed(1) + "s window";
  }

  // Drag handles. Pointer events handle both mouse and touch in modern browsers.
  let dragging = null;
  function startDrag(handle, e) {
    e.preventDefault();
    dragging = handle;
    handle.setPointerCapture?.(e.pointerId);
  }
  function moveDrag(e) {
    if (!dragging || !state.videoDuration) return;
    const rect = track.getBoundingClientRect();
    const x = ("clientX" in e ? e.clientX : e.touches?.[0]?.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const t = pct * state.videoDuration;
    const which = dragging.dataset.handle;
    const minWindow = 0.5; // seconds — don't let handles overlap
    if (which === "start") {
      state.trimStart = Math.min(t, state.trimEnd - minWindow);
    } else {
      state.trimEnd = Math.max(t, state.trimStart + minWindow);
    }
    updateTrimVisuals();
    // Scrub the video to the handle position so user sees what they're trimming to
    if (video.readyState >= 2) video.currentTime = which === "start" ? state.trimStart : state.trimEnd;
  }
  function endDrag(e) {
    dragging = null;
  }

  for (const h of [handleStart, handleEnd]) {
    h.addEventListener("pointerdown", e => startDrag(h, e));
  }
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // Set up drag-to-load on the dropzone (called separately for the no-video state)
}

// Drag-and-drop on the upload zone (desktop browsers)
function setupDropzone() {
  const dz = document.getElementById("dropzone");
  if (!dz) return;
  const prevent = e => { e.preventDefault(); e.stopPropagation(); };
  ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, e => {
    prevent(e);
    if (!state.isDragOver) { state.isDragOver = true; renderScreen(); }
  }));
  ["dragleave", "dragend"].forEach(ev => dz.addEventListener(ev, e => {
    prevent(e);
    if (state.isDragOver) { state.isDragOver = false; renderScreen(); }
  }));
  dz.addEventListener("drop", e => {
    prevent(e);
    state.isDragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
    else renderScreen();
  });
  // Also block default browser-wide drop behavior so dropping outside doesn't navigate
  ["dragover", "drop"].forEach(ev => window.addEventListener(ev, e => {
    if (state.screen === "upload") e.preventDefault();
  }));
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
    <h1 class="title">SHIFT REPORT.</h1>
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
    ${r._reference ? `
      <a href="${escapeHtml(r._reference.url)}" target="_blank" rel="noopener noreferrer" data-a="log-reference-click" data-skill="${escapeHtml(state.skill)}" style="display:flex;align-items:center;gap:.875rem;padding:1rem 1.125rem;margin-top:1.5rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);text-decoration:none;color:inherit;transition:border-color .15s">
        <div style="width:2.5rem;height:2.5rem;border-radius:.625rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,45,45,.1);color:var(--fire)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 7.196A2.506 2.506 0 0 0 19.83 5.43C18.282 5 12 5 12 5s-6.282 0-7.83.43A2.506 2.506 0 0 0 2.418 7.196C2 8.748 2 12 2 12s0 3.252.418 4.804c.232.864.916 1.532 1.752 1.766C5.718 19 12 19 12 19s6.282 0 7.83-.43a2.506 2.506 0 0 0 1.752-1.766C22 15.252 22 12 22 12s0-3.252-.418-4.804zM10 15V9l5.196 3L10 15z"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div class="mono" style="font-size:.6875rem;color:var(--fire);font-weight:700;letter-spacing:.05em;margin-bottom:.125rem">SEE WHAT GOOD LOOKS LIKE</div>
          <div style="font-size:.875rem;font-weight:700;line-height:1.3">${escapeHtml(r._reference.title)}</div>
          <div style="font-size:.6875rem;color:var(--muted);margin-top:.125rem">Tutorials on YouTube · opens in a new tab</div>
        </div>
        <div style="color:var(--muted-dim);flex-shrink:0">${icons.right}</div>
      </a>
    ` : ""}
    ${r.workout ? `
      <button data-a="show-workout" class="btn btn-blue" style="margin-top:1rem">
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
    ${state.result?._sessionId ? `
      <button data-a="open-saved-workout" data-id="${state.result._sessionId}" class="btn btn-blue" style="margin-top:1.5rem">
        <div style="text-align:left">
          <div class="mono" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;opacity:.9;margin-bottom:.25rem;font-weight:700">Track your progress</div>
          <div class="bebas" style="font-size:1.25rem">CHECK OFF DRILLS AS YOU GO</div>
        </div>
        <div style="color:var(--bg)">${icons.right}</div>
      </button>
    ` : ""}
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
// Aggregate session data into the small numbers shown on the home screen.
// Uses the same auth.listSessions endpoint — no new backend needed.
async function loadHomeData() {
  try {
    const profile = auth.getCurrentProfile();
    const profileId = profile?.id && profile.id !== "local" ? profile.id : null;
    const sessions = await auth.listSessions(profileId);
    const arr = sessions || [];

    state.totalAnalyses = arr.length;
    state.bestScore = arr.reduce((max, s) => Math.max(max, s.score || 0), 0);

    // Streak: count consecutive days with at least one analysis, starting from today
    state.streak = computeDayStreak(arr);

    // Recent ticker — last ~6 analyses (most recent first), this user only.
    // For genuine "on the ice now" signal we'd query other users, but that needs a
    // public endpoint and consent. For now, show this player's own recent activity —
    // it still feels alive and uses real data.
    state.recentTicker = arr.slice(0, 6).map(s => ({
      skill: s.skill, score: s.score, created_at: s.created_at,
    }));

    // Today's workout = most recent saved session that has a workout plan
    const withWorkout = arr.find(s => {
      const w = s.result?.workout;
      return w && (w.days?.length || (w.tracks?.off_ice?.days?.length && w.tracks?.on_ice?.days?.length));
    });
    if (withWorkout) {
      state.todaysWorkout = withWorkout;
      const completions = await auth.listCompletions({ profileId });
      // Reuse global state.completions briefly so workoutProgress can compute
      const prevCompletions = state.completions;
      state.completions = completions || [];
      const prog = workoutProgress(withWorkout); // null track = sums across all tracks for dual
      state.todaysWorkoutPct = prog.pct;
      state.completions = prevCompletions; // restore — workouts screen reloads its own
    } else {
      state.todaysWorkout = null;
      state.todaysWorkoutPct = 0;
    }
  } catch (err) {
    console.error("[home] data load failed:", err);
  }
  state.homeDataLoaded = true;
  if (state.screen === "home") renderScreen();
}

function computeDayStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  // Get unique days (YYYY-MM-DD) when any analysis happened, sorted desc
  const days = [...new Set(sessions.map(s => (s.created_at || "").slice(0, 10)).filter(Boolean))].sort().reverse();
  if (days.length === 0) return 0;
  // Walk backward from today (or yesterday — being generous about the cutoff)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const d1 = new Date(days[i]);
    const d2 = new Date(days[i + 1]);
    const diff = Math.round((d1 - d2) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

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
              ${[profile.position && capitalize(profile.position), profile.age_group?.toUpperCase(), profile.experience_level && capitalize(profile.experience_level)].filter(Boolean).join(" · ") || "No details set"}
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
                  <div style="font-size:.6875rem;color:var(--muted)">${[p.position && capitalize(p.position), p.age_group?.toUpperCase(), p.experience_level && capitalize(p.experience_level)].filter(Boolean).join(" · ") || ""}</div>
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
let profileFormState = { name: "", position: "", age_group: "", experience_level: "", training_access: "", makeDefault: false, editingId: null };

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
  const expLevels = [
    { id: "beginner", label: "Beginner", desc: "First few seasons" },
    { id: "intermediate", label: "Intermediate", desc: "Comfortable with basics" },
    { id: "advanced", label: "Advanced", desc: "Competitive / AA+" },
    { id: "coach", label: "Coach", desc: "Reading on behalf of a coach" },
  ];
  const accessLevels = [
    { id: "off_ice", label: "Off-ice only", desc: "Garage, basement, gym, driveway" },
    { id: "on_ice", label: "On-ice only", desc: "Regular rink time, no off-ice" },
    { id: "both", label: "Both (separated)", desc: "Two parallel tracks per plan" },
  ];
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

      <label class="slabel" style="margin-top:.75rem">Experience level <span style="color:var(--muted-dim);font-weight:400;text-transform:none;letter-spacing:0">(controls how technical the feedback is)</span></label>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${expLevels.map(e => `
          <button type="button" data-exp="${e.id}" style="padding:.875rem 1rem;border-radius:.75rem;background:${profileFormState.experience_level===e.id?'rgba(91,192,235,.12)':'var(--surface-hi)'};border:1px solid ${profileFormState.experience_level===e.id?'var(--ice)':'var(--border)'};display:flex;align-items:center;justify-content:space-between;text-align:left;gap:.75rem">
            <div>
              <div style="font-size:.875rem;font-weight:700;color:${profileFormState.experience_level===e.id?'var(--ice)':'var(--text)'}">${e.label}</div>
              <div style="font-size:.75rem;color:var(--muted);margin-top:.125rem">${e.desc}</div>
            </div>
            ${profileFormState.experience_level===e.id ? `<div style="color:var(--ice)">${icons.check}</div>` : ''}
          </button>
        `).join("")}
      </div>

      <label class="slabel" style="margin-top:1rem">Training access <span style="color:var(--muted-dim);font-weight:400;text-transform:none;letter-spacing:0">(shapes the workout plan)</span></label>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${accessLevels.map(a => `
          <button type="button" data-access="${a.id}" style="padding:.875rem 1rem;border-radius:.75rem;background:${profileFormState.training_access===a.id?'rgba(91,192,235,.12)':'var(--surface-hi)'};border:1px solid ${profileFormState.training_access===a.id?'var(--ice)':'var(--border)'};display:flex;align-items:center;justify-content:space-between;text-align:left;gap:.75rem">
            <div>
              <div style="font-size:.875rem;font-weight:700;color:${profileFormState.training_access===a.id?'var(--ice)':'var(--text)'}">${a.label}</div>
              <div style="font-size:.75rem;color:var(--muted);margin-top:.125rem">${a.desc}</div>
            </div>
            ${profileFormState.training_access===a.id ? `<div style="color:var(--ice)">${icons.check}</div>` : ''}
          </button>
        `).join("")}
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

// ============ WORKOUTS ============
// Each "workout" is a saved session that has a workout plan attached.
// We compute "Day X / Y" based on the session creation date and the # of days completed.

async function loadWorkouts() {
  state.historyLoading = true;
  renderScreen();
  try {
    const profile = auth.getCurrentProfile();
    const profileId = profile?.id && profile.id !== "local" ? profile.id : null;
    const sessions = await auth.listSessions(profileId);
    // Only sessions that actually have a workout (either single-track days or dual-track tracks)
    state.workouts = (sessions || []).filter(s => {
      const w = s.result?.workout;
      return w && (w.days?.length || (w.tracks?.off_ice?.days?.length && w.tracks?.on_ice?.days?.length));
    });
    // Load completions for these sessions
    const completions = await auth.listCompletions({ profileId });
    state.completions = completions || [];
  } catch (err) {
    console.error("[workouts] load failed:", err);
    state.workouts = [];
    state.completions = [];
  }
  state.historyLoading = false;
  renderScreen();
}

// Compute progress for one session: how many drills completed across all days
// Returns the days array for a given track. For old single-track plans, just returns workout.days.
// For dual-track plans, returns workout.tracks[track].days.
function getWorkoutDays(workout, track) {
  if (!workout) return [];
  if (workout.tracks) {
    return workout.tracks[track]?.days || [];
  }
  return workout.days || [];
}

// True if this workout is a dual-track plan (has a "tracks" object with both off_ice and on_ice)
function isDualTrack(workout) {
  return !!(workout?.tracks?.off_ice && workout?.tracks?.on_ice);
}

// Returns the list of available tracks for this workout. Single-track returns [null].
// Dual-track returns ["off_ice", "on_ice"].
function workoutTracks(workout) {
  return isDualTrack(workout) ? ["off_ice", "on_ice"] : [null];
}

function trackLabel(track) {
  if (track === "off_ice") return "Off-Ice";
  if (track === "on_ice") return "On-Ice";
  return "";
}

function workoutProgress(session, track) {
  // If track specified, only count that track. If track is null on a dual-track plan,
  // sum across both tracks.
  const workout = session.result?.workout;
  if (!workout) return { completed: 0, total: 0, pct: 0 };

  let totalDrills = 0;
  let completed = 0;

  if (isDualTrack(workout)) {
    const tracks = track ? [track] : ["off_ice", "on_ice"];
    for (const t of tracks) {
      const days = workout.tracks[t]?.days || [];
      totalDrills += days.reduce((sum, d) => sum + (d.drills?.length || 0), 0);
      completed += (state.completions || []).filter(c =>
        c.session_id === session.id && (c.track || null) === t
      ).length;
    }
  } else {
    const days = workout.days || [];
    totalDrills = days.reduce((sum, d) => sum + (d.drills?.length || 0), 0);
    // Single-track completions have null track
    completed = (state.completions || []).filter(c =>
      c.session_id === session.id && (c.track == null)
    ).length;
  }

  return { completed, total: totalDrills, pct: totalDrills ? Math.round(completed / totalDrills * 100) : 0 };
}

// "Day X of plan" — based on calendar days since session was created
function dayOfPlan(session) {
  const created = new Date(session.created_at);
  const now = new Date();
  const dayNum = Math.floor((now - created) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = (session.result?.workout?.weeks || 4) * 7;
  return { day: Math.min(dayNum, totalDays), total: totalDays, finished: dayNum > totalDays };
}

function isDrillComplete(sessionId, dayIndex, drillIndex, track) {
  const trackVal = track || null;
  return (state.completions || []).some(c =>
    c.session_id === sessionId &&
    c.day_index === dayIndex &&
    c.drill_index === drillIndex &&
    (c.track || null) === trackVal
  );
}

function Workouts() {
  if (state.historyLoading) {
    return `<h1 class="title">WORKOUTS</h1><p style="margin-top:2rem;color:var(--muted);text-align:center">Loading...</p>`;
  }

  const workouts = state.workouts || [];
  if (workouts.length === 0) {
    return `
      <h1 class="title">WORKOUTS</h1>
      <p class="slabel" style="margin-top:.75rem">No workout plans yet</p>
      <div class="card" style="margin-top:1.5rem;text-align:center;padding:2rem 1rem">
        <div style="font-size:3rem;margin-bottom:.75rem">🏋️</div>
        <div style="font-size:.875rem;font-weight:700;margin-bottom:.5rem">Workouts appear here automatically</div>
        <div style="font-size:.8125rem;color:var(--muted);line-height:1.5">After every analysis, the AI builds a 4-week training plan tailored to what it saw. Track your drills, mark them complete, build the habit.</div>
        <button data-a="new" class="btn btn-red" style="margin-top:1.5rem">
          <span class="bebas" style="font-size:1.125rem">ANALYZE A CLIP</span>
          <div style="color:#fff">${icons.right}</div>
        </button>
      </div>
    `;
  }

  // Group by skill
  const bySkill = {};
  workouts.forEach(w => {
    if (!bySkill[w.skill]) bySkill[w.skill] = [];
    bySkill[w.skill].push(w);
  });

  // Compute totals
  const totalDrills = workouts.reduce((sum, w) => sum + (w.result?.workout?.days?.reduce((s, d) => s + (d.drills?.length || 0), 0) || 0), 0);
  const totalCompleted = (state.completions || []).length;

  return `
    <h1 class="title">WORKOUTS</h1>
    <p class="slabel" style="margin-top:.5rem">${workouts.length} plan${workouts.length === 1 ? '' : 's'} ${auth.getCurrentProfile()?.name ? '· ' + auth.getCurrentProfile().name : ''}</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:1.25rem">
      <div class="card" style="text-align:center;padding:1rem">
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:var(--ice)">${totalCompleted}</div>
        <div class="slabel" style="margin-top:.375rem;margin-bottom:0">Drills done</div>
      </div>
      <div class="card" style="text-align:center;padding:1rem">
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:var(--good)">${totalDrills ? Math.round(totalCompleted/totalDrills*100) : 0}%</div>
        <div class="slabel" style="margin-top:.375rem;margin-bottom:0">Overall progress</div>
      </div>
    </div>

    ${Object.entries(bySkill).map(([skillId, plans]) => `
      <div style="margin-top:1.75rem">
        <div style="display:flex;align-items:center;gap:.625rem;margin-bottom:.75rem">
          <div style="width:2rem;height:2rem;border-radius:.5rem;display:flex;align-items:center;justify-content:center;background:var(--surface-hi);font-size:1rem">${skillIcon(skillId)}</div>
          <h2 class="bebas" style="font-size:1.125rem;margin:0">${skillName(skillId).toUpperCase()}</h2>
          <span class="mono" style="font-size:.6875rem;color:var(--muted);margin-left:auto">${plans.length} plan${plans.length === 1 ? '' : 's'}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          ${plans.map(p => {
            const prog = workoutProgress(p);
            const day = dayOfPlan(p);
            return `
              <button data-a="open-workout" data-id="${p.id}" class="card" style="text-align:left;width:100%;cursor:pointer">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.625rem">
                  <div style="flex:1;min-width:0">
                    <div style="font-size:.875rem;font-weight:700;line-height:1.3">${escapeHtml(p.result?.workout?.focus || "Training plan")}</div>
                    <div style="display:flex;gap:.625rem;margin-top:.375rem;font-size:.6875rem;color:var(--muted);font-family:'JetBrains Mono';font-weight:600">
                      <span>${formatDate(p.created_at)}</span>
                      <span>·</span>
                      <span>${day.finished ? "PLAN COMPLETE" : `DAY ${day.day}/${day.total}`}</span>
                    </div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div class="bebas" style="font-size:1.125rem;line-height:1;color:${prog.pct === 100 ? 'var(--good)' : 'var(--ice)'}">${prog.completed}<span style="font-size:.75rem;color:var(--muted)">/${prog.total}</span></div>
                    <div class="mono" style="font-size:9px;color:var(--muted);font-weight:600;margin-top:.125rem">DRILLS</div>
                  </div>
                </div>
                <div style="width:100%;height:4px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
                  <div style="height:100%;width:${prog.pct}%;background:${prog.pct === 100 ? 'var(--good)' : 'var(--ice)'};transition:width .3s"></div>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `).join("")}
  `;
}

function WorkoutDetail() {
  const workout = state.activeWorkout;
  if (!workout) return `<h1 class="title">WORKOUT</h1><p style="margin-top:2rem;color:var(--muted)">Workout not found.</p><button data-a="back-workouts" class="btn btn-secondary" style="margin-top:1rem">Back</button>`;

  const w = workout.result?.workout;
  if (!w) return `<h1 class="title">WORKOUT</h1><p style="margin-top:2rem;color:var(--muted)">No workout data.</p>`;

  const dual = isDualTrack(w);
  // Active track: dual plans default to off_ice, single plans use null
  const activeTrack = dual ? (state.activeTrack || "off_ice") : null;

  // Overall progress (across both tracks if dual)
  const overallProg = workoutProgress(workout);
  const day = dayOfPlan(workout);
  const expandedDayIndex = state.expandedDay ?? 0;

  // Days for the current view
  const days = getWorkoutDays(w, activeTrack);

  // Per-track progress for the tabs (only relevant if dual)
  const offProg = dual ? workoutProgress(workout, "off_ice") : null;
  const onProg = dual ? workoutProgress(workout, "on_ice") : null;

  return `
    <button data-a="back-workouts" style="display:flex;align-items:center;gap:.25rem;margin-bottom:1rem;color:var(--muted)">
      ${icons.back}<span style="font-size:.875rem;font-weight:600">Back</span>
    </button>
    <p class="slabel" style="color:var(--ice);font-weight:600">${skillName(workout.skill)} · ${formatDate(workout.created_at)}</p>
    <h1 class="title">${escapeHtml((w.focus || "Training plan").toUpperCase())}</h1>

    <div class="card" style="margin-top:1.25rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div>
          <div class="slabel" style="margin-bottom:.25rem">${day.finished ? "Plan complete" : `Day ${day.day} of ${day.total}`}</div>
          <div style="font-size:.8125rem;color:var(--muted)">${overallProg.completed} of ${overallProg.total} drills done · ${overallProg.pct}% overall</div>
        </div>
        <div class="bebas" style="font-size:1.75rem;line-height:1;color:${overallProg.pct === 100 ? 'var(--good)' : 'var(--ice)'}">${overallProg.pct}<span style="font-size:.875rem;color:var(--muted)">%</span></div>
      </div>
      <div style="width:100%;height:6px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
        <div style="height:100%;width:${overallProg.pct}%;background:${overallProg.pct === 100 ? 'var(--good)' : 'var(--ice)'};transition:width .3s"></div>
      </div>
    </div>

    ${dual ? `
      <div style="margin-top:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
        <button data-a="switch-track" data-track="off_ice" style="padding:.875rem 1rem;border-radius:.875rem;text-align:left;background:${activeTrack==='off_ice'?'rgba(91,192,235,.12)':'var(--surface)'};border:1px solid ${activeTrack==='off_ice'?'var(--ice)':'var(--border)'};cursor:pointer">
          <div class="slabel" style="margin-bottom:.125rem;color:${activeTrack==='off_ice'?'var(--ice)':'var(--muted)'};font-weight:600">Off-Ice Track</div>
          <div style="display:flex;align-items:baseline;gap:.375rem">
            <div class="bebas" style="font-size:1.375rem;line-height:1;color:${offProg.pct===100?'var(--good)':'var(--ice)'}">${offProg.pct}<span style="font-size:.6875rem;color:var(--muted);font-family:'JetBrains Mono'">%</span></div>
            <div class="mono" style="font-size:.6875rem;color:var(--muted);font-weight:600">${offProg.completed}/${offProg.total}</div>
          </div>
          <div style="margin-top:.5rem;height:3px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
            <div style="height:100%;width:${offProg.pct}%;background:${offProg.pct===100?'var(--good)':'var(--ice)'};transition:width .3s"></div>
          </div>
        </button>
        <button data-a="switch-track" data-track="on_ice" style="padding:.875rem 1rem;border-radius:.875rem;text-align:left;background:${activeTrack==='on_ice'?'rgba(91,192,235,.12)':'var(--surface)'};border:1px solid ${activeTrack==='on_ice'?'var(--ice)':'var(--border)'};cursor:pointer">
          <div class="slabel" style="margin-bottom:.125rem;color:${activeTrack==='on_ice'?'var(--ice)':'var(--muted)'};font-weight:600">On-Ice Track</div>
          <div style="display:flex;align-items:baseline;gap:.375rem">
            <div class="bebas" style="font-size:1.375rem;line-height:1;color:${onProg.pct===100?'var(--good)':'var(--ice)'}">${onProg.pct}<span style="font-size:.6875rem;color:var(--muted);font-family:'JetBrains Mono'">%</span></div>
            <div class="mono" style="font-size:.6875rem;color:var(--muted);font-weight:600">${onProg.completed}/${onProg.total}</div>
          </div>
          <div style="margin-top:.5rem;height:3px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
            <div style="height:100%;width:${onProg.pct}%;background:${onProg.pct===100?'var(--good)':'var(--ice)'};transition:width .3s"></div>
          </div>
        </button>
      </div>
    ` : ""}

    <div style="margin-top:${dual?'1.25rem':'1.5rem'};display:flex;flex-direction:column;gap:.625rem">
      ${days.map((d, dIdx) => {
        const dayDrills = d.drills || [];
        const dayCompleted = dayDrills.filter((_, drIdx) => isDrillComplete(workout.id, dIdx, drIdx, activeTrack)).length;
        const dayPct = dayDrills.length ? Math.round(dayCompleted / dayDrills.length * 100) : 0;
        const isExpanded = expandedDayIndex === dIdx;
        return `
          <div style="border-radius:1rem;overflow:hidden;background:var(--surface);border:1px solid var(--border)">
            <button data-a="toggle-day" data-day="${dIdx}" style="width:100%;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;text-align:left">
              <div style="flex:1;min-width:0">
                <div class="slabel" style="color:${dayPct===100?'var(--good)':'var(--ice)'};font-weight:600;margin-bottom:.125rem">${d.day}</div>
                <div class="bebas" style="font-size:1.125rem">${escapeHtml((d.title || "").toUpperCase())}</div>
                <div style="display:flex;align-items:center;gap:.5rem;margin-top:.375rem">
                  <div style="flex:1;max-width:120px;height:3px;border-radius:9999px;overflow:hidden;background:var(--surface-hi)">
                    <div style="height:100%;width:${dayPct}%;background:${dayPct===100?'var(--good)':'var(--ice)'};transition:width .3s"></div>
                  </div>
                  <span class="mono" style="font-size:.6875rem;color:var(--muted);font-weight:600">${dayCompleted}/${dayDrills.length}</span>
                </div>
              </div>
              <div style="color:var(--muted);transform:rotate(${isExpanded?'90':'0'}deg);transition:transform .2s">${icons.right}</div>
            </button>
            ${isExpanded ? `
              <div style="padding:0 1.25rem 1.25rem;display:flex;flex-direction:column;gap:.5rem">
                ${dayDrills.map((dr, drIdx) => {
                  const done = isDrillComplete(workout.id, dIdx, drIdx, activeTrack);
                  return `
                    <button data-a="toggle-drill" data-day="${dIdx}" data-drill="${drIdx}" data-track="${activeTrack || ''}" style="display:flex;gap:.75rem;align-items:flex-start;padding:.75rem;border-radius:.625rem;background:${done?'rgba(74,222,128,.06)':'var(--surface-hi)'};border:1px solid ${done?'rgba(74,222,128,.3)':'var(--border)'};text-align:left;width:100%;cursor:pointer">
                      <div style="flex-shrink:0;margin-top:.125rem;color:${done?'var(--good)':'var(--muted-dim)'}">${done?icons.checkCircle:icons.circle}</div>
                      <div style="flex:1;min-width:0">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem">
                          <div style="font-size:.875rem;font-weight:700;${done?'text-decoration:line-through;opacity:.7':''}">${escapeHtml(dr.name)}</div>
                          <div class="mono" style="flex-shrink:0;font-size:.75rem;color:var(--ice);font-weight:600">${escapeHtml(dr.sets || "")}</div>
                        </div>
                        ${dr.note ? `<div style="margin-top:.25rem;font-size:.75rem;color:var(--muted);line-height:1.4">${escapeHtml(dr.note)}</div>` : ""}
                      </div>
                    </button>
                  `;
                }).join("")}
              </div>
            ` : ""}
          </div>
        `;
      }).join("")}
    </div>

    <button data-a="open-original-report" data-id="${workout.id}" style="width:100%;margin-top:1.5rem;padding:1rem;border-radius:1rem;background:var(--surface);border:1px solid var(--border);color:var(--ice);font-size:.875rem;font-weight:600">
      View original analysis report
    </button>
  `;
}


function renderTabBar() {
  const el = document.getElementById("tabbar");
  if (!el) return;
  const tabs = [
    { id: "home", label: "Home", icon: icons.home },
    { id: "workouts", label: "Workouts", icon: icons.dumbbell },
    { id: "upload", label: "Analyze", icon: icons.plus },
    { id: "stats", label: "Stats", icon: icons.stats },
    { id: "profile", label: "Profile", icon: icons.user },
  ];
  el.innerHTML = `<div>${tabs.map(t => {
    const a = state.screen === t.id || (t.id === "upload" && (state.screen === "skill" || state.screen === "upload")) || (t.id === "workouts" && state.screen === "workoutDetail");
    const p = t.id === "upload";
    return `<button data-tab="${t.id}" class="tab">${p
      ? `<div class="tab-plus" style="color:#fff">${t.icon}</div>`
      : `<div style="color:${a?'var(--ice)':'var(--muted-dim)'}">${t.icon}</div><span style="font-size:10px;font-weight:600;color:${a?'var(--ice)':'var(--muted-dim)'}">${t.label}</span>`
    }</button>`;
  }).join("")}</div>`;
  el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
    const t = b.dataset.tab;
    if (t === "upload") { state.error = null; go("skill"); }
    else if (t === "home") { go("home"); loadHomeData(); }
    else if (t === "stats") { go("stats"); loadHistory(); }
    else if (t === "workouts") { go("workouts"); loadWorkouts(); }
    else if (t === "profile") go("profile");
  }));
}

// ============ EVENT BINDING ============
function bind() {
  document.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", e => act(b.dataset.a, b.dataset, e)));
  const fi = document.getElementById("fi");
  if (fi) fi.addEventListener("change", e => { const f = e.target.files?.[0]; if (f) onFile(f); });

  // Upload screen extras: trim handles + drag-and-drop
  if (state.screen === "upload") {
    if (state.videoFile && state.videoUrl) setupTrimUI();
    else setupDropzone();
  }

  // Profile form
  const pf = document.getElementById("pf");
  if (pf) {
    pf.addEventListener("submit", async e => {
      e.preventDefault();
      profileFormState.name = document.getElementById("pf-name").value;
      profileFormState.makeDefault = document.getElementById("pf-default")?.checked || false;
      try {
        if (profileFormState.editingId) {
          await auth.updateProfile(profileFormState.editingId, { name: profileFormState.name, position: profileFormState.position, age_group: profileFormState.age_group, experience_level: profileFormState.experience_level, training_access: profileFormState.training_access, makeDefault: profileFormState.makeDefault });
          toast("Profile updated", "success");
        } else {
          await auth.createProfile({ name: profileFormState.name, position: profileFormState.position, age_group: profileFormState.age_group, experience_level: profileFormState.experience_level, training_access: profileFormState.training_access, makeDefault: profileFormState.makeDefault });
          toast("Profile created", "success");
        }
        profileFormState = { name: "", position: "", age_group: "", experience_level: "", training_access: "", makeDefault: false, editingId: null };
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
    pf.querySelectorAll("[data-exp]").forEach(b => b.addEventListener("click", () => {
      profileFormState.experience_level = b.dataset.exp === profileFormState.experience_level ? "" : b.dataset.exp;
      renderScreen();
    }));
    pf.querySelectorAll("[data-access]").forEach(b => b.addEventListener("click", () => {
      profileFormState.training_access = b.dataset.access === profileFormState.training_access ? "" : b.dataset.access;
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
    case "back-home": go("home"); loadHomeData(); break;
    case "back-skill": state.error = null; go("skill"); break;
    case "back-results": go("results"); break;
    case "view-last": go("results"); break;
    case "pick-skill": state.skill = d.skill; auth.logEvent("skill_picked", { skill: d.skill }); go("upload"); break;
    case "pick-file": document.getElementById("fi")?.click(); break;
    case "analyze-trimmed": {
      // Kick off the analysis with current trim window
      state.frames = []; state.progress = 0; state.stage = 0; state.stageText = "";
      go("analyzing"); run();
      break;
    }
    case "reset-video": {
      // User wants to pick a different clip
      if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
      state.videoFile = null; state.videoUrl = null;
      state.videoDuration = 0; state.trimStart = 0; state.trimEnd = 0; state.trimReady = false;
      renderScreen();
      break;
    }
    case "show-workout": go("workout"); break;
    case "log-reference-click":
      // Don't preventDefault — let the link open. Just log it.
      auth.logEvent("reference_clicked", { skill: d.skill });
      break;
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
      profileFormState = { name: "", position: "", age_group: "", experience_level: "", training_access: "", makeDefault: false, editingId: null };
      go("profileSetup");
      break;
    case "add-profile":
      profileFormState = { name: "", position: "", age_group: "", experience_level: "", training_access: "", makeDefault: false, editingId: null };
      go("profileNew");
      break;
    case "edit-profile":
      const cur = auth.getProfiles().find(p => p.id === d.id) || auth.getCurrentProfile();
      if (cur) {
        profileFormState = { name: cur.name||"", position: cur.position||"", age_group: cur.age_group||"", experience_level: cur.experience_level||"", training_access: cur.training_access||"", makeDefault: !!cur.is_default, editingId: cur.id };
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
    case "back-workouts":
      go("workouts"); break;
    case "open-workout": {
      const w = (state.workouts || []).find(x => x.id === d.id);
      if (w) {
        state.activeWorkout = w;
        state.expandedDay = 0; // expand first day by default
        // Default to off_ice track for dual-track plans, null otherwise
        const wo = w.result?.workout;
        state.activeTrack = isDualTrack(wo) ? "off_ice" : null;
        go("workoutDetail");
      } else {
        toast("Workout not found", "error");
      }
      break;
    }
    case "switch-track": {
      state.activeTrack = d.track;
      state.expandedDay = 0; // collapse to first day on track switch
      renderScreen();
      break;
    }
    case "toggle-day": {
      const idx = parseInt(d.day);
      state.expandedDay = state.expandedDay === idx ? -1 : idx;
      renderScreen();
      break;
    }
    case "toggle-drill": {
      const dayIdx = parseInt(d.day);
      const drillIdx = parseInt(d.drill);
      const trackVal = d.track || null; // empty string from data-track="" becomes null
      const sessionId = state.activeWorkout?.id;
      if (!sessionId) break;
      const wasComplete = isDrillComplete(sessionId, dayIdx, drillIdx, trackVal);
      // Optimistic UI: toggle local state immediately, matching on track too
      if (wasComplete) {
        state.completions = (state.completions || []).filter(c =>
          !(c.session_id === sessionId && c.day_index === dayIdx && c.drill_index === drillIdx && (c.track || null) === trackVal));
      } else {
        state.completions = [...(state.completions || []), {
          session_id: sessionId,
          profile_id: auth.getCurrentProfile()?.id,
          day_index: dayIdx,
          drill_index: drillIdx,
          track: trackVal,
          completed_at: new Date().toISOString(),
        }];
      }
      renderScreen();
      // Sync to backend
      try {
        if (wasComplete) await auth.unmarkDrillComplete(sessionId, dayIdx, drillIdx, trackVal);
        else await auth.markDrillComplete(sessionId, dayIdx, drillIdx, auth.getCurrentProfile()?.id, trackVal);
      } catch (err) {
        toast("Save failed, will retry", "error");
        // Reload to be safe
        await loadWorkouts();
      }
      break;
    }
    case "open-original-report": {
      const w = (state.workouts || []).find(x => x.id === d.id);
      if (w) {
        state.skill = w.skill;
        state.result = { ...w.result, _saved: true };
        go("results");
      }
      break;
    }
    case "open-saved-workout": {
      // Coming from results page after analysis — load workouts and open this one
      await loadWorkouts();
      const w = (state.workouts || []).find(x => x.id === d.id);
      if (w) {
        state.activeWorkout = w;
        state.expandedDay = 0;
        state.activeTrack = isDualTrack(w.result?.workout) ? "off_ice" : null;
        go("workoutDetail");
      } else {
        go("workouts");
      }
      break;
    }
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
    state.videoDuration = 0; state.trimStart = 0; state.trimEnd = 0; state.trimReady = false;
    state.isDragOver = false;
    // Stay on upload screen so user can trim. Run() is invoked by "analyze-trimmed" action.
    if (state.screen !== "upload") go("upload");
    else renderScreen();
  } catch (err) {
    state.error = `[E3-onFile] ${err?.message||err?.toString()||"unparseable error"}`;
    go("error");
  }
}

async function run() {
  try {
    state.progress = 5; renderScreen();
    const trimOpts = state.trimReady ? { trimStart: state.trimStart, trimEnd: state.trimEnd } : {};
    const { frames, duration } = await extractFrames(state.videoFile, 8,
      fr => { state.progress = 10 + fr * 35; state.stage = 1; updateAnalyzing(); },
      t => { state.stageText = t; updateAnalyzing(); },
      trimOpts
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
  loadHomeData();
});
window.addEventListener("sessions-migrated", e => {
  toast(`Imported ${e.detail.count} shift${e.detail.count === 1 ? '' : 's'} to your account`, "success", 4000);
  loadHomeData();
});

(async function init() {
  try { await auth.initAuth(); } catch (err) { console.error("[init] Auth init failed:", err); }
  auth.loadLocalProfileIfNeeded();
  renderScreen(); renderTabBar();
  // Log app open (fire and forget)
  auth.logEvent("app_open");
  // Load home data in background — doesn't block first paint
  loadHomeData();
})();
