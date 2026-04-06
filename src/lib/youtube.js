const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

/**
 * Fetches current live stream info for a given YouTube channel ID.
 * Returns { title, thumbnailUrl, videoId, watchUrl } or null if offline.
 */
export async function fetchLiveStreamInfo(youtubeChannelId) {
  if (!API_KEY) {
    console.error("Missing VITE_YOUTUBE_API_KEY");
    return null;
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("channelId", youtubeChannelId);
    searchUrl.searchParams.set("eventType", "live");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", API_KEY);

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null; // channel is offline

    const videoId = item.id.videoId;
    const snippet = item.snippet;

    // prefer maxres, fall back down the chain
    const thumbnailUrl =
      snippet.thumbnails.maxres?.url ||
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.medium?.url ||
      snippet.thumbnails.default?.url;

    return {
      title: snippet.title,
      thumbnailUrl,
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err) {
    console.error(`fetchLiveStreamInfo failed for ${youtubeChannelId}:`, err);
    return null;
  }
}
