import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { STORE_NAME, WHATSAPP_NUMBER, buildWhatsAppLink, formatWhatsApp } from "@/lib/config";
import { assetUrl } from "@/lib/asset";

const categories = [
  { label: "Boards", path: "/shop?category=Boards" },
  { label: "Sensors", path: "/shop?category=Sensors" },
  { label: "Motors", path: "/shop?category=Motors" },
  { label: "Components", path: "/shop?category=Components" },
  { label: "Kits", path: "/shop?category=Kits" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      {/* Trace line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm border border-primary/40">
                <img src={assetUrl("/images/robohub-logo.jpg")} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="font-heading text-lg font-700">
                DIY<span className="text-primary">GH</span>
                <span className="ml-1 align-top font-mono-tech text-[9px] font-500 text-muted-foreground">STORE</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A student-run STEM store powering the next generation of makers in Ghana.
              Real components, fair prices, and support that actually answers on WhatsApp.
            </p>
            <a
              href={buildWhatsAppLink("Hi DIYGH, I have a question about a component.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-sm border border-accent/50 bg-accent/10 px-3.5 py-2 font-mono-tech text-xs font-600 uppercase tracking-wider text-accent transition-colors hover:bg-accent/20"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>

          <div>
            <h4 className="font-mono-tech text-[11px] font-600 uppercase tracking-widest text-primary">Catalog</h4>
            <ul className="mt-4 space-y-2.5">
              {categories.map((c) => (
                <li key={c.label}>
                  <Link to={c.path} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono-tech text-[11px] font-600 uppercase tracking-widest text-primary">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" /> {formatWhatsApp(WHATSAPP_NUMBER)}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" /> hello@diygh.store
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Tarkwa, Ghana
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()} {STORE_NAME} · A branch of the DIYGH collective
          </p>
          <div className="flex gap-5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
            <Link to="/tutorials" className="hover:text-foreground">Tutorials</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
            <span className="text-accent">VER 2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
}