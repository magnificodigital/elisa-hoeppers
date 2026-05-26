import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { getCourseBySlug, listLessonsByCourse } from "@/lib/courses";
import { useAuth } from "@/hooks/useAuth";
import { enrollInCourse, isEnrolledInCourse } from "@/lib/enrollments";

export const Route = createFileRoute("/cursos/$slug")({
  loader: async ({ params }) => {
    const course = await getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.course.title} — Elisa Hoeppers` },
      { name: "description", content: loaderData?.course.subtitle ?? loaderData?.course.description?.slice(0, 160) ?? "" },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const { data: lessons } = useQuery({
    queryKey: ["lessons", course.id],
    queryFn: () => listLessonsByCourse(course.id),
  });

  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden bg-primary-dark">
        {course.cover_image && (
          <img src={course.cover_image} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div>
            <span className="font-display text-white/90 text-4xl md:text-6xl block mb-3 tracking-wide">
              {course.overlay_label ?? course.title}
            </span>
            <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto">
              {course.subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-[900px] mx-auto px-4 md:px-6">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-6">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-primary-dark text-base md:text-lg leading-relaxed mb-10">
              {course.description}
            </p>
          )}

          <h2 className="font-display text-2xl text-primary-dark mb-4">Aulas</h2>
          {(!lessons || lessons.length === 0) && (
            <p className="text-[var(--text-muted)] italic">Em breve: as aulas serão publicadas em breve.</p>
          )}
          <ol className="space-y-2">
            {(lessons ?? []).map((l, i) => (
              <li key={l.id} className="flex items-start gap-4 py-3 border-b border-border">
                <span className="text-primary-dark font-medium w-8">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <p className="text-primary-dark">{l.title}</p>
                  {l.duration_min && (
                    <p className="text-xs text-[var(--text-muted)]">{l.duration_min} min</p>
                  )}
                </div>
                {l.is_free_preview && (
                  <span className="text-[10px] uppercase bg-peach text-primary-dark px-2 py-1 rounded">
                    Prévia
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <EnrollButton courseId={course.id} courseSlug={course.slug} />
          </div>
        </div>
      </section>
    </Layout>
  );
}

function EnrollButton({ courseId, courseSlug }: { courseId: string; courseSlug: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: enrolled } = useQuery({
    queryKey: ["is-enrolled", user?.id, courseId],
    queryFn: () => isEnrolledInCourse(courseId),
    enabled: !!user,
  });
  const mutation = useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      qc.invalidateQueries({ queryKey: ["is-enrolled", user?.id, courseId] });
      navigate({ to: "/painel" });
    },
  });

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={() => navigate({ to: "/login", search: { next: `/cursos/${courseSlug}` } })}
        className="inline-block bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
      >
        MATRICULAR-SE
      </button>
    );
  }

  if (enrolled) {
    return (
      <button
        onClick={() => navigate({ to: "/painel" })}
        className="inline-block bg-primary-dark text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:opacity-90 transition"
      >
        VOCÊ ESTÁ MATRICULADA — IR PARA O PAINEL
      </button>
    );
  }

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="inline-block bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition disabled:opacity-60"
    >
      {mutation.isPending ? "MATRICULANDO…" : "MATRICULAR-SE"}
    </button>
  );
}
