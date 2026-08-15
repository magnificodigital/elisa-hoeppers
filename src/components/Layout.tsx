import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";

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
        <main className={`flex-grow ${noTopPadding ? "" : "pt-24"} bg-background`}>
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8">
            {children}
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
