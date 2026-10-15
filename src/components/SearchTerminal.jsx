import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";

const suggestions = ["Arduino", "Sensors", "Motors", "Breadboard", "Kit"];

export default function SearchTerminal() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2.5 backdrop-blur focus-within:border-primary/60">
        <span className="font-mono-tech text-sm font-600 text-accent">›</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search components… e.g. 'arduino' or 'sensor'"
          className="flex-1 bg-transparent font-mono-tech text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          aria-label="Search components"
        />
        <button type="submit" className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Quick:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => navigate(`/shop?q=${encodeURIComponent(s)}`)}
            className="flex items-center gap-0.5 rounded-sm border border-border bg-secondary/60 px-2 py-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {s} <ChevronRight className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}