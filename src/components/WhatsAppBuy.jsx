import React from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, productBuyMessage } from "@/lib/config";

export default function WhatsAppBuy({ product, className = "", label = "Buy on WhatsApp" }) {
  return (
    <a
      href={buildWhatsAppLink(productBuyMessage(product))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm border border-accent/50 bg-accent/10 px-3 py-2 font-mono-tech text-[11px] font-600 uppercase tracking-wider text-accent transition-colors hover:bg-accent/20 ${className}`}
    >
      <MessageCircle className="h-3.5 w-3.5" /> {label}
    </a>
  );
}