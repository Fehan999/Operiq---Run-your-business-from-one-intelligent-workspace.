import { Globe } from "lucide-react";

import { GitHubIcon, LinkedInIcon } from "@/components/shared/brand-icons";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/** Small credit box shown on the sign-in and sign-up pages. */
export function AuthorCard({ className }: { className?: string }) {
  const { author, repository } = siteConfig;

  return (
    <aside
      aria-label="About the author"
      className={cn("rounded-lg border bg-card/60 px-4 py-3 text-sm", className)}
    >
      <p className="text-muted-foreground">
        Designed and built by{" "}
        <a
          href={author.website}
          rel="author noopener"
          target="_blank"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {author.name}
        </a>
      </p>
      <div className="mt-2 -ml-2 flex flex-wrap items-center gap-1">
        <a href={repository} target="_blank" rel="noopener" className={linkClass}>
          <GitHubIcon className="size-3.5" />
          Source on GitHub
        </a>
        {author.linkedin ? (
          <a href={author.linkedin} target="_blank" rel="me noopener" className={linkClass}>
            <LinkedInIcon className="size-3.5" />
            LinkedIn
          </a>
        ) : null}
        <a href={author.website} target="_blank" rel="me noopener" className={linkClass}>
          <Globe className="size-3.5" aria-hidden />
          ehansiddique.com
        </a>
      </div>
    </aside>
  );
}
