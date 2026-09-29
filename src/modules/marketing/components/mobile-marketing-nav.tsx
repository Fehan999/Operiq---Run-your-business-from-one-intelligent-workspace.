"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MARKETING_LINKS } from "@/modules/marketing/links";

export function MobileMarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-6">
        <SheetTitle>Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <nav aria-label="Mobile" className="mt-2 grid gap-1">
          {MARKETING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 grid gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
