import { Phone } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/5511994061178?text=Olá+Elisa%2C+tudo+bem%3F"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group"
      aria-label="Falar no WhatsApp"
    >
      <Phone size={28} fill="currentColor" />
      <span className="absolute right-full mr-3 bg-white text-primary-dark px-3 py-1 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Fale comigo!
      </span>
    </a>
  );
};

export default WhatsAppButton;
