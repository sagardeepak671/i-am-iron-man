"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { Film } from "@/data/archive";
import {
  MAX_QUERY_LENGTH,
  SORT_OPTIONS,
  isDefaultQuery,
  serializeArmorQuery,
  type ArmorQuery,
  type SortKey,
} from "@/lib/armor-query";

type Props = {
  /** The query the server rendered the current results for (parsed from the URL). */
  query: ArmorQuery;
  films: Film[];
  resultCount: number;
  totalCount: number;
};

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Search / film / sort controls for `/armors`.
 *
 * The URL is the only state: every change navigates to `/armors?…`, the server
 * re-renders the list, and Back/Forward or a reload reproduce the same view.
 * Without JavaScript the form still works as a plain GET form.
 *
 * Typing uses `replace` (so history is not spammed per keystroke); picking a
 * film or sort, submitting, and clearing use `push` (so Back undoes them).
 */
export function ArmorControls({ query, films, resultCount, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(query.q);
  const lastSentSearch = useRef(query.q);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the URL changes for a reason other than our own search navigation
  // (Back/Forward, the Clear link, a hand-edited URL), resync the input.
  useEffect(() => {
    if (query.q !== lastSentSearch.current) {
      lastSentSearch.current = query.q;
      setSearch(query.q);
    }
  }, [query.q]);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  const navigate = (next: ArmorQuery, mode: "push" | "replace") => {
    lastSentSearch.current = next.q;
    const url = `${pathname}${serializeArmorQuery(next)}`;
    startTransition(() => {
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    });
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      navigate({ ...query, q: value.trim() }, "replace");
    }, SEARCH_DEBOUNCE_MS);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounce.current) clearTimeout(debounce.current);
    navigate({ ...query, q: search.trim() }, "push");
  };

  const onFilmChange = (value: string) =>
    navigate({ ...query, film: value === "" ? null : value }, "push");

  const onSortChange = (value: string) =>
    navigate({ ...query, sort: value as SortKey }, "push");

  const clearSearch = () => {
    if (debounce.current) clearTimeout(debounce.current);
    setSearch("");
    navigate({ ...query, q: "" }, "push");
  };

  const filtersActive = !isDefaultQuery(query);
  const activeFilm = films.find((f) => f.id === query.film);

  const fieldBase =
    "h-11 w-full rounded-full border border-white/12 bg-white/[0.04] font-mono text-[12px] tracking-[0.08em] text-foreground placeholder:text-zinc-600 backdrop-blur-md transition-colors hover:border-white/20 focus:border-accent/60 focus:outline-none";
  const labelBase =
    "font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500";

  return (
    <form
      role="search"
      method="get"
      action={pathname}
      onSubmit={onSubmit}
      aria-label="Search and filter armors"
      className="card-surface flex flex-col gap-5 p-5 md:p-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
        {/* Search */}
        <div className="flex flex-col gap-2">
          <label htmlFor="armor-search" className={labelBase}>
            Search
          </label>
          <div className="relative">
            <MagnifyingGlass
              size={14}
              weight="bold"
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              id="armor-search"
              name="q"
              type="search"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={MAX_QUERY_LENGTH}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Mark, alias, film…"
              aria-describedby="armor-result-count"
              className={`${fieldBase} pl-10 pr-10`}
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X size={12} weight="bold" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* Film filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="armor-film" className={labelBase}>
            First appearance
          </label>
          <select
            id="armor-film"
            name="film"
            value={query.film ?? ""}
            onChange={(e) => onFilmChange(e.target.value)}
            className={`hud-select ${fieldBase} cursor-pointer pl-4 pr-9`}
          >
            <option value="">All films</option>
            {films.map((film) => (
              <option key={film.id} value={film.id}>
                {film.title} ({film.releaseYear})
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-2">
          <label htmlFor="armor-sort" className={labelBase}>
            Sort
          </label>
          <select
            id="armor-sort"
            name="sort"
            value={query.sort}
            onChange={(e) => onSortChange(e.target.value)}
            className={`hud-select ${fieldBase} cursor-pointer pl-4 pr-9`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Apply (keyboard / no-JS path) */}
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-all duration-200 hover:bg-white/[0.1] active:translate-y-[1px]"
        >
          Apply
        </button>
      </div>

      {/* Status row */}
      <div className="flex flex-col gap-3 border-t border-white/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          id="armor-result-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-400"
        >
          <span className="text-foreground">{resultCount}</span> of {totalCount} armor
          {totalCount === 1 ? "" : "s"}
          {query.q && (
            <>
              {" "}
              matching <span className="text-accent">&ldquo;{query.q}&rdquo;</span>
            </>
          )}
          {activeFilm && (
            <>
              {" "}
              in <span className="text-accent">{activeFilm.title}</span>
            </>
          )}
          {isPending && <span className="ml-2 text-zinc-600">&middot; updating</span>}
        </p>

        {filtersActive && (
          <Link
            href={pathname}
            scroll={false}
            className="inline-flex items-center gap-1.5 self-start font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:text-accent sm:self-auto"
          >
            <X size={11} weight="bold" aria-hidden />
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}
