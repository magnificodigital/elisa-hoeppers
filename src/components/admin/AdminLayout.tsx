import React, { useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const currentTitle = ADMIN_NAV_ITEMS.flatMap(g => g.items)
    .find(item => isActive(item.to, item.exact))?.label || "Admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#3B4F30] text-white overflow-y-auto no-scrollbar">
      <div className="p-6">
        <Link to="/admin" className="block">
          <BodyogaLogo variant="full" tone="cream" size={32} />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-6">
        {ADMIN_NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <h3 className="px-4 text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
              {group.group}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.exact);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group",
                        active 
                          ? "bg-white/10 text-white font-medium" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={18} strokeWidth={2} className={cn("transition-colors", active ? "text-white" : "text-white/60 group-hover:text-white")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all"
        >
          <ArrowUpRight size={18} strokeWidth={2} className="text-white/60" />
          Ver site
        </a>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut size={18} strokeWidth={2} className="text-white/60" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F5F3EE] overflow-hidden bodyoga-scope">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 border-r border-[#3B4F30]/10">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-[#3B4F30]/10 shrink-0">
          <div className="flex items-center gap-4">
            <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-[#3B4F30]">
                  <Menu size={24} />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-0 h-[85vh] bg-[#3B4F30] border-none">
                <div className="h-full overflow-hidden">
                  <SidebarContent />
                </div>
              </DrawerContent>
            </Drawer>
            <h2 className="font-display text-lg text-[#3B4F30] font-medium tracking-tight">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F3EE] border border-[#3B4F30]/5 text-[13px] text-[#3B4F30]/80">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Admin: {profile?.full_name || 'Usuário'}
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className={cn(
            "p-6 md:p-8 lg:p-10 max-w-7xl mx-auto",
            pathname.includes('/site/paginas/') && "p-0 md:p-0 lg:p-0 max-w-none"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
