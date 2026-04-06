// supabase/functions/run-watchdog/index.ts
// Deploy with: npx supabase functions deploy run-watchdog
//
// This watchdog:
// 1. Fetches active channels with YouTube IDs from Supabase
// 2. Calls YouTube Data API to get the current live stream title
// 3. Parses show name from the title (strips date/branding noise)
// 4. Upserts a "today" EPG entry into epg_entries with source = 'watchdog'

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/** Strip common livestream title noise to get a clean show name */
function parseShowName(rawTitle: string): string {
  return rawTitle
    .replace(/\|.*$/g, "")           // remove everything after |
    .replace(/:\s*(April|March|February|January|May|June|July|August|September|October|November|December)\s+\d+,?\s*\d{4}/gi, "")
    .replace(/\bLIVESTREAM\b/gi, "")
    .replace(/\bLIVE\b/gi, "")
    .replace(/\bStream\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchCurrentLiveTitle(channelId: string): Promise<{ title: string; videoId: string } | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return { title: item.snippet.title, videoId: item.id.videoId };
}

Deno.serve(async (req) => {
  // Allow manual POST trigger (with optional auth header check)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Fetch active channels with YouTube IDs
    const { data: channels, error: chErr } = await supabase
      .from("channels")
      .select("id, name, youtube_channel_id")
      .eq("is_active", true)
      .not("youtube_channel_id", "is", null);

    if (chErr) throw chErr;

    const results: Record<string, string> = {};
    const today = new Date().toISOString().split("T")[0];
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

    for (const ch of channels ?? []) {
      const live = await fetchCurrentLiveTitle(ch.youtube_channel_id);
      if (!live) {
        results[ch.name] = "offline";
        continue;
      }

      const showName = parseShowName(live.title);
      if (!showName) {
        results[ch.name] = "no show name parsed";
        continue;
      }

      // Get current time rounded to nearest 30 min
      const now = new Date();
      const mins = now.getMinutes() >= 30 ? 30 : 0;
      const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

      // Upsert: if a watchdog entry already exists for this channel + day + time, update it
      const { error: upsertErr } = await supabase
        .from("epg_entries")
        .upsert(
          {
            channel_id: ch.id,
            show_name: showName,
            days_of_week: dayName,
            start_time: startTime,
            duration_minutes: 60,
            notes: `Auto-detected from YouTube. Raw: "${live.title}"`,
            source: "watchdog",
            end_date: today,
          },
          {
            onConflict: "channel_id,start_time,days_of_week",
            ignoreDuplicates: false,
          }
        );

      results[ch.name] = upsertErr ? `error: ${upsertErr.message}` : `inserted: ${showName}`;
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
