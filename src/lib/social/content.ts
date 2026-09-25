/** Static Instagram feed data for the homepage (Car Bros pattern). */

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
};

export type SocialFeedPlatform = {
  profile: SocialProfile;
  posts: SocialPost[];
};

export type SocialFeedData = {
  instagram: SocialFeedPlatform;
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

export const SOCIAL_FEED: SocialFeedData = {
  instagram: { profile: INSTAGRAM_PROFILE, posts: INSTAGRAM_POSTS },
};

/** Merge tenant social URLs/handles onto the static feed before homepage inject. */
export function resolveSocialFeed(tenant?: {
  social: {
    instagram: { url?: string; handle?: string };
  };
}): SocialFeedData {
  const ig = { ...SOCIAL_FEED.instagram.profile };
  if (tenant?.social.instagram.url) ig.url = tenant.social.instagram.url;
  if (tenant?.social.instagram.handle) ig.handle = tenant.social.instagram.handle;
  return {
    instagram: { profile: ig, posts: SOCIAL_FEED.instagram.posts },
  };
}
