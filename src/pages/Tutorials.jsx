import React from "react";
import { Image } from "@/components/ui/image";
import { Clock, PlayCircle, Youtube } from "lucide-react";

const GUIDES = [
  {
    src: "/images/guides/arduino-nano-pinout.jpg",
    title: "Arduino Nano pinout",
    desc: "Every pin labelled — power, GPIO, analog, and UART.",
  },
  {
    src: "/images/guides/dc-motor-encoder-tutorial.jpg",
    title: "DC motor with encoder",
    desc: "Reading shaft position from a geared DC motor's encoder output.",
  },
  {
    src: "/images/guides/electrical-symbols-chart.jpg",
    title: "Electrical symbols chart",
    desc: "The schematic language every maker should read.",
  },
  {
    src: "/images/guides/active-vs-passive-components.jpg",
    title: "Active vs passive parts",
    desc: "Know which side of the bench your component lives on.",
  },
  {
    src: "/images/guides/glowing-led-butterfly.jpg",
    title: "Glowing LED butterfly",
    desc: "A first wearable build: charred-paper circuits and pulsing LEDs.",
  },
  {
    src: "/images/guides/diy-wireless-charger.jpg",
    title: "DIY wireless charger",
    desc: "Coil pairing and Qi basics for a contactless power pad.",
  },
  {
    src: "/images/guides/digital-multimeter-functions.jpg",
    title: "Multimeter functions",
    desc: "Voltage, current, continuity, and diode test — when to use each.",
  },
];

export default function Tutorials() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="border-b border-border pb-6">
        <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Learn</p>
        <h1 className="mt-1 font-heading text-3xl font-700">Tutorials & guides</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Workshop material from the DIYGH bench. Full video tutorials are coming soon —
          we&apos;ll publish them on YouTube first and link them here as they land.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-accent">
            <Clock className="h-3.5 w-3.5" /> Videos coming soon
          </span>
          <span className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
            <Youtube className="h-3.5 w-3.5 text-primary" /> First on YouTube, linked later
          </span>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-xl font-700">Reference gallery</h2>
            <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Quick charts from past workshops
            </p>
          </div>
          <PlayCircle className="h-5 w-5 text-primary/50" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <figure
              key={g.src}
              className="group overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-primary/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-secondary">
                <Image
                  src={g.src}
                  alt={g.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="p-4">
                <h3 className="font-heading text-sm font-600 group-hover:text-primary">{g.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-sm border border-dashed border-border bg-secondary/30 p-6 text-center">
        <p className="font-mono-tech text-sm uppercase tracking-wider text-muted-foreground">
          Want a specific tutorial?
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Message us on WhatsApp with the project you&apos;re stuck on — if enough people ask,
          it goes to the top of the video queue.
        </p>
      </div>
    </div>
  );
}
