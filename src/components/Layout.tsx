import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";

import { AdminNav } from "@/components/AdminNav";
import { useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  noTopPadding?: boolean;
  transparentHeader?: boolean;
}

const Layout = ({ children, noTopPadding = false, transparentHeader = false }: LayoutProps) => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem("admin_nav_collapsed") === "1");
  }, []);

  const toggleNav = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("admin_nav_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className="bodyoga-scope min-h-screen flex flex-col">
      <BodyogaHeader alwaysGreen />
      {isAdmin ? (
        <main className={`flex-grow ${noTopPadding ? "" : "pt-24"} bg-background`}>
          <div
            className={`${collapsed ? "max-w-none" : "max-w-[1280px]"} mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8`}
          >
            {!collapsed && (
              <aside className="md:w-72 shrink-0">
                <div className="md:sticky md:top-28">
                  <AdminNav />
                </div>
              </aside>
            )}
            <div className="min-w-0 flex-1">
              <button
                onClick={toggleNav}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-bodyoga-cream px-4 py-2 text-xs uppercase tracking-widest text-primary-dark border border-border/20 shadow-none hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
              >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                {collapsed ? "Mostrar menu" : "Recolher menu"}
              </button>
              {children}
            </div>
          </div>
        </main>
      ) : (
        <main className={`flex-grow ${noTopPadding ? "" : "pt-24"}`}>{children}</main>
      )}
      <Footer />
    </div>
  );
};

export default Layout;
