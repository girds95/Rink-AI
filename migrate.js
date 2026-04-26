import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const admin = getAdminClient();

  try {
    if (req.method === "GET") {
      // List sessions, optionally filtered by profile_id
      const profileId = req.query?.profileId;
      let q = admin.from("sessions")
        .select("id, profile_id, skill, score, grade, result, duration, frame_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (profileId) q = q.eq("profile_id", profileId);
      const { data, error } = await q;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ sessions: data || [] });
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const { error } = await admin.from("sessions").delete().eq("id", id).eq("user_id", user.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
