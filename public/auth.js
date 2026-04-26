// Auth + state — uses Supabase JS client loaded from CDN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Public (anon) key + URL are injected by Vercel at build time via /api/config
let supabase = null;
let currentUser = null;
let currentProfile = null;
let allProfiles = [];

const LOCAL_SESSIONS_KEY = "rinkai.localSessions";
const LOCAL_PROFILE_KEY = "rinkai.localProfile";

// ============ INIT ============
export async function initAuth() {
  // Fetch public config from server (so we don't hardcode keys in HTML)
  let cfg;
  try {
    const r = await fetch("/api/config");
    if (!r.ok) throw new Error(`Config endpoint returned ${r.status}`);
    cfg = await r.json();
  } catch (err) {
    console.warn("[auth] No config available, running in local-only mode:", err.message);
    return { supabase: null, user: null };
  }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.warn("[auth] Supabase not configured, running in local-only mode");
    return { supabase: null, user: null };
  }

  supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadProfiles();
  }

  // Listen for auth changes (e.g. magic link callback)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      currentUser = session?.user || null;
      await loadProfiles();
      // Migrate local sessions if any
      await migrateLocalSessions();
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: { signedIn: true } }));
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;
      allProfiles = [];
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: { signedIn: false } }));
    }
  });

  return { supabase, user: currentUser };
}

export function getUser() { return currentUser; }
export function getProfiles() { return allProfiles; }
export function getCurrentProfile() { return currentProfile; }
export function isLoggedIn() { return !!currentUser; }
export function isConfigured() { return !!supabase; }

// ============ AUTH METHODS ============
export async function signInWithMagicLink(email) {
  if (!supabase) throw new Error("Auth not configured");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
  return { ok: true };
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Auth not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signUpWithPassword(email, password) {
  if (!supabase) throw new Error("Auth not configured");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error("Auth not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

async function getAuthHeader() {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// ============ PROFILE METHODS ============
export async function loadProfiles() {
  if (!currentUser) return [];
  const headers = await getAuthHeader();
  const r = await fetch("/api/profiles", { headers });
  if (!r.ok) {
    console.error("[profiles] load failed:", r.status);
    return [];
  }
  const { profiles } = await r.json();
  allProfiles = profiles || [];

  // Pick default or first profile as current
  if (allProfiles.length > 0) {
    currentProfile = allProfiles.find(p => p.is_default) || allProfiles[0];
  } else {
    currentProfile = null;
  }
  return allProfiles;
}

export async function createProfile({ name, position, age_group, makeDefault }) {
  if (!currentUser) {
    // Save locally for anonymous users
    const local = { id: "local", name, position, age_group, is_default: true, _local: true };
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(local));
    currentProfile = local;
    allProfiles = [local];
    return local;
  }
  const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
  const r = await fetch("/api/profiles", {
    method: "POST", headers,
    body: JSON.stringify({ name, position, age_group, makeDefault })
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to create profile");
  const { profile } = await r.json();
  await loadProfiles();
  if (makeDefault || allProfiles.length === 1) currentProfile = profile;
  return profile;
}

export async function updateProfile(id, updates) {
  if (id === "local") {
    const local = { ...currentProfile, ...updates };
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(local));
    currentProfile = local;
    allProfiles = [local];
    return local;
  }
  const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
  const r = await fetch(`/api/profiles?id=${encodeURIComponent(id)}`, {
    method: "PATCH", headers, body: JSON.stringify(updates)
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to update profile");
  await loadProfiles();
  return (await r.json()).profile;
}

export async function deleteProfile(id) {
  if (id === "local") {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    currentProfile = null;
    allProfiles = [];
    return;
  }
  const headers = await getAuthHeader();
  const r = await fetch(`/api/profiles?id=${encodeURIComponent(id)}`, { method: "DELETE", headers });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to delete profile");
  await loadProfiles();
}

export function setActiveProfile(id) {
  const p = allProfiles.find(x => x.id === id);
  if (p) currentProfile = p;
  return currentProfile;
}

export function loadLocalProfileIfNeeded() {
  if (currentUser) return;
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      const local = JSON.parse(raw);
      currentProfile = local;
      allProfiles = [local];
    }
  } catch {}
}

// ============ SESSION METHODS ============
export async function listSessions(profileId = null) {
  if (!currentUser) {
    // Local sessions
    try {
      const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return profileId ? arr.filter(s => s.profile_id === profileId) : arr;
    } catch { return []; }
  }
  const headers = await getAuthHeader();
  const url = profileId ? `/api/sessions?profileId=${encodeURIComponent(profileId)}` : "/api/sessions";
  const r = await fetch(url, { headers });
  if (!r.ok) {
    console.error("[sessions] list failed:", r.status);
    return [];
  }
  const { sessions } = await r.json();
  return sessions || [];
}

export async function deleteSession(id) {
  if (!currentUser || id?.startsWith?.("local-")) {
    // Local
    try {
      const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const filtered = arr.filter(s => s.id !== id);
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(filtered));
    } catch {}
    return;
  }
  const headers = await getAuthHeader();
  const r = await fetch(`/api/sessions?id=${encodeURIComponent(id)}`, { method: "DELETE", headers });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to delete");
}

// Save anonymously to localStorage when not logged in
export function saveLocalSession(session) {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const withId = {
      id: session.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: session.created_at || new Date().toISOString(),
      profile_id: session.profile_id || (currentProfile?.id) || null,
      skill: session.skill,
      score: session.score,
      grade: session.grade,
      result: session.result,
      duration: session.duration,
      frame_count: session.frame_count,
    };
    arr.unshift(withId);
    if (arr.length > 100) arr.length = 100;
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(arr));
    return withId;
  } catch (err) {
    console.error("[local] save failed:", err);
    return null;
  }
}

// ============ DRILL COMPLETIONS ============
const LOCAL_COMPLETIONS_KEY = "rinkai.localCompletions";

export async function listCompletions({ sessionId, profileId } = {}) {
  if (!currentUser) {
    try {
      const raw = localStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return arr.filter(c =>
        (!sessionId || c.session_id === sessionId) &&
        (!profileId || c.profile_id === profileId)
      );
    } catch { return []; }
  }
  const headers = await getAuthHeader();
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  if (profileId) params.set("profileId", profileId);
  const url = `/api/completions${params.toString() ? "?" + params.toString() : ""}`;
  const r = await fetch(url, { headers });
  if (!r.ok) return [];
  const { completions } = await r.json();
  return completions || [];
}

export async function markDrillComplete(sessionId, dayIndex, drillIndex, profileId) {
  if (!currentUser || sessionId?.startsWith?.("local-")) {
    // Local
    try {
      const raw = localStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      // Avoid duplicates
      if (!arr.some(c => c.session_id === sessionId && c.day_index === dayIndex && c.drill_index === drillIndex)) {
        arr.push({
          session_id: sessionId,
          profile_id: profileId || (currentProfile?.id) || null,
          day_index: dayIndex,
          drill_index: drillIndex,
          completed_at: new Date().toISOString(),
        });
        localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(arr));
      }
      return true;
    } catch { return false; }
  }
  const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
  const r = await fetch("/api/completions", {
    method: "POST", headers,
    body: JSON.stringify({ sessionId, profileId: profileId || currentProfile?.id, dayIndex, drillIndex })
  });
  return r.ok;
}

export async function unmarkDrillComplete(sessionId, dayIndex, drillIndex) {
  if (!currentUser || sessionId?.startsWith?.("local-")) {
    try {
      const raw = localStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const filtered = arr.filter(c => !(c.session_id === sessionId && c.day_index === dayIndex && c.drill_index === drillIndex));
      localStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(filtered));
      return true;
    } catch { return false; }
  }
  const headers = await getAuthHeader();
  const params = new URLSearchParams({ sessionId, dayIndex: String(dayIndex), drillIndex: String(drillIndex) });
  const r = await fetch(`/api/completions?${params.toString()}`, { method: "DELETE", headers });
  return r.ok;
}

async function migrateLocalSessions() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return;

    const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
    const r = await fetch("/api/migrate", {
      method: "POST", headers,
      body: JSON.stringify({ sessions: arr, profileId: currentProfile?.id })
    });
    if (r.ok) {
      const { migrated } = await r.json();
      console.log(`[migrate] Imported ${migrated} local sessions to account`);
      localStorage.removeItem(LOCAL_SESSIONS_KEY);
      window.dispatchEvent(new CustomEvent("sessions-migrated", { detail: { count: migrated } }));
    }
  } catch (err) {
    console.error("[migrate] failed:", err);
  }
}

export async function getAuthHeaders() {
  return await getAuthHeader();
}
