import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "@/api/catalog";
import { Image } from "@/components/ui/image";
import { getSettings } from "@/lib/settings";
import { splitStoreTagline } from "@/lib/config";
import { assetUrl } from "@/lib/asset";
import { ArrowRight, Cpu, Truck, MessageCircle, GraduationCap, ChevronRight, Zap } from "lucide-react";
import SearchTerminal from "@/components/SearchTerminal";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "/hero-kit.svg";
const HERO_VIDEOS = ["/videos/hero-promo.mp4", "/videos/hero-alarm.mp4"];

function HeroVideo() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Image src={HERO_IMG} alt="DIYGH build kit components" loading="eager" className="absolute inset-0 h-full w-full bg-black object-cover" />;
  }

  return (
    <video
      key={idx}
      src={assetUrl(HERO_VIDEOS[idx])}
      autoPlay
      muted
      playsInline
      preload="metadata"
      aria-label="DIYGH robotics build demonstration"
      onEnded={() => setIdx((i) => (i + 1) % HERO_VIDEOS.length)}
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full bg-black object-cover"
    />
  );
}

const categories = [
  { label: "Boards", desc: "Arduino & clones", path: "/shop?category=Boards" },
  { label: "Sensors", desc: "See the world", path: "/shop?category=Sensors" },
  { label: "Motors", desc: "Make it move", path: "/shop?category=Motors" },
  { label: "Components", desc: "Wire & build", path: "/shop?category=Components" },
  { label: "Kits", desc: "All-in-one", path: "/shop?category=Kits" },
];

const valueProps = [
  { icon: GraduationCap, title: "Student-run", desc: "Built by makers who actually use this stuff in their own projects." },
  { icon: Zap, title: "Real components", desc: "No fakes, no mystery chips. Every part is tested before it ships." },
  { icon: MessageCircle, title: "WhatsApp support", desc: "Stuck on a build? Message us and a real human helps you wire it." },
  { icon: Truck, title: "Fast delivery", desc: "Tarkwa same-day on weekdays. Nationwide in 1–3 days." },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = getSettings();
  const [tagHead, tagSub] = splitStoreTagline(settings.tagline);

  useEffect(() => {
    listProducts("-created_date", 50)
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = products.filter((p) => p.featured).slice(0, 4);
  const recent = products.slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 pcb-grid opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_26rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_32rem] xl:grid-cols-[minmax(0,1fr)_36rem]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-accent">
                <span className="led-blink h-1.5 w-1.5 rounded-full bg-accent" />
                Student-run STEM · Tarkwa, Ghana
              </div>
              <h1 className="mt-4 font-heading text-4xl font-700 leading-[1.05] tracking-tight md:text-6xl">
                {tagHead}
                {tagSub && (
                  <>
                    <br />
                    <span className="text-primary">{tagSub}</span>
                  </>
                )}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                Arduino boards, sensors, motors, and full robotics kits — the exact
                components students need to go from first blink to a working robot.
                Order on WhatsApp, build this weekend.
              </p>
              <div className="mt-6 max-w-md">
                <SearchTerminal />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/shop" className="flex items-center gap-2 rounded-sm bg-primary px-5 py-3 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse">
                  Browse the catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/shop?category=Kits" className="flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-3 font-mono-tech text-xs font-600 uppercase tracking-wider text-foreground transition-colors hover:border-primary/50">
                  <Cpu className="h-4 w-4 text-primary" /> Starter kits
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[20rem] p-3 md:max-w-none">
              <div className="relative z-10 aspect-[9/16] overflow-hidden rounded-sm border-2 border-primary/70 ring-2 ring-primary/50 ring-offset-4 ring-offset-background md:aspect-[10/9]">
                <HeroVideo />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                <span className="absolute left-3 top-3 font-mono-tech text-[10px] uppercase tracking-wider text-foreground/80">
                  VER. 2.4 / STOCK: ACTIVE
                </span>
                <span className="absolute bottom-3 left-3 font-mono-tech text-[10px] uppercase tracking-wider text-accent">
                  ▸ Real builds, full length
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-heading text-xl font-700">Shop by category</h2>
            <Link to="/shop" className="flex items-center gap-1 font-mono-tech text-[11px] uppercase tracking-wider text-primary">
              All parts <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.label}
                to={c.path}
                className="group flex flex-col gap-1 rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <span className="font-heading text-base font-600 group-hover:text-primary">{c.label}</span>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">{c.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Featured</p>
              <h2 className="mt-1 font-heading text-2xl font-700">This week's build kits</h2>
            </div>
            <Link to="/shop" className="flex items-center gap-1 font-mono-tech text-[11px] uppercase tracking-wider text-primary">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-sm border border-border bg-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(featured.length ? featured : recent.slice(0, 4)).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((v) => (
              <div key={v.title} className="rounded-sm border border-border bg-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-sm border border-primary/30 bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 font-heading text-base font-600">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ How it works</p>
          <h2 className="mt-1 font-heading text-2xl font-700">From link to build in 3 steps</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Browse & add", d: "Find your parts on the catalog. Tap the + to drop them into your build, or hit WhatsApp Buy to ask first." },
              { n: "02", t: "Send your build", d: "Open the cart and tap Complete Build. It opens WhatsApp with your full order pre-filled." },
              { n: "03", t: "Pay & build", d: "We confirm stock and total, you pay via mobile money, and your parts arrive — then you build." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-sm border border-border bg-card p-6">
                <span className="font-mono-tech text-3xl font-700 text-primary/30">{s.n}</span>
                <h3 className="mt-3 font-heading text-lg font-600">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pcb-grid-fine opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center">
          <h2 className="font-heading text-3xl font-700 leading-tight md:text-4xl">
            Got a project idea?<br />
            <span className="text-primary">Let's get it built.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Tell us what you're trying to make and we'll help you pick exactly the parts you need.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="rounded-sm bg-primary px-6 py-3 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse">
              Start browsing
            </Link>
            <Link to="/contact" className="rounded-sm border border-border bg-card px-6 py-3 font-mono-tech text-xs font-600 uppercase tracking-wider">
              Talk to a maker
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}