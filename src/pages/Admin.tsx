import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAdminSession } from "@/hooks/useAdmin";
import { backend } from "@/lib/backend";

export default function Admin() {
  const session = useAdminSession();

  // Keep the admin area out of search results.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Admin — NeoFolks";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  if (!backend.configured) {
    return (
      <Notice title="Supabase isn't connected yet">
        Add <code className="text-ghost-white">VITE_SUPABASE_URL</code> and{" "}
        <code className="text-ghost-white">VITE_SUPABASE_ANON_KEY</code> to your <code className="text-ghost-white">.env</code>{" "}
        file and restart the dev server. Step-by-step instructions are in{" "}
        <code className="text-ghost-white">supabase/README.md</code>.
      </Notice>
    );
  }

  if (session.status === "loading") {
    return (
      <div className="container-page py-48">
        <Skeleton className="h-[240px] w-full" />
      </div>
    );
  }

  if (session.status === "signedOut") return <AdminLogin />;

  if (session.status === "notAdmin") {
    return (
      <Notice title="You don't have admin access">
        <span className="text-ghost-white">{session.email}</span> is signed in, but isn't on the admin list. Ask an
        existing admin to add you, or sign in with a different account.
        <span className="mt-16 flex gap-12">
          <Button variant="outlined" size="sm" onClick={() => void backend.auth.signOut()}>
            Sign out
          </Button>
        </span>
      </Notice>
    );
  }

  return <AdminDashboard email={session.email} />;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-24 py-48">
      <div className="flex w-full max-w-[520px] flex-col gap-12 rounded-card border border-graphite bg-carbon-card p-32">
        <h1 className="font-alpha-lyrae text-heading-sm font-normal text-ghost-white">{title}</h1>
        <div className="text-body-sm text-ash-gray">{children}</div>
        <Link to="/" className="mt-8 text-body-sm text-ash-gray transition-colors duration-200 hover:text-ghost-white">
          Back to the site
        </Link>
      </div>
    </div>
  );
}
