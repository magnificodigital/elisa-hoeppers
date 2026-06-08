import Header from "@/components/Header";
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
    <div className="min-h-screen flex flex-col">
      <Header transparentOnTop={transparentHeader} />
      {isAdmin && <AdminNav />}
      <main className={`flex-grow ${noTopPadding ? "" : "pt-16 md:pt-20"}`}>{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
