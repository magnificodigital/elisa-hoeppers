import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInstagramPosts, type InstagramPost } from "@/lib/instagram.functions";

const fallbackImages = [
  "/images/instagram/ig-01.jpg",
  "/images/instagram/ig-02.jpg",
  "/images/instagram/ig-03.jpg",
  "/images/instagram/ig-04.jpg",
];

const PROFILE_URL = "https://www.instagram.com/bodyoga.oficial/";

const HomeInstagram = () => {
  const fetchPosts = useServerFn(getInstagramPosts);
  const { data } = useQuery({
    queryKey: ["instagram-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 1000 * 60 * 30,
  });

  const posts: InstagramPost[] = data?.posts ?? [];
  const hasLive = posts.length > 0;

  return (
    <section className="py-14 md:py-24 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <h3 className="text-center text-primary-dark font-medium text-base md:text-lg mb-6 md:mb-8">
          Acompanhe{" "}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-primary"
          >
            @bodyoga.oficial
          </a>{" "}
          no Instagram
        </h3>
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-8 md:mb-10">
          <img
            src="/images/home/instagram/round-2.png"
            alt="Foto de perfil de Bodyoga"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0"
           loading="lazy" decoding="async" />
          <div className="min-w-0 max-w-md">
            <p className="text-primary-dark font-semibold text-sm">bodyoga.oficial</p>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Fundadora do @bodyoga__ ® · Professora de YOGA · Alquimia Olfativa ·
              Aromaterapia com Óleos Essenciais: Elisa Hoeppers Casas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {hasLive
            ? posts.map((post, i) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square overflow-hidden rounded-md"
                >
                  <img
                    src={post.imageUrl}
                    alt={post.caption ? post.caption.slice(0, 120) : `Publicação ${i + 1} do Instagram @bodyoga.oficial`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ))
            : fallbackImages.map((src, i) => (
                <a
                  key={i}
                  href={PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square overflow-hidden rounded-md"
                >
                  <img
                    src={src}
                    alt={`Publicação ${i + 1} do Instagram @bodyoga.oficial`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ))}
        </div>
      </div>
    </section>
  );
};

export default HomeInstagram;
