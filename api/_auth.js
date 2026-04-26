// Shared auth helper for backend endpoints
// Verifies the Supabase JWT in the Authorization header and returns the user ID
// Returns null if not authenticated (some endpoints support anonymous use)

import { createClient } from "@supabase/supabase-js";

let _admin = null;
export function getAdminClient() {
  if (_admin) return _admin;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }
  _admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return _admin;
}

export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (err) {
    console.error("[auth] getUser failed:", err.message);
    return null;
  }
}

// Set CORS headers for all API routes
export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
