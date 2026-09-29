import Link from "next/link";

import { GitHubIcon, LinkedInIcon } from "@/components/shared/brand-icons";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const { author, repository } = siteConfig;

  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
          <p className="text-sm text-muted-foreground">
            Designed and built by{" "}
            <a
              href={author.website}
              rel="author noopener"
              target="_blank"
              className="font-medium text-foreground hover:underline"
            >
              {author.name}
            </a>
            .
          </p>
          <div className="flex gap-2">
            <a
              href={repository}
              target="_blank"
              rel="noopener"
              aria-label="Operiq on GitHub"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <GitHubIcon className="size-4" />
            </a>
            {author.linkedin ? (
              <a
                href={author.linkedin}
                target="_blank"
                rel="me noopener"
                aria-label={`${author.name} on LinkedIn`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LinkedInIcon className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
        <nav aria-label="Product" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Product</p>
          <Link href="/#features" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="/#ai" className="text-muted-foreground hover:text-foreground">
            AI agent
          </Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#security" className="text-muted-foreground hover:text-foreground">
            Security
          </Link>
        </nav>
        <nav aria-label="Account" className="grid content-start gap-2 text-sm">
          <p className="font-medium">Get started</p>
          <Link href="/register" className="text-muted-foreground hover:text-foreground">
            Create an account
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <a
            href={repository}
            target="_blank"
            rel="noopener"
            className="text-muted-foreground hover:text-foreground"
          >
            Source code
          </a>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}. Built by {author.name}.
        </p>
      </div>
    </footer>
  );
}
