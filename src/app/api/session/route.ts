import { z } from "zod";
import { fetchOnlinePassage } from "@/lib/content-service";
import { buildCategorySession, buildOnlineSession } from "@/lib/session";
import type { GuidedSession } from "@/lib/session";
import type { Language } from "@/lib/types";
import { getServerSupabase } from "@/lib/supabase-server";

const requestSchema = z.object({
  language: z.enum(["english", "hindi", "hinglish", "mixed"]),
  difficulty: z.enum(["easy", "medium", "advanced"]),
  minutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]).default(10),
  recentIds: z.array(z.string().max(200)).max(120).default([]),
  completedIds: z.array(z.string().max(200)).max(500).default([]),
  category: z.enum(["pace", "breathing", "articulation", "reading", "prompts"]).optional(),
  refresh: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid session preferences." }, { status: 400 });

  const { language, difficulty, minutes, recentIds, completedIds, category, refresh } = parsed.data;
  const supabase = await getServerSupabase();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = auth.user;
  let allRecentIds = recentIds;

  if (supabase && user) {
    const { data: remoteRecent } = await supabase.from("user_recent_content").select("content_id").eq("user_id", user.id).order("used_at", { ascending: false }).limit(120);
    allRecentIds = [...new Set([...recentIds, ...(remoteRecent || []).map((item) => item.content_id)])];
    if (!refresh) {
      let query = supabase.from("practice_content_cache").select("session_data,content_ids").eq("user_id", user.id).eq("language", language).eq("difficulty", difficulty).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1);
      query = category ? query.eq("category", category) : query.is("category", null);
      const { data: cached } = await query.maybeSingle();
      if (cached?.session_data && !cached.content_ids.some((id: string) => completedIds.includes(id))) return Response.json({ session: cached.session_data as GuidedSession, online: true, cached: true });
    }
  }

  const languages: Language[] = language === "mixed" ? ["english", "hindi", "hinglish"] : [language];
  const passages = (await Promise.all(languages.map((item) => fetchOnlinePassage(item, difficulty, allRecentIds)))).filter((passage) => passage !== null);
  if (!passages.length) return Response.json({ error: "Online book sources are temporarily unavailable. Please try again." }, { status: 503 });

  const session = category ? buildCategorySession(category, passages[0]) : buildOnlineSession(passages, minutes);
  if (supabase && user) {
    await supabase.from("practice_content_cache").insert({ user_id: user.id, language, difficulty, category: category || null, session_data: session, content_ids: session.usedIds });
  }
  return Response.json({ session, online: true, cached: false });
}
