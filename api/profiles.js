import { getUserFromRequest, getAdminClient, setCors } from "./_auth.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const admin = getAdminClient();

  try {
    if (req.method === "GET") {
      const { data, error } = await admin.from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ profiles: data || [] });
    }

    if (req.method === "POST") {
      const { name, position, age_group, experience_level, training_access, makeDefault } = req.body || {};
      if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });

      // If makeDefault, unset existing defaults first
      if (makeDefault) {
        await admin.from("profiles").update({ is_default: false }).eq("user_id", user.id);
      }

      const { data, error } = await admin.from("profiles").insert({
        user_id: user.id,
        name: name.trim(),
        position: position || null,
        age_group: age_group || null,
        experience_level: experience_level || null,
        training_access: training_access || null,
        is_default: !!makeDefault,
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ profile: data });
    }

    if (req.method === "PATCH") {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const { name, position, age_group, experience_level, training_access, makeDefault } = req.body || {};

      if (makeDefault) {
        await admin.from("profiles").update({ is_default: false }).eq("user_id", user.id);
      }

      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (position !== undefined) updates.position = position;
      if (age_group !== undefined) updates.age_group = age_group;
      if (experience_level !== undefined) updates.experience_level = experience_level;
      if (training_access !== undefined) updates.training_access = training_access;
      if (makeDefault !== undefined) updates.is_default = !!makeDefault;

      const { data, error } = await admin.from("profiles")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ profile: data });
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const { error } = await admin.from("profiles").delete().eq("id", id).eq("user_id", user.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
