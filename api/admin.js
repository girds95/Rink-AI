import { getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Password check
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "Server missing ADMIN_PASSWORD" });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }

  try {
    const admin = getAdminClient();

    // Time windows
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const last24h = new Date(now - day).toISOString();
    const last7d = new Date(now - 7 * day).toISOString();
    const last30d = new Date(now - 30 * day).toISOString();

    // ====== EVENTS COUNTS ======
    const [
      events24,
      events7d,
      events30d,
      eventsAll,
    ] = await Promise.all([
      admin.from("analytics_events").select("event_type, skill, anon_id, user_id, created_at").gte("created_at", last24h).order("created_at", { ascending: false }),
      admin.from("analytics_events").select("event_type, skill, anon_id, user_id, created_at").gte("created_at", last7d),
      admin.from("analytics_events").select("event_type, skill, anon_id, user_id, created_at").gte("created_at", last30d),
      admin.from("analytics_events").select("id", { count: "exact", head: true }),
    ]);

    // ====== USERS / SESSIONS / PROFILES ======
    const [usersResult, sessionsResult, profilesResult, recentSessionsResult] = await Promise.all([
      // List users (auth.users) — needs admin call
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("sessions").select("id, user_id, skill, score, grade, created_at").order("created_at", { ascending: false }),
      admin.from("profiles").select("id, user_id, name, position, age_group, created_at"),
      admin.from("sessions").select("id, user_id, skill, score, grade, created_at, profile_id").order("created_at", { ascending: false }).limit(20),
    ]);

    const users = usersResult?.data?.users || [];
    const sessions = sessionsResult?.data || [];
    const profiles = profilesResult?.data || [];
    const recentSessions = recentSessionsResult?.data || [];

    // ====== AGGREGATIONS ======
    const ev = (rows) => rows?.data || [];
    const e24 = ev(events24), e7 = ev(events7d), e30 = ev(events30d);

    const countBy = (arr, type) => arr.filter(x => x.event_type === type).length;
    const uniqueBy = (arr, key) => new Set(arr.map(x => x[key]).filter(Boolean)).size;

    // Build a daily activity series for the last 14 days (for chart)
    const series = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date(now - i * day); start.setHours(0,0,0,0);
      const end = new Date(start.getTime() + day);
      const dayEvents = e30.filter(x => {
        const d = new Date(x.created_at);
        return d >= start && d < end;
      });
      series.push({
        date: start.toISOString().slice(0, 10),
        analyses: dayEvents.filter(x => x.event_type === "analyze_success").length,
        starts: dayEvents.filter(x => x.event_type === "analyze_start").length,
        fails: dayEvents.filter(x => x.event_type === "analyze_fail").length,
      });
    }

    // Skill breakdown (last 30 days)
    const skillCounts = {};
    e30.filter(x => x.event_type === "analyze_success").forEach(x => {
      if (x.skill) skillCounts[x.skill] = (skillCounts[x.skill] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);

    // Recent failures (with reasons)
    const failuresWithReasonsResult = await admin.from("analytics_events")
      .select("created_at, skill, metadata")
      .eq("event_type", "analyze_fail")
      .gte("created_at", last7d)
      .order("created_at", { ascending: false })
      .limit(20);
    const recentFailEvents = failuresWithReasonsResult?.data || [];

    // Funnel for last 7 days
    const funnel = {
      starts7: countBy(e7, "analyze_start"),
      successes7: countBy(e7, "analyze_success"),
      fails7: countBy(e7, "analyze_fail"),
    };

    // Active users today (signed in OR anonymous with anon_id)
    const activeToday = uniqueBy(e24, "user_id") + uniqueBy(e24.filter(x => !x.user_id), "anon_id");

    // ====== RESPONSE ======
    return res.status(200).json({
      summary: {
        total_users: users.length,
        total_profiles: profiles.length,
        total_sessions_saved: sessions.length,
        total_events_alltime: eventsAll?.count || 0,
        active_users_today: activeToday,
        analyses_today: countBy(e24, "analyze_success"),
        analyses_7d: countBy(e7, "analyze_success"),
        analyses_30d: countBy(e30, "analyze_success"),
        starts_today: countBy(e24, "analyze_start"),
        fails_today: countBy(e24, "analyze_fail"),
      },
      funnel,
      series,
      top_skills: topSkills,
      recent_users: users.slice(0, 20).map(u => ({
        id: u.id,
        email: u.email,
        last_sign_in: u.last_sign_in_at,
        created_at: u.created_at,
        provider: u.app_metadata?.provider || "email",
      })),
      recent_sessions: recentSessions.map(s => {
        const user = users.find(u => u.id === s.user_id);
        const profile = profiles.find(p => p.id === s.profile_id);
        return {
          ...s,
          user_email: user?.email || null,
          profile_name: profile?.name || null,
        };
      }),
      recent_failures: recentFailEvents.slice(0, 20).map(e => ({
        when: e.created_at,
        skill: e.skill,
        reason: e.metadata?.error || "(no detail)",
      })),
    });
  } catch (err) {
    console.error("[admin] error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
