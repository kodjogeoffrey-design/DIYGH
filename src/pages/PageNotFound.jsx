import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageNotFound() {
  const { pathname } = useLocation();
  const pageName = pathname.replace(/^\//, "") || pathname;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 pcb-grid opacity-50" />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">
          <span className="led-blink mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" /> Signal lost
        </p>
        <h1 className="mt-4 font-heading text-7xl font-700 leading-none text-primary">404</h1>
        <h2 className="mt-5 font-heading text-2xl font-700">Page not found</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing is wired to{" "}
          <span className="font-mono-tech text-foreground">/{pageName}</span>. The part may have been
          discontinued, or the link is wrong.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-sm bg-primary px-5 py-3 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
          >
            <ArrowLeft className="h-4 w-4" /> Back to base
          </Link>
          <Link
            to="/shop"
            className="rounded-sm border border-border bg-card px-5 py-3 font-mono-tech text-xs font-600 uppercase tracking-wider hover:border-primary/50"
          >
            Browse the catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
