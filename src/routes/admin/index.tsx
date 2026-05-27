import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Elisa Hoeppers" }] }),
  component: () => (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  ),
});

function AdminHome() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Admin</h1>
          <p className="text-primary-dark/70 mb-10">Gerencie cursos, aulas e agendamentos.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link
              to="/admin/cursos"
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center shrink-0">
                <GraduationCap size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-primary-dark mb-1 group-hover:text-primary transition">Cursos</h2>
                <p className="text-sm text-primary-dark/60">Edite cursos, aulas e quizzes da plataforma.</p>
              </div>
            </Link>

            <Link
              to="/admin/agendamentos"
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center shrink-0">
                <Calendar size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-primary-dark mb-1 group-hover:text-primary transition">Agendamentos</h2>
                <p className="text-sm text-primary-dark/60">Confirme reservas de aulas presenciais e online.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
