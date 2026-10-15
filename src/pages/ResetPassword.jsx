import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePassword } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

const inputCls =
  "w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none";

const labelCls =
  "block font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground";

const btnPrimaryCls =
  "flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse disabled:opacity-60";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validToken, setValidToken] = useState(true);

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const type = searchParams.get("type");

  useEffect(() => {
    if (type === "recovery" && accessToken && refreshToken) {
      setValidToken(true);
    } else if (type !== "recovery") {
      setValidToken(false);
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
    }
  }, [type, accessToken, refreshToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Your password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!validToken) {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      toast({
        title: "Password updated",
        description: "Your password has been changed. You can now sign in with your new password.",
      });
      navigate("/account", { replace: true });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!validToken) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h1 className="mt-4 font-heading text-2xl font-700">Invalid Reset Link</h1>
        <p className="mt-2 font-mono-tech text-sm text-muted-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading text-2xl font-700">Reset Password</h1>
        <p className="mt-2 font-mono-tech text-sm text-muted-foreground">
          Enter your new password below. Make sure it's at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <label className={labelCls}>
          New password
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${inputCls} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={saving}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className={labelCls}>
          Confirm new password
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={inputCls}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={saving}
            required
          />
        </label>

        <button type="submit" disabled={saving} className={btnPrimaryCls}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Update password
            </>
          )}
        </button>

        <p className="font-mono-tech text-[10px] text-center text-muted-foreground">
          <Link to="/" className="underline hover:text-primary">
            ← Back to homepage
          </Link>
        </p>
      </form>
    </div>
  );
}