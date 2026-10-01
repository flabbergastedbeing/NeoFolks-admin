import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend } from "@/lib/backend";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await backend.auth.signIn(email.trim(), password);
      // The session listener in useAdminSession takes it from here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-24 py-48">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-[400px] flex-col gap-20 rounded-card border border-graphite bg-carbon-card p-32"
      >
        <div>
          <p className="text-caption uppercase tracking-wider text-steel-gray">NeoFolks</p>
          <h1 className="mt-4 font-alpha-lyrae text-heading-sm font-normal text-ghost-white">
            Admin sign in
          </h1>
        </div>

        <div className="flex flex-col gap-8">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-8">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-body-sm text-error-red">
            {error}
          </p>
        )}

        <Button type="submit" variant="filled" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>

        <Link
          to="/"
          className="text-center text-body-sm text-ash-gray transition-colors duration-200 hover:text-ghost-white"
        >
          Back to the site
        </Link>
      </form>
    </div>
  );
}
