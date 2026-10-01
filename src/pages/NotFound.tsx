import { Link } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  useDocumentMeta(pageMeta.notFound);

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-24 px-24 text-center">
      <p className="text-body-sm text-steel-gray">404</p>
      <h1 className="text-display-heading">Page not found</h1>
      <p className="max-w-[480px] text-body-lg text-ash-gray">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild variant="filled">
        <Link to="/">Back to home</Link>
      </Button>
    </section>
  );
}
