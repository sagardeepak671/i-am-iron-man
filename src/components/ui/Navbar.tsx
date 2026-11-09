"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, List, X } from "@phosphor-icons/react";

const NAV_LINKS: { href: string; label: string; match?: string }[] = [
  { href: "/#systems", label: "Systems" },
  { href: "/armors", label: "Armors", match: "/armors" },
  { href: "/technology", label: "Technology", match: "/technology" },
  { href: "/compare", label: "Compare", match: "/compare" },
  { href: "/archive", label: "Archive", match: "/archive" },
];

const linkClass =
  "inline-flex min-h-9 items-center font-mono text-[11px] uppercase tracking-[0.24em] transition-colors hover:text-foreground";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // The menu is "open for" a specific path, so a route change closes it
  // without needing an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (next: boolean) => setOpenFor(next ? pathname : null);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes and returns focus; clicking outside closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenFor(null);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpenFor(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    // Move focus into the panel once it is rendered.
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const isActive = (match?: string) =>
    Boolean(match && (pathname === match || pathname.startsWith(`${match}/`)));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        open
          ? "border-b border-white/10 bg-black/90 backdrop-blur-2xl backdrop-saturate-150"
          : scrolled
            ? "border-b border-white/10 bg-black/60 backdrop-blur-2xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8 md:py-5">
        <Link
          href="/"
          className="flex min-h-9 items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(212,162,47,0.9)]"
          />
          Stark / Industries
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.match) ? "page" : undefined}
              className={`${linkClass} ${isActive(l.match) ? "text-foreground" : "text-zinc-400"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/armors"
            className="group hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.1] active:translate-y-[1px] sm:inline-flex"
          >
            Engage
            <ArrowUpRight
              size={14}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>

          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-foreground backdrop-blur-md transition-colors hover:bg-white/[0.1] md:hidden"
          >
            {open ? <X size={16} weight="bold" aria-hidden /> : <List size={16} weight="bold" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id={menuId}
        ref={panelRef}
        hidden={!open}
        className="border-t border-white/10 px-6 pb-6 pt-3 md:hidden"
      >
        <nav aria-label="Primary, mobile" className="flex flex-col">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.match) ? "page" : undefined}
              className={`flex items-center justify-between border-b border-white/6 py-3.5 font-mono text-[12px] uppercase tracking-[0.24em] transition-colors hover:text-accent ${
                isActive(l.match) ? "text-accent" : "text-zinc-200"
              }`}
            >
              {l.label}
              <ArrowUpRight size={13} weight="bold" aria-hidden className="text-zinc-500" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
