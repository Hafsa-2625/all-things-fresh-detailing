/** Static Instagram and TikTok feed data for the homepage (Car Bros pattern). */

export type SocialPostType = "reel" | "post";

export type SocialPost = {
  id: string;
  src: string;
  alt: string;
  url: string;
  caption: string;
  likes: string;
  comments: string;
  date: string;
  type: SocialPostType;
};

export type SocialProfile = {
  name: string;
  handle: string;
  url: string;
  avatar: string;
  posts: string;
  followers: string;
  /** Total likes; TikTok shows these in place of a post count. */
  likes?: string;
};

export type SocialFeedPlatform = {
  profile: SocialProfile;
  posts: SocialPost[];
};

export type SocialFeedData = {
  instagram: SocialFeedPlatform;
  tiktok: SocialFeedPlatform;
};

export const INSTAGRAM_PROFILE: SocialProfile = {
  name: "All Things Fresh Mobile Detailing",
  handle: "@atfcardetailing",
  url: "https://www.instagram.com/atfcardetailing",
  avatar: "/assets/instagram/avatar.jpg",
  posts: "971",
  followers: "27.2K",
};

export const INSTAGRAM_POSTS: SocialPost[] = [
  {
    id: "DYQRL0npyP7",
    src: "/assets/instagram/post-01.jpg",
    alt: "Mobile car detailer POV cleaning an Amazon fleet vehicle",
    url: "https://www.instagram.com/atfcardetailing/reel/DYQRL0npyP7/",
    caption:
      "My POV as a mobile car detailer! 🚗well back at it again with the monthly Amazon fleet clean up BUT this time… had to fix the mistakes of another detailer 😭is what it isssss #cardetailing #detailing #pov",
    likes: "5,811",
    comments: "100",
    date: "13 May 2026",
    type: "reel",
  },
  {
    id: "DJz36GzO2ip",
    src: "/assets/instagram/post-02.jpg",
    alt: "Photo dump of recently detailed cars",
    url: "https://www.instagram.com/atfcardetailing/p/DJz36GzO2ip/",
    caption:
      "Little photo dump of recent cars 🚀 Working hard behind the scenes, servicing over 100 cars a month and continuing to grow! Excited to announce our newest expansion in Tampa, officially making it our third location alongside Cleveland and Columbus!✈️",
    likes: "416",
    comments: "16",
    date: "19 May 2025",
    type: "post",
  },
  {
    id: "CjY9GGUJhYb",
    src: "/assets/instagram/post-03.jpg",
    alt: "Exterior and interior car detail",
    url: "https://www.instagram.com/atfcardetailing/reel/CjY9GGUJhYb/",
    caption: "Exterior / Interior Detail 🔥#clevelanddetailer #cardetailing",
    likes: "177",
    comments: "10",
    date: "7 Oct 2022",
    type: "reel",
  },
  {
    id: "DdKYr-pp3k3",
    src: "/assets/instagram/post-04.jpg",
    alt: "Pressure washing dirty cupholders during a detail",
    url: "https://www.instagram.com/atfcardetailing/reel/DdKYr-pp3k3/",
    caption:
      "Sometimes I gotta do what I gotta do, once the cupholders hit a certain point I just get to the pressure washer ngl 😂#cardetailing #detailing",
    likes: "309",
    comments: "59",
    date: "13 Sep 2026",
    type: "reel",
  },
  {
    id: "DcZCo-2JtfF",
    src: "/assets/instagram/post-05.jpg",
    alt: "Mobile detailer POV restoring a client's car",
    url: "https://www.instagram.com/atfcardetailing/reel/DcZCo-2JtfF/",
    caption:
      "My POV as a mobile detailer!🚘 getting my clients car back to brand new!!👀#cardetailing #detailing #pov #asmr",
    likes: "353",
    comments: "8",
    date: "23 Aug 2026",
    type: "reel",
  },
  {
    id: "DchUgu9J5-D",
    src: "/assets/instagram/post-06.jpg",
    alt: "Removing stains from a car seat during detailing",
    url: "https://www.instagram.com/atfcardetailing/reel/DchUgu9J5-D/",
    caption:
      "My secret sauce for the save again! Literally took me 15 min to get all these nasty stains out the seat lol #detailing #cardetailing #pov",
    likes: "513",
    comments: "33",
    date: "27 Aug 2026",
    type: "reel",
  },
];

// From candidate-assets/tiktok/tiktok-feed.json; images built by scripts/optimize-tiktok-assets.mjs.
export const TIKTOK_PROFILE: SocialProfile = {
  name: "ATFCARDETAILING",
  handle: "@atfcardetailing1",
  url: "https://www.tiktok.com/@atfcardetailing1",
  avatar: "/assets/tiktok/avatar.webp",
  posts: "",
  followers: "323.9K",
  likes: "10.4M",
};

export const TIKTOK_POSTS: SocialPost[] = [
  {
    id: "7345157164337777966",
    src: "/assets/tiktok/post-01.webp",
    alt: "Mobile detailer POV refreshing a car for a road trip",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7345157164337777966",
    caption:
      "My POV as a mobile detailer!🚗✨ they needed there car refreshed for a long road trip! #CarDetailing #AutoDetailing #CarCare #DetailingLife #CarWash #detailersoftiktok #CleanCar #CarDetailingProducts #DetailingWorld #CarLovers #ExteriorDetailing #InteriorDetailing #CarDetailingServices #MobileDetailing #AutoDetailer",
    likes: "731.2K",
    comments: "1,658",
    date: "11 Mar 2024",
    type: "reel",
  },
  {
    id: "7346370827161472302",
    src: "/assets/tiktok/post-02.webp",
    alt: "Complete interior transformation by a mobile detailer",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7346370827161472302",
    caption:
      "My POV as a mobile detailer! 🚗🧼Complete interior transformation with beautiful results ✨ #CarDetailing #AutoDetailing #CarCare #DetailingLife #CarWash #detailersoftiktok #CleanCar #CarDetailingProducts #DetailingWorld #CarLovers #ExteriorDetailing #InteriorDetailing #CarDetailingServices #MobileDetailing #AutoDetailer",
    likes: "876.8K",
    comments: "2,350",
    date: "15 Mar 2024",
    type: "reel",
  },
  {
    id: "7434345257241726250",
    src: "/assets/tiktok/post-03.webp",
    alt: "Restoring a Jaguar interior during a mobile detail",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7434345257241726250",
    caption:
      "My POV as a mobile car detailer! 🚗restoring the interior of my clients jaguar back to new! ✨ #CarDetailing #AutoDetailing #CarCare #DetailingLife #CarWash #detailersoftiktok #CleanCar #CarDetailingProducts #DetailingWorld #CarLovers #ExteriorDetailing #InteriorDetailing #CarDetailingServices #MobileDetailing #AutoDetailer",
    likes: "177",
    comments: "10",
    date: "7 Nov 2024",
    type: "reel",
  },
  {
    id: "7654722417843096845",
    src: "/assets/tiktok/post-04.webp",
    alt: "Disastrous interior restored to brand new",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7654722417843096845",
    caption:
      "My pov as a mobile car detailer🚗👀 getting this disastrous interior back to brand new after it had never been detailed before! 👀✨#detailing #cardetailing #pov #asmr",
    likes: "2,532",
    comments: "27",
    date: "24 Jun 2026",
    type: "reel",
  },
  {
    id: "7636512440745774366",
    src: "/assets/tiktok/post-05.webp",
    alt: "Day in the life of a mobile car detailer during busy season",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7636512440745774366",
    caption:
      "My POV as a mobile car detailer 🚗 come spend an average day in the life with me during busy season! This year has been my best year so far to date! But it def cost to be the boss… a lot…trust me😂#detailing #cardetailing #pov",
    likes: "2,446",
    comments: "30",
    date: "6 May 2026",
    type: "reel",
  },
  {
    id: "7569736905714109726",
    src: "/assets/tiktok/post-06.webp",
    alt: "Client's first car detail and reaction",
    url: "https://www.tiktok.com/@atfcardetailing1/video/7569736905714109726",
    caption:
      "My POV as a mobile car detailer! 🚗 this is my clients first time ever getting her car detailed! Watch for her reaction👀more at the end 👀#cardetailing #detailing #satisfying #cleaning #asmr",
    likes: "60.4K",
    comments: "171",
    date: "7 Nov 2025",
    type: "reel",
  },
];

export const SOCIAL_FEED: SocialFeedData = {
  instagram: { profile: INSTAGRAM_PROFILE, posts: INSTAGRAM_POSTS },
  tiktok: { profile: TIKTOK_PROFILE, posts: TIKTOK_POSTS },
};

type TenantSocialSource = { enabled: boolean; url?: string; handle?: string };

/**
 * The account a TikTok profile URL points at, as "@name". The admin edits only the profile URL, so
 * the handle follows it; otherwise a changed URL would still show the old handle.
 */
function tiktokHandle(url: string): string | undefined {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)tiktok\.com$/.test(hostname)) return undefined;
    return pathname.match(/^\/(@[A-Za-z0-9_.]+)/)?.[1];
  } catch {
    return undefined;
  }
}

/** Merge tenant social URLs/handles onto the static feed before homepage inject. */
export function resolveSocialFeed(tenant?: {
  social: {
    instagram: TenantSocialSource;
    tiktok: TenantSocialSource;
  };
}): SocialFeedData {
  const ig = { ...SOCIAL_FEED.instagram.profile };
  if (tenant?.social.instagram.url) ig.url = tenant.social.instagram.url;
  if (tenant?.social.instagram.handle) ig.handle = tenant.social.instagram.handle;
  const tt = { ...SOCIAL_FEED.tiktok.profile };
  const tiktok = tenant?.social.tiktok;
  if (tiktok?.url) tt.url = tiktok.url;
  const handle = (tiktok?.url && tiktokHandle(tiktok.url)) || tiktok?.handle;
  if (handle) tt.handle = handle;
  return {
    instagram: { profile: ig, posts: SOCIAL_FEED.instagram.posts },
    // A disabled TikTok account has no feed; the homepage then leaves the section out.
    tiktok: { profile: tt, posts: tiktok?.enabled === false ? [] : SOCIAL_FEED.tiktok.posts },
  };
}
