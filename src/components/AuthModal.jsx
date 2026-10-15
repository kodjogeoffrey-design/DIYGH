import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";

const inputCls =
  "w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none";

const labelCls =
  "block font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground";

const btnPrimaryCls =
  "flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse disabled:opacity-60";

const btnGhostCls =
  "flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-background px-4 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50";

function PasswordInput({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="mt-1 relative">
        <input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${inputCls} pr-10`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function LoginForm({ onSwitch, onSubmit, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className={labelCls}>
        Email
        <input
          type="email"
          autoComplete="username"
          required
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </label>
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </button>
      <p className="text-center font-mono-tech text-[11px] text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch("register")}
          className="text-primary hover:underline"
        >
          Create one
        </button>
      </p>
      <p className="text-center font-mono-tech text-[11px] text-muted-foreground">
        <button
          type="button"
          onClick={() => onSwitch("forgot")}
          className="text-primary hover:underline"
        >
          Forgot password?
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch, onSubmit, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password, { full_name: name });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className={labelCls}>
        Full name (optional)
        <input
          type="text"
          autoComplete="name"
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          disabled={loading}
        />
      </label>
      <label className={labelCls}>
        Email
        <input
          type="email"
          autoComplete="username"
          required
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </label>
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min 6 characters"
        autoComplete="new-password"
      />
      <p className="font-mono-tech text-[10px] text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </p>
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </button>
      <p className="text-center font-mono-tech text-[11px] text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="text-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

function ForgotPasswordForm({ onSwitch, onSubmit, loading }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="font-mono-tech text-[11px] text-muted-foreground">
        Enter your email and we'll send you a link to reset your password.
      </p>
      <label className={labelCls}>
        Email
        <input
          type="email"
          autoComplete="username"
          required
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </label>
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
      </button>
      <p className="text-center font-mono-tech text-[11px] text-muted-foreground">
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="text-primary hover:underline"
        >
          Back to sign in
        </button>
      </p>
    </form>
  );
}

function ResetPasswordForm({ onSubmit, loading }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }
    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="font-mono-tech text-[11px] text-muted-foreground">
        Enter your new password.
      </p>
      <PasswordInput
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min 6 characters"
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
      />
      <button type="submit" disabled={loading} className={btnPrimaryCls}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
      </button>
    </form>
  );
}

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, logout, requestPasswordReset, changePassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You're now signed in." });
      onClose();
    } catch (err) {
      toast({
        title: "Sign in failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email, password, metadata) => {
    setLoading(true);
    try {
      await register(email, password, metadata);
      toast({
        title: "Account created",
        description: "Check your email to confirm your account.",
      });
      setMode("login");
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (email) => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
      setMode("login");
    } catch (err) {
      toast({
        title: "Could not send reset email",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (password) => {
    setLoading(true);
    try {
      await changePassword(password);
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      setMode("login");
    } catch (err) {
      toast({
        title: "Could not update password",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case "register":
        return <RegisterForm onSwitch={setMode} onSubmit={handleRegister} loading={loading} />;
      case "forgot":
        return <ForgotPasswordForm onSwitch={setMode} onSubmit={handleForgot} loading={loading} />;
      case "reset":
        return <ResetPasswordForm onSubmit={handleReset} loading={loading} />;
      default:
        return <LoginForm onSwitch={setMode} onSubmit={handleLogin} loading={loading} />;
    }
  };

  const titleMap = {
    login: "Sign in to your account",
    register: "Create your account",
    forgot: "Reset your password",
    reset: "Set new password",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-sm border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6">
          <h2 id="auth-modal-title" className="font-heading text-2xl font-700">
            {titleMap[mode]}
          </h2>
          <p className="mt-1 font-mono-tech text-[11px] text-muted-foreground">
            {mode === "login" && "Access your orders, wishlist, and more."}
            {mode === "register" && "Join DIYGH to track orders and save favorites."}
            {mode === "forgot" && "We'll email you a secure link to reset your password."}
            {mode === "reset" && "Your new password must be different from previous ones."}
          </p>
        </div>
        {renderForm()}
      </div>
    </div>
  );
}