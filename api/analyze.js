const SKILLS = {
  wrist: { name: "Wrist Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "stance, hand separation, puck position on blade, weight transfer, wrist snap, follow-through height, head/eye position" },
  slap: { name: "Slap Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "backswing height, stick flex, weight transfer, hip rotation, plant foot direction, contact point, follow-through, head position" },
  stride: { name: "Skating Stride", metrics: ["Power", "Extension", "Recovery", "Balance", "Edge Work"], focusAreas: "knee bend, push-leg extension, recovery foot height, posture, lateral sway, edge engagement, stride frequency" },
  stick: { name: "Stickhandling", metrics: ["Control", "Hand Speed", "Vision", "Deception", "Range"], focusAreas: "hand position, top-hand rotation, head position, puck contact area, tempo variation, range of motion" },
  back: { name: "Backhand", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "puck cup, bottom-hand engagement, puck position in stance, follow-through, weight transfer, head position" },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { frames, skill, duration } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length === 0) return res.status(400).json({ error: "No frames provided" });
    if (!SKILLS[skill]) return res.status(400).json({ error: "Invalid skill" });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });

    const s = SKILLS[skill];
    const prompt = `You are an elite hockey skills coach analyzing ${frames.length} sequential frames from a ${duration?.toFixed ? duration.toFixed(1) : "short"}-second video of a player performing a ${s.name.toLowerCase()}. Frames captured at: ${frames.map(f => f.time + "s").join(", ")}.

Focus on: ${s.focusAreas}.

Prescribe a 4-week corrective plan with drills that DIRECTLY fix the weaknesses you identified. Each drill must connect back to what you saw.

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

Rules: 2-4 strengths, 2-4 improvements, 3 workout days with 3-5 drills each. Poor video quality: lower scores, say so in summary. Wrong skill: score 0, explain. Be specific about what you actually saw.`;

    const content = [
      ...frames.map(f => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.base64 } })),
      { type: "text", text: prompt }
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2500, messages: [{ role: "user", content }] })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: `Claude API ${r.status}`, detail: t.slice(0, 500) });
    }

    const data = await r.json();
    const text = data.content.filter(c => c.type === "text").map(c => c.text).join("\n");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      return res.status(200).json(JSON.parse(cleaned));
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Claude", detail: cleaned.slice(0, 500) });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message || String(err) });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
