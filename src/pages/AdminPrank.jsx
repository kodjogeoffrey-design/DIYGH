import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";

// FAKE terminal script — pure text on screen. Nothing here touches cookies,
// storage, the camera, the network, or anything else. It is a joke.
const SCRIPT = [
  { d: 450, tone: "ok", t: "credentials accepted — welcome, operator" },
  { d: 380, tone: "bad", t: "escalating privileges ............ ROOT SHELL OPEN" },
  { d: 420, tone: "info", t: "device fingerprint .............. MATCH (this phone)" },
  { d: 480, tone: "bad", t: "scanning phone .................. /data/data/*" },
  { d: 520, tone: "bad", t: "extracting cookies .............. 43 COOKIES IN 2 BROWSERS" },
  { d: 460, tone: "bad", t: "grabbing sessions ............... 5 SESSIONS CAPTURED" },
  { d: 460, tone: "bad", t: "open tabs ...................... 13 PAGES STILL LOGGED IN" },
  { d: 420, tone: "bad", t: "bypassing 2FA ................... BYPASSED IN 0.4 S" },
  { d: 420, tone: "info", t: "geolocation .................... TARKWA, GH ±3 M" },
  { d: 420, tone: "bad", t: "camera / microphone ............. ARMED" },
  { d: 460, tone: "bad", t: "uploading archive .............. 97% → 100% COMPLETE" },
  { d: 600, tone: "bad", t: "ROUTE COMPLETE — YOUR PHONE IS MINE" },
];

const REVEAL = [
  { d: 700, tone: "ok", t: "…just kidding." },
  { d: 500, tone: "ok", t: "NOTHING WAS SCANNED. NO COOKIES. NO SESSIONS. NO PHONE." },
  { d: 500, tone: "info", t: "this is a demo terminal with scripted text and zero access." },
  { d: 600, tone: "info", t: "sending you home, operator →" },
];

const LINES = [...SCRIPT, ...REVEAL];

const TONE = {
  ok: "text-accent",
  bad: "text-destructive",
  info: "text-muted-foreground",
};

export default function AdminPrank() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("login");
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "run") return undefined;
    if (step >= LINES.length) {
      const done = setTimeout(() => navigate("/"), 2600);
      return () => clearTimeout(done);
    }
    const tick = setTimeout(() => setStep((s) => s + 1), LINES[step].d);
    return () => clearTimeout(tick);
  }, [phase, step, navigate]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Both fields required — this console does not do half-access.");
      return;
    }
    setError("");
    setPhase("run");
  }

  const joke = step >= SCRIPT.length;
  const pct = Math.min(100, Math.round((step / LINES.length) * 100));

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 pcb-grid opacity-50" />
      <div className="relative mx-auto max-w-2xl px-4 py-16">
        {phase === "login" ? (
          <>
            <p className="font-mono-tech text-[11px] uppercase tracking-widest text-destructive">
              <span className="led-blink mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-destructive align-middle" /> Restricted area
            </p>
            <h1 className="mt-4 font-heading text-4xl font-700 leading-none text-primary">
              Secure console
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              DIYGH admin access. Authorized personnel only — all attempts are logged.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-sm border border-border bg-card p-6"
            >
              <label className="block font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="prank-email">
                Operator email
              </label>
              <input
                id="prank-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-11 w-full rounded-sm border border-border bg-background px-3 font-mono-tech text-sm text-foreground outline-none focus:border-primary/60"
              />

              <label className="mt-5 block font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground" htmlFor="prank-pass">
                Passphrase
              </label>
              <input
                id="prank-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="mt-2 h-11 w-full rounded-sm border border-border bg-background px-3 font-mono-tech text-sm text-foreground outline-none focus:border-primary/60"
              />

              {error && (
                <p className="mt-4 font-mono-tech text-[11px] uppercase tracking-wider text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
              >
                <Lock className="h-4 w-4" /> Sign in
              </button>
            </form>
          </>
        ) : (
          <div className="rounded-sm border border-destructive/50 bg-card/95">
            <div className="flex items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3">
              <p className="flex items-center gap-2 font-mono-tech text-[11px] font-700 uppercase tracking-widest text-destructive">
                <ShieldAlert className="h-4 w-4" />
                {joke ? "Prank terminal — stand down" : "Security breach in progress"}
              </p>
              <span className="font-mono-tech text-[11px] text-muted-foreground">{pct}%</span>
            </div>

            <div className="h-1 w-full bg-secondary">
              <div
                className="h-full transition-all duration-300 bg-destructive"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="px-4 py-5 font-mono-tech text-[11px] leading-6 sm:text-xs">
              {LINES.slice(0, step).map((line, i) => (
                <p key={i} className={`whitespace-pre-wrap break-words ${TONE[line.tone]}`}>
                  <span className="mr-2 text-muted-foreground">root@diygh:~$</span>
                  {line.t}
                </p>
              ))}
              {step < LINES.length && (
                <p className="text-muted-foreground">
                  <span className="mr-2">root@diygh:~$</span>
                  <span className="led-blink inline-block h-3 w-2 bg-foreground align-middle" />
                </p>
              )}
            </div>

            {joke && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">
                  Gotcha — you typed a password into a joke
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
