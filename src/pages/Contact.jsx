import React, { useState } from "react";
import { MessageCircle, Mail, MapPin, Clock, Send } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_NUMBER } from "@/lib/config";

export default function Contact() {
  const [form, setForm] = useState({ name: "", message: "" });

  const send = (e) => {
    e.preventDefault();
    const msg = `Hi DIYGH, my name is ${form.name || "—"}.\n\n${form.message}`;
    window.open(buildWhatsAppLink(msg), "_blank", "noopener,noreferrer");
  };

  const channels = [
    { icon: MessageCircle, t: "WhatsApp", d: `+${WHATSAPP_NUMBER}`, sub: "Fastest — we reply 7am to 9pm", href: buildWhatsAppLink("Hi DIYGH!") },
    { icon: Mail, t: "Email", d: "hello@diygh.store", sub: "For longer questions & invoices", href: "mailto:hello@diygh.store" },
    { icon: MapPin, t: "Location", d: "Tarkwa, Ghana", sub: "Pickup by arrangement", href: null },
    { icon: Clock, t: "Hours", d: "Mon–Sat · 7am–9pm", sub: "Sunday closed", href: null },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Contact</p>
      <h1 className="mt-1 font-heading text-3xl font-700">Talk to a maker</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Questions about a part, a build, or a bulk order for a class? We're real students and we
        actually reply. WhatsApp is the fastest way.
      </p>

      {/* Channels */}
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {channels.map((c) => {
          const Inner = (
            <div className="flex h-full flex-col gap-2 rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/50">
              <span className="grid h-10 w-10 place-items-center rounded-sm border border-primary/30 bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </span>
              <p className="font-heading text-sm font-600">{c.t}</p>
              <p className="font-mono-tech text-xs text-foreground">{c.d}</p>
              <p className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">{c.sub}</p>
            </div>
          );
          return c.href ? (
            <a key={c.t} href={c.href} target="_blank" rel="noopener noreferrer">{Inner}</a>
          ) : (
            <div key={c.t}>{Inner}</div>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={send} className="mt-8 rounded-sm border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-600">Send us a message</h2>
        <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
          Opens WhatsApp with your message ready to send
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Your name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ama Mensah"
              className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="What are you trying to build?"
              className="mt-1.5 w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none"
              required
            />
          </div>
          <button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse">
            <Send className="h-4 w-4" /> Send via WhatsApp
          </button>
        </div>
      </form>
    </div>
  );
}