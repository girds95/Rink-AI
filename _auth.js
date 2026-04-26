import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { sessions, profileId } = req.body || {};
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(200).json({ migrated: 0 });
    }

    const admin = getAdminClient();
    const rows = sessions.map(s => ({
      user_id: user.id,
      profile_id: profileId || null,
      skill: s.skill,
      score: s.score || null,
      grade: s.grade || null,
      result: s.result || s,
      duration: s.duration || null,
      frame_count: s.frame_count || (s.frames?.length) || null,
      created_at: s.created_at || s.timestamp || new Date().toISOString(),
    }));

    const { error } = await admin.from("sessions").insert(rows);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ migrated: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
