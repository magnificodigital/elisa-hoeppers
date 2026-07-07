export type BeholdPost = {
  id: string;
  timestamp: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  isReel?: boolean;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  prunedCaption?: string;
  likeCount?: number;
  commentsCount?: number;
  sizes: {
    small: { mediaUrl: string; width: number; height: number };
    medium: { mediaUrl: string; width: number; height: number };
    large: { mediaUrl: string; width: number; height: number };
    full: { mediaUrl: string; width: number; height: number };
  };
  children?: Array<{
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    sizes: BeholdPost["sizes"];
  }>;
};

export type BeholdFeed = {
  biography: string | null;
  profilePictureUrl: string | null;
  website: string | null;
  followersCount: number;
  followsCount: number;
  posts: BeholdPost[];
};

export async function fetchBeholdFeed(url: string): Promise<BeholdFeed> {
  if (!url) throw new Error("Behold URL não configurada");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Behold ${res.status}`);
  return (await res.json()) as BeholdFeed;
}
