import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { AdminNav } from "@/components/AdminNav";
import { useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  noTopPadding?: boolean;
  transparentHeader?: boolean;
}

const Layout = ({ children, noTopPadding = false, transparentHeader = false }: LayoutProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div className="bodyoga-scope min-h-screen flex flex-col">
      <BodyogaHeader alwaysGreen />
      {isAdmin ? (
        <main className={`flex-grow ${noTopPadding ? "" : "pt-24"} bg-[#F6E9D6]`}>
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
            <aside className="md:w-72 shrink-0">
              <div className="md:sticky md:top-28">
                <AdminNav />
              </div>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      ) : (
        <main className={`flex-grow ${noTopPadding ? "" : "pt-24"}`}>{children}</main>
      )}
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
