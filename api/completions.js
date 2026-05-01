import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const admin = getAdminClient();

  try {
    if (req.method === "GET") {
      // Get all completions for this user, optionally filtered by session_id or profile_id
      const { sessionId, profileId } = req.query || {};
      let q = admin.from("drill_completions")
        .select("id, session_id, profile_id, day_index, drill_index, track, completed_at")
        .eq("user_id", user.id);
      if (sessionId) q = q.eq("session_id", sessionId);
      if (profileId) q = q.eq("profile_id", profileId);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ completions: data || [] });
    }

    if (req.method === "POST") {
      // Mark a drill complete. Track is optional — null = single-track plan, "off_ice"/"on_ice" = dual.
      const { sessionId, profileId, dayIndex, drillIndex, track } = req.body || {};
      if (!sessionId || dayIndex == null || drillIndex == null) {
        return res.status(400).json({ error: "Missing sessionId, dayIndex, or drillIndex" });
      }

      // Manual upsert — first check if it exists, then insert if not. The schema's unique
      // index covers (session, day, drill, user, coalesce(track,'')) so we match the same way.
      const trackVal = track || null;
      let existQ = admin.from("drill_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .eq("day_index", dayIndex)
        .eq("drill_index", drillIndex);
      if (trackVal === null) existQ = existQ.is("track", null);
      else existQ = existQ.eq("track", trackVal);
      const { data: existing } = await existQ.maybeSingle();

      if (existing) {
        return res.status(200).json({ completion: existing, alreadyDone: true });
      }

      const { data, error } = await admin.from("drill_completions")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          profile_id: profileId || null,
          day_index: dayIndex,
          drill_index: drillIndex,
          track: trackVal,
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ completion: data });
    }

    if (req.method === "DELETE") {
      // Mark a drill incomplete (uncheck it). Track is optional — must match the same value used when marking complete.
      const { sessionId, dayIndex, drillIndex, track } = req.query || {};
      if (!sessionId || dayIndex == null || drillIndex == null) {
        return res.status(400).json({ error: "Missing sessionId, dayIndex, or drillIndex" });
      }
      let delQ = admin.from("drill_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .eq("day_index", parseInt(dayIndex))
        .eq("drill_index", parseInt(drillIndex));
      if (track === undefined || track === null || track === "") delQ = delQ.is("track", null);
      else delQ = delQ.eq("track", track);
      const { error } = await delQ;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
