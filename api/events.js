import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { event_type, anon_id, skill, metadata } = req.body || {};
    if (!event_type || typeof event_type !== "string") {
      return res.status(400).json({ error: "Missing event_type" });
    }

    const user = await getUserFromRequest(req); // null if anonymous
    const admin = getAdminClient();

    const userAgent = (req.headers["user-agent"] || "").slice(0, 500);

    const { error } = await admin.from("analytics_events").insert({
      event_type: event_type.slice(0, 100),
      user_id: user?.id || null,
      anon_id: anon_id ? String(anon_id).slice(0, 100) : null,
      skill: skill ? String(skill).slice(0, 50) : null,
      metadata: metadata && typeof metadata === "object" ? metadata : null,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[events] insert failed:", error.message);
      // Don't surface DB errors to frontend - analytics shouldn't break UX
      return res.status(200).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[events] handler error:", err);
    return res.status(200).json({ ok: false });
  }
}
