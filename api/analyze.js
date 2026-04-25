const SKILLS = {
  wrist: { name: "Wrist Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "stance, hand separation, puck position on blade, weight transfer, wrist snap, follow-through height, head/eye position. The video may be on-ice or off-ice (shooting pad in a garage, driveway, basement, or backyard) — judge mechanics the same way regardless of surface. The shooter may be in skates, sneakers, or running shoes; this does not change the analysis of upper-body and shooting mechanics." },
  snap: { name: "Snap Shot", metrics: ["Power", "Quickness", "Release", "Balance", "Accuracy"], focusAreas: "compact backswing (short, no full windup), quick load on the stick blade, snap of the wrists at release, weight transfer over the front leg, puck position relative to feet, follow-through. Snap shot differs from wrist shot in that it has a small backswing and is meant to be quick and deceptive — judge it on speed of release more than raw power. The video may be on-ice or off-ice (shooting pad in a garage, driveway, basement, or backyard) — judge the mechanics the same regardless of surface or footwear." },
  slap: { name: "Slap Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "backswing height, stick flex, weight transfer, hip rotation, plant foot direction, contact point, follow-through, head position. The video may be on-ice or off-ice (shooting pad) — judge mechanics the same way regardless of surface or footwear." },
  back: { name: "Backhand", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "puck cup, bottom-hand engagement, puck position in stance, follow-through, weight transfer, head position. The video may be on-ice or off-ice (shooting pad) — judge mechanics the same way regardless of surface or footwear." },
  stride: { name: "Skating Stride", metrics: ["Power", "Extension", "Recovery", "Balance", "Edge Work"], focusAreas: "knee bend, push-leg extension, recovery foot height, posture, lateral sway, edge engagement, stride frequency. This skill requires on-ice video or skates on a synthetic ice / slideboard surface. If the video shows the player off-ice in sneakers, set score to 0 and explain in summary that skating analysis requires ice or a synthetic skating surface." },
  crossovers: { name: "Crossovers", metrics: ["Depth", "Push Power", "Edge Control", "Posture", "Tempo"], focusAreas: "depth of the crossover (how far the outside leg crosses over the inside leg), inside-edge push from the leading skate, outside-edge bite from the crossing skate, knee bend (deeper = more power), hip mobility, posture (chest up, eyes forward), tempo and rhythm of repeated crosses, head and shoulders staying square to direction of travel rather than turning. Look for full leg extensions on each push, smooth weight transfer, and avoidance of hopping or popping up. This skill requires on-ice video or a synthetic skating surface — if the player is in sneakers, set score to 0 and explain." },
  tightturns: { name: "Tight Turns", metrics: ["Edge Lean", "Knee Bend", "Speed Retention", "Body Position", "Recovery"], focusAreas: "depth of the inside-edge lean, knee bend through the turn (the deeper the better), shoulder and chest position relative to the turn direction (should lean into the turn, not away), how tightly the player carves vs. how wide they swing out, retention of speed through the turn (do they coast or accelerate out?), recovery and ability to immediately accelerate or change direction after exiting. Look for outside foot pressure, inside leg drive on exit, and head up to maintain spatial awareness. Requires on-ice video or synthetic surface." },
  stops: { name: "Hockey Stops", metrics: ["Edge Engagement", "Balance", "Snow Spray", "Body Control", "Reset Speed"], focusAreas: "both-feet engagement (a true hockey stop uses both skates, not just one), depth of the edges biting into the ice, knee bend at moment of stop (should be deep, athletic stance), upper body remaining stable and quiet rather than jerking forward, snow spray indicating proper edge bite, balance through the stop (not falling backward or pitching forward), and how quickly they can reset and accelerate in the opposite direction. Judge both inside-edge and outside-edge stops if visible. Requires on-ice video — set score 0 if off-ice in sneakers." },
  backwards: { name: "Backwards Skating", metrics: ["Push Power", "Posture", "C-Cut Depth", "Balance", "Tempo"], focusAreas: "depth and width of the C-cut push (each push should carve a wide C-shape on the ice), knee bend (deeper bend = more power transfer, common weakness is being too upright), butt and chest position (butt back, chest up — most players make the mistake of leaning forward like they're falling), posture stays athletic, head up looking forward (not down at feet), smooth weight transfer between feet, glide and recovery between pushes, and rhythm/tempo of repeated cuts. Watch for skates being too narrow or too wide, and for hips that don't swivel through each push. Requires on-ice video." },
  stick: { name: "Stickhandling", metrics: ["Control", "Hand Speed", "Vision", "Deception", "Range"], focusAreas: "hand position, top-hand rotation, head position, puck contact area, tempo variation, range of motion. Stickhandling can be analyzed on or off ice (with a ball, puck, or stickhandling ball on a smooth surface)." },
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

Rules: 2-4 strengths, 2-4 improvements, 3 workout days with 3-5 drills each. Poor video quality: lower scores, say so in summary. If the video clearly shows a different skill than ${s.name.toLowerCase()} (e.g. uploaded a stickhandling video for wrist shot analysis), set score to 0 and explain. Off-ice training (garage, driveway, shooting pad) is fully valid for shot analysis — do not penalize for it. Be specific about what you actually saw in the frames.`;

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
      if (fetchErr.name === "AbortError") {
        return res.status(504).json({ error: "Claude took too long to respond (50s timeout). Try a shorter video clip.", detail: "" });
      }
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
