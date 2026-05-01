import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

const SKILLS = {
  wrist: { name: "Wrist Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "stance, hand separation, puck position on blade, weight transfer, wrist snap, follow-through height, head/eye position. The video may be on-ice or off-ice (shooting pad in a garage, driveway, basement, or backyard) — judge mechanics the same way regardless of surface. The shooter may be in skates, sneakers, or running shoes; this does not change the analysis of upper-body and shooting mechanics." },
  snap: { name: "Snap Shot", metrics: ["Power", "Quickness", "Release", "Balance", "Accuracy"], focusAreas: "compact backswing, quick load on stick blade, snap of wrists at release, weight transfer over front leg, puck position relative to feet, follow-through. Snap differs from wrist shot in shorter backswing — judge on speed of release more than raw power. May be on-ice or off-ice." },
  slap: { name: "Slap Shot", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "backswing height, stick flex, weight transfer, hip rotation, plant foot direction, contact point, follow-through, head position. May be on-ice or off-ice." },
  back: { name: "Backhand", metrics: ["Power", "Form", "Release", "Balance", "Accuracy"], focusAreas: "puck cup, bottom-hand engagement, puck position in stance, follow-through, weight transfer, head position. May be on-ice or off-ice." },
  stride: { name: "Skating Stride", metrics: ["Power", "Extension", "Recovery", "Balance", "Edge Work"], focusAreas: "knee bend, push-leg extension, recovery foot height, posture, lateral sway, edge engagement, stride frequency. Accepts on-ice video, inline skates / rollerblades on any hard surface, or synthetic ice. ONLY reject (set score to 0) if the player is in sneakers/running shoes/barefoot." },
  crossovers: { name: "Crossovers", metrics: ["Depth", "Push Power", "Edge Control", "Posture", "Tempo"], focusAreas: "depth of crossover, inside-edge push from leading skate, outside-edge bite from crossing skate, knee bend, hip mobility, posture, tempo. Accepts ice skates or rollerblades. ONLY reject if in sneakers." },
  tightturns: { name: "Tight Turns", metrics: ["Edge Lean", "Knee Bend", "Speed Retention", "Body Position", "Recovery"], focusAreas: "depth of inside-edge lean, knee bend, shoulder/chest position, carve tightness, speed retention, recovery. Accepts ice skates or rollerblades. ONLY reject if in sneakers." },
  stops: { name: "Hockey Stops", metrics: ["Edge Engagement", "Balance", "Snow Spray", "Body Control", "Reset Speed"], focusAreas: "both-feet engagement, edge depth, knee bend, upper body stability, balance, reset speed. Accepts ice skates or rollerblades (rollerblade stops won't have snow but should still show two-foot engagement). ONLY reject if in sneakers." },
  backwards: { name: "Backwards Skating", metrics: ["Push Power", "Posture", "C-Cut Depth", "Balance", "Tempo"], focusAreas: "C-cut depth/width, knee bend, butt-back/chest-up posture, head up, weight transfer, glide and recovery. Accepts ice skates or rollerblades. ONLY reject if in sneakers." },
  stick: { name: "Stickhandling", metrics: ["Control", "Hand Speed", "Vision", "Deception", "Range"], focusAreas: "hand position, top-hand rotation, head position, puck contact area, tempo variation, range of motion. On-ice or off-ice." },
};

// Reference YouTube tutorials per skill. These are search results pages on YouTube,
// so they always return current popular videos rather than relying on a single video URL
// that could be deleted. The format is: short description shown to user + URL.
// Returned in the API response so the frontend can show "Watch the right way" links.
const REFERENCES = {
  wrist:      { title: "How to shoot a wrist shot",     url: "https://www.youtube.com/results?search_query=how+to+shoot+a+wrist+shot+hockey+technique" },
  snap:       { title: "Snap shot mechanics",           url: "https://www.youtube.com/results?search_query=snap+shot+hockey+technique+tutorial" },
  slap:       { title: "Slap shot fundamentals",        url: "https://www.youtube.com/results?search_query=how+to+slap+shot+hockey+technique" },
  back:       { title: "Backhand shot technique",       url: "https://www.youtube.com/results?search_query=hockey+backhand+shot+how+to" },
  stride:     { title: "Powerful skating stride",       url: "https://www.youtube.com/results?search_query=hockey+skating+stride+technique+tutorial" },
  crossovers: { title: "Forward crossovers",            url: "https://www.youtube.com/results?search_query=hockey+forward+crossovers+technique" },
  tightturns: { title: "Tight turns",                   url: "https://www.youtube.com/results?search_query=hockey+tight+turns+technique" },
  stops:      { title: "Hockey stop fundamentals",      url: "https://www.youtube.com/results?search_query=how+to+hockey+stop+technique" },
  backwards:  { title: "Backwards skating",             url: "https://www.youtube.com/results?search_query=hockey+backwards+skating+technique" },
  stick:      { title: "Stickhandling drills",          url: "https://www.youtube.com/results?search_query=hockey+stickhandling+drills+technique" },
};

// Build the language-style instructions based on experience level.
// Beginner = plain English, no jargon. Advanced/coach = technical biomechanics OK.
function languageGuide(experienceLevel, ageGroup) {
  const isYoung = ageGroup && ["u8", "u10", "u12"].includes(ageGroup);
  switch (experienceLevel) {
    case "beginner":
      return `LANGUAGE LEVEL: BEGINNER. The player or parent reading this has limited hockey background. Write in plain everyday English. Avoid technical jargon entirely. Instead of "plant foot opens too early reducing power vector" say "your front foot is turning toward the side instead of pointing where you want the puck to go — this leaks power." Use comparisons to everyday actions when helpful (e.g. "like throwing a punch", "like a golf swing"). Drill instructions must be simple step-by-step, no assumed knowledge.`;
    case "intermediate":
      return `LANGUAGE LEVEL: INTERMEDIATE. The player has a few seasons of experience. Use common hockey vocabulary (stride, edge, blade angle, follow-through, weight transfer) but explain the WHY behind feedback in clear terms. Avoid heavy biomechanics jargon. Example: "your knee bend is shallow — deeper bend stores more energy for the push" rather than "insufficient sagittal-plane flexion limits eccentric loading."`;
    case "advanced":
      return `LANGUAGE LEVEL: ADVANCED. The player is a competitive athlete. Technical hockey vocabulary is fine. You can reference biomechanics concepts (kinetic chain, force vectors, hip-shoulder separation, COM transfer, edge engagement angles) when relevant.`;
    case "coach":
      return `LANGUAGE LEVEL: COACH. The reader is a hockey coach. Use full technical and biomechanical vocabulary. Provide depth on coaching cues, common faults, and progression logic. Reference accepted coaching frameworks where appropriate (USA Hockey ADM, common skills curricula).`;
    default:
      // No experience level set — default to intermediate but keep it accessible
      return `LANGUAGE LEVEL: GENERAL. ${isYoung ? "The player is young (under 12), so" : ""} Use clear hockey vocabulary that a typical hockey parent or player would understand. Explain technical points in plain terms. Avoid heavy biomechanics jargon.`;
  }
}

// Build the workout structure instructions based on training access.
// Returns an object: { instructions: string for prompt, jsonShape: string for prompt JSON spec, mode: 'off_ice'|'on_ice'|'both'|'mixed' }
function workoutAccessGuide(trainingAccess) {
  const SHAPE_SINGLE = `"workout": {
    "focus": "<short phrase>",
    "weeks": 4,
    "days": [
      {"day":"Day 1","title":"<title>","drills":[{"name":"<drill>","sets":"<sets x reps>","note":"<why this drill addresses what you saw>"}]},
      {"day":"Day 2","title":"...","drills":[...]},
      {"day":"Day 3","title":"...","drills":[...]}
    ]
  }`;
  const SHAPE_DUAL = `"workout": {
    "focus": "<short phrase>",
    "weeks": 4,
    "tracks": {
      "off_ice": {
        "label": "Off-Ice Track",
        "days": [
          {"day":"Day 1","title":"<title>","drills":[{"name":"<drill>","sets":"<sets x reps>","note":"<why this drill addresses what you saw>"}]},
          {"day":"Day 2","title":"...","drills":[...]},
          {"day":"Day 3","title":"...","drills":[...]}
        ]
      },
      "on_ice": {
        "label": "On-Ice Track",
        "days": [
          {"day":"Day 1","title":"<title>","drills":[...]},
          {"day":"Day 2","title":"...","drills":[...]},
          {"day":"Day 3","title":"...","drills":[...]}
        ]
      }
    }
  }`;

  switch (trainingAccess) {
    case "off_ice":
      return {
        mode: "off_ice",
        instructions: `WORKOUT ACCESS: OFF-ICE ONLY. The player can only train off the ice (basement, garage, driveway, gym, backyard). Every drill must be doable without ice or skates. Focus on: shooting pads, stickhandling balls, weighted pucks, dryland skating drills (slideboards, balance boards, lateral lunges), strength and mobility work, video review homework. DO NOT prescribe any drill that requires being on ice or wearing skates.`,
        jsonShape: SHAPE_SINGLE,
      };
    case "on_ice":
      return {
        mode: "on_ice",
        instructions: `WORKOUT ACCESS: ON-ICE ONLY. The player has regular ice access. Every drill should happen on the ice (or at minimum, in skates on a synthetic surface). Focus on: skating progressions, edge work drills, puck work in stride, shooting from movement, small-area games. DO NOT prescribe pure off-ice work like dryland or gym strength training.`,
        jsonShape: SHAPE_SINGLE,
      };
    case "both":
      return {
        mode: "both",
        instructions: `WORKOUT ACCESS: BOTH OFF-ICE AND ON-ICE. The player has access to both training environments. Build TWO PARALLEL TRACKS, each with their own 3 days of drills:

OFF-ICE TRACK: Drills doable at home/garage/gym — shooting pads, stickhandling balls, weighted pucks, dryland skating (slideboards, balance work, lateral movement), strength/mobility, video review.

ON-ICE TRACK: Drills that require ice (or skates on synthetic) — skating progressions, edge work, in-stride puck/shooting work, small-area games.

Both tracks should target the SAME weaknesses you identified. The off-ice track is the "between practices" reinforcement. The on-ice track is what they do when they get ice time. Each track must have 3 days of 3-5 drills.`,
        jsonShape: SHAPE_DUAL,
      };
    default:
      // Not set — give a balanced/mixed plan as before
      return {
        mode: "mixed",
        instructions: `WORKOUT ACCESS: NOT SPECIFIED. Mix off-ice and on-ice drills as appropriate for the skill being analyzed.`,
        jsonShape: SHAPE_SINGLE,
      };
  }
}

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

    // Look up profile for experience/age context (only if logged in + profileId provided)
    let profile = null;
    if (user && profileId) {
      try {
        const admin = getAdminClient();
        const { data } = await admin.from("profiles")
          .select("name, position, age_group, experience_level, training_access")
          .eq("id", profileId)
          .eq("user_id", user.id)
          .single();
        if (data) profile = data;
      } catch (e) { /* non-fatal */ }
    }

    // Anonymous users can pass experience/age/training_access inline
    const experienceLevel = profile?.experience_level || req.body?.experienceLevel || null;
    const ageGroup = profile?.age_group || req.body?.ageGroup || null;
    const trainingAccess = profile?.training_access || req.body?.trainingAccess || null;
    const languageInstr = languageGuide(experienceLevel, ageGroup);
    const workoutInstr = workoutAccessGuide(trainingAccess);

    // Log analyze_start
    const adminForLogging = (() => { try { return getAdminClient(); } catch { return null; } })();
    const logEvent = async (event_type, metadata = {}) => {
      if (!adminForLogging) return;
      try {
        await adminForLogging.from("analytics_events").insert({
          event_type,
          user_id: user?.id || null,
          anon_id: req.body?.anonId || null,
          skill,
          metadata,
          user_agent: (req.headers["user-agent"] || "").slice(0, 500),
        });
      } catch (e) { console.error("[analyze] event log failed:", e.message); }
    };
    await logEvent("analyze_start", { duration: duration || null, frame_count: frames.length, experience: experienceLevel });

    const prompt = `You are an elite hockey skills coach analyzing ${frames.length} sequential frames from a ${duration?.toFixed ? duration.toFixed(1) : "short"}-second video of a player performing a ${s.name.toLowerCase()}. Frames captured at: ${frames.map(f => f.time + "s").join(", ")}.

${languageInstr}

${workoutInstr.instructions}

Focus areas to assess: ${s.focusAreas}.

CRITICAL HONESTY RULE: Only comment on aspects of the technique you can actually see in the provided frames. If the clip doesn't capture a particular phase (e.g. you can't see the backswing because the clip starts mid-shot, or you can't see the follow-through because it ends too early), DO NOT invent feedback about that phase. Instead: skip it entirely from your improvements list, and add a note in the summary like "(Note: this clip didn't capture the [backswing/release/follow-through], so feedback focuses on what was visible.)"

Also: if the clip is so short or unclear that you can't reliably assess the skill at all, set score to 0 and explain that a longer or clearer clip is needed.

Prescribe a 4-week corrective plan with drills that DIRECTLY fix the weaknesses you identified. Drill complexity should match the language level above (simpler drills for beginners, technical progressions for advanced/coach). Drill environment must respect the WORKOUT ACCESS rules above.

Respond with ONLY valid JSON, no markdown fences:
{
  "score": <0-100 integer>,
  "grade": "<A, B+, C-, etc>",
  "summary": "<one sentence takeaway>",
  "metrics": [${s.metrics.map(m => `{"label":"${m}","value":<0-100>}`).join(",")}],
  "strengths": ["<observation>", "<another>"],
  "improvements": [{"title":"<issue>","detail":"<2 sentences: what you saw + why it matters>"}],
  ${workoutInstr.jsonShape}
}

Rules: 2-4 strengths, 2-4 improvements. Each workout track must have 3 days with 3-5 drills each. Be specific about what you actually saw.`;

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

    // Attach reference link for "what good looks like"
    parsed._reference = REFERENCES[skill] || null;
    // Stamp the workout mode so the frontend knows whether to render single or dual track
    if (parsed.workout) {
      parsed.workout.mode = workoutInstr.mode;
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

    await logEvent("analyze_success", { score: parsed.score, grade: parsed.grade, saved: !!savedSessionId, experience: experienceLevel });
    return res.status(200).json({ ...parsed, _sessionId: savedSessionId, _saved: !!savedSessionId });
  } catch (err) {
    try {
      const adminForLogging = getAdminClient();
      await adminForLogging.from("analytics_events").insert({
        event_type: "analyze_fail",
        user_id: null,
        anon_id: req.body?.anonId || null,
        skill: req.body?.skill || null,
        metadata: { error: (err.message || String(err)).slice(0, 500) },
        user_agent: (req.headers["user-agent"] || "").slice(0, 500),
      });
    } catch {}
    return res.status(500).json({ error: "Server error", detail: err.message || String(err) });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };
