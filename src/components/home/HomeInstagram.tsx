import { useQuery } from "@tanstack/react-query";
import { Instagram, Play, Layers, Heart, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchBeholdFeed, type BeholdPost } from "@/lib/instagram";
import { getSetting } from "@/lib/settings";

// Fallback estático caso feed falhe (mantém experiência do site)
const fallbackImages = [
  "/images/instagram/ig-01.jpg",
  "/images/instagram/ig-02.jpg",
  "/images/instagram/ig-03.jpg",
  "/images/instagram/ig-04.jpg",
];

const HomeInstagram = () => {
  const [feedUrl, setFeedUrl] = useState<string>("");
  const [handle, setHandle] = useState<string>("bodyoga.ritual");

  useEffect(() => {
    Promise.all([getSetting("behold_feed_url"), getSetting("instagram_handle")])
      .then(([url, ig]) => {
        if (url) setFeedUrl(url);
        if (ig) setHandle(ig);
      })
      .catch(() => {});
  }, []);

  const { data: feed, isLoading, isError } = useQuery({
    queryKey: ["ig-feed", feedUrl],
    queryFn: () => fetchBeholdFeed(feedUrl),
    enabled: !!feedUrl,
    staleTime: 30 * 60 * 1000, // 30 min
    refetchOnWindowFocus: false,
  });

  const posts = feed?.posts?.slice(0, 6) ?? [];
  const instagramUrl = `https://instagram.com/${handle}`;


  return (
    <section className="py-20 md:py-24 bg-bodyoga-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <h3 className="text-center text-bodyoga-green font-medium text-base md:text-lg mb-8 uppercase tracking-[0.2em]">
          Acompanhe{" "}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            @{handle}
          </a>{" "}
          no Instagram
        </h3>



        {/* Grid de posts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-bodyoga-green/5 animate-pulse rounded-md" />
            ))}

          {(isError || (!isLoading && posts.length === 0)) &&
            fallbackImages.map((src, i) => (
              <a
                key={i}
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square overflow-hidden rounded-md group relative"
              >
                <img
                  src={src}
                  alt={`Post do Instagram ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ))}

          {!isLoading &&
            !isError &&
            posts.map((post) => <PostThumbnail key={post.id} post={post} />)}
        </div>

        {/* CTA final */}
        <div className="text-center mt-12">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-bodyoga-green text-bodyoga-cream px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-bodyoga-green/90 transition shadow-sm"
          >
            <Instagram className="w-3.5 h-3.5" />
            Seguir no Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

function PostThumbnail({ post }: { post: BeholdPost }) {
  const thumb =
    post.thumbnailUrl ||
    post.sizes?.medium?.mediaUrl ||
    post.sizes?.small?.mediaUrl ||
    post.mediaUrl;

  const isReel = post.mediaType === "VIDEO" && post.isReel;
  const isCarousel = post.mediaType === "CAROUSEL_ALBUM";
  const isVideo = post.mediaType === "VIDEO";

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noreferrer"
      className="block aspect-square overflow-hidden rounded-xl group relative bg-bodyoga-green/5"
    >
      <img
        src={thumb}
        alt={post.prunedCaption?.slice(0, 80) ?? "Post do Instagram"}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // se der 404 (URLs do IG expiram), tenta o mediaUrl original
          const img = e.currentTarget;
          if (img.src !== post.mediaUrl && post.mediaType === "IMAGE") {
            img.src = post.mediaUrl;
          }
        }}
      />

      {/* Overlay com contadores no hover */}
      <div className="absolute inset-0 bg-bodyoga-green/0 group-hover:bg-bodyoga-green/40 transition-colors flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
        {post.likeCount != null && (
          <span className="inline-flex items-center gap-1 text-cream text-sm font-semibold">
            <Heart className="w-4 h-4 fill-cream" />
            {post.likeCount}
          </span>
        )}
        {post.commentsCount != null && (
          <span className="inline-flex items-center gap-1 text-cream text-sm font-semibold">
            <MessageCircle className="w-4 h-4 fill-cream" />
            {post.commentsCount}
          </span>
        )}
      </div>

      {/* Badge de tipo (canto superior direito) */}
      {(isReel || isVideo || isCarousel) && (
        <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm rounded p-1">
          {isReel || isVideo ? (
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          ) : (
            <Layers className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      )}
    </a>
  );
}

export default HomeInstagram;
