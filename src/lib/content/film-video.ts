/**
 * The homepage film video (tenant `media.filmVideo`). The approved design embeds YouTube or Vimeo
 * from one URL and tells them apart with loose patterns (any `v=` reads as YouTube, bare digits as a
 * YouTube id), so links are checked here and stored in one canonical form per provider that the
 * design reads unambiguously.
 */

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;

type Parsed = { url: string } | { error: string };

const NOT_SUPPORTED = "Video URL must be a YouTube or Vimeo video link, e.g. https://vimeo.com/123456789";
/** The design's Vimeo embed carries only the video id, so unlisted (hash) links cannot play. */
const PRIVATE_VIMEO = "That is a private Vimeo link. Set the video to Public (or allow embedding on this site in Vimeo) and paste its plain link.";

function parse(input: string): Parsed {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { error: NOT_SUPPORTED };
  }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    const id = host === "youtu.be" ? parts[0]
      : parts[0] === "watch" ? url.searchParams.get("v")
      : ["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1]
      : null;
    return id && YOUTUBE_ID.test(id) ? { url: `https://www.youtube.com/watch?v=${id}` } : { error: NOT_SUPPORTED };
  }

  if (VIMEO_HOSTS.has(host)) {
    // player.vimeo.com/video/ID, vimeo.com/ID, vimeo.com/channels/NAME/ID,
    // vimeo.com/groups/NAME/videos/ID and the owner's vimeo.com/manage/videos/ID.
    const at = host === "player.vimeo.com" ? (parts[0] === "video" ? 1 : -1)
      : parts[0] === "channels" ? 2
      : parts[0] === "groups" ? (parts[2] === "videos" ? 3 : -1)
      : parts[0] === "manage" ? (parts[1] === "videos" ? 2 : -1)
      : 0;
    const id = at < 0 ? undefined : parts[at];
    if (!id || !VIMEO_ID.test(id)) return { error: NOT_SUPPORTED };
    if (url.searchParams.get("h") || /^[0-9a-f]{6,}$/i.test(parts[at + 1] ?? "")) return { error: PRIVATE_VIMEO };
    return { url: `https://vimeo.com/${id}` };
  }

  return { error: NOT_SUPPORTED };
}

/**
 * For the admin form: `""` for an empty field (the section shows its placeholder), otherwise the
 * canonical link. Throws, with a message for the person editing, when the link cannot be embedded.
 */
export function canonicalFilmVideoUrl(input: string): string {
  const value = input.trim();
  if (!value) return "";
  const parsed = parse(value);
  if ("error" in parsed) throw new Error(parsed.error);
  return parsed.url;
}

/** For rendering: the canonical link, or null when there is none or it cannot be embedded. */
export function filmVideoUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = parse(trimmed);
  return "error" in parsed ? null : parsed.url;
}
