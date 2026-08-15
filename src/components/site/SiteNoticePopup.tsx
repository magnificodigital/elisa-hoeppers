import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { submitLead, type SiteNotice } from "@/lib/notices";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

export function SiteNoticePopup() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<SiteNotice | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const { data: notices } = useQuery({
    queryKey: ["active_site_notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_notices")
        .select("*")
        .eq("active", true);
      
      if (error) throw error;
      
      // Filter by schedule on client side to be safe, though RLS should handle it
      const now = new Date();
      return (data as SiteNotice[]).filter(n => {
        const start = n.start_at ? new Date(n.start_at) : null;
        const end = n.end_at ? new Date(n.end_at) : null;
        if (start && start > now) return false;
        if (end && end < now) return false;
        return true;
      });
    },
    // Don't refetch too often
    staleTime: 1000 * 60 * 5
  });

  useEffect(() => {
    // Skip on admin routes
    if (location.pathname.startsWith("/admin")) return;
    // Skip on checkout
    if (location.pathname.startsWith("/checkout")) return;
    if (!notices || notices.length === 0) return;

    // Filter by page
    const matchingNotices = notices.filter(n => 
      n.pages.includes("all") || n.pages.includes(location.pathname)
    );

    if (matchingNotices.length === 0) return;

    // Pick the most recent one
    const notice = matchingNotices[0];

    // Check frequency
    const sessionKey = `notice_seen_${notice.id}`;
    const dayKey = `notice_last_seen_${notice.id}`;

    if (notice.frequency === 'once_session' && sessionStorage.getItem(sessionKey)) return;
    
    if (notice.frequency === 'once_day') {
      const lastSeen = localStorage.getItem(dayKey);
      if (lastSeen) {
        const diff = Date.now() - parseInt(lastSeen);
        if (diff < 1000 * 60 * 60 * 24) return;
      }
    }

    // Delay showing
    const timer = setTimeout(() => {
      setCurrentNotice(notice);
      setOpen(true);
      
      // Mark as seen immediately when opening
      if (notice.frequency === 'once_session') {
        sessionStorage.setItem(sessionKey, 'true');
      } else if (notice.frequency === 'once_day') {
        localStorage.setItem(dayKey, Date.now().toString());
      }
    }, notice.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [location.pathname, notices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNotice) return;

    setLoading(true);
    try {
      await submitLead({
        notice_id: currentNotice.id,
        notice_title: currentNotice.title,
        name,
        email,
        phone,
        page: location.pathname
      });

      // Notify Elisa (optional integration with existing notification function)
      try {
        await supabase.functions.invoke('send-notification', {
          body: { 
            type: 'notice_lead', 
            payload: { 
              notice_title: currentNotice.title, 
              name, 
              email, 
              phone 
            } 
          },
        });
      } catch (err) {
        console.warn("Failed to send notification:", err);
      }

      setSubmitted(true);
      toast.success(currentNotice.success_message || "Dados enviados com sucesso!");
      
      // Auto-close after success
      setTimeout(() => setOpen(false), 3000);
    } catch (err: any) {
      toast.error("Erro ao enviar seus dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentNotice) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-cream rounded-2xl shadow-2xl">
        <DialogClose className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition text-primary-dark">
          <X className="w-4 h-4" />
        </DialogClose>

        <div className="flex flex-col">
          {currentNotice.image_url && (
            <div className="w-full aspect-video overflow-hidden">
              <img 
                src={currentNotice.image_url} 
                alt={currentNotice.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 text-center space-y-4">
            <DialogHeader className="space-y-2">
              <DialogTitle className="font-display text-2xl md:text-3xl text-primary-dark leading-tight">
                {currentNotice.title}
              </DialogTitle>
              {currentNotice.content && (
                <div className="text-sm md:text-base text-primary-dark/70 leading-relaxed">
                  {currentNotice.content}
                </div>
              )}
            </DialogHeader>

            {currentNotice.capture_lead && !submitted && (
              <form onSubmit={handleSubmit} className="space-y-3 pt-4">
                {currentNotice.form_title && (
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary-dark/60 mb-2">
                    {currentNotice.form_title}
                  </h3>
                )}
                
                {currentNotice.fields_name && (
                  <Input 
                    placeholder="Seu nome" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required 
                    className="bg-white border-border rounded-lg text-sm"
                  />
                )}
                
                {currentNotice.fields_email && (
                  <Input 
                    type="email" 
                    placeholder="Seu melhor e-mail" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    required 
                    className="bg-white border-border rounded-lg text-sm"
                  />
                )}
                
                {currentNotice.fields_phone && (
                  <Input 
                    type="tel" 
                    placeholder="Seu telefone" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    required 
                    className="bg-white border-border rounded-lg text-sm"
                  />
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-full py-6 font-medium transition"
                >
                  {loading ? "Enviando..." : currentNotice.cta_label || "Enviar Agora"}
                </Button>
              </form>
            )}

            {submitted && (
              <div className="py-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-primary-dark">
                  {currentNotice.success_message}
                </p>
              </div>
            )}

            {!currentNotice.capture_lead && currentNotice.cta_label && (
              <div className="pt-4">
                <Button 
                  asChild
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-full py-6 font-medium transition"
                >
                  <a href={currentNotice.cta_href || "#"}>
                    {currentNotice.cta_label}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
