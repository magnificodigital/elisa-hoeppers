import { Link } from "@tanstack/react-router";
import { courses } from "@/data/courses";
import SectionTitle from "@/components/SectionTitle";

const HomeCourses = () => {
  return (
    <section className="py-20 md:py-28 bg-bodyoga-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <SectionTitle subtitle="Encontre a harmonia e energia que você precisa, em nossas aulas.">
          Explorar Aulas
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12">
          {courses.map((c) => (
            <div key={c.slug} className="flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src={c.image}
                  alt={`Aula de ${c.label}`}
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/10" />
                <span className="absolute top-3 left-3 bg-white/85 text-primary-dark text-[10px] uppercase tracking-wider px-2 py-1 rounded">
                  Todos os níveis
                </span>
              </div>
              <div className="mt-5 flex flex-col items-center text-center gap-4">
                <p className="text-primary-dark font-medium">{c.label}</p>
                <Link
                  to="/cursos"
                  className="border border-primary text-primary px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition"
                >
                  COMECE A ESTUDAR
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCourses;
