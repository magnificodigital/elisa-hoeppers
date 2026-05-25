import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  noTopPadding?: boolean;
}

const Layout = ({ children, noTopPadding = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-grow ${noTopPadding ? "" : "pt-16 md:pt-20"}`}>{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
