import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

const SKILLS = {
  wrist: { name: "Wrist Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "stance, hand separation, puck position on blade, weight transfer, wrist snap, follow-through height, head/eye position. The video may be on-ice or off-ice (shooting pad in a garage, driveway, basement, or backyard) — judge mechanics the same way regardless of surface. The shooter may be in skates, sneakers, or running shoes; this does not change the analysis of upper-body and shooting mechanics." },
  snap: { name: "Snap Shot", metrics: ["Power", "Quickness", "Release", "Balance", "Accuracy"], focusAreas: "compact backswing, quick load on stick blade, snap of wrists at release, weight transfer over front leg, puck position relative to feet, follow-through. Snap differs from wrist shot in shorter backswing — judge on speed of release more than raw power. May be on-ice or off-ice." },
  slap: { name: "Slap Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "backswing height, stick flex, weight transfer, hip rotation, plant foot direction, contact point, follow-through, head position. May be on-ice or off-ice." },
  back: { name: "Backhand", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "puck cup, bottom-hand engagement, puck position in stance, follow-through, weight transfer, head position. May be on-ice or off-ice." },
  stride: { name: "Skating Stride", metrics: ["Power", "Extension", "Recovery", "Balance", "Edge Work"], focusAreas: "knee bend, push-leg extension, recovery foot height, posture, lateral sway, edge engagement, stride frequency. Requires on-ice video. If sneakers off-ice, set score to 0." },
  crossovers: { name: "Crossovers", metrics: ["Depth", "Push Power", "Edge Control", "Posture", "Tempo"], focusAreas: "depth of crossover, inside-edge push from leading skate, outside-edge bite from crossing skate, knee bend, hip mobility, posture, tempo. Requires on-ice video." },
  tightturns: { name: "Tight Turns", metrics: ["Edge Lean", "Knee Bend", "Speed Retention", "Body Position", "Recovery"], focusAreas: "depth of inside-edge lean, knee bend, shoulder/chest position, carve tightness, speed retention, recovery. Requires on-ice video." },
  stops: { name: "Hockey Stops", metrics: ["Edge Engagement", "Balance", "Snow Spray", "Body Control", "Reset Speed"], focusAreas: "both-feet engagement, edge depth, knee bend, upper body stability, snow spray, balance, reset speed. Requires on-ice video." },
  backwards: { name: "Backwards Skating", metrics: ["Push Power", "Posture", "C-Cut Depth", "Balance", "Tempo"], focusAreas: "C-cut depth/width, knee bend, butt-back/chest-up posture, head up, weight transfer, glide and recovery. Requires on-ice video." },
  stick: { name: "Stickhandling", metrics: ["Control", "Hand Speed", "Vision", "Deception", "Range"], focusAreas: "hand position, top-hand rotation, head position, puck contact area, tempo variation, range of motion. On-ice or off-ice." },
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { frames, skill, duration, profileId } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length === 0) return res.status(400).json({ error: "No frames provided" });
    if (!SKILLS[skill]) return res.status(400).json({ error: "Invalid skill" });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

    const user = await getUserFromRequest(req);
    const s = SKILLS[skill];

    const prompt = `You are an elite hockey skills coach analyzing ${frames.length} sequential frames from a ${duration?.toFixed ? duration.toFixed(1) : "short"}-second video of a player performing a ${s.name.toLowerCase()}. Frames captured at: ${frames.map(f => f.time + "s").join(", ")}.

Focus on: ${s.focusAreas}.

Prescribe a 4-week corrective plan with drills that DIRECTLY fix the weaknesses you identified.

Respond with ONLY valid JSON, no markdown fences:
{
  "score": <0-100 integer>,
  "grade": "<A, B+, C-, etc>",
  "summary": "<one sentence takeaway>",
  "metrics": [${s.metrics.map(m => `{"label":"${m}","value":<0-100>}`).join(",")}],
  "strengths": ["<observation>", "<another>"],
  "improvements": [{"title":"<issue>","detail":"<2 sentences: what you saw + why it matters>"}],
  "workout": {
    "focus": "<short phrase>",
    "weeks": 4,
    "days": [
      {"day":"Today","title":"<title>","drills":[{"name":"<drill>","sets":"<sets x reps>","note":"<why>"}]},
      {"day":"Day 2","title":"...","drills":[...]},
      {"day":"Day 3","title":"...","drills":[...]}
    ]
  }
}

Rules: 2-4 strengths, 2-4 improvements, 3 workout days with 3-5 drills each. Off-ice training is valid for shot analysis. Be specific.`;

    const content = [
      ...frames.map(f => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.base64 } })),
      { type: "text", text: prompt }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);
    let r;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2500, messages: [{ role: "user", content }] }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") return res.status(504).json({ error: "Claude took too long to respond. Try a shorter video clip." });
      return res.status(500).json({ error: "Network error reaching Claude", detail: fetchErr.message });
    }
    clearTimeout(timeoutId);

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: `Claude API ${r.status}`, detail: t.slice(0, 500) });
    }

    const data = await r.json();
    const text = data.content.filter(c => c.type === "text").map(c => c.text).join("\n");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Claude", detail: cleaned.slice(0, 500) });
    }

    let savedSessionId = null;
    if (user) {
      try {
        const admin = getAdminClient();
        const { data: saved, error: dbErr } = await admin.from("sessions").insert({
          user_id: user.id,
          profile_id: profileId || null,
          skill,
          score: parsed.score || null,
          grade: parsed.grade || null,
          result: parsed,
          duration: duration || null,
          frame_count: frames.length,
        }).select("id").single();
        if (dbErr) console.error("[analyze] DB save failed:", dbErr.message);
        else savedSessionId = saved?.id;
      } catch (dbErr) {
        console.error("[analyze] DB save threw:", dbErr.message);
      }
    }

    return res.status(200).json({ ...parsed, _sessionId: savedSessionId, _saved: !!savedSessionId });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message || String(err) });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
